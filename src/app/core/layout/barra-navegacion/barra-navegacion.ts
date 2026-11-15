import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RolRegistro, RolUsuario } from '../../../dominio/rol';
import { AuthApi } from '../../auth/auth-api';

interface EnlaceNavegacion {
  ruta: string;
  etiqueta: string;
}

const ENLACES_POR_ROL: Record<RolUsuario, readonly EnlaceNavegacion[]> = {
  CLIENTE: [
    { ruta: '/directorio', etiqueta: 'Directorio' },
    { ruta: '/solicitudes', etiqueta: 'Mis Solicitudes' },
    { ruta: '/piloto', etiqueta: 'Encuesta Piloto' },
  ],
  PROVEEDOR: [
    { ruta: '/proveedor/perfil', etiqueta: 'Mi Perfil' },
    { ruta: '/solicitudes', etiqueta: 'Agenda' },
    { ruta: '/piloto', etiqueta: 'Encuesta Piloto' },
  ],
  ADMIN: [
    { ruta: '/directorio', etiqueta: 'Directorio' },
    { ruta: '/admin/verificaciones', etiqueta: 'Verificaciones' },
    { ruta: '/admin/oficios', etiqueta: 'Oficios' },
    { ruta: '/admin/piloto', etiqueta: 'Resumen Piloto' },
  ],
};

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
  protected readonly cambiandoModo = signal(false);

  protected readonly enlaces = computed<readonly EnlaceNavegacion[]>(() => {
    const rol = this.authApi.rol();
    if (!this.estaAutenticado() || !rol) {
      return [];
    }
    return ENLACES_POR_ROL[rol];
  });

  protected readonly puedeCambiarModo = computed(() => {
    const rol = this.authApi.rol();
    return this.estaAutenticado() && (rol === 'CLIENTE' || rol === 'PROVEEDOR');
  });

  protected readonly etiquetaCambioModo = computed(() =>
    this.authApi.rol() === 'PROVEEDOR' ? 'Modo Cliente' : 'Modo Proveedor',
  );

  protected alternarModo(): void {
    if (this.cambiandoModo()) {
      return;
    }

    const rolActual = this.authApi.rol();
    if (rolActual !== 'CLIENTE' && rolActual !== 'PROVEEDOR') {
      return;
    }

    const nuevoModo: RolRegistro = rolActual === 'PROVEEDOR' ? 'CLIENTE' : 'PROVEEDOR';
    const rutaDestino = nuevoModo === 'CLIENTE' ? '/directorio' : '/proveedor/perfil';

    this.cambiandoModo.set(true);
    this.authApi.cambiarModo(nuevoModo).subscribe({
      next: () => {
        this.cambiandoModo.set(false);
        void this.router.navigate([rutaDestino]);
      },
      error: () => {
        this.cambiandoModo.set(false);
      },
    });
  }

  protected cerrarSesion(): void {
    this.authApi.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
