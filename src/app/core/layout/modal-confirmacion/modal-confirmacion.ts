import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal-confirmacion',
  templateUrl: './modal-confirmacion.html',
  styleUrl: './modal-confirmacion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'alPresionarEscape()',
  },
})
export class ModalConfirmacion {
  readonly abierto = input.required<boolean>();
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly textoConfirmar = input('Confirmar');
  readonly textoCancelar = input('Cancelar');
  readonly variante = input<'primario' | 'peligro'>('primario');
  readonly cargando = input(false);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  protected intentarCancelar(): void {
    if (!this.cargando()) {
      this.cancelar.emit();
    }
  }

  protected alPresionarEscape(): void {
    if (this.abierto()) {
      this.intentarCancelar();
    }
  }
}
