import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { CalificacionEstrellas } from '../../core/layout/calificacion-estrellas/calificacion-estrellas';
import { ResumenPiloto as ResumenPilotoDto } from '../../dominio/piloto';
import { AdminApi } from '../admin-api';

@Component({
  selector: 'app-resumen-piloto',
  imports: [DecimalPipe, AlertaMensaje, CalificacionEstrellas],
  templateUrl: './resumen-piloto.html',
  styleUrl: './resumen-piloto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenPiloto implements OnInit {
  private readonly adminApi = inject(AdminApi);

  protected readonly resumen = signal<ResumenPilotoDto | null>(null);
  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);

  ngOnInit(): void {
    this.cargarResumen();
  }

  protected cargarResumen(): void {
    this.cargando.set(true);
    this.errorHttp.set(null);

    this.adminApi.obtenerResumenPiloto().subscribe({
      next: (datos) => {
        this.cargando.set(false);
        this.resumen.set(datos);
      },
      error: (error: ErrorHttp) => {
        this.cargando.set(false);
        this.errorHttp.set(error);
      },
    });
  }
}
