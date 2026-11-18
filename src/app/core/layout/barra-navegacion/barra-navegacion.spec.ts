import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthResponse } from '../../../dominio/auth';
import { RolUsuario } from '../../../dominio/rol';
import { AuthApi } from '../../auth/auth-api';
import { BarraNavegacion } from './barra-navegacion';

function tokenVigente(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = btoa(JSON.stringify({ sub: 'user@fastwork.pe', exp }));
  return `${header}.${payload}.firma`;
}

function sesionPara(rol: RolUsuario): AuthResponse {
  return {
    token: tokenVigente(),
    tipo: 'Bearer',
    idUsuario: 1,
    rol,
    nombres: 'Carlos',
  };
}

describe('BarraNavegacion', () => {
  let authApi: AuthApi;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BarraNavegacion],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    authApi = TestBed.inject(AuthApi);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe mostrar los enlaces actualizados de CLIENTE', () => {
    authApi.establecerSesion(sesionPara('CLIENTE'));
    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('.fw-nav-link') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.textContent?.trim());

    expect(enlaces).toEqual([
      'Directorio',
      'Publicar Trabajo',
      'Mis Solicitudes',
      'Encuesta Piloto',
    ]);
  });

  it('debe mostrar los enlaces actualizados de PROVEEDOR', () => {
    authApi.establecerSesion(sesionPara('PROVEEDOR'));
    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('.fw-nav-link') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.textContent?.trim());

    expect(enlaces).toEqual(['Mi Perfil', 'Solicitudes y Agenda', 'Encuesta Piloto']);
  });

  it('debe mostrar enlaces administrativos para ADMIN', () => {
    authApi.establecerSesion(sesionPara('ADMIN'));
    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('.fw-nav-link') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.textContent?.trim());

    expect(enlaces).toEqual(['Directorio', 'Verificaciones', 'Oficios', 'Resumen Piloto']);
  });

  it('debe cerrar sesión y navegar a /login al pulsar Cerrar sesión', () => {
    const router = TestBed.inject(Router);
    const spyNavigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authApi.establecerSesion(sesionPara('CLIENTE'));

    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    const btnSalir = fixture.nativeElement.querySelector('.fw-btn-salir') as HTMLButtonElement;
    btnSalir.click();

    expect(authApi.estaAutenticado()).toBe(false);
    expect(spyNavigate).toHaveBeenCalledWith(['/login']);
  });
});
