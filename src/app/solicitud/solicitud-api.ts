import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { extraerData, JsendResponse } from '../core/api/jsend';
import {
  ActualizarEstadoSolicitudRequest,
  CrearSolicitudRequest,
  SolicitudServicio,
} from '../dominio/solicitud';

/** Cliente HTTP para solicitudes de servicio y agenda (`/api/v1/solicitudes`). */
@Injectable({ providedIn: 'root' })
export class SolicitudApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/solicitudes`;

  crear(request: CrearSolicitudRequest): Observable<SolicitudServicio> {
    return this.http
      .post<JsendResponse<SolicitudServicio>>(this.baseUrl, request)
      .pipe(map(extraerData));
  }

  listarMisSolicitudes(): Observable<SolicitudServicio[]> {
    return this.http
      .get<JsendResponse<SolicitudServicio[]>>(`${this.baseUrl}/mis-solicitudes`)
      .pipe(map(extraerData));
  }

  actualizarEstado(
    idSolicitud: number,
    request: ActualizarEstadoSolicitudRequest,
  ): Observable<SolicitudServicio> {
    return this.http
      .patch<JsendResponse<SolicitudServicio>>(`${this.baseUrl}/${idSolicitud}/estado`, request)
      .pipe(map(extraerData));
  }
}
