import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { ProveedorDetalle } from '../../dominio/proveedor';
import { FormularioSolicitud } from './formulario-solicitud';

function crearProveedorDemo(): ProveedorDetalle {
  return {
    idPerfilProveedor: 1,
    idUsuario: 2,
    nombres: 'Carlos',
    apellidos: 'Mendoza',
    correo: 'carlos@fastwork.pe',
    telefono: '944123456',
    dni: '70123456',
    descripcionPerfil: 'Gasfitero certificado',
    estadoDisponibilidad: 'DISPONIBLE',
    estadoVerificacion: 'VERIFICADO',
    calificacionPromedio: 4.8,
    totalResenas: 5,
    resenas: [],
    oficios: [
      {
        idProveedorOficio: 10,
        idOficio: 3,
        nombreOficio: 'Gasfitería',
        precioMinimo: 50,
        precioMaximo: 120,
        detalleTarifa: 'Por visita',
      },
    ],
  };
}

function crearArchivoImagen(nombre: string, tipo = 'image/png', tamanoBytes = 64): File {
  return new File([new Uint8Array(tamanoBytes)], nombre, { type: tipo });
}

function seleccionarArchivos(input: HTMLInputElement, archivos: File[]): void {
  Object.defineProperty(input, 'files', {
    value: archivos,
    configurable: true,
  });
  input.dispatchEvent(new Event('change'));
}

describe('FormularioSolicitud', () => {
  let httpMock: HttpTestingController;
  let router: Router;
  let seqUrl = 0;

  beforeEach(async () => {
    seqUrl = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:preview-${++seqUrl}`);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [FormularioSolicitud],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('debe ubicar el campo de imágenes del problema antes de la descripción y exigir al menos 1 imagen', () => {
    const fixture = TestBed.createComponent(FormularioSolicitud);
    fixture.componentRef.setInput('idPerfilProveedor', '1');
    fixture.detectChanges();

    const reqProv = httpMock.expectOne(`${environment.apiUrl}/proveedores/1`);
    reqProv.flush({ status: 'success', data: crearProveedorDemo() });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const inputImagenes = el.querySelector('#sol-imagenes') as HTMLInputElement;
    const textareaDesc = el.querySelector('#sol-desc') as HTMLTextAreaElement;
    expect(inputImagenes).not.toBeNull();
    expect(textareaDesc).not.toBeNull();

    // Verifica orden DOM: imágenes aparece antes que descripción
    const relacion = inputImagenes.compareDocumentPosition(textareaDesc);
    expect(relacion & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Completa dirección y descripción sin adjuntar imagen e intenta enviar
    const inputDir = el.querySelector('#sol-direccion') as HTMLInputElement;
    inputDir.value = 'Av. Larco 450, Trujillo';
    inputDir.dispatchEvent(new Event('input'));
    textareaDesc.value = 'Fuga debajo del lavadero';
    textareaDesc.dispatchEvent(new Event('input'));

    const form = el.querySelector('.fw-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(el.textContent).toContain('Debes adjuntar al menos 1 imagen del problema');
    httpMock.expectNone(`${environment.apiUrl}/solicitudes`);
  });

  it('debe permitir agregar, reemplazar, eliminar hasta 5 imágenes y enviar multipart', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(FormularioSolicitud);
    fixture.componentRef.setInput('idPerfilProveedor', '1');
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/proveedores/1`)
      .flush({ status: 'success', data: crearProveedorDemo() });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const inputImagenes = el.querySelector('#sol-imagenes') as HTMLInputElement;

    seleccionarArchivos(inputImagenes, [
      crearArchivoImagen('foto1.png'),
      crearArchivoImagen('foto2.jpg', 'image/jpeg'),
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.fw-imagen-item').length).toBe(2);
    expect(el.textContent).toContain('2 / 5 seleccionadas');

    // Reemplaza la primera imagen
    const inputReemplazar = el.querySelector('.fw-input-oculto') as HTMLInputElement;
    seleccionarArchivos(inputReemplazar, [crearArchivoImagen('foto1-nueva.webp', 'image/webp')]);
    fixture.detectChanges();
    expect(el.textContent).toContain('foto1-nueva.webp');

    // Quita la segunda imagen
    const btnQuitar = el.querySelectorAll('.fw-btn-mini-peligro')[1] as HTMLButtonElement;
    btnQuitar.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.fw-imagen-item').length).toBe(1);

    // Completa datos y envía
    const inputDir = el.querySelector('#sol-direccion') as HTMLInputElement;
    inputDir.value = 'Av. Larco 450, Trujillo';
    inputDir.dispatchEvent(new Event('input'));
    const textareaDesc = el.querySelector('#sol-desc') as HTMLTextAreaElement;
    textareaDesc.value = 'Tubería rota en cocina';
    textareaDesc.dispatchEvent(new Event('input'));

    (el.querySelector('.fw-form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const reqCrear = httpMock.expectOne(`${environment.apiUrl}/solicitudes`);
    expect(reqCrear.request.method).toBe('POST');
    expect(reqCrear.request.body instanceof FormData).toBe(true);
    expect((reqCrear.request.body as FormData).getAll('imagenes').length).toBe(1);

    reqCrear.flush({ status: 'success', data: { idSolicitud: 99 } });
    expect(navigateSpy).toHaveBeenCalledWith(['/solicitudes']);
  });
});
