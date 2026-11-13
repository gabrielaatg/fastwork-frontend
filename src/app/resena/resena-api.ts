import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { extraerData, JsendResponse } from '../core/api/jsend';
import { CrearResenaRequest, Resena } from '../dominio/resena';

/** Cliente HTTP para calificaciones y reseñas post-servicio (`/api/v1/resenas`). */
@Injectable({ providedIn: 'root' })
export class ResenaApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/resenas`;

  crear(idSolicitud: number, request: CrearResenaRequest): Observable<Resena> {
    return this.http
      .post<JsendResponse<Resena>>(`${this.baseUrl}/solicitud/${idSolicitud}`, request)
      .pipe(map(extraerData));
  }
}
