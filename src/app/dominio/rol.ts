export type RolUsuario = 'CLIENTE' | 'PROVEEDOR' | 'ADMIN';

/** Roles permitidos en el registro público (`/api/v1/auth/register`). */
export type RolRegistro = 'CLIENTE' | 'PROVEEDOR';

export type EstadoCuenta = 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO';
