import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { normalizarError } from '../api/errores';
import { JsendResponse } from '../api/jsend';
import { AuthApi } from './auth-api';
import { esRutaAuthPublica } from './rutas-auth';

/**
 * Normaliza los errores HTTP al formato ErrorHttp y cierra sesión cuando recibe 401 fuera de rutas públicas de auth.
 */
export const sesionVencidaInterceptor: HttpInterceptorFn = (req, next) => {
  const authApi = inject(AuthApi);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const cuerpo =
        error.error && typeof error.error === 'object'
          ? (error.error as Partial<JsendResponse<unknown>>)
          : null;
      const errorNormalizado = normalizarError(error.status, cuerpo);

      if (error.status === 401 && !esRutaAuthPublica(req.url)) {
        authApi.cerrarSesion();
        void router.navigate(['/login']);
      }

      return throwError(() => errorNormalizado);
    }),
  );
};
