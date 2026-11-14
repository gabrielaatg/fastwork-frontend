import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { ModalConfirmacion } from '../../core/layout/modal-confirmacion/modal-confirmacion';
import {
  EstadoDestinoSolicitud,
  EstadoSolicitud,
  SolicitudServicio,
} from '../../dominio/solicitud';
import { ChatSolicitud } from '../../mensaje/chat-solicitud/chat-solicitud';
import { FormularioResena } from '../../resena/formulario-resena/formulario-resena';
import { SolicitudApi } from '../solicitud-api';
import { TarjetaSolicitud } from '../tarjeta-solicitud/tarjeta-solicitud';

type FiltroEstado = 'TODAS' | EstadoSolicitud;
type ModoPanel = 'ninguno' | 'chat' | 'resena';

interface TransicionPendiente {
  solicitud: SolicitudServicio;
  nuevoEstado: EstadoDestinoSolicitud;
}

@Component({
  selector: 'app-lista-solicitud',
  imports: [AlertaMensaje, ModalConfirmacion, TarjetaSolicitud, ChatSolicitud, FormularioResena],
  templateUrl: './lista-solicitud.html',
  styleUrl: './lista-solicitud.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaSolicitud implements OnInit {
  private readonly solicitudApi = inject(SolicitudApi);
  private readonly authApi = inject(AuthApi);

  protected readonly rolActual = computed(() => this.authApi.rol() ?? 'CLIENTE');
  protected readonly solicitudes = signal<SolicitudServicio[]>([]);
  protected readonly filtroEstado = signal<FiltroEstado>('TODAS');
  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);

  protected readonly solicitudActiva = signal<SolicitudServicio | null>(null);
  protected readonly modoPanel = signal<ModoPanel>('ninguno');

  protected readonly transicionPendiente = signal<TransicionPendiente | null>(null);
  protected readonly procesandoTransicion = signal(false);

  protected readonly estadosFiltro: readonly { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: 'TODAS', etiqueta: 'Todas' },
    { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
    { valor: 'ACEPTADA', etiqueta: 'Aceptadas' },
    { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
    { valor: 'FINALIZADA', etiqueta: 'Finalizadas' },
    { valor: 'CANCELADA', etiqueta: 'Canceladas' },
    { valor: 'RECHAZADA', etiqueta: 'Rechazadas' },
  ];

  protected readonly solicitudesFiltradas = computed(() => {
    const estado = this.filtroEstado();
    const todas = this.solicitudes();
    return estado === 'TODAS' ? todas : todas.filter((s) => s.estado === estado);
  });

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  protected seleccionarFiltro(estado: FiltroEstado): void {
    this.filtroEstado.set(estado);
  }

  protected abrirChat(solicitud: SolicitudServicio): void {
    this.solicitudActiva.set(solicitud);
    this.modoPanel.set('chat');
  }

  protected abrirResena(solicitud: SolicitudServicio): void {
    this.solicitudActiva.set(solicitud);
    this.modoPanel.set('resena');
  }

  protected cerrarPanel(): void {
    this.modoPanel.set('ninguno');
    this.solicitudActiva.set(null);
  }

  protected alSolicitarCambioEstado(
    solicitud: SolicitudServicio,
    nuevoEstado: EstadoDestinoSolicitud,
  ): void {
    if (nuevoEstado === 'RECHAZADA' || nuevoEstado === 'CANCELADA') {
      this.transicionPendiente.set({ solicitud, nuevoEstado });
      return;
    }
    this.ejecutarCambioEstado(solicitud.idSolicitud, nuevoEstado);
  }

  protected confirmarTransicionPendiente(): void {
    const pendiente = this.transicionPendiente();
    if (!pendiente) {
      return;
    }
    this.ejecutarCambioEstado(pendiente.solicitud.idSolicitud, pendiente.nuevoEstado);
  }

  protected alCrearResena(): void {
    this.mensajeExito.set('¡Gracias! Tu reseña ha sido registrada.');
    this.cerrarPanel();
  }

  protected tituloModalConfirmacion(): string {
    const pendiente = this.transicionPendiente();
    if (!pendiente) {
      return '';
    }
    return pendiente.nuevoEstado === 'RECHAZADA'
      ? 'Confirmar rechazo de solicitud'
      : 'Confirmar cancelación de solicitud';
  }

  protected mensajeModalConfirmacion(): string {
    const pendiente = this.transicionPendiente();
    if (!pendiente) {
      return '';
    }
    return pendiente.nuevoEstado === 'RECHAZADA'
      ? `¿Deseas rechazar la solicitud #${pendiente.solicitud.idSolicitud} de ${pendiente.solicitud.nombreCliente}?`
      : `¿Deseas cancelar tu solicitud #${pendiente.solicitud.idSolicitud} para ${pendiente.solicitud.nombreOficio}?`;
  }

  private ejecutarCambioEstado(idSolicitud: number, nuevoEstado: EstadoDestinoSolicitud): void {
    this.procesandoTransicion.set(true);
    this.errorHttp.set(null);
    this.mensajeExito.set(null);

    this.solicitudApi.actualizarEstado(idSolicitud, { nuevoEstado }).subscribe({
      next: (actualizada) => {
        this.procesandoTransicion.set(false);
        this.transicionPendiente.set(null);
        this.solicitudes.update((lista) =>
          lista.map((item) => (item.idSolicitud === idSolicitud ? actualizada : item)),
        );
        if (this.solicitudActiva()?.idSolicitud === idSolicitud) {
          this.solicitudActiva.set(actualizada);
        }
        this.mensajeExito.set(`Solicitud #${idSolicitud} actualizada a ${actualizada.estado}.`);
      },
      error: (error: ErrorHttp) => {
        this.procesandoTransicion.set(false);
        this.transicionPendiente.set(null);
        this.errorHttp.set(error);
      },
    });
  }

  private cargarSolicitudes(): void {
    this.cargando.set(true);
    this.errorHttp.set(null);

    this.solicitudApi.listarMisSolicitudes().subscribe({
      next: (lista) => {
        this.cargando.set(false);
        this.solicitudes.set(lista);
      },
      error: (error: ErrorHttp) => {
        this.cargando.set(false);
        this.errorHttp.set(error);
      },
    });
  }
}
