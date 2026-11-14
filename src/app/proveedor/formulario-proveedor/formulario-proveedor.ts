import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  FormField,
  applyEach,
  form,
  min,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { forkJoin } from 'rxjs';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { BadgeEstado } from '../../core/layout/badge-estado/badge-estado';
import { Oficio } from '../../dominio/oficio';
import {
  ActualizarOficioTarifaRequest,
  EstadoDisponibilidad,
  EstadoVerificacion,
  esRangoTarifaValido,
} from '../../dominio/proveedor';
import { OficioApi } from '../../oficio/oficio-api';
import { ProveedorApi } from '../proveedor-api';

interface OficioTarifaModelo {
  idOficio: string;
  precioMinimo: number;
  precioMaximo: number;
  detalleTarifa: string;
}

interface PerfilProveedorModelo {
  documentoIdentidad: string;
  descripcionPerfil: string;
  oficios: OficioTarifaModelo[];
}

@Component({
  selector: 'app-formulario-proveedor',
  imports: [FormField, AlertaMensaje, BadgeEstado],
  templateUrl: './formulario-proveedor.html',
  styleUrl: './formulario-proveedor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioProveedor implements OnInit {
  private readonly proveedorApi = inject(ProveedorApi);
  private readonly oficioApi = inject(OficioApi);
  private readonly authApi = inject(AuthApi);

  protected readonly catalogoOficios = signal<Oficio[]>([]);
  protected readonly estadoDisponibilidad = signal<EstadoDisponibilidad>('DISPONIBLE');
  protected readonly estadoVerificacion = signal<EstadoVerificacion | null>(null);
  protected readonly cargandoInicial = signal(true);
  protected readonly guardandoPerfil = signal(false);
  protected readonly guardandoDisponibilidad = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);
  protected readonly errorDuplicados = signal<string | null>(null);

  protected readonly modelo = signal<PerfilProveedorModelo>({
    documentoIdentidad: '',
    descripcionPerfil: '',
    oficios: [],
  });

  protected readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.documentoIdentidad, {
      message: 'El documento de identidad es obligatorio.',
    });
    applyEach(ruta.oficios, (fila) => {
      required(fila.idOficio, { message: 'Selecciona un oficio.' });
      min(fila.precioMinimo, 0, { message: 'El precio mínimo debe ser mayor o igual a 0.' });
      validate(fila.precioMaximo, ({ value, valueOf }) => {
        const minimo = valueOf(fila.precioMinimo);
        const maximo = value();
        if (!esRangoTarifaValido(minimo, maximo)) {
          return {
            kind: 'rangoTarifaInvalido',
            message: 'El precio máximo debe ser mayor o igual al precio mínimo.',
          };
        }
        return null;
      });
    });
  });

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  protected agregarOficio(): void {
    this.errorDuplicados.set(null);
    this.modelo.update((actual) => ({
      ...actual,
      oficios: [
        ...actual.oficios,
        { idOficio: '', precioMinimo: 0, precioMaximo: 0, detalleTarifa: '' },
      ],
    }));
  }

  protected quitarOficio(indice: number): void {
    this.errorDuplicados.set(null);
    this.modelo.update((actual) => ({
      ...actual,
      oficios: actual.oficios.filter((_, i) => i !== indice),
    }));
  }

  protected cambiarDisponibilidad(nuevoEstado: EstadoDisponibilidad): void {
    if (this.guardandoDisponibilidad() || this.estadoDisponibilidad() === nuevoEstado) {
      return;
    }

    this.guardandoDisponibilidad.set(true);
    this.errorHttp.set(null);
    this.mensajeExito.set(null);

    this.proveedorApi.actualizarDisponibilidad({ estadoDisponibilidad: nuevoEstado }).subscribe({
      next: (actualizado) => {
        this.guardandoDisponibilidad.set(false);
        this.estadoDisponibilidad.set(actualizado.estadoDisponibilidad);
        this.mensajeExito.set('Disponibilidad actualizada correctamente.');
      },
      error: (error: ErrorHttp) => {
        this.guardandoDisponibilidad.set(false);
        this.errorHttp.set(error);
      },
    });
  }

  protected alGuardarPerfil(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);
    this.mensajeExito.set(null);
    this.errorDuplicados.set(null);

    const idsSeleccionados = this.modelo()
      .oficios.map((item) => item.idOficio)
      .filter((id) => id !== '');
    if (new Set(idsSeleccionados).size !== idsSeleccionados.length) {
      this.errorDuplicados.set('No puedes repetir el mismo oficio en más de una tarifa.');
      return;
    }

    void submit(this.formulario, () => {
      const datos = this.modelo();
      const oficiosPayload: ActualizarOficioTarifaRequest[] = datos.oficios.map((item) => {
        const detalle = item.detalleTarifa.trim();
        return {
          idOficio: Number(item.idOficio),
          precioMinimo: Number(item.precioMinimo),
          precioMaximo: Number(item.precioMaximo),
          ...(detalle ? { detalleTarifa: detalle } : {}),
        };
      });

      this.guardandoPerfil.set(true);
      const descripcion = datos.descripcionPerfil.trim();

      this.proveedorApi
        .actualizarMiPerfil({
          documentoIdentidad: datos.documentoIdentidad.trim(),
          ...(descripcion ? { descripcionPerfil: descripcion } : {}),
          oficios: oficiosPayload,
        })
        .subscribe({
          next: (detalle) => {
            this.guardandoPerfil.set(false);
            this.estadoVerificacion.set(detalle.estadoVerificacion);
            this.estadoDisponibilidad.set(detalle.estadoDisponibilidad);
            this.mensajeExito.set('Perfil comercial y tarifas guardados correctamente.');
          },
          error: (error: ErrorHttp) => {
            this.guardandoPerfil.set(false);
            this.errorHttp.set(error);
          },
        });

      return Promise.resolve();
    });
  }

  private cargarDatosIniciales(): void {
    this.cargandoInicial.set(true);
    this.errorHttp.set(null);

    forkJoin({
      oficios: this.oficioApi.listarActivos(),
      directorio: this.proveedorApi.buscarDirectorio(),
    }).subscribe({
      next: ({ oficios, directorio }) => {
        this.catalogoOficios.set(oficios);
        const idUsuarioActual = this.authApi.idUsuario();
        const propio = directorio.find((p) => p.idUsuario === idUsuarioActual);

        if (!propio) {
          this.cargandoInicial.set(false);
          return;
        }

        this.proveedorApi.obtenerDetalle(propio.idPerfilProveedor).subscribe({
          next: (detalle) => {
            this.cargandoInicial.set(false);
            this.estadoVerificacion.set(detalle.estadoVerificacion);
            this.estadoDisponibilidad.set(detalle.estadoDisponibilidad);
            this.modelo.set({
              documentoIdentidad: detalle.documentoIdentidad ?? '',
              descripcionPerfil: detalle.descripcionPerfil ?? '',
              oficios: detalle.oficios.map((o) => ({
                idOficio: String(o.idOficio),
                precioMinimo: o.precioMinimo,
                precioMaximo: o.precioMaximo,
                detalleTarifa: o.detalleTarifa ?? '',
              })),
            });
          },
          error: (error: ErrorHttp) => {
            this.cargandoInicial.set(false);
            this.errorHttp.set(error);
          },
        });
      },
      error: (error: ErrorHttp) => {
        this.cargandoInicial.set(false);
        this.errorHttp.set(error);
      },
    });
  }
}
