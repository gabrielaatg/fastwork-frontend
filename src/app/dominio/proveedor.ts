import { Resena } from './resena';

export type EstadoDisponibilidad = 'DISPONIBLE' | 'OCUPADO' | 'NO_DISPONIBLE';
export type EstadoVerificacion = 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';
export type EstadoVerificacionDecision = 'VERIFICADO' | 'RECHAZADO';

export interface ProveedorOficio {
  idProveedorOficio: number;
  idOficio: number;
  nombreOficio: string;
  precioMinimo: number;
  precioMaximo: number;
  detalleTarifa: string | null;
}

export interface ProveedorDirectorio {
  idPerfilProveedor: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  descripcionPerfil: string | null;
  estadoDisponibilidad: EstadoDisponibilidad;
  estadoVerificacion: EstadoVerificacion;
  calificacionPromedio: number;
  totalResenas: number;
  oficios: ProveedorOficio[];
}

export interface ProveedorDetalle extends ProveedorDirectorio {
  correo: string;
  documentoIdentidad: string;
  resenas: Resena[];
}

/** Filtros soportados por `GET /api/v1/proveedores` (cobertura única en Trujillo). */
export interface FiltroProveedoresQuery {
  oficios?: number[];
  disponibilidad?: EstadoDisponibilidad;
  calificacionMin?: number;
}

export interface ActualizarOficioTarifaRequest {
  idOficio: number;
  precioMinimo: number;
  precioMaximo: number;
  detalleTarifa?: string;
}

export interface ActualizarPerfilProveedorRequest {
  descripcionPerfil?: string;
  oficios?: ActualizarOficioTarifaRequest[];
}

export interface ActualizarDisponibilidadRequest {
  estadoDisponibilidad: EstadoDisponibilidad;
}

/** Regla pura de negocio: `precioMinimo >= 0` y `precioMaximo >= precioMinimo`. */
export function esRangoTarifaValido(precioMinimo: number, precioMaximo: number): boolean {
  return (
    Number.isFinite(precioMinimo) &&
    Number.isFinite(precioMaximo) &&
    precioMinimo >= 0 &&
    precioMaximo >= precioMinimo
  );
}
