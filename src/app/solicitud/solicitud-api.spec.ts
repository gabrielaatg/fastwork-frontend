import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { Contratacion, OfertaSolicitud, SolicitudServicio } from '../dominio/solicitud';
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

  it('crear() con imágenes debe enviar multipart FormData con datos (oficio, zona, presupuesto) e imagenes', () => {
    const mockSolicitud: SolicitudServicio = {
      idSolicitud: 18,
      idCliente: 4,
      nombreCliente: 'Lucía Fernández',
      telefonoCliente: '944300400',
      calificacionCliente: 0,
      totalResenasCliente: 0,
      idPerfilProveedor: null,
      nombreProveedor: null,
      telefonoProveedor: null,
      fotoPerfilProveedor: null,
      idOficio: 1,
      nombreOficio: 'Gasfitería',
      idZona: 1,
      nombreZona: 'Trujillo',
      direccionTrujillo: 'Av. España 450, Trujillo',
      fechaProgramada: '2026-11-20',
      horaProgramada: '15:30:00',
      descripcionTrabajo: 'Fuga de agua en cocina',
      presupuestoReferencial: 95,
      estado: 'ABIERTA',
      fechaCreacion: '2026-11-17T10:00:00',
      imagenes: [
        {
          idImagen: 1,
          nombreOriginal: 'fuga.png',
          contentType: 'image/png',
          tamanoBytes: 12,
          orden: 1,
          url: 'https://res.cloudinary.com/demo/image/upload/v1/fastwork/solicitudes/18/fuga.png',
        },
      ],
      contratacion: null,
      miOferta: null,
      totalOfertas: 0,
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
          idOficio: 1,
          idZona: 1,
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

    req.flush({ status: 'success', message: 'Solicitud creada exitosamente', data: mockSolicitud });
    expect(respuesta).toEqual(mockSolicitud);
  });

  it('debe invocar endpoints de ofertas y contrataciones', () => {
    let oferta: OfertaSolicitud | undefined;
    api
      .enviarOActualizarOferta(18, {
        tipoOferta: 'CONTRAOFERTA',
        precioOfertado: 110,
        condiciones: 'Incluye repuestos',
      })
      .subscribe((res) => (oferta = res));

    const reqOferta = httpMock.expectOne(`${environment.apiUrl}/solicitudes/18/ofertas`);
    expect(reqOferta.request.method).toBe('POST');
    reqOferta.flush({
      status: 'success',
      data: {
        idOferta: 9,
        idSolicitud: 18,
        idPerfilProveedor: 2,
        nombreProveedor: 'Pedro Gómez',
        telefonoProveedor: '944555666',
        fotoPerfilUrl: 'https://cdn.test/f.jpg',
        calificacionPromedio: 4.8,
        totalResenas: 5,
        tipoOferta: 'CONTRAOFERTA',
        precioOfertado: 110,
        condiciones: 'Incluye repuestos',
        estado: 'PENDIENTE',
        fechaCreacion: '2026-11-17T11:00:00',
        fechaActualizacion: '2026-11-17T11:00:00',
      },
    });
    expect(oferta?.idOferta).toBe(9);

    let cont: Contratacion | undefined;
    api.aceptarOferta(9).subscribe((res) => (cont = res));
    const reqAceptar = httpMock.expectOne(`${environment.apiUrl}/ofertas/9/aceptar`);
    expect(reqAceptar.request.method).toBe('PATCH');
    reqAceptar.flush({
      status: 'success',
      data: {
        idContratacion: 30,
        idSolicitud: 18,
        idOferta: 9,
        idCliente: 4,
        nombreCliente: 'Lucía Fernández',
        idPerfilProveedor: 2,
        nombreProveedor: 'Pedro Gómez',
        fotoPerfilProveedor: null,
        precioFinal: 110,
        estado: 'ACTIVA',
        completadoCliente: false,
        completadoProveedor: false,
        fechaContratacion: '2026-11-17T11:05:00',
        fechaCompletado: null,
        yaCalificoCliente: false,
        yaCalificoProveedor: false,
      },
    });
    expect(cont?.precioFinal).toBe(110);

    api.confirmarCompletado(30).subscribe();
    const reqComp = httpMock.expectOne(`${environment.apiUrl}/contrataciones/30/completar`);
    expect(reqComp.request.method).toBe('PATCH');
    reqComp.flush({ status: 'success', data: cont });
  });
});
