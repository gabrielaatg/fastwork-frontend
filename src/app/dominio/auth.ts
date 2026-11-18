import { RolRegistro, RolUsuario } from './rol';

/** Credenciales para iniciar sesión por correo o DNI. */
export interface LoginRequest {
  identificador: string;
  password: string;
  rol?: RolUsuario;
}

/** Cuerpo de registro público para cliente (POST /auth/register). */
export interface RegistroUsuarioRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  confirmarPassword: string;
  telefono: string;
  rol: RolRegistro;
  aceptoPoliticaDatos: boolean;
  dni: string;
}

/** Cuerpo de registro público para proveedor (parte JSON `datos` de POST /auth/register-proveedor). */
export interface RegistroProveedorRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  confirmarPassword: string;
  telefono: string;
  aceptoPoliticaDatos: boolean;
  dni: string;
  idsZonas: number[];
  idsOficios: number[];
}

/** Datos heredados desde la cuenta del rol contrario al consultar por DNI. */
export interface DatosHeredadosDniResponse {
  existeEnOtroRol: boolean;
  rolOrigen: RolRegistro | null;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
  correo: string | null;
}

/** Resultado de la validación previa de PDF del CUL contra DNI (POST /auth/validar-cul). */
export interface ValidacionCulResponse {
  valido: boolean;
  nombreArchivo: string;
  detalleValidacion: string;
  fechaValidacion: string;
}

/** Solicitud de envío de código de verificación por correo (POST /auth/enviar-codigo-correo). */
export interface EnviarCodigoCorreoRequest {
  correo: string;
  rol: RolRegistro;
}

/** Solicitud de validación del código de 6 dígitos (POST /auth/verificar-codigo-correo). */
export interface VerificarCodigoCorreoRequest {
  correo: string;
  rol: RolRegistro;
  codigo: string;
}

/** Estado devuelto por el backend tras enviar o validar el código de verificación por correo. */
export interface EstadoVerificacionCorreoResponse {
  correo: string;
  rol: RolRegistro;
  verificado: boolean;
  cooldownSegundos: number;
  mensaje: string;
}

/** Respuesta del backend al autenticar, registrar o requerir selección de rol dual. */
export interface AuthResponse {
  token: string | null;
  tipo: string | null;
  idUsuario: number | null;
  rol: RolUsuario | null;
  nombres: string;
  requiereSeleccionRol?: boolean;
  rolesDisponibles?: RolUsuario[];
}

/** Sesión autenticada persistida en almacenamiento local. */
export interface UsuarioSesion {
  idUsuario: number;
  nombres: string;
  rol: RolUsuario;
  token: string;
}
