import { RolUsuario } from './rol';

export type EstadoSolicitud =
  'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA';

export type EstadoDestinoSolicitud = Exclude<EstadoSolicitud, 'PENDIENTE'>;

export interface SolicitudImagen {
  idImagen: number;
  nombreOriginal: string;
  contentType: string;
  tamanoBytes: number;
  orden: number;
  url: string;
}

export interface SolicitudServicio {
  idSolicitud: number;
  idCliente: number;
  nombreCliente: string;
  telefonoCliente: string;
  idPerfilProveedor: number;
  nombreProveedor: string;
  telefonoProveedor: string;
  idOficio: number;
  nombreOficio: string;
  direccionTrujillo: string;
  fechaProgramada: string; // YYYY-MM-DD
  horaProgramada: string; // HH:mm:ss
  descripcionTrabajo: string;
  presupuestoReferencial: number | null;
  estado: EstadoSolicitud;
  fechaCreacion: string; // ISO LocalDateTime
  imagenes?: SolicitudImagen[];
}

export interface CrearSolicitudRequest {
  idPerfilProveedor: number;
  idOficio: number;
  direccionTrujillo: string;
  fechaProgramada: string; // YYYY-MM-DD
  horaProgramada: string; // HH:mm:ss
  descripcionTrabajo: string;
  presupuestoReferencial?: number | null;
}

export interface ActualizarEstadoSolicitudRequest {
  nuevoEstado: EstadoDestinoSolicitud;
}

/** Máquina de estados permitida por rol (paridad con `SolicitudService.java`). */
export const TRANSICIONES_SOLICITUD_POR_ROL: Readonly<
  Partial<Record<RolUsuario, Partial<Record<EstadoSolicitud, readonly EstadoDestinoSolicitud[]>>>>
> = {
  PROVEEDOR: {
    PENDIENTE: ['ACEPTADA', 'RECHAZADA'],
    ACEPTADA: ['EN_PROCESO'],
    EN_PROCESO: ['FINALIZADA'],
  },
  CLIENTE: {
    PENDIENTE: ['CANCELADA'],
    ACEPTADA: ['CANCELADA'],
  },
};

export function obtenerTransicionesPermitidas(
  estadoActual: EstadoSolicitud,
  rol: RolUsuario,
): readonly EstadoDestinoSolicitud[] {
  return TRANSICIONES_SOLICITUD_POR_ROL[rol]?.[estadoActual] ?? [];
}

export function puedeTransicionarEstado(
  estadoActual: EstadoSolicitud,
  nuevoEstado: EstadoDestinoSolicitud,
  rol: RolUsuario,
): boolean {
  return obtenerTransicionesPermitidas(estadoActual, rol).includes(nuevoEstado);
}

export function puedeCalificarSolicitud(estado: EstadoSolicitud, rol: RolUsuario): boolean {
  return estado === 'FINALIZADA' && rol === 'CLIENTE';
}
