import { Resena } from './resena';
import { Zona } from './zona';

export type EstadoDisponibilidad = 'DISPONIBLE' | 'OCUPADO' | 'NO_DISPONIBLE';
export type EstadoVerificacion = 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';
export type EstadoVerificacionDecision = 'VERIFICADO' | 'RECHAZADO';

/** Oficio y rango tarifario publicado por un proveedor. */
export interface ProveedorOficio {
  idProveedorOficio: number;
  idOficio: number;
  nombreOficio: string;
  precioMinimo: number;
  precioMaximo: number;
  detalleTarifa: string | null;
}

/** Tarjeta resumida del directorio público/cliente de proveedores. */
export interface ProveedorDirectorio {
  idPerfilProveedor: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  fotoPerfilUrl: string | null;
  descripcionPerfil: string | null;
  estadoDisponibilidad: EstadoDisponibilidad;
  estadoVerificacion: EstadoVerificacion;
  calificacionPromedio: number;
  totalResenas: number;
  oficios: ProveedorOficio[];
  zonas: Zona[];
}

/** Detalle completo del proveedor con foto, oficios, zonas, reseñas y datos de contacto. */
export interface ProveedorDetalle {
  idPerfilProveedor: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  dni: string;
  fotoPerfilUrl: string | null;
  /** Portada elegida (`portada-1` … `portada-4`). Opcional hasta que el backend la guarde. */
  portada?: string | null;
  descripcionPerfil: string | null;
  estadoDisponibilidad: EstadoDisponibilidad;
  estadoVerificacion: EstadoVerificacion;
  calificacionPromedio: number;
  totalResenas: number;
  oficios: ProveedorOficio[];
  zonas: Zona[];
  resenas: Resena[];
}

/** Elemento para actualizar las tarifas por oficio del proveedor autenticado. */
export interface ActualizarOficioTarifaRequest {
  idOficio: number;
  precioMinimo: number;
  precioMaximo: number;
  detalleTarifa?: string | null;
}

/** Cuerpo de actualización integral del perfil comercial del proveedor. */
export interface ActualizarPerfilProveedorRequest {
  descripcionPerfil?: string | null;
  oficios?: ActualizarOficioTarifaRequest[] | null;
  idsZonas?: number[] | null;
}

/** Cuerpo para actualizar disponibilidad del proveedor (`PATCH /proveedores/mi-disponibilidad`). */
export interface ActualizarDisponibilidadRequest {
  estadoDisponibilidad: EstadoDisponibilidad;
}

/** Parámetros de búsqueda del directorio de proveedores en Trujillo. */
export interface FiltroProveedoresQuery {
  oficios?: number[];
  idZona?: number;
  disponibilidad?: EstadoDisponibilidad;
  calificacionMin?: number;
}

/** Valida en el cliente el invariante `precioMaximo >= precioMinimo >= 0`. */
export function esRangoTarifaValido(minimo: number, maximo: number): boolean {
  return Number.isFinite(minimo) && Number.isFinite(maximo) && minimo >= 0 && maximo >= minimo;
}
