import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormularioResena } from './formulario-resena';

describe('FormularioResena', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioResena],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('debe adaptar título y subtítulo para calificar al cliente cuando rolEvaluador es PROVEEDOR', () => {
    const fixture = TestBed.createComponent(FormularioResena);
    const ref: ComponentRef<FormularioResena> = fixture.componentRef;
    ref.setInput('idSolicitud', 18);
    ref.setInput('rolEvaluador', 'PROVEEDOR');
    ref.setInput('nombreEvaluado', 'Lucía Fernández');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Calificar al cliente');
    expect(host.textContent).toContain('Cliente: Lucía Fernández');
  });

  it('debe adaptar título y subtítulo para calificar al proveedor cuando rolEvaluador es CLIENTE', () => {
    const fixture = TestBed.createComponent(FormularioResena);
    const ref: ComponentRef<FormularioResena> = fixture.componentRef;
    ref.setInput('idSolicitud', 18);
    ref.setInput('rolEvaluador', 'CLIENTE');
    ref.setInput('nombreEvaluado', 'Carlos Mendoza');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Calificar al proveedor');
    expect(host.textContent).toContain('Proveedor: Carlos Mendoza');
  });
});
