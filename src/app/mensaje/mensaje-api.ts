import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { extraerData, JsendResponse } from '../core/api/jsend';
import { EnviarMensajeRequest, Mensaje } from '../dominio/mensaje';

/** Cliente HTTP para la mensajería interna por solicitud (`/api/v1/solicitudes/{id}/mensajes`). */
@Injectable({ providedIn: 'root' })
export class MensajeApi {
  private readonly http = inject(HttpClient);
  private readonly baseSolicitudesUrl = `${environment.apiUrl}/solicitudes`;

  listarPorSolicitud(idSolicitud: number): Observable<Mensaje[]> {
    return this.http
      .get<JsendResponse<Mensaje[]>>(`${this.baseSolicitudesUrl}/${idSolicitud}/mensajes`)
      .pipe(map(extraerData));
  }

  enviar(idSolicitud: number, request: EnviarMensajeRequest): Observable<Mensaje> {
    return this.http
      .post<JsendResponse<Mensaje>>(`${this.baseSolicitudesUrl}/${idSolicitud}/mensajes`, request)
      .pipe(map(extraerData));
  }
}
