import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { Oficio } from '../../dominio/oficio';
import { FormularioOficio } from '../formulario-oficio/formulario-oficio';
import { OficioApi } from '../oficio-api';

@Component({
  selector: 'app-lista-oficios',
  imports: [AlertaMensaje, FormularioOficio],
  templateUrl: './lista-oficios.html',
  styleUrl: './lista-oficios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaOficios implements OnInit {
  private readonly oficioApi = inject(OficioApi);

  protected readonly oficios = signal<Oficio[]>([]);
  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarOficios();
  }

  protected alCrearOficio(nuevo: Oficio): void {
    this.oficios.update((lista) => [...lista, nuevo]);
    this.mensajeExito.set(`Oficio "${nuevo.nombreOficio}" agregado al catálogo.`);
  }

  private cargarOficios(): void {
    this.cargando.set(true);
    this.errorHttp.set(null);

    this.oficioApi.listarActivos().subscribe({
      next: (lista) => {
        this.cargando.set(false);
        this.oficios.set(lista);
      },
      error: (error: ErrorHttp) => {
        this.cargando.set(false);
        this.errorHttp.set(error);
      },
    });
  }
}
