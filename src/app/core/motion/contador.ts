import { Directive, ElementRef, effect, inject, input } from '@angular/core';

/**
 * Anima un número desde su valor anterior hasta el nuevo.
 * Uso: `<span [fwContador]="total()"></span>`.
 */
@Directive({ selector: '[fwContador]' })
export class Contador {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private actual = 0;
  private cuadro: number | null = null;

  readonly fwContador = input.required<number>();

  constructor() {
    effect(() => this.animarHasta(this.fwContador()));
  }

  private animarHasta(destino: number): void {
    const nodo = this.elemento.nativeElement;
    const sinAnimacion =
      typeof requestAnimationFrame === 'undefined' ||
      (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    if (sinAnimacion) {
      this.actual = destino;
      nodo.textContent = String(destino);
      return;
    }
    if (this.cuadro !== null) {
      cancelAnimationFrame(this.cuadro);
    }
    const inicio = this.actual;
    const duracion = 900;
    const t0 = performance.now();
    const paso = (ahora: number) => {
      const progreso = Math.min(1, (ahora - t0) / duracion);
      const suave = 1 - Math.pow(1 - progreso, 3);
      this.actual = Math.round(inicio + (destino - inicio) * suave);
      nodo.textContent = String(this.actual);
      this.cuadro = progreso < 1 ? requestAnimationFrame(paso) : null;
    };
    this.cuadro = requestAnimationFrame(paso);
  }
}
