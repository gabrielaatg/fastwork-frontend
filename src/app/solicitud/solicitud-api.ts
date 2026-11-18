import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { extraerData, JsendResponse } from '../core/api/jsend';
import {
  ActualizarEstadoSolicitudRequest,
  Contratacion,
  CrearActualizarOfertaRequest,
  CrearSolicitudRequest,
  OfertaSolicitud,
  SolicitudServicio,
} from '../dominio/solicitud';

/**
 * Cliente HTTP para publicación abierta de solicitudes, ofertas/contraofertas
 * y gestión de contrataciones (`/api/v1/solicitudes`, `/ofertas`, `/contrataciones`).
 */
@Injectable({ providedIn: 'root' })
export class SolicitudApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/solicitudes`;
  private readonly ofertasUrl = `${environment.apiUrl}/ofertas`;
  private readonly contratacionesUrl = `${environment.apiUrl}/contrataciones`;

  crear(datos: CrearSolicitudRequest, imagenes: File[]): Observable<SolicitudServicio> {
    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    for (const imagen of imagenes) {
      formData.append('imagenes', imagen, imagen.name);
    }

    return this.http
      .post<JsendResponse<SolicitudServicio>>(this.baseUrl, formData)
      .pipe(map(extraerData));
  }

  listarDisponibles(): Observable<SolicitudServicio[]> {
    return this.http
      .get<JsendResponse<SolicitudServicio[]>>(`${this.baseUrl}/disponibles`)
      .pipe(map(extraerData));
  }

  listarMisSolicitudes(): Observable<SolicitudServicio[]> {
    return this.http
      .get<JsendResponse<SolicitudServicio[]>>(`${this.baseUrl}/mis-solicitudes`)
      .pipe(map(extraerData));
  }

  actualizarEstado(
    idSolicitud: number,
    cuerpo: ActualizarEstadoSolicitudRequest,
  ): Observable<SolicitudServicio> {
    return this.http
      .patch<JsendResponse<SolicitudServicio>>(`${this.baseUrl}/${idSolicitud}/estado`, cuerpo)
      .pipe(map(extraerData));
  }

  listarOfertas(idSolicitud: number): Observable<OfertaSolicitud[]> {
    return this.http
      .get<JsendResponse<OfertaSolicitud[]>>(`${this.baseUrl}/${idSolicitud}/ofertas`)
      .pipe(map(extraerData));
  }

  enviarOActualizarOferta(
    idSolicitud: number,
    cuerpo: CrearActualizarOfertaRequest,
  ): Observable<OfertaSolicitud> {
    return this.http
      .post<JsendResponse<OfertaSolicitud>>(`${this.baseUrl}/${idSolicitud}/ofertas`, cuerpo)
      .pipe(map(extraerData));
  }

  aceptarOferta(idOferta: number): Observable<Contratacion> {
    return this.http
      .patch<JsendResponse<Contratacion>>(`${this.ofertasUrl}/${idOferta}/aceptar`, {})
      .pipe(map(extraerData));
  }

  rechazarOferta(idOferta: number): Observable<OfertaSolicitud> {
    return this.http
      .patch<JsendResponse<OfertaSolicitud>>(`${this.ofertasUrl}/${idOferta}/rechazar`, {})
      .pipe(map(extraerData));
  }

  listarMisContrataciones(): Observable<Contratacion[]> {
    return this.http
      .get<JsendResponse<Contratacion[]>>(`${this.contratacionesUrl}/mis-contrataciones`)
      .pipe(map(extraerData));
  }

  iniciarContratacion(idContratacion: number): Observable<Contratacion> {
    return this.http
      .patch<JsendResponse<Contratacion>>(`${this.contratacionesUrl}/${idContratacion}/iniciar`, {})
      .pipe(map(extraerData));
  }

  confirmarCompletado(idContratacion: number): Observable<Contratacion> {
    return this.http
      .patch<JsendResponse<Contratacion>>(`${this.contratacionesUrl}/${idContratacion}/completar`, {})
      .pipe(map(extraerData));
  }
}
