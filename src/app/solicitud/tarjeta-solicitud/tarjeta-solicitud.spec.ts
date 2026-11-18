import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SolicitudServicio } from '../../dominio/solicitud';
import { TarjetaSolicitud } from './tarjeta-solicitud';

describe('TarjetaSolicitud', () => {
  const solicitudBase: SolicitudServicio = {
    idSolicitud: 18,
    idCliente: 4,
    nombreCliente: 'Lucía Fernández',
    telefonoCliente: '944300400',
    calificacionCliente: 4.5,
    totalResenasCliente: 2,
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
    descripcionTrabajo: 'Fuga de agua debajo del lavadero',
    presupuestoReferencial: 95,
    estado: 'ABIERTA',
    fechaCreacion: '2026-11-17T10:00:00',
    imagenes: [
      {
        idImagen: 1,
        nombreOriginal: 'fuga-cocina.png',
        contentType: 'image/png',
        tamanoBytes: 1200,
        orden: 1,
        url: 'https://res.cloudinary.com/demo/image/upload/v1700000000/fastwork/solicitudes/18/fuga-cocina.png',
      },
    ],
    contratacion: null,
    miOferta: null,
    totalOfertas: 2,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaSolicitud],
    }).compileComponents();
  });

  it('debe renderizar miniaturas, zona, ofertas para cliente y abrir el visor lightbox al pulsar una', () => {
    const fixture = TestBed.createComponent(TarjetaSolicitud);
    const ref: ComponentRef<TarjetaSolicitud> = fixture.componentRef;
    ref.setInput('solicitud', solicitudBase);
    ref.setInput('rol', 'CLIENTE');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Trujillo');
    expect(host.textContent).toContain('Ver ofertas (2)');

    const miniaturaImg = host.querySelector('.fw-miniatura-img') as HTMLImageElement | null;
    expect(miniaturaImg).toBeTruthy();
    expect(miniaturaImg?.src).toContain('/upload/w_320,h_320,c_fill,q_auto,f_auto/');

    (host.querySelector('.fw-miniatura-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('.fw-lightbox-backdrop')).toBeTruthy();
    expect(host.querySelector('.fw-lightbox-img')?.getAttribute('src')).toBe(
      solicitudBase.imagenes[0].url,
    );
  });

  it('debe ocultar Mensajes si no hay contratación y mostrarlo cuando existe contrato', () => {
    const fixture = TestBed.createComponent(TarjetaSolicitud);
    const ref: ComponentRef<TarjetaSolicitud> = fixture.componentRef;
    ref.setInput('solicitud', solicitudBase);
    ref.setInput('rol', 'PROVEEDOR');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).not.toContain('Mensajes');
    expect(host.textContent).toContain('4.50');

    ref.setInput('solicitud', {
      ...solicitudBase,
      estado: 'CONTRATADA',
      idPerfilProveedor: 1,
      nombreProveedor: 'Carlos Mendoza',
      contratacion: {
        idContratacion: 30,
        idSolicitud: 18,
        idOferta: 9,
        idCliente: 4,
        nombreCliente: 'Lucía Fernández',
        idPerfilProveedor: 1,
        nombreProveedor: 'Carlos Mendoza',
        fotoPerfilProveedor: null,
        precioFinal: 110,
        estado: 'ACTIVA',
        completadoCliente: false,
        completadoProveedor: false,
        fechaContratacion: '2026-11-17T11:00:00',
        fechaCompletado: null,
        yaCalificoCliente: false,
        yaCalificoProveedor: false,
      },
    });
    fixture.detectChanges();
    expect(host.textContent).toContain('Mensajes');
  });

  it('debe habilitar Calificar independientemente para CLIENTE y PROVEEDOR cuando contratación está COMPLETADA', () => {
    const fixture = TestBed.createComponent(TarjetaSolicitud);
    const ref: ComponentRef<TarjetaSolicitud> = fixture.componentRef;
    const contratacionCompletada = {
      idContratacion: 30,
      idSolicitud: 18,
      idOferta: 9,
      idCliente: 4,
      nombreCliente: 'Lucía Fernández',
      idPerfilProveedor: 1,
      nombreProveedor: 'Carlos Mendoza',
      fotoPerfilProveedor: null,
      precioFinal: 110,
      estado: 'COMPLETADA' as const,
      completadoCliente: true,
      completadoProveedor: true,
      fechaContratacion: '2026-11-17T11:00:00',
      fechaCompletado: '2026-11-17T14:00:00',
      yaCalificoCliente: false,
      yaCalificoProveedor: false,
    };

    ref.setInput('solicitud', {
      ...solicitudBase,
      estado: 'COMPLETADA',
      idPerfilProveedor: 1,
      nombreProveedor: 'Carlos Mendoza',
      contratacion: contratacionCompletada,
    });

    ref.setInput('rol', 'PROVEEDOR');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Calificar al cliente');

    ref.setInput('rol', 'CLIENTE');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Calificar al proveedor');

    ref.setInput('solicitud', {
      ...solicitudBase,
      estado: 'COMPLETADA',
      idPerfilProveedor: 1,
      nombreProveedor: 'Carlos Mendoza',
      contratacion: { ...contratacionCompletada, yaCalificoProveedor: true },
    });
    ref.setInput('rol', 'PROVEEDOR');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Calificado');
  });
});
