import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { extraerData, JsendResponse } from '../core/api/jsend';
import { CrearMetricaPilotoRequest, MetricaPiloto } from '../dominio/piloto';

/** Cliente HTTP para el registro de encuestas del piloto (`/api/v1/piloto`). */
@Injectable({ providedIn: 'root' })
export class PilotoApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/piloto`;

  registrarMetrica(request: CrearMetricaPilotoRequest): Observable<MetricaPiloto> {
    return this.http
      .post<JsendResponse<MetricaPiloto>>(`${this.baseUrl}/metricas`, request)
      .pipe(map(extraerData));
  }
}
