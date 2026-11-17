import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { Registro, URL_PORTAL_CUL_MTPE } from './registro';

function llenarInput(input: HTMLInputElement, valor: string): void {
  input.value = valor;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
}

describe('Registro', () => {
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debe ocultar la sección CUL para CLIENTE y mostrar enlace MTPE y carga PDF para PROVEEDOR', () => {
    const fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('#reg-cul')).toBeNull();
    expect(elemento.querySelector('#reg-confirmar-password')).not.toBeNull();
    expect(elemento.querySelector(`a[href="${URL_PORTAL_CUL_MTPE}"]`)).toBeNull();

    const botonesRol = elemento.querySelectorAll('.fw-rol-btn');
    (botonesRol[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(elemento.querySelector('#reg-cul')).not.toBeNull();
    const enlaceMtpe = elemento.querySelector(
      `a[href="${URL_PORTAL_CUL_MTPE}"]`,
    ) as HTMLAnchorElement | null;
    expect(enlaceMtpe).not.toBeNull();
    expect(enlaceMtpe?.target).toBe('_blank');
  });

  it('debe validar coincidencia de contraseñas y mostrar confirmación ¡Se registró correctamente! al enviar', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    llenarInput(elemento.querySelector('#reg-nombres') as HTMLInputElement, 'Lucía');
    llenarInput(elemento.querySelector('#reg-apellidos') as HTMLInputElement, 'Mendoza');
    llenarInput(elemento.querySelector('#reg-correo') as HTMLInputElement, 'lucia@fastwork.pe');
    llenarInput(elemento.querySelector('#reg-telefono') as HTMLInputElement, '944111222');
    llenarInput(elemento.querySelector('#reg-password') as HTMLInputElement, 'Password123');
    llenarInput(
      elemento.querySelector('#reg-confirmar-password') as HTMLInputElement,
      'OtraClave',
    );
    llenarInput(elemento.querySelector('#reg-dni') as HTMLInputElement, '70556677');
    (elemento.querySelector('.fw-check-label input') as HTMLInputElement).click();
    fixture.detectChanges();

    expect(elemento.textContent).toContain('Las contraseñas no coinciden.');
    expect(elemento.textContent).not.toContain('Contraseñas coincidentes');

    const inputPass = elemento.querySelector('#reg-password') as HTMLInputElement;
    const inputConfirmar = elemento.querySelector('#reg-confirmar-password') as HTMLInputElement;
    const botonesOjo = elemento.querySelectorAll('.fw-btn-ojo') as NodeListOf<HTMLButtonElement>;
    expect(inputPass.type).toBe('password');
    expect(inputConfirmar.type).toBe('password');
    botonesOjo[0].click();
    botonesOjo[1].click();
    fixture.detectChanges();
    expect(inputPass.type).toBe('text');
    expect(inputConfirmar.type).toBe('text');

    llenarInput(inputConfirmar, 'Password123');
    fixture.detectChanges();
    expect(elemento.textContent).toContain('Contraseñas coincidentes');

    const form = elemento.querySelector('.fw-registro-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const reqRegistro = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(reqRegistro.request.body.confirmarPassword).toBe('Password123');
    reqRegistro.flush({
      status: 'success',
      message: 'Usuario registrado exitosamente',
      data: {
        token: 'jwt-ok',
        tipo: 'Bearer',
        idUsuario: 9,
        rol: 'CLIENTE',
        nombres: 'Lucía',
      },
    });
    fixture.detectChanges();

    expect(elemento.textContent).toContain('¡Se registró correctamente!');
    expect(navigateSpy).not.toHaveBeenCalled();

    const btnContinuar = elemento.querySelector('.fw-modal-exito button') as HTMLButtonElement;
    btnContinuar.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/directorio']);
  });
});
