import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormField, form, min, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { ProveedorDetalle } from '../../dominio/proveedor';
import { ProveedorApi } from '../../proveedor/proveedor-api';
import { SolicitudApi } from '../solicitud-api';

interface FormularioSolicitudModelo {
  idOficio: string;
  direccionTrujillo: string;
  fechaProgramada: string;
  horaProgramada: string;
  descripcionTrabajo: string;
  presupuestoReferencial: number | null;
}

function obtenerFechaLocalHoy(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

@Component({
  selector: 'app-formulario-solicitud',
  imports: [DecimalPipe, FormField, RouterLink, AlertaMensaje],
  templateUrl: './formulario-solicitud.html',
  styleUrl: './formulario-solicitud.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioSolicitud {
  private readonly proveedorApi = inject(ProveedorApi);
  private readonly solicitudApi = inject(SolicitudApi);
  private readonly router = inject(Router);

  readonly idPerfilProveedor = input.required<string>();

  protected readonly fechaMinima = obtenerFechaLocalHoy();
  protected readonly proveedor = signal<ProveedorDetalle | null>(null);
  protected readonly cargandoProveedor = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);

  protected readonly modelo = signal<FormularioSolicitudModelo>({
    idOficio: '',
    direccionTrujillo: '',
    fechaProgramada: this.fechaMinima,
    horaProgramada: '09:00',
    descripcionTrabajo: '',
    presupuestoReferencial: null,
  });

  protected readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.idOficio, { message: 'Selecciona el oficio que necesitas.' });
    required(ruta.direccionTrujillo, {
      message: 'Ingresa la dirección del servicio en Trujillo.',
    });
    required(ruta.fechaProgramada, { message: 'La fecha programada es obligatoria.' });
    validate(ruta.fechaProgramada, ({ value }) => {
      const fecha = value();
      if (fecha && fecha < this.fechaMinima) {
        return {
          kind: 'fechaPasada',
          message: 'La fecha programada debe ser hoy o posterior.',
        };
      }
      return null;
    });
    required(ruta.horaProgramada, { message: 'La hora programada es obligatoria.' });
    required(ruta.descripcionTrabajo, {
      message: 'Describe brevemente el trabajo requerido.',
    });
    min(ruta.presupuestoReferencial, 0, {
      message: 'El presupuesto referencial no puede ser negativo.',
    });
  });

  constructor() {
    effect(() => {
      const id = Number(this.idPerfilProveedor());
      if (!Number.isInteger(id) || id <= 0) {
        return;
      }
      this.cargarProveedor(id);
    });
  }

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);
    const detalle = this.proveedor();
    if (!detalle) {
      return;
    }

    void submit(this.formulario, () => {
      const datos = this.modelo();
      const horaNormalizada =
        datos.horaProgramada.length === 5 ? `${datos.horaProgramada}:00` : datos.horaProgramada;

      this.enviando.set(true);
      this.solicitudApi
        .crear({
          idPerfilProveedor: detalle.idPerfilProveedor,
          idOficio: Number(datos.idOficio),
          direccionTrujillo: datos.direccionTrujillo.trim(),
          fechaProgramada: datos.fechaProgramada,
          horaProgramada: horaNormalizada,
          descripcionTrabajo: datos.descripcionTrabajo.trim(),
          ...(datos.presupuestoReferencial !== null
            ? { presupuestoReferencial: Number(datos.presupuestoReferencial) }
            : {}),
        })
        .subscribe({
          next: () => {
            this.enviando.set(false);
            void this.router.navigate(['/solicitudes']);
          },
          error: (error: ErrorHttp) => {
            this.enviando.set(false);
            this.errorHttp.set(error);
          },
        });

      return Promise.resolve();
    });
  }

  private cargarProveedor(id: number): void {
    this.cargandoProveedor.set(true);
    this.errorHttp.set(null);

    this.proveedorApi.obtenerDetalle(id).subscribe({
      next: (datos) => {
        this.cargandoProveedor.set(false);
        this.proveedor.set(datos);
        if (datos.oficios.length === 1) {
          this.modelo.update((actual) => ({
            ...actual,
            idOficio: String(datos.oficios[0].idOficio),
          }));
        }
      },
      error: (error: ErrorHttp) => {
        this.cargandoProveedor.set(false);
        this.errorHttp.set(error);
      },
    });
  }
}
