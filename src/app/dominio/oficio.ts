export interface Oficio {
  idOficio: number;
  nombreOficio: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CrearOficioRequest {
  nombreOficio: string;
  descripcion?: string;
}
