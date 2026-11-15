import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../../dominio/rol';
import { AuthApi } from './auth-api';

/** Protege rutas que requieren una sesión JWT vigente. */
export const sesionGuard: CanActivateFn = (_route, state) => {
  const authApi = inject(AuthApi);
  const router = inject(Router);

  if (authApi.esSesionVigente()) {
    return true;
  }

  authApi.cerrarSesion();
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Protege rutas restringidas a uno o más roles específicos. */
export function rolGuard(...rolesPermitidos: RolUsuario[]): CanActivateFn {
  return (_route, state) => {
    const authApi = inject(AuthApi);
    const router = inject(Router);

    if (!authApi.esSesionVigente()) {
      authApi.cerrarSesion();
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (authApi.tieneRol(...rolesPermitidos)) {
      return true;
    }

    return router.parseUrl('/');
  };
}

/** Evita que usuarios con sesión activa accedan a login o registro. */
export const invitadoGuard: CanActivateFn = () => {
  const authApi = inject(AuthApi);
  const router = inject(Router);

  return authApi.esSesionVigente() ? router.parseUrl('/') : true;
};

/** Redirige la ruta raíz hacia el panel inicial correspondiente al rol activo. */
export const inicioRedirectGuard: CanActivateFn = () => {
  const authApi = inject(AuthApi);
  const router = inject(Router);

  if (!authApi.esSesionVigente()) {
    authApi.cerrarSesion();
    return router.parseUrl('/login');
  }

  switch (authApi.rol()) {
    case 'ADMIN':
      return router.parseUrl('/admin/verificaciones');
    case 'PROVEEDOR':
      return router.parseUrl('/solicitudes');
    default:
      return router.parseUrl('/directorio');
  }
};
