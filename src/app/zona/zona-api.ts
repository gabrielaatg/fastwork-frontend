import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { extraerData, JsendResponse } from '../core/api/jsend';
import { Zona } from '../dominio/zona';

/** Cliente HTTP público para el catálogo de los 12 distritos de Trujillo (`/api/v1/zonas`). */
@Injectable({ providedIn: 'root' })
export class ZonaApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/zonas`;

  listarActivas(): Observable<Zona[]> {
    return this.http.get<JsendResponse<Zona[]>>(this.baseUrl).pipe(map(extraerData));
  }
}
