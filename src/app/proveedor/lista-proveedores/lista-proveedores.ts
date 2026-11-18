import { ChangeDetectionStrategy, Component, computed, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { Oficio } from '../../dominio/oficio';
import {
  FiltroProveedoresQuery,
  ProveedorDirectorio,
} from '../../dominio/proveedor';
import { Zona } from '../../dominio/zona';
import { OficioApi } from '../../oficio/oficio-api';
import { ZonaApi } from '../../zona/zona-api';
import { ProveedorApi } from '../proveedor-api';
import { TarjetaProveedor } from '../tarjeta-proveedor/tarjeta-proveedor';

@Component({
  selector: 'app-lista-proveedores',
  imports: [AlertaMensaje, TarjetaProveedor, RouterLink],
  templateUrl: './lista-proveedores.html',
  styleUrl: './lista-proveedores.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaProveedores implements OnInit {
  private readonly authApi = inject(AuthApi);
  private readonly proveedorApi = inject(ProveedorApi);
  private readonly oficioApi = inject(OficioApi);
  private readonly zonaApi = inject(ZonaApi);

  protected readonly esCliente = computed(() => this.authApi.usuario()?.rol === 'CLIENTE');
  protected readonly oficios = signal<Oficio[]>([]);
  protected readonly zonas = signal<Zona[]>([]);
  protected readonly proveedores = signal<ProveedorDirectorio[]>([]);
  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);

  protected readonly oficiosSeleccionados = signal<number[]>([]);
  protected readonly zonaSeleccionada = signal<number | null>(null);
  protected readonly calificacionMinima = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarOficios();
    this.cargarZonas();
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

  protected cambiarZona(valor: string): void {
    const numero = Number(valor);
    this.zonaSeleccionada.set(valor && Number.isFinite(numero) ? numero : null);
    this.buscarProveedores();
  }

  protected cambiarCalificacion(valor: string): void {
    const numero = Number(valor);
    this.calificacionMinima.set(valor && Number.isFinite(numero) ? numero : null);
    this.buscarProveedores();
  }

  protected limpiarFiltros(): void {
    this.oficiosSeleccionados.set([]);
    this.zonaSeleccionada.set(null);
    this.calificacionMinima.set(null);
    this.buscarProveedores();
  }

  private cargarOficios(): void {
    this.oficioApi.listarActivos().subscribe({
      next: (lista) => this.oficios.set(lista),
      error: (error: ErrorHttp) => this.errorHttp.set(error),
    });
  }

  private cargarZonas(): void {
    this.zonaApi.listarActivas().subscribe({
      next: (lista) => this.zonas.set(lista),
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

    const idZona = this.zonaSeleccionada();
    if (idZona !== null) {
      filtros.idZona = idZona;
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
