import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RolUsuario } from '../../../dominio/rol';
import { AuthApi } from '../../auth/auth-api';

interface EnlaceNavegacion {
  ruta: string;
  etiqueta: string;
  exacta?: boolean;
}

const ENLACES_POR_ROL: Record<RolUsuario, readonly EnlaceNavegacion[]> = {
  CLIENTE: [
    { ruta: '/directorio', etiqueta: 'Directorio' },
    { ruta: '/solicitudes/nueva', etiqueta: 'Publicar Trabajo' },
    { ruta: '/solicitudes', etiqueta: 'Mis Solicitudes', exacta: true },
    { ruta: '/piloto', etiqueta: 'Encuesta Piloto' },
  ],
  PROVEEDOR: [
    { ruta: '/proveedor/perfil', etiqueta: 'Mi Perfil' },
    { ruta: '/solicitudes', etiqueta: 'Solicitudes y Agenda' },
    { ruta: '/piloto', etiqueta: 'Encuesta Piloto' },
  ],
  ADMIN: [
    { ruta: '/directorio', etiqueta: 'Directorio' },
    { ruta: '/admin/verificaciones', etiqueta: 'Verificaciones' },
    { ruta: '/admin/oficios', etiqueta: 'Oficios' },
    { ruta: '/admin/piloto', etiqueta: 'Resumen Piloto' },
  ],
};

/**
 * Barra superior de navegación adaptada al rol de la sesión activa.
 */
@Component({
  selector: 'app-barra-navegacion',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './barra-navegacion.html',
  styleUrl: './barra-navegacion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraNavegacion {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  protected readonly estaAutenticado = this.authApi.estaAutenticado;
  protected readonly usuario = this.authApi.usuario;

  protected readonly enlaces = computed<readonly EnlaceNavegacion[]>(() => {
    const rol = this.authApi.rol();
    if (!this.estaAutenticado() || !rol) {
      return [];
    }
    return ENLACES_POR_ROL[rol];
  });

  /** Limpia la sesión actual y redirige a la pantalla de inicio de sesión. */
  protected cerrarSesion(): void {
    this.authApi.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
