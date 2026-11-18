import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { RolUsuario } from '../../../dominio/rol';
import { AuthApi } from '../../auth/auth-api';
import { Logo } from '../logo/logo';

type IconoNav =
  'buscar' | 'publicar' | 'lista' | 'encuesta' | 'perfil' | 'verificar' | 'herramienta' | 'grafico';

interface EnlaceNavegacion {
  ruta: string;
  etiqueta: string;
  icono: IconoNav;
  exacta?: boolean;
}

interface Indicador {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  visible: boolean;
}

const ENLACES_POR_ROL: Record<RolUsuario, readonly EnlaceNavegacion[]> = {
  CLIENTE: [
    { ruta: '/directorio', etiqueta: 'Directorio', icono: 'buscar' },
    { ruta: '/solicitudes/nueva', etiqueta: 'Publicar Trabajo', icono: 'publicar' },
    { ruta: '/solicitudes', etiqueta: 'Mis Solicitudes', icono: 'lista', exacta: true },
    { ruta: '/piloto', etiqueta: 'Encuesta Piloto', icono: 'encuesta' },
  ],
  PROVEEDOR: [
    { ruta: '/proveedor/perfil', etiqueta: 'Mi Perfil', icono: 'perfil' },
    { ruta: '/solicitudes', etiqueta: 'Solicitudes y Agenda', icono: 'lista' },
    { ruta: '/piloto', etiqueta: 'Encuesta Piloto', icono: 'encuesta' },
  ],
  ADMIN: [
    { ruta: '/directorio', etiqueta: 'Directorio', icono: 'buscar' },
    { ruta: '/admin/verificaciones', etiqueta: 'Verificaciones', icono: 'verificar' },
    { ruta: '/admin/oficios', etiqueta: 'Oficios', icono: 'herramienta' },
    { ruta: '/admin/piloto', etiqueta: 'Resumen Piloto', icono: 'grafico' },
  ],
};

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  CLIENTE: 'Cliente',
  PROVEEDOR: 'Proveedor',
  ADMIN: 'Administrador',
};

/**
 * Navegación de la aplicación con sesión: barra lateral en escritorio y barra
 * inferior tipo app en móvil. Un indicador se desliza hasta la sección activa.
 */
@Component({
  selector: 'app-barra-navegacion',
  imports: [RouterLink, RouterLinkActive, Logo],
  templateUrl: './barra-navegacion.html',
  styleUrl: './barra-navegacion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'medirIndicador()',
  },
})
export class BarraNavegacion {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly estaAutenticado = this.authApi.estaAutenticado;
  protected readonly usuario = this.authApi.usuario;
  protected readonly rol = this.authApi.rol;

  protected readonly enlaces = computed<readonly EnlaceNavegacion[]>(() => {
    const rol = this.authApi.rol();
    if (!this.estaAutenticado() || !rol) {
      return [];
    }
    return ENLACES_POR_ROL[rol];
  });

  protected readonly indicador = signal<Indicador>({
    x: 0,
    y: 0,
    ancho: 0,
    alto: 0,
    visible: false,
  });

  constructor() {
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.programarMedicion());

    afterNextRender(() => this.programarMedicion());
  }

  /** Nombre legible del rol para mostrar junto al usuario. */
  protected etiquetaRol(rol: RolUsuario): string {
    return ETIQUETA_ROL[rol];
  }

  /** Limpia la sesión actual y redirige a la pantalla de inicio de sesión. */
  protected cerrarSesion(): void {
    this.authApi.cerrarSesion();
    void this.router.navigate(['/login']);
  }

  /** Ubica el indicador deslizante sobre el enlace activo. */
  protected medirIndicador(): void {
    const activo = this.elemento.nativeElement.querySelector<HTMLElement>('.fw-nav-link-activo');
    if (!activo) {
      this.indicador.update((actual) => ({ ...actual, visible: false }));
      return;
    }
    this.indicador.set({
      x: activo.offsetLeft,
      y: activo.offsetTop,
      ancho: activo.offsetWidth,
      alto: activo.offsetHeight,
      visible: true,
    });
  }

  private programarMedicion(): void {
    if (typeof requestAnimationFrame === 'undefined') {
      return;
    }
    requestAnimationFrame(() => this.medirIndicador());
  }
}
