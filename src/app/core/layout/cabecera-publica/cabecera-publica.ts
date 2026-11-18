import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Logo } from '../logo/logo';

/** Cabecera flotante de vidrio para las páginas públicas (inicio, login y registro). */
@Component({
  selector: 'app-cabecera-publica',
  imports: [RouterLink, RouterLinkActive, Logo],
  templateUrl: './cabecera-publica.html',
  styleUrl: './cabecera-publica.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.fw-desplazada]': 'desplazada()',
    '(window:scroll)': 'alDesplazar()',
  },
})
export class CabeceraPublica {
  protected readonly desplazada = signal(false);

  protected alDesplazar(): void {
    this.desplazada.set(globalThis.scrollY > 24);
  }
}
