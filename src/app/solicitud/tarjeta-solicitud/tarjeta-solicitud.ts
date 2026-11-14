import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BadgeEstado } from '../../core/layout/badge-estado/badge-estado';
import { RolUsuario } from '../../dominio/rol';
import {
  EstadoDestinoSolicitud,
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
})
export class TarjetaSolicitud {
  readonly solicitud = input.required<SolicitudServicio>();
  readonly rolActual = input.required<RolUsuario>();
  readonly seleccionada = input(false);

  readonly cambiarEstado = output<EstadoDestinoSolicitud>();
  readonly abrirChat = output<void>();
  readonly calificar = output<void>();

  protected readonly transiciones = computed(() =>
    obtenerTransicionesPermitidas(this.solicitud().estado, this.rolActual()),
  );

  protected readonly puedeCalificar = computed(() =>
    puedeCalificarSolicitud(this.solicitud().estado, this.rolActual()),
  );

  protected etiquetaAccion(estado: EstadoDestinoSolicitud): string {
    return ETIQUETA_ACCION_ESTADO[estado];
  }

  protected esAccionPeligro(estado: EstadoDestinoSolicitud): boolean {
    return estado === 'RECHAZADA' || estado === 'CANCELADA';
  }
}
