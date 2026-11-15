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

  it('debe ofrecer únicamente Todos (por defecto) y Disponibles en el filtro de disponibilidad', () => {
    const fixture = TestBed.createComponent(ListaProveedores);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/oficios`).flush({ status: 'success', data: [] });
    httpMock.expectOne(`${environment.apiUrl}/proveedores`).flush({ status: 'success', data: [] });

    const select = fixture.nativeElement.querySelector('#filtro-disponibilidad') as HTMLSelectElement;
    const opciones = Array.from(select.options).map((o) => ({
      value: o.value,
      text: o.text.trim(),
    }));

    expect(opciones).toEqual([
      { value: '', text: 'Todos' },
      { value: 'DISPONIBLE', text: 'Disponibles' },
    ]);
    expect(select.value).toBe('');
  });
});
