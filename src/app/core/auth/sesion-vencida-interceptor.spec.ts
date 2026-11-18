import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { ErrorHttp } from '../api/errores';
import { AuthApi } from './auth-api';
import { sesionVencidaInterceptor } from './sesion-vencida-interceptor';
import { tokenInterceptor } from './token-interceptor';

function crearJwtVigente(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = btoa(JSON.stringify({ sub: 'cliente@fastwork.pe', exp }));
  return `${header}.${payload}.firma-prueba`;
}

describe('Interceptores de autenticación (token y sesión vencida)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authApi: AuthApi;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([tokenInterceptor, sesionVencidaInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authApi = TestBed.inject(AuthApi);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debe adjuntar Bearer token en rutas protegidas, pero omitirlo en /auth/login y /auth/register', () => {
    const token = crearJwtVigente();
    authApi.establecerSesion({
      token,
      tipo: 'Bearer',
      idUsuario: 4,
      rol: 'CLIENTE',
      nombres: 'Lucía',
    });

    http.get(`${environment.apiUrl}/proveedores`).subscribe();
    const reqProtegida = httpMock.expectOne(`${environment.apiUrl}/proveedores`);
    expect(reqProtegida.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    reqProtegida.flush({ status: 'success', data: [] });

    http.post(`${environment.apiUrl}/piloto/metricas`, { puntajeUsabilidad: 5 }).subscribe();
    const reqMetrica = httpMock.expectOne(`${environment.apiUrl}/piloto/metricas`);
    expect(reqMetrica.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    reqMetrica.flush({ status: 'success', data: {} });

    http
      .post(`${environment.apiUrl}/auth/login`, {
        correo: 'a@b.com',
        password: '123',
        rol: 'CLIENTE',
      })
      .subscribe();
    const reqLogin = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(reqLogin.request.headers.has('Authorization')).toBe(false);
    reqLogin.flush({ status: 'success', data: {} });

    http.post(`${environment.apiUrl}/auth/register`, { correo: 'a@b.com' }).subscribe();
    const reqRegister = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(reqRegister.request.headers.has('Authorization')).toBe(false);
    reqRegister.flush({ status: 'success', data: {} });

    http.post(`${environment.apiUrl}/auth/register-proveedor`, new FormData()).subscribe();
    const reqRegisterProv = httpMock.expectOne(`${environment.apiUrl}/auth/register-proveedor`);
    expect(reqRegisterProv.request.headers.has('Authorization')).toBe(false);
    reqRegisterProv.flush({ status: 'success', data: {} });
  });

  it('debe cerrar sesión, redirigir a /login y emitir ErrorHttp cuando recibe 401 en rutas protegidas', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authApi.establecerSesion({
      token: crearJwtVigente(),
      tipo: 'Bearer',
      idUsuario: 4,
      rol: 'CLIENTE',
      nombres: 'Lucía',
    });

    let errorCapturado: ErrorHttp | undefined;
    http.get(`${environment.apiUrl}/solicitudes/mis-solicitudes`).subscribe({
      error: (err: ErrorHttp) => {
        errorCapturado = err;
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/solicitudes/mis-solicitudes`);
    req.flush(
      { status: 'error', message: 'Token expirado', code: 401 },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(authApi.estaAutenticado()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(errorCapturado).toEqual({
      statusHttp: 401,
      tipo: 'NO_AUTORIZADO',
      mensaje: 'Token expirado',
    });
  });

  it('no debe cerrar sesión ni redirigir en 401 sobre /auth/login, pero sí normalizar errores 400', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    let errorAuth: ErrorHttp | undefined;
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({
      error: (err: ErrorHttp) => {
        errorAuth = err;
      },
    });

    const reqLogin = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    reqLogin.flush(
      { status: 'error', message: 'Credenciales inválidas', code: 401 },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(errorAuth?.tipo).toBe('NO_AUTORIZADO');
    expect(errorAuth?.mensaje).toBe('Credenciales inválidas');

    let errorValidacion: ErrorHttp | undefined;
    http.post(`${environment.apiUrl}/oficios`, {}).subscribe({
      error: (err: ErrorHttp) => {
        errorValidacion = err;
      },
    });

    const reqValidacion = httpMock.expectOne(`${environment.apiUrl}/oficios`);
    reqValidacion.flush(
      {
        status: 'fail',
        message: 'Errores de validación en la solicitud',
        data: { nombreOficio: 'El nombre del oficio es obligatorio' },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(errorValidacion).toEqual({
      statusHttp: 400,
      tipo: 'VALIDACION',
      mensaje: 'Errores de validación en la solicitud',
      erroresCampo: { nombreOficio: 'El nombre del oficio es obligatorio' },
    });
  });

  it('no debe cerrar sesión ni redirigir a /login ante 403 Forbidden en rutas protegidas', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authApi.establecerSesion({
      token: crearJwtVigente(),
      tipo: 'Bearer',
      idUsuario: 2,
      rol: 'PROVEEDOR',
      nombres: 'Carlos',
    });

    let errorForbidden: ErrorHttp | undefined;
    http.get(`${environment.apiUrl}/solicitudes/55/mensajes`).subscribe({
      error: (err: ErrorHttp) => {
        errorForbidden = err;
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/solicitudes/55/mensajes`);
    req.flush(
      { status: 'error', message: 'Sin permisos sobre esta conversación', code: 403 },
      { status: 403, statusText: 'Forbidden' },
    );

    expect(authApi.estaAutenticado()).toBe(true);
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(errorForbidden?.statusHttp).toBe(403);
  });
});
