export type EstadoSolicitud = 'ABIERTA' | 'CONTRATADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';
export type TipoOferta = 'ACEPTA_PRESUPUESTO' | 'CONTRAOFERTA';
export type EstadoOferta = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CERRADA';
export type EstadoContratacion = 'ACTIVA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';

/** Imagen adjunta de una solicitud almacenada en Cloudinary. */
export interface SolicitudImagen {
  idImagen: number;
  nombreOriginal: string;
  contentType: string;
  tamanoBytes: number;
  orden: number;
  url: string;
}

/** Oferta o contraoferta emitida por un proveedor sobre una solicitud abierta. */
export interface OfertaSolicitud {
  idOferta: number;
  idSolicitud: number;
  idPerfilProveedor: number;
  nombreProveedor: string;
  telefonoProveedor: string;
  fotoPerfilUrl: string | null;
  calificacionPromedio: number;
  totalResenas: number;
  tipoOferta: TipoOferta;
  precioOfertado: number;
  condiciones: string | null;
  estado: EstadoOferta;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/** Contratación única registrada al aceptar una oferta sobre una solicitud. */
export interface Contratacion {
  idContratacion: number;
  idSolicitud: number;
  idOferta: number;
  idCliente: number;
  nombreCliente: string;
  idPerfilProveedor: number;
  nombreProveedor: string;
  fotoPerfilProveedor: string | null;
  precioFinal: number;
  estado: EstadoContratacion;
  completadoCliente: boolean;
  completadoProveedor: boolean;
  fechaContratacion: string;
  fechaCompletado: string | null;
  yaCalificoCliente: boolean;
  yaCalificoProveedor: boolean;
}

/** Solicitud de servicio publicada por un cliente en un oficio y distrito de Trujillo. */
export interface SolicitudServicio {
  idSolicitud: number;
  idCliente: number;
  nombreCliente: string;
  telefonoCliente: string;
  calificacionCliente: number;
  totalResenasCliente: number;
  idPerfilProveedor: number | null;
  nombreProveedor: string | null;
  telefonoProveedor: string | null;
  fotoPerfilProveedor: string | null;
  idOficio: number;
  nombreOficio: string;
  idZona: number;
  nombreZona: string;
  direccionTrujillo: string;
  fechaProgramada: string;
  horaProgramada: string;
  descripcionTrabajo: string;
  presupuestoReferencial: number;
  estado: EstadoSolicitud;
  fechaCreacion: string;
  imagenes: SolicitudImagen[];
  contratacion: Contratacion | null;
  miOferta: OfertaSolicitud | null;
  totalOfertas: number;
}

/** Datos para publicar una solicitud abierta de trabajo (`POST /solicitudes`). */
export interface CrearSolicitudRequest {
  idOficio: number;
  idZona: number;
  direccionTrujillo: string;
  fechaProgramada: string;
  horaProgramada: string;
  descripcionTrabajo: string;
  presupuestoReferencial: number;
}

/** Cuerpo para enviar o actualizar la única oferta de un proveedor en una solicitud. */
export interface CrearActualizarOfertaRequest {
  tipoOferta: TipoOferta;
  precioOfertado?: number | null;
  condiciones?: string | null;
}

/** Cambio de estado permitido sobre una solicitud (`PATCH /solicitudes/{id}/estado`). */
export interface ActualizarEstadoSolicitudRequest {
  nuevoEstado: EstadoSolicitud;
}
