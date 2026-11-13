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
