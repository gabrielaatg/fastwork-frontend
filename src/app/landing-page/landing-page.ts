
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Categoria {
  numero: string;
  nombre: string;
  descripcion: string;
}

interface Proveedor {
  iniciales: string;
  nombre: string;
  oficio: string;
  estado: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPageComponent {

  readonly anioActual = new Date().getFullYear();

  readonly categorias: Categoria[] = [
    {
      numero: '01',
      nombre: 'Electricidad',
      descripcion: 'Instalaciones y reparaciones eléctricas.'
    },
    {
      numero: '02',
      nombre: 'Gasfitería',
      descripcion: 'Soluciones para tuberías y sanitarios.'
    },
    {
      numero: '03',
      nombre: 'Carpintería',
      descripcion: 'Trabajos y reparaciones en madera.'
    },
    {
      numero: '04',
      nombre: 'Pintura',
      descripcion: 'Acabados y mantenimiento de superficies.'
    },
    {
      numero: '05',
      nombre: 'Albañilería',
      descripcion: 'Construcción y reparaciones.'
    },
    {
      numero: '06',
      nombre: 'Refrigeración',
      descripcion: 'Mantenimiento de equipos y climatización.'
    }
  ];

  readonly proveedores: Proveedor[] = [
    {
      iniciales: 'JM',
      nombre: 'Juan M.',
      oficio: 'Especialista en electricidad',
      estado: 'Perfil ilustrativo'
    },
    {
      iniciales: 'CR',
      nombre: 'Carlos R.',
      oficio: 'Servicio de gasfitería',
      estado: 'Perfil ilustrativo'
    },
    {
      iniciales: 'AP',
      nombre: 'Andrés P.',
      oficio: 'Trabajos de carpintería',
      estado: 'Perfil ilustrativo'
    }
  ];

}
