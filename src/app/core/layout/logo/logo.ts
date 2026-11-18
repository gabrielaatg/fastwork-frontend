import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marca de Fast Work: greca escalonada con degradado verde → celeste sobre vidrio. */
@Component({
  selector: 'app-logo',
  template: `
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <defs>
        <linearGradient id="fw-logo-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#4be3a0" />
          <stop offset="1" stop-color="#7dd3fc" />
        </linearGradient>
      </defs>
      <rect
        x="0.5"
        y="0.5"
        width="35"
        height="35"
        rx="10"
        fill="rgb(255 255 255 / 0.06)"
        stroke="rgb(255 255 255 / 0.18)"
      />
      <path fill="url(#fw-logo-grad)" d="M6 28v-4.5h4.5V19H15v-4.5h6V19h4.5v4.5H30V28z" />
      <path fill="url(#fw-logo-grad)" d="M15.75 7h4.5v4.5h-4.5z" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 2.25rem;
      height: 2.25rem;
      flex-shrink: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {}
