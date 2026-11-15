import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth-api';
import { esRutaAuthPublica } from './rutas-auth';

/**
 * Adjunta el token JWT Bearer en las peticiones dirigidas a rutas protegidas del backend.
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authApi = inject(AuthApi);
  const token = authApi.token();

  const esRutaBackend = req.url.startsWith(environment.apiUrl);

  if (!token || !esRutaBackend || esRutaAuthPublica(req.url) || !authApi.esSesionVigente()) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
