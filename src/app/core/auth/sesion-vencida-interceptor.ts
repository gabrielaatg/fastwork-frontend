import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { normalizarError } from '../api/errores';
import { JsendResponse } from '../api/jsend';
import { AuthApi } from './auth-api';

/**
 * Normaliza los errores HTTP al formato ErrorHttp y cierra sesión cuando recibe 401 fuera de /auth/.
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
      const esRutaAuth = req.url.startsWith(`${environment.apiUrl}/auth/`);

      if (error.status === 401 && !esRutaAuth) {
        authApi.cerrarSesion();
        void router.navigate(['/login']);
      }

      return throwError(() => errorNormalizado);
    }),
  );
};
