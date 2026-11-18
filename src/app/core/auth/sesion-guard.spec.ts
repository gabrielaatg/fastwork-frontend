import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthResponse } from '../../dominio/auth';
import { RolUsuario } from '../../dominio/rol';
import { AuthApi } from './auth-api';
import { inicioRedirectGuard, invitadoGuard, rolGuard, sesionGuard } from './sesion-guard';

function crearJwtPrueba(expSegundosOffset: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expSegundosOffset;
  const payload = btoa(JSON.stringify({ sub: 'usuario@fastwork.pe', exp }));
  return `${header}.${payload}.firma-prueba`;
}

function sesionPrueba(rol: RolUsuario, expSegundosOffset = 3600): AuthResponse {
  return {
    token: crearJwtPrueba(expSegundosOffset),
    tipo: 'Bearer',
    idUsuario: 10,
    rol,
    nombres: 'Carlos',
  };
}

describe('Guards de sesión y rol (sesion-guard)', () => {
  let authApi: AuthApi;
  let injector: EnvironmentInjector;

  const rutaFalsa = {} as ActivatedRouteSnapshot;
  const estadoFalso = { url: '/solicitudes' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    authApi = TestBed.inject(AuthApi);
    injector = TestBed.inject(EnvironmentInjector);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('sesionGuard debe redirigir a /login con returnUrl cuando no hay sesión', () => {
    const resultado = runInInjectionContext(injector, () => sesionGuard(rutaFalsa, estadoFalso));

    expect(resultado instanceof UrlTree).toBe(true);
    expect((resultado as UrlTree).toString()).toBe('/login?returnUrl=%2Fsolicitudes');
  });

  it('sesionGuard debe permitir acceso cuando hay token vigente y bloquear si expiró', () => {
    authApi.establecerSesion(sesionPrueba('CLIENTE', 3600));
    expect(runInInjectionContext(injector, () => sesionGuard(rutaFalsa, estadoFalso))).toBe(true);

    authApi.establecerSesion(sesionPrueba('CLIENTE', -60));
    const bloqueado = runInInjectionContext(injector, () => sesionGuard(rutaFalsa, estadoFalso));
    expect(bloqueado instanceof UrlTree).toBe(true);
    expect(authApi.usuario()).toBeNull();
  });

  it('rolGuard debe permitir roles autorizados y redirigir a / si el rol no coincide', () => {
    authApi.establecerSesion(sesionPrueba('CLIENTE'));

    const permitido = runInInjectionContext(injector, () =>
      rolGuard('CLIENTE', 'PROVEEDOR')(rutaFalsa, estadoFalso),
    );
    expect(permitido).toBe(true);

    const denegado = runInInjectionContext(injector, () =>
      rolGuard('ADMIN')(rutaFalsa, estadoFalso),
    );
    expect(denegado instanceof UrlTree).toBe(true);
    expect((denegado as UrlTree).toString()).toBe('/');
  });

  it('invitadoGuard debe permitir acceso sin sesión y redirigir a / si ya está autenticado', () => {
    expect(runInInjectionContext(injector, () => invitadoGuard(rutaFalsa, estadoFalso))).toBe(true);

    authApi.establecerSesion(sesionPrueba('PROVEEDOR'));
    const redir = runInInjectionContext(injector, () => invitadoGuard(rutaFalsa, estadoFalso));
    expect(redir instanceof UrlTree).toBe(true);
    expect((redir as UrlTree).toString()).toBe('/');
  });

  it('inicioRedirectGuard debe redirigir según el rol vigente', () => {
    const sinSesion = runInInjectionContext(injector, () =>
      inicioRedirectGuard(rutaFalsa, estadoFalso),
    );
    expect((sinSesion as UrlTree).toString()).toBe('/inicio');

    authApi.establecerSesion(sesionPrueba('CLIENTE'));
    const cliente = runInInjectionContext(injector, () =>
      inicioRedirectGuard(rutaFalsa, estadoFalso),
    );
    expect((cliente as UrlTree).toString()).toBe('/directorio');

    authApi.establecerSesion(sesionPrueba('PROVEEDOR'));
    const proveedor = runInInjectionContext(injector, () =>
      inicioRedirectGuard(rutaFalsa, estadoFalso),
    );
    expect((proveedor as UrlTree).toString()).toBe('/solicitudes');

    authApi.establecerSesion(sesionPrueba('ADMIN'));
    const admin = runInInjectionContext(injector, () =>
      inicioRedirectGuard(rutaFalsa, estadoFalso),
    );
    expect((admin as UrlTree).toString()).toBe('/admin/verificaciones');
  });
});
