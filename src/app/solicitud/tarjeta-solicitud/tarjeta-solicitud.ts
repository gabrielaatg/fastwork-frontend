import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { BadgeEstado } from '../../core/layout/badge-estado/badge-estado';
import { RolUsuario } from '../../dominio/rol';
import {
  EstadoDestinoSolicitud,
  SolicitudImagen,
  SolicitudServicio,
  obtenerTransicionesPermitidas,
  puedeCalificarSolicitud,
} from '../../dominio/solicitud';

const ETIQUETA_ACCION_ESTADO: Record<EstadoDestinoSolicitud, string> = {
  ACEPTADA: 'Aceptar solicitud',
  RECHAZADA: 'Rechazar',
  EN_PROCESO: 'Iniciar trabajo',
  FINALIZADA: 'Finalizar servicio',
  CANCELADA: 'Cancelar solicitud',
};

@Component({
  selector: 'app-tarjeta-solicitud',
  imports: [DatePipe, DecimalPipe, BadgeEstado],
  templateUrl: './tarjeta-solicitud.html',
  styleUrl: './tarjeta-solicitud.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cerrarLightbox()',
    '(document:keydown.arrowleft)': 'navegarLightboxTeclado(-1)',
    '(document:keydown.arrowright)': 'navegarLightboxTeclado(1)',
  },
})
export class TarjetaSolicitud {
  readonly solicitud = input.required<SolicitudServicio>();
  readonly rolActual = input.required<RolUsuario>();
  readonly seleccionada = input(false);

  readonly cambiarEstado = output<EstadoDestinoSolicitud>();
  readonly abrirChat = output<void>();
  readonly calificar = output<void>();

  protected readonly indiceLightbox = signal<number | null>(null);

  protected readonly imagenes = computed<SolicitudImagen[]>(() => this.solicitud().imagenes ?? []);

  protected readonly imagenLightboxActual = computed(() => {
    const idx = this.indiceLightbox();
    const lista = this.imagenes();
    if (idx === null || idx < 0 || idx >= lista.length) {
      return null;
    }
    return {
      imagen: lista[idx],
      indice: idx,
      total: lista.length,
    };
  });

  protected readonly transiciones = computed(() =>
    obtenerTransicionesPermitidas(this.solicitud().estado, this.rolActual()),
  );

  protected readonly puedeCalificar = computed(() =>
    puedeCalificarSolicitud(this.solicitud().estado, this.rolActual()),
  );

  protected obtenerUrlMiniatura(url: string): string {
    const marcador = '/upload/';
    if (url.includes('res.cloudinary.com') && url.includes(marcador)) {
      return url.replace(marcador, `${marcador}w_320,h_320,c_fill,q_auto,f_auto/`);
    }
    return url;
  }

  protected abrirLightbox(indice: number): void {
    this.indiceLightbox.set(indice);
  }

  protected cerrarLightbox(): void {
    if (this.indiceLightbox() !== null) {
      this.indiceLightbox.set(null);
    }
  }

  protected navegarLightbox(delta: number): void {
    const idx = this.indiceLightbox();
    const total = this.imagenes().length;
    if (idx === null || total === 0) {
      return;
    }
    const siguiente = (idx + delta + total) % total;
    this.indiceLightbox.set(siguiente);
  }

  protected navegarLightboxTeclado(delta: number): void {
    if (this.indiceLightbox() !== null && this.imagenes().length > 1) {
      this.navegarLightbox(delta);
    }
  }

  protected etiquetaAccion(estado: EstadoDestinoSolicitud): string {
    return ETIQUETA_ACCION_ESTADO[estado];
  }

  protected esAccionPeligro(estado: EstadoDestinoSolicitud): boolean {
    return estado === 'RECHAZADA' || estado === 'CANCELADA';
  }
}
