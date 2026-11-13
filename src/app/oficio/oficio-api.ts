import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { extraerData, JsendResponse } from '../core/api/jsend';
import { CrearOficioRequest, Oficio } from '../dominio/oficio';

/** Cliente HTTP para el catálogo maestro de oficios (`/api/v1/oficios`). */
@Injectable({ providedIn: 'root' })
export class OficioApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/oficios`;

  listarActivos(): Observable<Oficio[]> {
    return this.http.get<JsendResponse<Oficio[]>>(this.baseUrl).pipe(map(extraerData));
  }

  crear(request: CrearOficioRequest): Observable<Oficio> {
    return this.http.post<JsendResponse<Oficio>>(this.baseUrl, request).pipe(map(extraerData));
  }
}
