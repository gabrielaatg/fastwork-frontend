import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { SolicitudServicio } from '../dominio/solicitud';
import { SolicitudApi } from './solicitud-api';

describe('SolicitudApi', () => {
  let api: SolicitudApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SolicitudApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('crear() con imágenes debe enviar multipart FormData con datos e imagenes', () => {
    const mockSolicitud: SolicitudServicio = {
      idSolicitud: 18,
      idCliente: 4,
      nombreCliente: 'Lucía Fernández',
      telefonoCliente: '944300400',
      idPerfilProveedor: 1,
      nombreProveedor: 'Carlos Mendoza',
      telefonoProveedor: '944123456',
      idOficio: 1,
      nombreOficio: 'Gasfitería',
      direccionTrujillo: 'Av. España 450, Trujillo',
      fechaProgramada: '2026-11-20',
      horaProgramada: '15:30:00',
      descripcionTrabajo: 'Fuga de agua en cocina',
      presupuestoReferencial: 95,
      estado: 'PENDIENTE',
      fechaCreacion: '2026-11-17T10:00:00',
      imagenes: [
        {
          idImagen: 1,
          nombreOriginal: 'fuga.png',
          contentType: 'image/png',
          tamanoBytes: 12,
          orden: 1,
          url: '/api/v1/solicitudes/18/imagenes/1',
        },
      ],
    };

    const img1 = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'fuga.png', {
      type: 'image/png',
    });
    const img2 = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'tubo.jpg', {
      type: 'image/jpeg',
    });

    let respuesta: SolicitudServicio | undefined;
    api
      .crear(
        {
          idPerfilProveedor: 1,
          idOficio: 1,
          direccionTrujillo: 'Av. España 450, Trujillo',
          fechaProgramada: '2026-11-20',
          horaProgramada: '15:30:00',
          descripcionTrabajo: 'Fuga de agua en cocina',
          presupuestoReferencial: 95,
        },
        [img1, img2],
      )
      .subscribe((res) => (respuesta = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/solicitudes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    const formData = req.request.body as FormData;
    expect(formData.get('datos')).toBeInstanceOf(Blob);
    expect(formData.getAll('imagenes').length).toBe(2);

    req.flush({
      status: 'success',
      message: 'Solicitud creada exitosamente',
      data: mockSolicitud,
    });

    expect(respuesta).toEqual(mockSolicitud);
  });
});
