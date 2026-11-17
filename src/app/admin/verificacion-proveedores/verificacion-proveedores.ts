import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { BadgeEstado } from '../../core/layout/badge-estado/badge-estado';
import { ModalConfirmacion } from '../../core/layout/modal-confirmacion/modal-confirmacion';
import {
  EstadoVerificacion,
  EstadoVerificacionDecision,
  ProveedorDirectorio,
} from '../../dominio/proveedor';
import { ProveedorApi } from '../../proveedor/proveedor-api';
import { AdminApi } from '../admin-api';

type FiltroVerificacion = 'TODOS' | EstadoVerificacion;

interface DecisionPendiente {
  proveedor: ProveedorDirectorio;
  nuevoEstado: EstadoVerificacionDecision;
}

@Component({
  selector: 'app-verificacion-proveedores',
  imports: [AlertaMensaje, BadgeEstado, ModalConfirmacion],
  templateUrl: './verificacion-proveedores.html',
  styleUrl: './verificacion-proveedores.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificacionProveedores implements OnInit {
  private readonly proveedorApi = inject(ProveedorApi);
  private readonly adminApi = inject(AdminApi);

  protected readonly proveedores = signal<ProveedorDirectorio[]>([]);
  protected readonly filtro = signal<FiltroVerificacion>('TODOS');
  protected readonly cargando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);
  protected readonly decisionPendiente = signal<DecisionPendiente | null>(null);

  protected readonly proveedoresFiltrados = computed(() => {
    const estado = this.filtro();
    const lista = this.proveedores();
    return estado === 'TODOS' ? lista : lista.filter((p) => p.estadoVerificacion === estado);
  });

  ngOnInit(): void {
    this.cargarProveedores();
  }

  protected solicitarDecision(
    proveedor: ProveedorDirectorio,
    nuevoEstado: EstadoVerificacionDecision,
  ): void {
    this.decisionPendiente.set({ proveedor, nuevoEstado });
  }

  protected confirmarDecision(): void {
    const decision = this.decisionPendiente();
    if (!decision) {
      return;
    }

    this.procesando.set(true);
    this.errorHttp.set(null);
    this.mensajeExito.set(null);

    this.adminApi
      .actualizarVerificacion(decision.proveedor.idPerfilProveedor, {
        nuevoEstado: decision.nuevoEstado,
      })
      .subscribe({
        next: (actualizado) => {
          this.procesando.set(false);
          this.decisionPendiente.set(null);
          this.proveedores.update((lista) =>
            lista.map((p) =>
              p.idPerfilProveedor === actualizado.idPerfilProveedor
                ? { ...p, estadoVerificacion: actualizado.estadoVerificacion }
                : p,
            ),
          );
          this.mensajeExito.set(
            `Proveedor ${actualizado.nombres} ${actualizado.apellidos} marcado como ${actualizado.estadoVerificacion}.`,
          );
        },
        error: (error: ErrorHttp) => {
          this.procesando.set(false);
          this.decisionPendiente.set(null);
          this.errorHttp.set(error);
        },
      });
  }

  protected tituloModal(): string {
    const decision = this.decisionPendiente();
    if (!decision) {
      return '';
    }
    return decision.nuevoEstado === 'VERIFICADO'
      ? 'Verificar proveedor'
      : 'Rechazar verificación de proveedor';
  }

  protected mensajeModal(): string {
    const decision = this.decisionPendiente();
    if (!decision) {
      return '';
    }
    const nombre = `${decision.proveedor.nombres} ${decision.proveedor.apellidos}`;
    return decision.nuevoEstado === 'VERIFICADO'
      ? `¿Confirmas que deseas marcar como VERIFICADO a ${nombre}?`
      : `¿Confirmas que deseas RECHAZAR la verificación de ${nombre}?`;
  }

  private cargarProveedores(): void {
    this.cargando.set(true);
    this.errorHttp.set(null);

    this.proveedorApi.buscarDirectorio().subscribe({
      next: (lista) => {
        this.cargando.set(false);
        this.proveedores.set(lista);
      },
      error: (error: ErrorHttp) => {
        this.cargando.set(false);
        this.errorHttp.set(error);
      },
    });
  }
}
