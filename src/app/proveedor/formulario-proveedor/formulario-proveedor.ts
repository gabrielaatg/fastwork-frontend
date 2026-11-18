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
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { BadgeEstado } from '../../core/layout/badge-estado/badge-estado';
import { PortadaPerfil } from '../../core/layout/portada-perfil/portada-perfil';
import { Oficio } from '../../dominio/oficio';
import {
  ActualizarOficioTarifaRequest,
  EstadoDisponibilidad,
  EstadoVerificacion,
  esRangoTarifaValido,
} from '../../dominio/proveedor';
import { OficioApi } from '../../oficio/oficio-api';
import { ProveedorApi } from '../proveedor-api';
import { ZonaApi } from '../../zona/zona-api';
import { Zona } from '../../dominio/zona';

interface OficioTarifaModelo {
  idOficio: string;
  precioMinimo: number;
  precioMaximo: number;
  detalleTarifa: string;
}

interface PerfilProveedorModelo {
  descripcionPerfil: string;
  oficios: OficioTarifaModelo[];
}

@Component({
  selector: 'app-formulario-proveedor',
  imports: [FormField, AlertaMensaje, BadgeEstado, PortadaPerfil],
  templateUrl: './formulario-proveedor.html',
  styleUrl: './formulario-proveedor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioProveedor implements OnInit {
  private readonly proveedorApi = inject(ProveedorApi);
  private readonly oficioApi = inject(OficioApi);
  private readonly zonaApi = inject(ZonaApi);

  protected readonly catalogoOficios = signal<Oficio[]>([]);
  protected readonly catalogoZonas = signal<Zona[]>([]);
  protected readonly zonasSeleccionadas = signal<number[]>([]);
  protected readonly fotoPerfilUrl = signal<string | null>(null);
  protected readonly idPerfil = signal<number | null>(null);
  protected readonly portadaServidor = signal<string | null>(null);
  protected readonly dni = signal('');
  protected readonly estadoDisponibilidad = signal<EstadoDisponibilidad>('DISPONIBLE');
  protected readonly estadoVerificacion = signal<EstadoVerificacion | null>(null);
  protected readonly cargandoInicial = signal(true);
  protected readonly guardandoPerfil = signal(false);
  protected readonly guardandoDisponibilidad = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);
  protected readonly errorDuplicados = signal<string | null>(null);

  protected readonly modelo = signal<PerfilProveedorModelo>({
    descripcionPerfil: '',
    oficios: [],
  });

  protected readonly formulario = form(this.modelo, (ruta) => {
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

  protected estaZonaSeleccionada(idZona: number): boolean {
    return this.zonasSeleccionadas().includes(idZona);
  }

  protected alternarZona(idZona: number): void {
    this.zonasSeleccionadas.update((actual) =>
      actual.includes(idZona) ? actual.filter((id) => id !== idZona) : [...actual, idZona],
    );
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
          ...(descripcion ? { descripcionPerfil: descripcion } : {}),
          oficios: oficiosPayload,
          idsZonas: this.zonasSeleccionadas(),
        })
        .subscribe({
          next: (detalle) => {
            this.guardandoPerfil.set(false);
            this.estadoVerificacion.set(detalle.estadoVerificacion);
            this.estadoDisponibilidad.set(detalle.estadoDisponibilidad);
            this.fotoPerfilUrl.set(detalle.fotoPerfilUrl);
            this.idPerfil.set(detalle.idPerfilProveedor);
            this.portadaServidor.set(detalle.portada ?? null);
            this.zonasSeleccionadas.set(detalle.zonas.map((z) => z.idZona));
            this.mensajeExito.set('Perfil comercial, zonas y tarifas guardados correctamente.');
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
      zonas: this.zonaApi.listarActivas(),
      detalle: this.proveedorApi.obtenerMiPerfil(),
    }).subscribe({
      next: ({ oficios, zonas, detalle }) => {
        this.cargandoInicial.set(false);
        this.catalogoOficios.set(oficios);
        this.catalogoZonas.set(zonas);
        this.fotoPerfilUrl.set(detalle.fotoPerfilUrl);
        this.idPerfil.set(detalle.idPerfilProveedor);
        this.portadaServidor.set(detalle.portada ?? null);
        this.zonasSeleccionadas.set((detalle.zonas ?? []).map((z) => z.idZona));
        this.dni.set(detalle.dni ?? '');
        this.estadoVerificacion.set(detalle.estadoVerificacion);
        this.estadoDisponibilidad.set(detalle.estadoDisponibilidad);
        this.modelo.set({
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
  }
}
