import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../../dominio/auth';
import { AuthApi } from './auth-api';

function crearJwtVigente(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = btoa(JSON.stringify({ sub: 'carlos@fastwork.pe', exp }));
  return `${header}.${payload}.firma-prueba`;
}

describe('AuthApi', () => {
  let authApi: AuthApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    authApi = TestBed.inject(AuthApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('registrar() debe enviar POST /auth/register con confirmarPassword y guardar la sesión JWT', () => {
    const mockRespuesta: AuthResponse = {
      token: crearJwtVigente(),
      tipo: 'Bearer',
      idUsuario: 12,
      rol: 'CLIENTE',
      nombres: 'Carlos',
    };

    let recibido: AuthResponse | undefined;
    authApi
      .registrar({
        nombres: 'Carlos',
        apellidos: 'Mendoza',
        correo: 'carlos@fastwork.pe',
        password: 'Password123',
        confirmarPassword: 'Password123',
        telefono: '944123456',
        rol: 'CLIENTE',
        aceptoPoliticaDatos: true,
        dni: '70123456',
      })
      .subscribe((res) => (recibido = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.aceptoPoliticaDatos).toBe(true);
    expect(req.request.body.dni).toBe('70123456');
    req.flush({
      status: 'success',
      message: 'Usuario registrado exitosamente',
      data: mockRespuesta,
    });

    expect(recibido).toEqual(mockRespuesta);
    expect(authApi.estaAutenticado()).toBe(true);
    expect(authApi.rol()).toBe('CLIENTE');
    expect(localStorage.getItem('fastwork_sesion')).toContain('Carlos');
  });

  it('registrarProveedor() debe enviar multipart FormData a POST /auth/register-proveedor y guardar sesión', () => {
    const mockRespuesta: AuthResponse = {
      token: crearJwtVigente(),
      tipo: 'Bearer',
      idUsuario: 15,
      rol: 'PROVEEDOR',
      nombres: 'Mario',
    };
    const archivoCul = new File(['%PDF-1.4 demo'], 'cul_mario.pdf', { type: 'application/pdf' });

    let recibido: AuthResponse | undefined;
    authApi
      .registrarProveedor(
        {
          nombres: 'Mario',
          apellidos: 'Vargas',
          correo: 'mario@fastwork.pe',
          password: 'Password123',
          confirmarPassword: 'Password123',
          telefono: '944123456',
          aceptoPoliticaDatos: true,
          dni: '70112233',
        },
        archivoCul,
      )
      .subscribe((res) => (recibido = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register-proveedor`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    const body = req.request.body as FormData;
    expect(body.get('datos')).toBeTruthy();
    expect(body.get('archivoCul')).toBeTruthy();

    req.flush({
      status: 'success',
      message: 'Proveedor registrado y verificado exitosamente',
      data: mockRespuesta,
    });

    expect(recibido).toEqual(mockRespuesta);
    expect(authApi.rol()).toBe('PROVEEDOR');
  });

  it('iniciarSesion() debe guardar sesión si viene token y omitirla cuando requiereSeleccionRol es true', () => {
    const respuestaSeleccion: AuthResponse = {
      token: null,
      tipo: null,
      idUsuario: null,
      rol: null,
      nombres: 'Lucía',
      requiereSeleccionRol: true,
      rolesDisponibles: ['CLIENTE', 'PROVEEDOR'],
    };

    authApi
      .iniciarSesion({ identificador: 'lucia@fastwork.pe', password: 'Password123' })
      .subscribe();

    const req1 = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req1.request.method).toBe('POST');
    req1.flush({ status: 'success', data: respuestaSeleccion });

    expect(authApi.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('fastwork_sesion')).toBeNull();

    const mockRespuesta: AuthResponse = {
      token: crearJwtVigente(),
      tipo: 'Bearer',
      idUsuario: 4,
      rol: 'CLIENTE',
      nombres: 'Lucía',
    };

    let recibido: AuthResponse | undefined;
    authApi
      .iniciarSesion({ identificador: 'lucia@fastwork.pe', password: 'Password123', rol: 'CLIENTE' })
      .subscribe((res) => (recibido = res));

    const req2 = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req2.request.body.rol).toBe('CLIENTE');
    req2.flush({ status: 'success', data: mockRespuesta });

    expect(recibido).toEqual(mockRespuesta);
    expect(authApi.idUsuario()).toBe(4);
    expect(authApi.usuario()?.nombres).toBe('Lucía');
  });
});
