import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { PuntuacionEstrellas } from '../../../dominio/resena';

const ESTRELLAS: readonly PuntuacionEstrellas[] = [1, 2, 3, 4, 5];

@Component({
  selector: 'app-calificacion-estrellas',
  templateUrl: './calificacion-estrellas.html',
  styleUrl: './calificacion-estrellas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalificacionEstrellas {
  readonly valor = model<number>(0);
  readonly soloLectura = input(true);
  readonly mostrarNumero = input(true);
  readonly totalResenas = input<number | null>(null);

  protected readonly estrellas = ESTRELLAS;
  protected readonly valorRedondeado = computed(() =>
    Math.min(5, Math.max(0, Math.round(this.valor()))),
  );
  protected readonly valorFormateado = computed(() => this.valor().toFixed(2));
  protected readonly etiquetaLectura = computed(
    () => `Calificación ${this.valorFormateado()} de 5`,
  );

  protected seleccionar(puntuacion: PuntuacionEstrellas): void {
    if (this.soloLectura()) {
      return;
    }
    this.valor.set(puntuacion);
  }
}
