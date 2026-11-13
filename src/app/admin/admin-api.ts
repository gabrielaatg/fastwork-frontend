import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { extraerData, JsendResponse } from '../core/api/jsend';
import { ActualizarVerificacionRequest, ResumenPiloto } from '../dominio/piloto';
import { ProveedorDetalle } from '../dominio/proveedor';

/** Cliente HTTP exclusivo para administración (`/api/v1/admin`). */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  actualizarVerificacion(
    idPerfilProveedor: number,
    request: ActualizarVerificacionRequest,
  ): Observable<ProveedorDetalle> {
    return this.http
      .patch<JsendResponse<ProveedorDetalle>>(
        `${this.baseUrl}/proveedores/${idPerfilProveedor}/verificacion`,
        request,
      )
      .pipe(map(extraerData));
  }

  obtenerResumenPiloto(): Observable<ResumenPiloto> {
    return this.http
      .get<JsendResponse<ResumenPiloto>>(`${this.baseUrl}/piloto/resumen`)
      .pipe(map(extraerData));
  }
}
