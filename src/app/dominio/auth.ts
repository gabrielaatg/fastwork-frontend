import { RolRegistro, RolUsuario } from './rol';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface RegistroUsuarioRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  telefono: string;
  rol?: RolRegistro;
  aceptoPoliticaDatos: boolean;
  /** Obligatorio cuando `rol === 'PROVEEDOR'`. */
  documentoIdentidad?: string;
}

export interface AuthResponse {
  token: string;
  tipo: string; // "Bearer"
  idUsuario: number;
  rol: RolUsuario;
  nombres: string;
}

/** Estado de sesión autenticada en el cliente. */
export interface UsuarioSesion {
  idUsuario: number;
  nombres: string;
  rol: RolUsuario;
  token: string;
}
