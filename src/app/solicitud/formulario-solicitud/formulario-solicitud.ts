import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormField, form, min, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { ProveedorDetalle } from '../../dominio/proveedor';
import { ProveedorApi } from '../../proveedor/proveedor-api';
import { SolicitudApi } from '../solicitud-api';

export const MIN_IMAGENES_SOLICITUD = 1;
export const MAX_IMAGENES_SOLICITUD = 5;
export const MAX_BYTES_IMAGEN_SOLICITUD = 5 * 1024 * 1024;
const MIME_IMAGENES_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSIONES_IMAGEN_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp'];

interface ImagenSeleccionada {
  id: string;
  archivo: File;
  previewUrl: string;
}

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
  private readonly destroyRef = inject(DestroyRef);
  private secuenciaImagen = 0;

  readonly idPerfilProveedor = input.required<string>();

  protected readonly minImagenes = MIN_IMAGENES_SOLICITUD;
  protected readonly maxImagenes = MAX_IMAGENES_SOLICITUD;
  protected readonly fechaMinima = obtenerFechaLocalHoy();
  protected readonly proveedor = signal<ProveedorDetalle | null>(null);
  protected readonly cargandoProveedor = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly imagenes = signal<ImagenSeleccionada[]>([]);
  protected readonly errorImagenes = signal<string | null>(null);

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
    this.destroyRef.onDestroy(() => {
      for (const item of this.imagenes()) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    effect(() => {
      const id = Number(this.idPerfilProveedor());
      if (!Number.isInteger(id) || id <= 0) {
        return;
      }
      this.cargarProveedor(id);
    });
  }

  protected alSeleccionarImagenes(evento: Event): void {
    const input = evento.target as HTMLInputElement | null;
    const archivos = input?.files ? Array.from(input.files) : [];
    if (input) {
      input.value = '';
    }
    if (archivos.length === 0) {
      return;
    }

    const actuales = this.imagenes();
    const espacioDisponible = MAX_IMAGENES_SOLICITUD - actuales.length;
    if (espacioDisponible <= 0) {
      this.errorImagenes.set(`Solo puedes adjuntar un máximo de ${MAX_IMAGENES_SOLICITUD} imágenes.`);
      return;
    }

    let mensajeError: string | null = null;
    const aAgregar = archivos.slice(0, espacioDisponible);
    if (archivos.length > espacioDisponible) {
      mensajeError = `Solo puedes adjuntar hasta ${MAX_IMAGENES_SOLICITUD} imágenes por solicitud. Se agregaron las primeras ${espacioDisponible}.`;
    }

    const nuevas: ImagenSeleccionada[] = [];
    for (const archivo of aAgregar) {
      const errorArchivo = this.validarArchivoImagen(archivo);
      if (errorArchivo) {
        mensajeError = errorArchivo;
        continue;
      }
      this.secuenciaImagen += 1;
      nuevas.push({
        id: `img-${this.secuenciaImagen}`,
        archivo,
        previewUrl: URL.createObjectURL(archivo),
      });
    }

    if (nuevas.length > 0) {
      this.imagenes.set([...actuales, ...nuevas]);
    }
    this.errorImagenes.set(mensajeError);
  }

  protected alReemplazarImagen(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement | null;
    const archivo = input?.files?.[0] ?? null;
    if (input) {
      input.value = '';
    }
    if (!archivo) {
      return;
    }

    const errorArchivo = this.validarArchivoImagen(archivo);
    if (errorArchivo) {
      this.errorImagenes.set(errorArchivo);
      return;
    }

    const lista = [...this.imagenes()];
    const anterior = lista[indice];
    if (!anterior) {
      return;
    }

    URL.revokeObjectURL(anterior.previewUrl);
    this.secuenciaImagen += 1;
    lista[indice] = {
      id: `img-${this.secuenciaImagen}`,
      archivo,
      previewUrl: URL.createObjectURL(archivo),
    };
    this.imagenes.set(lista);
    this.errorImagenes.set(null);
  }

  protected eliminarImagen(indice: number): void {
    const lista = [...this.imagenes()];
    const [eliminada] = lista.splice(indice, 1);
    if (eliminada) {
      URL.revokeObjectURL(eliminada.previewUrl);
    }
    this.imagenes.set(lista);
    if (lista.length === 0) {
      this.errorImagenes.set('Debes adjuntar al menos 1 imagen del problema.');
    } else {
      this.errorImagenes.set(null);
    }
  }

  protected formatearTamanoArchivo(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);
    const detalle = this.proveedor();
    if (!detalle) {
      return;
    }

    if (this.imagenes().length < MIN_IMAGENES_SOLICITUD) {
      this.errorImagenes.set('Debes adjuntar al menos 1 imagen del problema (máximo 5).');
    }

    void submit(this.formulario, () => {
      const seleccionadas = this.imagenes();
      if (seleccionadas.length < MIN_IMAGENES_SOLICITUD) {
        this.errorImagenes.set('Debes adjuntar al menos 1 imagen del problema (máximo 5).');
        return Promise.resolve();
      }

      const datos = this.modelo();
      const horaNormalizada =
        datos.horaProgramada.length === 5 ? `${datos.horaProgramada}:00` : datos.horaProgramada;

      this.enviando.set(true);
      this.solicitudApi
        .crear(
          {
            idPerfilProveedor: detalle.idPerfilProveedor,
            idOficio: Number(datos.idOficio),
            direccionTrujillo: datos.direccionTrujillo.trim(),
            fechaProgramada: datos.fechaProgramada,
            horaProgramada: horaNormalizada,
            descripcionTrabajo: datos.descripcionTrabajo.trim(),
            ...(datos.presupuestoReferencial !== null
              ? { presupuestoReferencial: Number(datos.presupuestoReferencial) }
              : {}),
          },
          seleccionadas.map((item) => item.archivo),
        )
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

  private validarArchivoImagen(archivo: File): string | null {
    const nombreLower = archivo.name.toLowerCase();
    const extensionValida = EXTENSIONES_IMAGEN_PERMITIDAS.some((ext) => nombreLower.endsWith(ext));
    const mimeValido = archivo.type ? MIME_IMAGENES_PERMITIDOS.has(archivo.type) : false;

    if (!mimeValido && !extensionValida) {
      return `El archivo "${archivo.name}" debe ser una imagen JPG, PNG o WEBP.`;
    }
    if (archivo.size === 0) {
      return `La imagen "${archivo.name}" está vacía.`;
    }
    if (archivo.size > MAX_BYTES_IMAGEN_SOLICITUD) {
      return `La imagen "${archivo.name}" excede el tamaño máximo permitido (5 MB).`;
    }
    return null;
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
