import { RolUsuario } from './rol';

export interface Mensaje {
  idMensaje: number;
  idSolicitud: number;
  idEmisor: number;
  rolEmisor: RolUsuario;
  nombreEmisor: string;
  contenido: string;
  leido: boolean;
  fechaEnvio: string; // ISO LocalDateTime
}

export interface EnviarMensajeRequest {
  contenido: string;
}
