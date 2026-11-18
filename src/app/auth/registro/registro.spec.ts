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

  it('debe ocultar sección proveedor para CLIENTE y mostrar distritos, oficios, enlace MTPE y PDF para PROVEEDOR', () => {
    const fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('#reg-cul')).toBeNull();
    expect(elemento.querySelector('#reg-confirmar-password')).not.toBeNull();
    expect(elemento.querySelector(`a[href="${URL_PORTAL_CUL_MTPE}"]`)).toBeNull();

    const botonesRol = elemento.querySelectorAll('.fw-rol-btn');
    (botonesRol[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/zonas`).flush({
      status: 'success',
      data: [{ idZona: 1, nombreZona: 'Trujillo', activo: true }],
    });
    httpMock.expectOne(`${environment.apiUrl}/oficios`).flush({
      status: 'success',
      data: [{ idOficio: 1, nombreOficio: 'Gasfitería', descripcion: null, activo: true }],
    });
    fixture.detectChanges();

    expect(elemento.querySelector('#reg-cul')).not.toBeNull();
    expect(elemento.textContent).toContain('Trujillo');
    expect(elemento.textContent).toContain('Gasfitería');
    const enlaceMtpe = elemento.querySelector(
      `a[href="${URL_PORTAL_CUL_MTPE}"]`,
    ) as HTMLAnchorElement | null;
    expect(enlaceMtpe).not.toBeNull();
    expect(enlaceMtpe?.target).toBe('_blank');
  });

  it('debe validar coincidencia de contraseñas, código SMTP y mostrar confirmación ¡Se registró correctamente!', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    llenarInput(elemento.querySelector('#reg-dni') as HTMLInputElement, '70556677');
    fixture.detectChanges();

    const reqDni = httpMock.expectOne(
      `${environment.apiUrl}/auth/consultar-dni/70556677?rolDestino=CLIENTE`,
    );
    reqDni.flush({
      status: 'success',
      data: {
        existeEnOtroRol: false,
        rolOrigen: null,
        nombres: null,
        apellidos: null,
        telefono: null,
        correo: null,
      },
    });

    llenarInput(elemento.querySelector('#reg-nombres') as HTMLInputElement, 'Lucía');
    llenarInput(elemento.querySelector('#reg-apellidos') as HTMLInputElement, 'Mendoza');
    llenarInput(elemento.querySelector('#reg-correo') as HTMLInputElement, 'lucia@fastwork.pe');
    llenarInput(elemento.querySelector('#reg-telefono') as HTMLInputElement, '944111222');
    llenarInput(elemento.querySelector('#reg-password') as HTMLInputElement, 'Password123');
    llenarInput(
      elemento.querySelector('#reg-confirmar-password') as HTMLInputElement,
      'OtraClave',
    );
    (elemento.querySelector('.fw-check-label input') as HTMLInputElement).click();
    fixture.detectChanges();

    expect(elemento.textContent).toContain('Las contraseñas no coinciden.');
    expect(elemento.textContent).not.toContain('Contraseñas coincidentes');

    const inputPass = elemento.querySelector('#reg-password') as HTMLInputElement;
    const inputConfirmar = elemento.querySelector('#reg-confirmar-password') as HTMLInputElement;
    const botonesOjo = elemento.querySelectorAll('.fw-btn-ojo') as NodeListOf<HTMLButtonElement>;
    expect(botonesOjo.length).toBe(2);
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
    await Promise.resolve();
    fixture.detectChanges();
    expect(elemento.textContent).toContain('Debes verificar tu correo electrónico');
    httpMock.expectNone(`${environment.apiUrl}/auth/register`);

    const btnEnviarCodigo = elemento.querySelector('#reg-btn-enviar-codigo') as HTMLButtonElement;
    btnEnviarCodigo.click();
    const reqEnviar = httpMock.expectOne(`${environment.apiUrl}/auth/enviar-codigo-correo`);
    expect(reqEnviar.request.body).toEqual({ correo: 'lucia@fastwork.pe', rol: 'CLIENTE' });
    reqEnviar.flush({
      status: 'success',
      data: {
        correo: 'lucia@fastwork.pe',
        rol: 'CLIENTE',
        verificado: false,
        cooldownSegundos: 60,
        expiraEnSegundos: 600,
      },
    });
    fixture.detectChanges();

    expect(elemento.querySelector('.fw-modal-codigo')).not.toBeNull();
    const inputCodigo = elemento.querySelector('#reg-codigo-correo') as HTMLInputElement;
    llenarInput(inputCodigo, '654321');
    (elemento.querySelector('#reg-btn-validar-codigo') as HTMLButtonElement).click();

    const reqValidar = httpMock.expectOne(`${environment.apiUrl}/auth/verificar-codigo-correo`);
    reqValidar.flush({
      status: 'success',
      data: {
        correo: 'lucia@fastwork.pe',
        rol: 'CLIENTE',
        verificado: true,
        cooldownSegundos: 0,
        expiraEnSegundos: 1800,
      },
    });
    fixture.detectChanges();

    expect(elemento.querySelector('.fw-modal-codigo')).toBeNull();
    expect(elemento.textContent).toContain('Correo electrónico verificado');

    form.dispatchEvent(new Event('submit'));
    await Promise.resolve();
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
    const btnContinuar = elemento.querySelector('.fw-modal-exito button') as HTMLButtonElement;
    btnContinuar.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/directorio']);
  });

  it('debe heredar datos al ingresar DNI del otro rol y mostrar foto de perfil solo tras verificar CUL', () => {
    const fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const comp = fixture.componentInstance as unknown as {
      seleccionarRol: (rol: 'CLIENTE' | 'PROVEEDOR') => void;
      alSeleccionarCul: (e: Event) => void;
      modelo: { update: (fn: (m: Record<string, unknown>) => Record<string, unknown>) => void };
    };

    comp.seleccionarRol('PROVEEDOR');
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/zonas`).flush({ status: 'success', data: [] });
    httpMock.expectOne(`${environment.apiUrl}/oficios`).flush({ status: 'success', data: [] });

    comp.modelo.update((m) => ({ ...m, dni: '70112233' }));
    fixture.detectChanges();

    const reqDni = httpMock.expectOne(
      `${environment.apiUrl}/auth/consultar-dni/70112233?rolDestino=PROVEEDOR`,
    );
    reqDni.flush({
      status: 'success',
      data: {
        existeEnOtroRol: true,
        rolOrigen: 'CLIENTE',
        nombres: 'Lucía',
        apellidos: 'Mendoza',
        telefono: '944111222',
        correo: 'lucia@fastwork.pe',
      },
    });
    fixture.detectChanges();

    expect(host.querySelector('.fw-herencia-banner')?.textContent).toContain('Cuenta encontrada como Cliente');
    expect((host.querySelector('#reg-nombres') as HTMLInputElement).value).toBe('Lucía');
    expect((host.querySelector('#reg-nombres') as HTMLInputElement).readOnly).toBe(true);
    expect((host.querySelector('#reg-correo') as HTMLInputElement).value).toBe('lucia@fastwork.pe');
    expect((host.querySelector('#reg-correo') as HTMLInputElement).readOnly).toBe(true);
    expect(host.querySelector('#reg-foto-perfil')).toBeNull();

    const pdf = new File(['%PDF-1.4'], 'cul_70112233.pdf', { type: 'application/pdf' });
    comp.alSeleccionarCul({ target: { files: [pdf] } } as unknown as Event);

    const reqCul = httpMock.expectOne(`${environment.apiUrl}/auth/validar-cul`);
    reqCul.flush({
      status: 'success',
      data: {
        valido: true,
        nombreArchivo: 'cul_70112233.pdf',
        detalleValidacion: 'CUL validado',
        fechaValidacion: '2026-11-18T00:00:00',
      },
    });
    fixture.detectChanges();

    expect(host.querySelector('#reg-foto-perfil')).toBeTruthy();
  });
});
