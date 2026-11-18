import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { FormularioSolicitud } from './formulario-solicitud';

describe('FormularioSolicitud', () => {
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioSolicitud],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe cargar oficios y zonas de Trujillo y exigir al menos 1 imagen antes de publicar', () => {
    const fixture = TestBed.createComponent(FormularioSolicitud);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/oficios`).flush({
      status: 'success',
      data: [{ idOficio: 1, nombreOficio: 'Gasfitería', descripcion: null, activo: true }],
    });
    httpMock.expectOne(`${environment.apiUrl}/zonas`).flush({
      status: 'success',
      data: [{ idZona: 1, nombreZona: 'Trujillo', activo: true }],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('#sol-oficio')).toBeTruthy();
    expect(host.querySelector('#sol-zona')).toBeTruthy();
    expect(host.querySelector('#sol-presupuesto')).toBeTruthy();
    expect(host.querySelector('#sol-imagenes')).toBeTruthy();

    const direccion = host.querySelector('#sol-direccion') as HTMLInputElement;
    const descripcion = host.querySelector('#sol-desc') as HTMLTextAreaElement;
    direccion.value = 'Av. España 123';
    direccion.dispatchEvent(new Event('input'));
    descripcion.value = 'Fuga de agua';
    descripcion.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (host.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    httpMock.expectNone(`${environment.apiUrl}/solicitudes`);
    expect(host.textContent).toContain('Debes adjuntar entre 1 y 5 imágenes del problema.');
  });

  it('debe enviar multipart con idOficio, idZona, presupuesto e imagen y navegar a /solicitudes', () => {
    const fixture = TestBed.createComponent(FormularioSolicitud);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/oficios`).flush({
      status: 'success',
      data: [{ idOficio: 1, nombreOficio: 'Gasfitería', descripcion: null, activo: true }],
    });
    httpMock.expectOne(`${environment.apiUrl}/zonas`).flush({
      status: 'success',
      data: [{ idZona: 1, nombreZona: 'Trujillo', activo: true }],
    });
    fixture.detectChanges();

    const comp = fixture.componentInstance as unknown as {
      alSeleccionarImagenes: (e: Event) => void;
    };
    const img = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'fuga.png', {
      type: 'image/png',
    });
    comp.alSeleccionarImagenes({ target: { files: [img], value: '' } } as unknown as Event);

    const host = fixture.nativeElement as HTMLElement;
    const direccion = host.querySelector('#sol-direccion') as HTMLInputElement;
    const descripcion = host.querySelector('#sol-desc') as HTMLTextAreaElement;
    direccion.value = 'Av. España 450';
    direccion.dispatchEvent(new Event('input'));
    descripcion.value = 'Instalación de grifería';
    descripcion.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (host.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    const req = httpMock.expectOne(`${environment.apiUrl}/solicitudes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ status: 'success', data: { idSolicitud: 99 } });

    expect(navSpy).toHaveBeenCalledWith(['/solicitudes']);
  });
});
