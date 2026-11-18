import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { BadgeEstado } from '../../core/layout/badge-estado/badge-estado';
import { CalificacionEstrellas } from '../../core/layout/calificacion-estrellas/calificacion-estrellas';
import {
  CrearActualizarOfertaRequest,
  EstadoSolicitud,
  OfertaSolicitud,
  SolicitudServicio,
} from '../../dominio/solicitud';
import { ChatSolicitud } from '../../mensaje/chat-solicitud/chat-solicitud';
import { FormularioResena } from '../../resena/formulario-resena/formulario-resena';
import { SolicitudApi } from '../solicitud-api';
import { TarjetaSolicitud } from '../tarjeta-solicitud/tarjeta-solicitud';

type FiltroEstado = 'TODAS' | EstadoSolicitud;
type VistaProveedor = 'DISPONIBLES' | 'MIS_SOLICITUDES';

@Component({
  selector: 'app-lista-solicitud',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    AlertaMensaje,
    BadgeEstado,
    CalificacionEstrellas,
    TarjetaSolicitud,
    ChatSolicitud,
    FormularioResena,
  ],
  templateUrl: './lista-solicitud.html',
  styleUrl: './lista-solicitud.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaSolicitud implements OnInit {
  private readonly authApi = inject(AuthApi);
  private readonly solicitudApi = inject(SolicitudApi);

  protected readonly rolUsuario = computed(() => this.authApi.usuario()?.rol ?? 'CLIENTE');
  protected readonly vistaProveedor = signal<VistaProveedor>('DISPONIBLES');
  protected readonly solicitudes = signal<SolicitudServicio[]>([]);
  protected readonly filtroEstado = signal<FiltroEstado>('TODAS');
  protected readonly cargando = signal(false);
  protected readonly idProcesando = signal<number | null>(null);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);

  protected readonly chatActivo = signal<SolicitudServicio | null>(null);
  protected readonly resenaActiva = signal<SolicitudServicio | null>(null);
  protected readonly solicitudOfertasActiva = signal<SolicitudServicio | null>(null);
  protected readonly ofertasRecibidas = signal<OfertaSolicitud[]>([]);
  protected readonly cargandoOfertas = signal(false);

  protected readonly solicitudesFiltradas = computed(() => {
    const lista = this.solicitudes();
    const estado = this.filtroEstado();
    if (estado === 'TODAS') {
      return lista;
    }
    return lista.filter((s) => s.estado === estado);
  });

  protected readonly hayPanelAbierto = computed(
    () =>
      this.chatActivo() !== null ||
      this.resenaActiva() !== null ||
      this.solicitudOfertasActiva() !== null,
  );

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  protected cambiarVistaProveedor(vista: VistaProveedor): void {
    if (this.vistaProveedor() === vista) return;
    this.vistaProveedor.set(vista);
    this.filtroEstado.set('TODAS');
    this.cerrarPaneles();
    this.cargarSolicitudes();
  }

  protected cambiarFiltro(filtro: FiltroEstado): void {
    this.filtroEstado.set(filtro);
  }

  protected cargarSolicitudes(): void {
    this.cargando.set(true);
    this.errorHttp.set(null);

    const esProvDisponibles =
      this.rolUsuario() === 'PROVEEDOR' && this.vistaProveedor() === 'DISPONIBLES';
    const peticion = esProvDisponibles
      ? this.solicitudApi.listarDisponibles()
      : this.solicitudApi.listarMisSolicitudes();

    peticion.subscribe({
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

  protected alCambiarEstado(evento: { idSolicitud: number; nuevoEstado: EstadoSolicitud }): void {
    this.idProcesando.set(evento.idSolicitud);
    this.errorHttp.set(null);
    this.mensajeExito.set(null);

    this.solicitudApi
      .actualizarEstado(evento.idSolicitud, { nuevoEstado: evento.nuevoEstado })
      .subscribe({
        next: (actualizada) => {
          this.idProcesando.set(null);
          this.reemplazarSolicitud(actualizada);
          this.mensajeExito.set(`Solicitud #${actualizada.idSolicitud} cancelada.`);
        },
        error: (error: ErrorHttp) => {
          this.idProcesando.set(null);
          this.errorHttp.set(error);
        },
      });
  }

  protected alEnviarOferta(evento: {
    idSolicitud: number;
    oferta: CrearActualizarOfertaRequest;
  }): void {
    this.idProcesando.set(evento.idSolicitud);
    this.errorHttp.set(null);
    this.mensajeExito.set(null);

    this.solicitudApi.enviarOActualizarOferta(evento.idSolicitud, evento.oferta).subscribe({
      next: (oferta) => {
        this.idProcesando.set(null);
        this.solicitudes.update((lista) =>
          lista.map((s) => (s.idSolicitud === evento.idSolicitud ? { ...s, miOferta: oferta } : s)),
        );
        this.mensajeExito.set(`Oferta registrada por S/ ${oferta.precioOfertado.toFixed(2)}.`);
      },
      error: (error: ErrorHttp) => {
        this.idProcesando.set(null);
        this.errorHttp.set(error);
      },
    });
  }

  protected abrirPanelOfertas(solicitud: SolicitudServicio): void {
    this.cerrarPaneles();
    this.solicitudOfertasActiva.set(solicitud);
    this.cargandoOfertas.set(true);

    this.solicitudApi.listarOfertas(solicitud.idSolicitud).subscribe({
      next: (lista) => {
        this.cargandoOfertas.set(false);
        this.ofertasRecibidas.set(lista);
      },
      error: (error: ErrorHttp) => {
        this.cargandoOfertas.set(false);
        this.errorHttp.set(error);
      },
    });
  }

  protected aceptarOferta(idOferta: number): void {
    this.errorHttp.set(null);
    this.mensajeExito.set(null);
    this.cargandoOfertas.set(true);

    this.solicitudApi.aceptarOferta(idOferta).subscribe({
      next: (contratacion) => {
        this.cargandoOfertas.set(false);
        this.solicitudOfertasActiva.set(null);
        this.ofertasRecibidas.set([]);
        this.mensajeExito.set(
          `Contratación #${contratacion.idContratacion} registrada por S/ ${contratacion.precioFinal.toFixed(2)}.`,
        );
        this.cargarSolicitudes();
      },
      error: (error: ErrorHttp) => {
        this.cargandoOfertas.set(false);
        this.errorHttp.set(error);
      },
    });
  }

  protected rechazarOferta(idOferta: number): void {
    this.errorHttp.set(null);
    this.solicitudApi.rechazarOferta(idOferta).subscribe({
      next: (actualizada) => {
        this.ofertasRecibidas.update((lista) =>
          lista.map((o) => (o.idOferta === idOferta ? actualizada : o)),
        );
        this.mensajeExito.set('Oferta rechazada.');
      },
      error: (error: ErrorHttp) => this.errorHttp.set(error),
    });
  }

  protected alIniciarContratacion(idContratacion: number): void {
    this.errorHttp.set(null);
    this.mensajeExito.set(null);

    this.solicitudApi.iniciarContratacion(idContratacion).subscribe({
      next: (contratacion) => {
        this.mensajeExito.set(`Servicio #${contratacion.idSolicitud} iniciado.`);
        this.cargarSolicitudes();
      },
      error: (error: ErrorHttp) => this.errorHttp.set(error),
    });
  }

  protected alConfirmarCompletado(idContratacion: number): void {
    this.errorHttp.set(null);
    this.mensajeExito.set(null);

    this.solicitudApi.confirmarCompletado(idContratacion).subscribe({
      next: (contratacion) => {
        if (contratacion.estado === 'COMPLETADA') {
          this.mensajeExito.set(
            'Servicio completado por ambas partes. Ya puedes dejar tu calificación.',
          );
        } else {
          this.mensajeExito.set(
            'Tu confirmación de completado fue registrada. Falta la confirmación de la otra parte.',
          );
        }
        this.cargarSolicitudes();
      },
      error: (error: ErrorHttp) => this.errorHttp.set(error),
    });
  }

  protected abrirPanelChat(solicitud: SolicitudServicio): void {
    this.cerrarPaneles();
    this.chatActivo.set(solicitud);
  }

  protected abrirPanelResena(solicitud: SolicitudServicio): void {
    this.cerrarPaneles();
    this.resenaActiva.set(solicitud);
  }

  protected cerrarPaneles(): void {
    this.chatActivo.set(null);
    this.resenaActiva.set(null);
    this.solicitudOfertasActiva.set(null);
    this.ofertasRecibidas.set([]);
  }

  protected alCrearResena(): void {
    this.resenaActiva.set(null);
    this.mensajeExito.set('¡Gracias! Tu calificación fue registrada correctamente.');
    this.cargarSolicitudes();
  }

  private reemplazarSolicitud(actualizada: SolicitudServicio): void {
    this.solicitudes.update((lista) =>
      lista.map((item) => (item.idSolicitud === actualizada.idSolicitud ? actualizada : item)),
    );
  }
}
