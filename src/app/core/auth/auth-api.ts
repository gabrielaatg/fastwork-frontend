import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  DatosHeredadosDniResponse,
  EnviarCodigoCorreoRequest,
  EstadoVerificacionCorreoResponse,
  LoginRequest,
  RegistroProveedorRequest,
  RegistroUsuarioRequest,
  UsuarioSesion,
  ValidacionCulResponse,
  VerificarCodigoCorreoRequest,
} from '../../dominio/auth';
import { RolRegistro, RolUsuario } from '../../dominio/rol';
import { extraerData, JsendResponse } from '../api/jsend';

const CLAVE_SESION_STORAGE = 'fastwork_sesion';

/**
 * Cliente HTTP de autenticación (`/api/v1/auth`) y gestor reactivo de la sesión JWT.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly estado = signal<UsuarioSesion | null>(this.cargarSesionGuardada());

  readonly usuario = this.estado.asReadonly();
  readonly token = computed(() => this.estado()?.token ?? null);
  readonly rol = computed<RolUsuario | null>(() => this.estado()?.rol ?? null);
  readonly idUsuario = computed<number | null>(() => this.estado()?.idUsuario ?? null);
  readonly estaAutenticado = computed(() => {
    const sesion = this.estado();
    return sesion !== null && !this.tokenExpirado(sesion.token);
  });

  consultarDni(dni: string, rolDestino: RolRegistro): Observable<DatosHeredadosDniResponse> {
    return this.http
      .get<JsendResponse<DatosHeredadosDniResponse>>(
        `${this.baseUrl}/consultar-dni/${encodeURIComponent(dni)}`,
        { params: { rolDestino } },
      )
      .pipe(map(extraerData));
  }

  enviarCodigoCorreo(
    request: EnviarCodigoCorreoRequest,
  ): Observable<EstadoVerificacionCorreoResponse> {
    return this.http
      .post<JsendResponse<EstadoVerificacionCorreoResponse>>(
        `${this.baseUrl}/enviar-codigo-correo`,
        request,
      )
      .pipe(map(extraerData));
  }

  verificarCodigoCorreo(
    request: VerificarCodigoCorreoRequest,
  ): Observable<EstadoVerificacionCorreoResponse> {
    return this.http
      .post<JsendResponse<EstadoVerificacionCorreoResponse>>(
        `${this.baseUrl}/verificar-codigo-correo`,
        request,
      )
      .pipe(map(extraerData));
  }

  registrar(request: RegistroUsuarioRequest): Observable<AuthResponse> {
    return this.http.post<JsendResponse<AuthResponse>>(`${this.baseUrl}/register`, request).pipe(
      map(extraerData),
      tap((respuesta) => this.establecerSesion(respuesta)),
    );
  }

  validarCul(dni: string, archivoCul: File): Observable<ValidacionCulResponse> {
    const formData = new FormData();
    formData.append('dni', dni);
    formData.append('archivoCul', archivoCul, archivoCul.name);

    return this.http
      .post<JsendResponse<ValidacionCulResponse>>(`${this.baseUrl}/validar-cul`, formData)
      .pipe(map(extraerData));
  }

  registrarProveedor(
    request: RegistroProveedorRequest,
    archivoCul: File,
    fotoPerfil: File,
  ): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    formData.append('archivoCul', archivoCul, archivoCul.name);
    formData.append('fotoPerfil', fotoPerfil, fotoPerfil.name);

    return this.http
      .post<JsendResponse<AuthResponse>>(`${this.baseUrl}/register-proveedor`, formData)
      .pipe(
        map(extraerData),
        tap((respuesta) => this.establecerSesion(respuesta)),
      );
  }

  iniciarSesion(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<JsendResponse<AuthResponse>>(`${this.baseUrl}/login`, request).pipe(
      map(extraerData),
      tap((respuesta) => {
        if (!respuesta.requiereSeleccionRol && respuesta.token) {
          this.establecerSesion(respuesta);
        }
      }),
    );
  }

  establecerSesion(respuesta: AuthResponse): void {
    if (!respuesta.token || !respuesta.idUsuario || !respuesta.rol) {
      return;
    }
    const sesion: UsuarioSesion = {
      idUsuario: respuesta.idUsuario,
      nombres: respuesta.nombres,
      rol: respuesta.rol,
      token: respuesta.token,
    };
    this.estado.set(sesion);
    this.guardarEnStorage(sesion);
  }

  cerrarSesion(): void {
    this.estado.set(null);
    this.eliminarDeStorage();
  }

  /** Evalúa la vigencia real del token en el instante actual (útil en guards e interceptores). */
  esSesionVigente(): boolean {
    const sesion = this.estado();
    if (!sesion) return false;
    return !this.tokenExpirado(sesion.token);
  }

  tieneRol(...rolesPermitidos: RolUsuario[]): boolean {
    const rolActual = this.rol();
    return rolActual !== null && rolesPermitidos.includes(rolActual);
  }

  private cargarSesionGuardada(): UsuarioSesion | null {
    try {
      const raw = globalThis.localStorage?.getItem(CLAVE_SESION_STORAGE);
      if (!raw) return null;
      const sesion = JSON.parse(raw) as Partial<UsuarioSesion>;
      if (!sesion.token || !sesion.idUsuario || !sesion.rol || !sesion.nombres) {
        this.eliminarDeStorage();
        return null;
      }
      if (this.tokenExpirado(sesion.token)) {
        this.eliminarDeStorage();
        return null;
      }
      return sesion as UsuarioSesion;
    } catch {
      this.eliminarDeStorage();
      return null;
    }
  }

  private tokenExpirado(token: string): boolean {
    try {
      const partes = token.split('.');
      if (partes.length !== 3) return true;
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const base64ConPadding = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const payload = JSON.parse(globalThis.atob(base64ConPadding)) as { exp?: number };
      if (typeof payload.exp !== 'number') return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  private guardarEnStorage(sesion: UsuarioSesion): void {
    try {
      globalThis.localStorage?.setItem(CLAVE_SESION_STORAGE, JSON.stringify(sesion));
    } catch {
      // Ignorar si el navegador restringe el acceso a localStorage
    }
  }

  private eliminarDeStorage(): void {
    try {
      globalThis.localStorage?.removeItem(CLAVE_SESION_STORAGE);
    } catch {
      // Ignorar si el navegador restringe el acceso a localStorage
    }
  }
}
