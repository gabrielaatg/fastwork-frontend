import { computed, Injectable, signal } from '@angular/core';
import { AuthResponse, UsuarioSesion } from '../../dominio/auth';
import { RolUsuario } from '../../dominio/rol';

const CLAVE_SESION_STORAGE = 'fastwork_sesion';

/**
 * Administra el estado reactivo de la sesión autenticada y su persistencia local.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly estado = signal<UsuarioSesion | null>(this.cargarSesionGuardada());

  readonly usuario = this.estado.asReadonly();
  readonly token = computed(() => this.estado()?.token ?? null);
  readonly rol = computed<RolUsuario | null>(() => this.estado()?.rol ?? null);
  readonly idUsuario = computed<number | null>(() => this.estado()?.idUsuario ?? null);
  readonly estaAutenticado = computed(() => {
    const sesion = this.estado();
    return sesion !== null && !this.tokenExpirado(sesion.token);
  });

  establecerSesion(respuesta: AuthResponse): void {
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
