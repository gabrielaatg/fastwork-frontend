import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  it('debe mostrar enlaces de cliente y botón Cambiar a Modo Proveedor cuando está en modo CLIENTE', () => {
    authApi.establecerSesion(sesionPara('CLIENTE'));
    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('.fw-nav-link') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.textContent?.trim());
    const btnModo = fixture.nativeElement.querySelector('.fw-btn-modo') as HTMLButtonElement | null;

    expect(enlaces).toEqual(['Directorio', 'Mis Solicitudes', 'Encuesta Piloto']);
    expect(btnModo?.textContent?.trim()).toBe('Cambiar a Modo Proveedor');
  });

  it('debe mostrar enlaces de proveedor y botón Cambiar a Modo Cliente cuando está en modo PROVEEDOR', () => {
    authApi.establecerSesion(sesionPara('PROVEEDOR'));
    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('.fw-nav-link') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.textContent?.trim());
    const btnModo = fixture.nativeElement.querySelector('.fw-btn-modo') as HTMLButtonElement | null;

    expect(enlaces).toEqual(['Mi Perfil', 'Agenda', 'Encuesta Piloto']);
    expect(btnModo?.textContent?.trim()).toBe('Cambiar a Modo Cliente');
  });

  it('no debe mostrar botón de cambio de modo para ADMIN', () => {
    authApi.establecerSesion(sesionPara('ADMIN'));
    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    const btnModo = fixture.nativeElement.querySelector('.fw-btn-modo');
    expect(btnModo).toBeNull();
  });
});
