import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { Oficio } from '../../dominio/oficio';
import {
  FiltroProveedoresQuery,
  ProveedorDirectorio,
} from '../../dominio/proveedor';
import { OficioApi } from '../../oficio/oficio-api';
import { ProveedorApi } from '../proveedor-api';
import { TarjetaProveedor } from '../tarjeta-proveedor/tarjeta-proveedor';

@Component({
  selector: 'app-lista-proveedores',
  imports: [AlertaMensaje, TarjetaProveedor],
  templateUrl: './lista-proveedores.html',
  styleUrl: './lista-proveedores.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaProveedores implements OnInit {
  private readonly proveedorApi = inject(ProveedorApi);
  private readonly oficioApi = inject(OficioApi);

  protected readonly oficios = signal<Oficio[]>([]);
  protected readonly proveedores = signal<ProveedorDirectorio[]>([]);
  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);

  protected readonly oficiosSeleccionados = signal<number[]>([]);
  protected readonly calificacionMinima = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarOficios();
    this.buscarProveedores();
  }

  protected estaOficioSeleccionado(idOficio: number): boolean {
    return this.oficiosSeleccionados().includes(idOficio);
  }

  protected alternarOficio(idOficio: number): void {
    this.oficiosSeleccionados.update((actual) =>
      actual.includes(idOficio) ? actual.filter((id) => id !== idOficio) : [...actual, idOficio],
    );
    this.buscarProveedores();
  }

  protected cambiarCalificacion(valor: string): void {
    const numero = Number(valor);
    this.calificacionMinima.set(valor && Number.isFinite(numero) ? numero : null);
    this.buscarProveedores();
  }

  protected limpiarFiltros(): void {
    this.oficiosSeleccionados.set([]);
    this.calificacionMinima.set(null);
    this.buscarProveedores();
  }

  private cargarOficios(): void {
    this.oficioApi.listarActivos().subscribe({
      next: (lista) => this.oficios.set(lista),
      error: (error: ErrorHttp) => this.errorHttp.set(error),
    });
  }

  private buscarProveedores(): void {
    const filtros: FiltroProveedoresQuery = {
      disponibilidad: 'DISPONIBLE',
    };
    const idsOficios = this.oficiosSeleccionados();
    if (idsOficios.length > 0) {
      filtros.oficios = idsOficios;
    }

    const calificacionMin = this.calificacionMinima();
    if (calificacionMin !== null) {
      filtros.calificacionMin = calificacionMin;
    }

    this.cargando.set(true);
    this.errorHttp.set(null);

    this.proveedorApi.buscarDirectorio(filtros).subscribe({
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
