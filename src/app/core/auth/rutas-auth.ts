import { environment } from '../../../environments/environment';

const RUTAS_AUTH_PUBLICAS = [
  '/auth/login',
  '/auth/register',
  '/auth/register-proveedor',
  '/auth/consultar-dni',
  '/auth/validar-cul',
  '/auth/enviar-codigo-correo',
  '/auth/verificar-codigo-correo',
] as const;

/**
 * Determina si una URL apunta a un endpoint público de autenticación (`/auth/*`).
 */
export function esRutaAuthPublica(url: string): boolean {
  return RUTAS_AUTH_PUBLICAS.some((ruta) => {
    const prefijo = `${environment.apiUrl}${ruta}`;
    return url === prefijo || url.startsWith(`${prefijo}?`) || url.startsWith(`${prefijo}/`);
  });
}
