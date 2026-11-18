import { RolUsuario } from './rol';

export type PuntuacionEstrellas = 1 | 2 | 3 | 4 | 5;

/** Calificación bidireccional registrada tras el completado mutuo de una contratación. */
export interface Resena {
  idResena: number;
  idContratacion: number;
  idSolicitud: number;
  idAutor: number;
  nombreAutor: string;
  rolAutor: RolUsuario;
  idEvaluado: number;
  idPerfilProveedor: number;
  puntuacion: PuntuacionEstrellas;
  comentario: string | null;
  fechaResena: string;
}

/** Cuerpo para registrar una reseña entre cliente y proveedor. */
export interface CrearResenaRequest {
  puntuacion: PuntuacionEstrellas;
  comentario?: string | null;
}
