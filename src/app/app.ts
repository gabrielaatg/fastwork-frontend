import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraNavegacion } from './core/layout/barra-navegacion/barra-navegacion';

@Component({
  selector: 'app-root',
  imports: [BarraNavegacion, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
