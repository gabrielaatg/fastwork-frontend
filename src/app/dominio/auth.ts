import { RolRegistro, RolUsuario } from './rol';

export interface LoginRequest {
  identificador: string;
  password: string;
  rol?: RolUsuario;
}

export interface RegistroUsuarioRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  confirmarPassword: string;
  telefono: string;
  rol?: RolRegistro;
  aceptoPoliticaDatos: boolean;
  dni: string;
}

export interface RegistroProveedorRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  confirmarPassword: string;
  telefono: string;
  aceptoPoliticaDatos: boolean;
  dni: string;
}

export interface AuthResponse {
  token: string | null;
  tipo: string | null; // "Bearer"
  idUsuario: number | null;
  rol: RolUsuario | null;
  nombres: string;
  requiereSeleccionRol?: boolean;
  rolesDisponibles?: RolUsuario[];
}

/** Estado de sesión autenticada en el cliente. */
export interface UsuarioSesion {
  idUsuario: number;
  nombres: string;
  rol: RolUsuario;
  token: string;
}
