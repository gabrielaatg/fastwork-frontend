import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Revela el elemento con una transición suave cuando entra en pantalla.
 * Uso: `<div fwRevelar [fwRetraso]="120">`.
 */
@Directive({
  selector: '[fwRevelar]',
  host: {
    class: 'fw-revelar',
    '[style.--fw-retraso.ms]': 'fwRetraso()',
  },
})
export class Revelar implements OnInit, OnDestroy {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private observador: IntersectionObserver | null = null;

  /** Retraso en milisegundos para escalonar varias apariciones. */
  readonly fwRetraso = input(0);

  ngOnInit(): void {
    const nodo = this.elemento.nativeElement;
    if (typeof IntersectionObserver === 'undefined') {
      nodo.classList.add('fw-visible');
      return;
    }
    this.observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            nodo.classList.add('fw-visible');
            this.observador?.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    this.observador.observe(nodo);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
