import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoDisponibilidad, EstadoVerificacion } from '../../../dominio/proveedor';
import { EstadoContratacion, EstadoOferta, EstadoSolicitud } from '../../../dominio/solicitud';

export type EstadoBadge =
  | EstadoVerificacion
  | EstadoDisponibilidad
  | EstadoSolicitud
  | EstadoOferta
  | EstadoContratacion;
export type TonoBadge = 'exito' | 'advertencia' | 'peligro' | 'neutro';

interface ConfigBadge {
  etiqueta: string;
  tono: TonoBadge;
}

const CONFIG_POR_ESTADO: Record<EstadoBadge, ConfigBadge> = {
  VERIFICADO: { etiqueta: 'Verificado', tono: 'exito' },
  DISPONIBLE: { etiqueta: 'Disponible', tono: 'exito' },
  ACEPTADA: { etiqueta: 'Aceptada', tono: 'exito' },
  CONTRATADA: { etiqueta: 'Contratada', tono: 'exito' },
  COMPLETADA: { etiqueta: 'Completada', tono: 'exito' },
  ABIERTA: { etiqueta: 'Abierta a ofertas', tono: 'advertencia' },
  ACTIVA: { etiqueta: 'Activa', tono: 'advertencia' },
  PENDIENTE: { etiqueta: 'Pendiente', tono: 'advertencia' },
  OCUPADO: { etiqueta: 'Ocupado', tono: 'advertencia' },
  EN_PROCESO: { etiqueta: 'En proceso', tono: 'advertencia' },
  RECHAZADO: { etiqueta: 'Rechazado', tono: 'peligro' },
  RECHAZADA: { etiqueta: 'Rechazada', tono: 'peligro' },
  NO_DISPONIBLE: { etiqueta: 'No disponible', tono: 'peligro' },
  CANCELADA: { etiqueta: 'Cancelada', tono: 'neutro' },
  CERRADA: { etiqueta: 'Cerrada', tono: 'neutro' },
};

@Component({
  selector: 'app-badge-estado',
  templateUrl: './badge-estado.html',
  styleUrl: './badge-estado.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeEstado {
  readonly estado = input.required<EstadoBadge>();

  protected readonly config = computed(() => CONFIG_POR_ESTADO[this.estado()]);
}
