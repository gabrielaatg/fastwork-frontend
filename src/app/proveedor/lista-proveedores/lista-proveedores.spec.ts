import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ListaProveedores } from './lista-proveedores';

describe('ListaProveedores', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaProveedores],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('no debe mostrar el filtro de disponibilidad y debe consultar solo proveedores DISPONIBLE', () => {
    const fixture = TestBed.createComponent(ListaProveedores);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/oficios`).flush({ status: 'success', data: [] });
    httpMock.expectOne(`${environment.apiUrl}/zonas`).flush({ status: 'success', data: [] });
    const req = httpMock.expectOne(
      `${environment.apiUrl}/proveedores?disponibilidad=DISPONIBLE`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [] });

    expect(fixture.nativeElement.querySelector('#filtro-disponibilidad')).toBeNull();
  });
});
