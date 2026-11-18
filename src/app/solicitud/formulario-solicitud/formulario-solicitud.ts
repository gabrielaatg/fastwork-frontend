import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormField,
  form,
  min,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { Oficio } from '../../dominio/oficio';
import { Zona } from '../../dominio/zona';
import { OficioApi } from '../../oficio/oficio-api';
import { ZonaApi } from '../../zona/zona-api';
import { SolicitudApi } from '../solicitud-api';

const MIN_IMAGENES = 1;
const MAX_IMAGENES = 5;
const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;
const TIPOS_IMAGEN_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp'];

interface ImagenSeleccionada {
  archivo: File;
  previewUrl: string;
}

interface SolicitudModelo {
  idOficio: string;
  idZona: string;
  direccionTrujillo: string;
  fechaProgramada: string;
  horaProgramada: string;
  presupuestoReferencial: number;
  descripcionTrabajo: string;
}

function obtenerFechaLocalIso(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Component({
  selector: 'app-formulario-solicitud',
  imports: [FormField, RouterLink, AlertaMensaje],
  templateUrl: './formulario-solicitud.html',
  styleUrl: './formulario-solicitud.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioSolicitud implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly oficioApi = inject(OficioApi);
  private readonly zonaApi = inject(ZonaApi);
  private readonly solicitudApi = inject(SolicitudApi);

  protected readonly fechaMinima = obtenerFechaLocalIso();
  protected readonly oficios = signal<Oficio[]>([]);
  protected readonly zonas = signal<Zona[]>([]);
  protected readonly cargandoCatalogos = signal(true);
  protected readonly enviando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly imagenesSeleccionadas = signal<ImagenSeleccionada[]>([]);
  protected readonly errorImagenes = signal<string | null>(null);

  protected readonly modelo = signal<SolicitudModelo>({
    idOficio: '',
    idZona: '',
    direccionTrujillo: '',
    fechaProgramada: this.fechaMinima,
    horaProgramada: '09:00',
    presupuestoReferencial: 50,
    descripcionTrabajo: '',
  });

  protected readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.idOficio, { message: 'Selecciona la categoría de oficio.' });
    required(ruta.idZona, { message: 'Selecciona el distrito en Trujillo.' });
    required(ruta.direccionTrujillo, { message: 'La dirección en Trujillo es obligatoria.' });
    required(ruta.fechaProgramada, { message: 'La fecha programada es obligatoria.' });
    validate(ruta.fechaProgramada, ({ value }) => {
      const fecha = value();
      if (fecha && fecha < obtenerFechaLocalIso()) {
        return {
          kind: 'fechaPasada',
          message: 'La fecha programada no puede ser anterior a hoy.',
        };
      }
      return null;
    });
    required(ruta.horaProgramada, { message: 'La hora programada es obligatoria.' });
    min(ruta.presupuestoReferencial, 1, {
      message: 'El presupuesto inicial debe ser mayor o igual a S/ 1.00.',
    });
    required(ruta.descripcionTrabajo, {
      message: 'Describe brevemente el problema o trabajo requerido.',
    });
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const item of this.imagenesSeleccionadas()) {
        if (typeof URL.revokeObjectURL === 'function' && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    });
  }

  ngOnInit(): void {
    this.cargarCatalogos();
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

    this.errorImagenes.set(null);
    const actuales = [...this.imagenesSeleccionadas()];

    if (actuales.length + archivos.length > MAX_IMAGENES) {
      this.errorImagenes.set(`Solo puedes adjuntar como máximo ${MAX_IMAGENES} imágenes.`);
      return;
    }

    for (const archivo of archivos) {
      const nombreLower = archivo.name.toLowerCase();
      const tipoValido =
        TIPOS_IMAGEN_PERMITIDOS.has(archivo.type) ||
        EXTENSIONES_PERMITIDAS.some((ext) => nombreLower.endsWith(ext));
      if (!tipoValido) {
        this.errorImagenes.set('Solo se permiten imágenes JPG, PNG o WEBP.');
        return;
      }
      if (archivo.size === 0 || archivo.size > MAX_BYTES_IMAGEN) {
        this.errorImagenes.set('Cada imagen debe pesar entre 1 byte y 5 MB.');
        return;
      }

      const previewUrl =
        typeof URL.createObjectURL === 'function' ? URL.createObjectURL(archivo) : '';
      actuales.push({ archivo, previewUrl });
    }

    this.imagenesSeleccionadas.set(actuales);
  }

  protected quitarImagen(indice: number): void {
    const lista = this.imagenesSeleccionadas();
    const eliminado = lista[indice];
    if (eliminado?.previewUrl && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(eliminado.previewUrl);
    }
    this.imagenesSeleccionadas.set(lista.filter((_, i) => i !== indice));
    if (lista.length - 1 < MIN_IMAGENES) {
      this.errorImagenes.set('Debes adjuntar al menos 1 imagen del problema.');
    } else {
      this.errorImagenes.set(null);
    }
  }

  protected formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);

    if (this.imagenesSeleccionadas().length < MIN_IMAGENES) {
      this.errorImagenes.set('Debes adjuntar al menos 1 imagen del problema.');
    }

    void submit(this.formulario, () => {
      const imagenes = this.imagenesSeleccionadas().map((item) => item.archivo);
      if (imagenes.length < MIN_IMAGENES || imagenes.length > MAX_IMAGENES) {
        this.errorImagenes.set(
          `Debes adjuntar entre ${MIN_IMAGENES} y ${MAX_IMAGENES} imágenes del problema.`,
        );
        return Promise.resolve();
      }

      const datos = this.modelo();
      this.enviando.set(true);

      this.solicitudApi
        .crear(
          {
            idOficio: Number(datos.idOficio),
            idZona: Number(datos.idZona),
            direccionTrujillo: datos.direccionTrujillo.trim(),
            fechaProgramada: datos.fechaProgramada,
            horaProgramada: datos.horaProgramada,
            descripcionTrabajo: datos.descripcionTrabajo.trim(),
            presupuestoReferencial: Number(datos.presupuestoReferencial),
          },
          imagenes,
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

  private cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);
    forkJoin({
      oficios: this.oficioApi.listarActivos(),
      zonas: this.zonaApi.listarActivas(),
    }).subscribe({
      next: ({ oficios, zonas }) => {
        this.cargandoCatalogos.set(false);
        this.oficios.set(oficios);
        this.zonas.set(zonas);
        this.modelo.update((actual) => ({
          ...actual,
          idOficio: actual.idOficio || (oficios[0] ? String(oficios[0].idOficio) : ''),
          idZona: actual.idZona || (zonas[0] ? String(zonas[0].idZona) : ''),
        }));
      },
      error: (error: ErrorHttp) => {
        this.cargandoCatalogos.set(false);
        this.errorHttp.set(error);
      },
    });
  }
}
