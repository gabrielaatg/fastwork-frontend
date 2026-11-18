import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { BadgeEstado } from '../../core/layout/badge-estado/badge-estado';
import { CalificacionEstrellas } from '../../core/layout/calificacion-estrellas/calificacion-estrellas';
import { PortadaPerfil } from '../../core/layout/portada-perfil/portada-perfil';
import { Contador } from '../../core/motion/contador';
import { ProveedorDetalle } from '../../dominio/proveedor';
import { ListaResenas } from '../../resena/lista-resenas/lista-resenas';
import { ProveedorApi } from '../proveedor-api';

@Component({
  selector: 'app-detalle-proveedor',
  imports: [
    Contador,
    PortadaPerfil,
    DecimalPipe,
    RouterLink,
    AlertaMensaje,
    BadgeEstado,
    CalificacionEstrellas,
    ListaResenas,
  ],
  templateUrl: './detalle-proveedor.html',
  styleUrl: './detalle-proveedor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleProveedor {
  private readonly proveedorApi = inject(ProveedorApi);
  private readonly authApi = inject(AuthApi);

  readonly idPerfilProveedor = input.required<string>();

  protected readonly esCliente = computed(() => this.authApi.tieneRol('CLIENTE'));
  protected readonly idUsuarioActual = this.authApi.idUsuario;
  protected readonly esProveedor = computed(() => this.authApi.tieneRol('PROVEEDOR'));
  protected readonly detalle = signal<ProveedorDetalle | null>(null);
  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);

  /** Distritos de atención separados por comas. */
  protected nombresZonas(proveedor: ProveedorDetalle): string {
    return proveedor.zonas.map((z) => z.nombreZona).join(', ');
  }

  /** Tarifa mínima entre todos los oficios del técnico. */
  protected readonly tarifaDesde = computed(() => {
    const oficios = this.detalle()?.oficios ?? [];
    return oficios.length ? Math.min(...oficios.map((o) => o.precioMinimo)) : null;
  });

  constructor() {
    effect(() => {
      const id = Number(this.idPerfilProveedor());
      if (!Number.isInteger(id) || id <= 0) {
        return;
      }
      this.cargarDetalle(id);
    });
  }

  private cargarDetalle(id: number): void {
    this.cargando.set(true);
    this.errorHttp.set(null);

    this.proveedorApi.obtenerDetalle(id).subscribe({
      next: (datos) => {
        this.cargando.set(false);
        this.detalle.set(datos);
      },
      error: (error: ErrorHttp) => {
        this.cargando.set(false);
        this.errorHttp.set(error);
      },
    });
  }
}
