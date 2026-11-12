import { EstadoVerificacionDecision } from './proveedor';
import { PuntuacionEstrellas } from './resena';

export interface ActualizarVerificacionRequest {
  nuevoEstado: EstadoVerificacionDecision;
}

export interface CrearMetricaPilotoRequest {
  puntajeUsabilidad: PuntuacionEstrellas;
  puntajeSatisfaccion: PuntuacionEstrellas;
  observaciones?: string;
}

export interface MetricaPiloto {
  idMetrica: number;
  idUsuario: number;
  nombreUsuario: string;
  puntajeUsabilidad: number;
  puntajeSatisfaccion: number;
  observaciones: string | null;
  fechaRegistro: string; // ISO LocalDateTime
}

export interface ResumenPiloto {
  promedioUsabilidad: number;
  promedioSatisfaccion: number;
  totalEncuestas: number;
  totalUsuariosRegistrados: number;
  totalProveedoresVerificados: number;
  totalSolicitudesFinalizadas: number;
}
