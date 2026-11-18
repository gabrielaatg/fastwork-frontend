import { TestBed } from '@angular/core/testing';
import { SolicitudServicio } from '../../dominio/solicitud';
import { TarjetaSolicitud } from './tarjeta-solicitud';

function crearSolicitudConCloudinary(): SolicitudServicio {
  return {
    idSolicitud: 42,
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
        idImagen: 10,
        nombreOriginal: 'fuga-1.png',
        contentType: 'image/png',
        tamanoBytes: 120,
        orden: 1,
        url: 'https://res.cloudinary.com/demo/image/upload/v1/fastwork/solicitudes/42/fuga-1.png',
      },
      {
        idImagen: 11,
        nombreOriginal: 'fuga-2.jpg',
        contentType: 'image/jpeg',
        tamanoBytes: 220,
        orden: 2,
        url: 'https://res.cloudinary.com/demo/image/upload/v1/fastwork/solicitudes/42/fuga-2.jpg',
      },
    ],
  };
}

describe('TarjetaSolicitud', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaSolicitud],
    }).compileComponents();
  });

  it('debe renderizar miniaturas optimizadas de Cloudinary y permitir navegar en el lightbox', () => {
    const fixture = TestBed.createComponent(TarjetaSolicitud);
    fixture.componentRef.setInput('solicitud', crearSolicitudConCloudinary());
    fixture.componentRef.setInput('rolActual', 'PROVEEDOR');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const miniaturas = el.querySelectorAll('.fw-miniatura-btn');
    expect(miniaturas.length).toBe(2);
    expect(el.textContent).toContain('Fotos del problema (2)');

    const primeraImg = el.querySelector('.fw-miniatura-img') as HTMLImageElement;
    expect(primeraImg.src).toContain('/upload/w_320,h_320,c_fill,q_auto,f_auto/');

    // Abre lightbox en la primera foto
    (miniaturas[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.fw-lightbox-backdrop')).not.toBeNull();
    expect(el.textContent).toContain('fuga-1.png (1 / 2)');
    const imgLightbox = el.querySelector('.fw-lightbox-img') as HTMLImageElement;
    expect(imgLightbox.src).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/fastwork/solicitudes/42/fuga-1.png',
    );

    // Navega a la siguiente imagen
    const botonesNav = el.querySelectorAll('.fw-lightbox-nav');
    (botonesNav[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.textContent).toContain('fuga-2.jpg (2 / 2)');

    // Cierra lightbox
    (el.querySelector('.fw-lightbox-cerrar') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.fw-lightbox-backdrop')).toBeNull();
  });
});
