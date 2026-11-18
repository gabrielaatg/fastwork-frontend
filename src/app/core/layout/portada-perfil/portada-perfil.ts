import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Portada, Portadas } from '../../media/portadas';

/**
 * Portada del perfil de un proveedor. Si es editable, al pulsarla se abre un
 * selector con las portadas disponibles.
 */
@Component({
  selector: 'app-portada-perfil',
  templateUrl: './portada-perfil.html',
  styleUrl: './portada-perfil.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'alClicFuera($event)',
    '(document:keydown.escape)': 'abierto.set(false)',
  },
})
export class PortadaPerfil {
  private readonly portadas = inject(Portadas);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Id del perfil del proveedor. */
  readonly idPerfil = input<number | null>(null);
  /** Portada enviada por el backend, si existe. */
  readonly portadaServidor = input<string | null | undefined>(null);
  /** Permite cambiar la portada (solo el dueño del perfil). */
  readonly editable = input(false);

  protected readonly abierto = signal(false);
  protected readonly opciones = this.portadas.disponibles;
  protected readonly actual = computed<Portada>(() =>
    this.portadas.portadaDe(this.idPerfil(), this.portadaServidor()),
  );

  protected alternar(): void {
    if (this.editable()) {
      this.abierto.update((v) => !v);
    }
  }

  protected elegir(portada: Portada): void {
    const id = this.idPerfil();
    if (id != null) {
      this.portadas.elegir(id, portada.id);
    }
    this.abierto.set(false);
  }

  protected alClicFuera(evento: MouseEvent): void {
    if (this.abierto() && !this.elemento.nativeElement.contains(evento.target as Node)) {
      this.abierto.set(false);
    }
  }
}
