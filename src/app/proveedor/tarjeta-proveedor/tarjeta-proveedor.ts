import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeEstado } from '../../core/layout/badge-estado/badge-estado';
import { CalificacionEstrellas } from '../../core/layout/calificacion-estrellas/calificacion-estrellas';
import { ProveedorDirectorio } from '../../dominio/proveedor';

@Component({
  selector: 'app-tarjeta-proveedor',
  imports: [DecimalPipe, RouterLink, BadgeEstado, CalificacionEstrellas],
  templateUrl: './tarjeta-proveedor.html',
  styleUrl: './tarjeta-proveedor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaProveedor {
  readonly proveedor = input.required<ProveedorDirectorio>();
}
