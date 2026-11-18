import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { Login } from './login';

function crearJwtVigente(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = btoa(JSON.stringify({ sub: 'lucia@fastwork.pe', exp }));
  return `${header}.${payload}.firma`;
}

describe('Login', () => {
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('no debe mostrar botones de rol en la pantalla inicial de login y debe alternar visibilidad de contraseña', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    const botonesRol = fixture.nativeElement.querySelectorAll('.fw-rol-btn');
    const modal = fixture.nativeElement.querySelector('[role="dialog"]');
    const inputPass = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    const botonesOjo = fixture.nativeElement.querySelectorAll('.fw-btn-ojo') as NodeListOf<HTMLButtonElement>;
    const btnOjo = botonesOjo[0];

    expect(botonesRol.length).toBe(0);
    expect(modal).toBeNull();
    expect(botonesOjo.length).toBe(1);
    expect(inputPass.type).toBe('password');

    btnOjo.click();
    fixture.detectChanges();
    expect(inputPass.type).toBe('text');

    btnOjo.click();
    fixture.detectChanges();
    expect(inputPass.type).toBe('password');
  });

  it('debe abrir ventana de selección cuando el correo tiene cuenta Cliente y Proveedor e ingresar con el rol elegido', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    const inputIdentificador = fixture.nativeElement.querySelector('#login-identificador') as HTMLInputElement;
    const inputPassword = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    inputIdentificador.value = 'lucia@fastwork.pe';
    inputIdentificador.dispatchEvent(new Event('input'));
    inputPassword.value = 'Password123';
    inputPassword.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const req1 = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req1.request.body).toEqual({
      identificador: 'lucia@fastwork.pe',
      password: 'Password123',
    });
    req1.flush({
      status: 'success',
      data: {
        token: null,
        tipo: null,
        idUsuario: null,
        rol: null,
        nombres: 'Lucía',
        requiereSeleccionRol: true,
        rolesDisponibles: ['CLIENTE', 'PROVEEDOR'],
      },
    });
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(modal).not.toBeNull();
    const botonesModal = Array.from(
      modal!.querySelectorAll('.fw-modal-rol-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(botonesModal.map((b) => b.querySelector('strong')?.textContent?.trim())).toEqual([
      'Ingresar como Cliente',
      'Ingresar como Proveedor',
    ]);

    botonesModal[1].click();
    fixture.detectChanges();

    const req2 = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req2.request.body).toEqual({
      identificador: 'lucia@fastwork.pe',
      password: 'Password123',
      rol: 'PROVEEDOR',
    });
    req2.flush({
      status: 'success',
      data: {
        token: crearJwtVigente(),
        tipo: 'Bearer',
        idUsuario: 22,
        rol: 'PROVEEDOR',
        nombres: 'Lucía',
        requiereSeleccionRol: false,
        rolesDisponibles: [],
      },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/solicitudes']);
  });

  it('debe permitir iniciar sesión usando DNI de 8 dígitos', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    const inputIdentificador = fixture.nativeElement.querySelector('#login-identificador') as HTMLInputElement;
    const inputPassword = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    inputIdentificador.value = '70556677';
    inputIdentificador.dispatchEvent(new Event('input'));
    inputPassword.value = 'Password123';
    inputPassword.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.body).toEqual({
      identificador: '70556677',
      password: 'Password123',
    });
    req.flush({
      status: 'success',
      data: {
        token: crearJwtVigente(),
        tipo: 'Bearer',
        idUsuario: 9,
        rol: 'CLIENTE',
        nombres: 'Luis',
      },
    });
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/directorio']);
  });
});
