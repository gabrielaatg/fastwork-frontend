import { Directive, ElementRef, inject, input } from '@angular/core';

/**
 * Reflejo de luz que sigue al puntero sobre superficies de vidrio.
 * Con `[fwInclinar]="true"` el elemento además se inclina levemente en 3D.
 */
@Directive({
  selector: '[fwBrillo]',
  host: {
    class: 'fw-brillo',
    '(pointermove)': 'alMover($event)',
    '(pointerleave)': 'alSalir()',
  },
})
export class Brillo {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Activa una inclinación 3D sutil siguiendo al puntero. */
  readonly fwInclinar = input(false);

  protected alMover(evento: PointerEvent): void {
    if (evento.pointerType !== 'mouse') {
      return;
    }
    const nodo = this.elemento.nativeElement;
    const caja = nodo.getBoundingClientRect();
    const x = evento.clientX - caja.left;
    const y = evento.clientY - caja.top;
    nodo.style.setProperty('--fw-mx', `${x}px`);
    nodo.style.setProperty('--fw-my', `${y}px`);

    if (this.fwInclinar() && !this.prefiereMenosMovimiento()) {
      const rx = (y / caja.height - 0.5) * -6;
      const ry = (x / caja.width - 0.5) * 6;
      nodo.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }
  }

  protected alSalir(): void {
    if (this.fwInclinar()) {
      this.elemento.nativeElement.style.transform = '';
    }
  }

  private prefiereMenosMovimiento(): boolean {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }
}
