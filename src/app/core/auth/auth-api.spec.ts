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
    const fotoPerfil = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'perfil.png', {
      type: 'image/png',
    });

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
          idsZonas: [1],
          idsOficios: [1],
        },
        archivoCul,
        fotoPerfil,
      )
      .subscribe((res) => (recibido = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register-proveedor`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    const body = req.request.body as FormData;
    expect(body.get('datos')).toBeTruthy();
    expect(body.get('archivoCul')).toBeTruthy();
    expect(body.get('fotoPerfil')).toBeTruthy();

    req.flush({
      status: 'success',
      message: 'Proveedor registrado y verificado exitosamente',
      data: mockRespuesta,
    });

    expect(recibido).toEqual(mockRespuesta);
    expect(authApi.rol()).toBe('PROVEEDOR');
  });

  it('validarCul() debe enviar dni y archivoCul por FormData a POST /auth/validar-cul', () => {
    const archivoCul = new File(['%PDF-1.4'], 'cul.pdf', { type: 'application/pdf' });
    let valido = false;

    authApi.validarCul('70112233', archivoCul).subscribe((res) => (valido = res.valido));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/validar-cul`);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('dni')).toBe('70112233');
    expect(body.get('archivoCul')).toBeTruthy();
    req.flush({
      status: 'success',
      data: {
        valido: true,
        nombreArchivo: 'cul.pdf',
        detalleValidacion: 'CUL válido',
        fechaValidacion: '2026-11-18T00:00:00',
      },
    });
    expect(valido).toBe(true);
  });

  it('consultarDni() debe consultar GET /auth/consultar-dni/{dni} con rolDestino', () => {
    let correoHeredado: string | null = null;

    authApi.consultarDni('70556677', 'PROVEEDOR').subscribe((res) => (correoHeredado = res.correo));

    const req = httpMock.expectOne(
      `${environment.apiUrl}/auth/consultar-dni/70556677?rolDestino=PROVEEDOR`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({
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
    expect(correoHeredado).toBe('lucia@fastwork.pe');
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

  it('enviarCodigoCorreo() y verificarCodigoCorreo() deben invocar los endpoints públicos SMTP', () => {
    let estadoEnvio: boolean | undefined;
    authApi
      .enviarCodigoCorreo({ correo: 'ana@fastwork.pe', rol: 'CLIENTE' })
      .subscribe((res) => (estadoEnvio = res.verificado));

    const reqEnvio = httpMock.expectOne(`${environment.apiUrl}/auth/enviar-codigo-correo`);
    expect(reqEnvio.request.method).toBe('POST');
    expect(reqEnvio.request.body).toEqual({ correo: 'ana@fastwork.pe', rol: 'CLIENTE' });
    reqEnvio.flush({
      status: 'success',
      data: {
        correo: 'ana@fastwork.pe',
        rol: 'CLIENTE',
        verificado: false,
        cooldownSegundos: 60,
        expiraEnSegundos: 600,
      },
    });
    expect(estadoEnvio).toBe(false);

    let estadoVerificado: boolean | undefined;
    authApi
      .verificarCodigoCorreo({ correo: 'ana@fastwork.pe', rol: 'CLIENTE', codigo: '123456' })
      .subscribe((res) => (estadoVerificado = res.verificado));

    const reqVerif = httpMock.expectOne(`${environment.apiUrl}/auth/verificar-codigo-correo`);
    expect(reqVerif.request.method).toBe('POST');
    expect(reqVerif.request.body).toEqual({
      correo: 'ana@fastwork.pe',
      rol: 'CLIENTE',
      codigo: '123456',
    });
    reqVerif.flush({
      status: 'success',
      data: {
        correo: 'ana@fastwork.pe',
        rol: 'CLIENTE',
        verificado: true,
        cooldownSegundos: 0,
        expiraEnSegundos: 1800,
      },
    });
    expect(estadoVerificado).toBe(true);
  });
});
