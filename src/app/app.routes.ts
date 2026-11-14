import { Routes } from '@angular/router';
import { invitadoGuard, rolGuard, sesionGuard } from './core/auth/sesion-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'directorio',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    title: 'Iniciar sesión — Fast Work',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    title: 'Registro — Fast Work',
    loadComponent: () => import('./auth/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'directorio',
    canActivate: [sesionGuard],
    title: 'Directorio en Trujillo — Fast Work',
    loadComponent: () =>
      import('./proveedor/lista-proveedores/lista-proveedores').then((m) => m.ListaProveedores),
  },
  {
    path: 'proveedores/:idPerfilProveedor',
    canActivate: [sesionGuard],
    title: 'Perfil de proveedor — Fast Work',
    loadComponent: () =>
      import('./proveedor/detalle-proveedor/detalle-proveedor').then((m) => m.DetalleProveedor),
  },
  {
    path: 'proveedor/perfil',
    canActivate: [sesionGuard, rolGuard('PROVEEDOR')],
    title: 'Mi perfil comercial — Fast Work',
    loadComponent: () =>
      import('./proveedor/formulario-proveedor/formulario-proveedor').then(
        (m) => m.FormularioProveedor,
      ),
  },
  {
    path: 'solicitudes',
    canActivate: [sesionGuard, rolGuard('CLIENTE', 'PROVEEDOR')],
    title: 'Solicitudes — Fast Work',
    loadComponent: () =>
      import('./solicitud/lista-solicitud/lista-solicitud').then((m) => m.ListaSolicitud),
  },
  {
    path: 'solicitudes/nueva/:idPerfilProveedor',
    canActivate: [sesionGuard, rolGuard('CLIENTE')],
    title: 'Nueva solicitud — Fast Work',
    loadComponent: () =>
      import('./solicitud/formulario-solicitud/formulario-solicitud').then(
        (m) => m.FormularioSolicitud,
      ),
  },
  {
    path: 'piloto',
    canActivate: [sesionGuard, rolGuard('CLIENTE', 'PROVEEDOR')],
    title: 'Encuesta Piloto — Fast Work',
    loadComponent: () =>
      import('./piloto/encuesta-piloto/encuesta-piloto').then((m) => m.EncuestaPiloto),
  },
  {
    path: 'admin/verificaciones',
    canActivate: [sesionGuard, rolGuard('ADMIN')],
    title: 'Verificaciones — Fast Work',
    loadComponent: () =>
      import('./admin/verificacion-proveedores/verificacion-proveedores').then(
        (m) => m.VerificacionProveedores,
      ),
  },
  {
    path: 'admin/oficios',
    canActivate: [sesionGuard, rolGuard('ADMIN')],
    title: 'Catálogo de oficios — Fast Work',
    loadComponent: () => import('./oficio/lista-oficios/lista-oficios').then((m) => m.ListaOficios),
  },
  {
    path: 'admin/piloto',
    canActivate: [sesionGuard, rolGuard('ADMIN')],
    title: 'Resumen del piloto — Fast Work',
    loadComponent: () =>
      import('./admin/resumen-piloto/resumen-piloto').then((m) => m.ResumenPiloto),
  },
  {
    path: '**',
    redirectTo: 'directorio',
  },
];
