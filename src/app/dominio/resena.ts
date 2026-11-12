export type PuntuacionEstrellas = 1 | 2 | 3 | 4 | 5;

export interface Resena {
  idResena: number;
  idSolicitud: number;
  idCliente: number;
  nombreCliente: string;
  idPerfilProveedor: number;
  puntuacion: number;
  comentario: string | null;
  fechaResena: string; // ISO LocalDateTime
}

export interface CrearResenaRequest {
  puntuacion: PuntuacionEstrellas;
  comentario?: string;
}
