import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { extraerData, JsendResponse } from '../core/api/jsend';
import {
  ActualizarDisponibilidadRequest,
  ActualizarPerfilProveedorRequest,
  FiltroProveedoresQuery,
  ProveedorDetalle,
  ProveedorDirectorio,
} from '../dominio/proveedor';

/** Cliente HTTP para el directorio en Trujillo y perfiles de proveedores (`/api/v1/proveedores`). */
@Injectable({ providedIn: 'root' })
export class ProveedorApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/proveedores`;

  buscarDirectorio(filtros?: FiltroProveedoresQuery): Observable<ProveedorDirectorio[]> {
    let params = new HttpParams();

    if (filtros?.oficios && filtros.oficios.length > 0) {
      params = params.set('oficios', filtros.oficios.join(','));
    }
    if (filtros?.disponibilidad) {
      params = params.set('disponibilidad', filtros.disponibilidad);
    }
    if (filtros?.calificacionMin !== undefined) {
      params = params.set('calificacionMin', String(filtros.calificacionMin));
    }

    return this.http
      .get<JsendResponse<ProveedorDirectorio[]>>(this.baseUrl, { params })
      .pipe(map(extraerData));
  }

  obtenerDetalle(idPerfilProveedor: number): Observable<ProveedorDetalle> {
    return this.http
      .get<JsendResponse<ProveedorDetalle>>(`${this.baseUrl}/${idPerfilProveedor}`)
      .pipe(map(extraerData));
  }

  actualizarMiPerfil(request: ActualizarPerfilProveedorRequest): Observable<ProveedorDetalle> {
    return this.http
      .put<JsendResponse<ProveedorDetalle>>(`${this.baseUrl}/mi-perfil`, request)
      .pipe(map(extraerData));
  }

  actualizarDisponibilidad(request: ActualizarDisponibilidadRequest): Observable<ProveedorDetalle> {
    return this.http
      .patch<JsendResponse<ProveedorDetalle>>(`${this.baseUrl}/mi-disponibilidad`, request)
      .pipe(map(extraerData));
  }
}
