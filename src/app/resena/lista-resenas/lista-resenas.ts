import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CalificacionEstrellas } from '../../core/layout/calificacion-estrellas/calificacion-estrellas';
import { Resena } from '../../dominio/resena';

@Component({
  selector: 'app-lista-resenas',
  imports: [DatePipe, CalificacionEstrellas],
  templateUrl: './lista-resenas.html',
  styleUrl: './lista-resenas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaResenas {
  readonly resenas = input.required<readonly Resena[]>();
}
