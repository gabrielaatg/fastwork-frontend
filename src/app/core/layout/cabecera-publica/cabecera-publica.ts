import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  private readonly router = inject(Router);

  protected readonly desplazada = signal(false);

  /**
   * Lleva a una sección de la landing. Si ya estamos en ella baja con
   * desplazamiento suave (el router ignora repetir la misma URL); desde login
   * o registro navega a /inicio con el fragmento y el router hace el resto.
   */
  protected irASeccion(evento: MouseEvent, seccion: string): void {
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.button !== 0) {
      return;
    }
    evento.preventDefault();
    const destino = this.router.url.startsWith('/inicio') ? document.getElementById(seccion) : null;
    if (destino) {
      destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(history.state, '', `/inicio#${seccion}`);
      return;
    }
    void this.router.navigate(['/inicio'], { fragment: seccion });
  }

  protected alDesplazar(): void {
    this.desplazada.set(globalThis.scrollY > 24);
  }
}
