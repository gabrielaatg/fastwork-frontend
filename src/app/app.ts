import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { BarraNavegacion } from './core/layout/barra-navegacion/barra-navegacion';

const RUTAS_SIN_BARRA = ['/inicio', '/login', '/registro'] as const;

@Component({
  selector: 'app-root',
  imports: [BarraNavegacion, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);

  private readonly rutaActual = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly mostrarBarra = computed(() => {
    const ruta = this.rutaActual().split(/[?#]/)[0];
    return !RUTAS_SIN_BARRA.some((prefijo) => ruta === prefijo || ruta.startsWith(`${prefijo}/`));
  });
}
