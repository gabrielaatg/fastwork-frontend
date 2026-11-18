import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

@Component({ template: '' })
class RutaDummy {}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: RutaDummy },
          { path: 'registro', component: RutaDummy },
          { path: 'directorio', component: RutaDummy },
        ]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe crear la aplicación', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('debe renderizar barra-navegacion y router-outlet en rutas generales', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-barra-navegacion')).not.toBeNull();
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('debe ocultar barra-navegacion en /login y /registro', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/login?expirado=1');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-barra-navegacion')).toBeNull();

    await router.navigateByUrl('/registro');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-barra-navegacion')).toBeNull();

    await router.navigateByUrl('/directorio');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-barra-navegacion')).not.toBeNull();
  });
});
