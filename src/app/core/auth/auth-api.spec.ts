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

  it('registrar() debe enviar POST /auth/register y guardar la sesión JWT', () => {
    const mockRespuesta: AuthResponse = {
      token: crearJwtVigente(),
      tipo: 'Bearer',
      idUsuario: 12,
      rol: 'PROVEEDOR',
      nombres: 'Carlos',
    };

    let recibido: AuthResponse | undefined;
    authApi
      .registrar({
        nombres: 'Carlos',
        apellidos: 'Mendoza',
        correo: 'carlos@fastwork.pe',
        password: 'Password123',
        telefono: '944123456',
        rol: 'PROVEEDOR',
        aceptoPoliticaDatos: true,
        documentoIdentidad: '70123456',
      })
      .subscribe((res) => (recibido = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.aceptoPoliticaDatos).toBe(true);
    req.flush({
      status: 'success',
      message: 'Usuario registrado exitosamente',
      data: mockRespuesta,
    });

    expect(recibido).toEqual(mockRespuesta);
    expect(authApi.estaAutenticado()).toBe(true);
    expect(authApi.rol()).toBe('PROVEEDOR');
    expect(localStorage.getItem('fastwork_sesion')).toContain('Carlos');
  });

  it('iniciarSesion() debe enviar POST /auth/login y actualizar signals de sesión', () => {
    const mockRespuesta: AuthResponse = {
      token: crearJwtVigente(),
      tipo: 'Bearer',
      idUsuario: 4,
      rol: 'CLIENTE',
      nombres: 'Lucía',
    };

    let recibido: AuthResponse | undefined;
    authApi
      .iniciarSesion({ correo: 'lucia@fastwork.pe', password: 'Password123' })
      .subscribe((res) => (recibido = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'success', data: mockRespuesta });

    expect(recibido).toEqual(mockRespuesta);
    expect(authApi.idUsuario()).toBe(4);
    expect(authApi.usuario()?.nombres).toBe('Lucía');
  });
});
