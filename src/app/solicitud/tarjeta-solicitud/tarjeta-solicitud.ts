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
import { CalificacionEstrellas } from '../../core/layout/calificacion-estrellas/calificacion-estrellas';
import { RolUsuario } from '../../dominio/rol';
import {
  CrearActualizarOfertaRequest,
  EstadoSolicitud,
  SolicitudImagen,
  SolicitudServicio,
  TipoOferta,
} from '../../dominio/solicitud';

@Component({
  selector: 'app-tarjeta-solicitud',
  imports: [DatePipe, DecimalPipe, BadgeEstado, CalificacionEstrellas],
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
  readonly rol = input.required<RolUsuario>();
  readonly activa = input(false);
  readonly actualizando = input(false);

  readonly cambiarEstado = output<{ idSolicitud: number; nuevoEstado: EstadoSolicitud }>();
  readonly enviarOferta = output<{ idSolicitud: number; oferta: CrearActualizarOfertaRequest }>();
  readonly verOfertas = output<SolicitudServicio>();
  readonly iniciarContratacion = output<number>();
  readonly confirmarCompletado = output<number>();
  readonly abrirChat = output<SolicitudServicio>();
  readonly abrirResena = output<SolicitudServicio>();

  protected readonly indiceLightbox = signal<number | null>(null);
  protected readonly editandoOferta = signal(false);
  protected readonly tipoOfertaForm = signal<TipoOferta>('ACEPTA_PRESUPUESTO');
  protected readonly precioOfertaForm = signal<number>(0);
  protected readonly condicionesOfertaForm = signal<string>('');
  protected readonly errorOfertaForm = signal<string | null>(null);

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

  protected readonly puedeCancelar = computed(
    () => this.rol() === 'CLIENTE' && this.solicitud().estado === 'ABIERTA',
  );

  protected readonly puedeOfertar = computed(() => {
    if (this.rol() !== 'PROVEEDOR' || this.solicitud().estado !== 'ABIERTA') {
      return false;
    }
    const mi = this.solicitud().miOferta;
    return !mi || mi.estado === 'PENDIENTE';
  });

  protected readonly puedeIniciarTrabajo = computed(() => {
    const c = this.solicitud().contratacion;
    return this.rol() === 'PROVEEDOR' && c !== null && c.estado === 'ACTIVA';
  });

  protected readonly puedeConfirmarCompletado = computed(() => {
    const c = this.solicitud().contratacion;
    if (!c || (c.estado !== 'ACTIVA' && c.estado !== 'EN_PROCESO')) {
      return false;
    }
    return this.rol() === 'CLIENTE' ? !c.completadoCliente : !c.completadoProveedor;
  });

  protected readonly puedeCalificar = computed(() => {
    const c = this.solicitud().contratacion;
    if (!c || c.estado !== 'COMPLETADA') return false;
    return this.rol() === 'CLIENTE' ? !c.yaCalificoCliente : !c.yaCalificoProveedor;
  });

  protected readonly yaCalifico = computed(() => {
    const c = this.solicitud().contratacion;
    if (!c || c.estado !== 'COMPLETADA') return false;
    return this.rol() === 'CLIENTE' ? c.yaCalificoCliente : c.yaCalificoProveedor;
  });

  protected readonly puedeAbrirChat = computed(() => this.solicitud().contratacion !== null);

  protected abrirFormularioOferta(): void {
    const sol = this.solicitud();
    const existente = sol.miOferta;
    this.tipoOfertaForm.set(existente?.tipoOferta ?? 'ACEPTA_PRESUPUESTO');
    this.precioOfertaForm.set(existente?.precioOfertado ?? sol.presupuestoReferencial);
    this.condicionesOfertaForm.set(existente?.condiciones ?? '');
    this.errorOfertaForm.set(null);
    this.editandoOferta.set(true);
  }

  protected cerrarFormularioOferta(): void {
    this.editandoOferta.set(false);
    this.errorOfertaForm.set(null);
  }

  protected guardarOferta(evento: Event): void {
    evento.preventDefault();
    this.errorOfertaForm.set(null);

    const tipo = this.tipoOfertaForm();
    const precio = Number(this.precioOfertaForm());
    if (tipo === 'CONTRAOFERTA' && (!Number.isFinite(precio) || precio < 1)) {
      this.errorOfertaForm.set('La contraoferta debe ser mayor o igual a S/ 1.00.');
      return;
    }

    const condiciones = this.condicionesOfertaForm().trim();
    this.enviarOferta.emit({
      idSolicitud: this.solicitud().idSolicitud,
      oferta: {
        tipoOferta: tipo,
        ...(tipo === 'CONTRAOFERTA' ? { precioOfertado: precio } : {}),
        ...(condiciones ? { condiciones } : {}),
      },
    });
    this.editandoOferta.set(false);
  }

  protected solicitarCancelacion(): void {
    this.cambiarEstado.emit({
      idSolicitud: this.solicitud().idSolicitud,
      nuevoEstado: 'CANCELADA',
    });
  }

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
}
