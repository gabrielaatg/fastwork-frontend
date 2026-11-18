import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormField, form, maxLength, submit } from '@angular/forms/signals';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { CalificacionEstrellas } from '../../core/layout/calificacion-estrellas/calificacion-estrellas';
import { PuntuacionEstrellas, Resena } from '../../dominio/resena';
import { RolUsuario } from '../../dominio/rol';
import { ResenaApi } from '../resena-api';

interface FormularioResenaModelo {
  comentario: string;
}

@Component({
  selector: 'app-formulario-resena',
  imports: [FormField, CalificacionEstrellas, AlertaMensaje],
  templateUrl: './formulario-resena.html',
  styleUrl: './formulario-resena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioResena {
  private readonly resenaApi = inject(ResenaApi);

  readonly idSolicitud = input.required<number>();
  readonly rolEvaluador = input<RolUsuario>('CLIENTE');
  readonly nombreEvaluado = input<string>('');
  readonly resenaCreada = output<Resena>();
  readonly cancelar = output<void>();

  protected readonly puntuacion = signal<number>(5);
  protected readonly modelo = signal<FormularioResenaModelo>({ comentario: '' });

  protected readonly formulario = form(this.modelo, (ruta) => {
    maxLength(ruta.comentario, 500, {
      message: 'El comentario no puede superar los 500 caracteres.',
    });
  });

  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly errorPuntuacion = signal<string | null>(null);

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);
    this.errorPuntuacion.set(null);

    const estrellas = Math.round(this.puntuacion());
    if (estrellas < 1 || estrellas > 5) {
      this.errorPuntuacion.set('Selecciona una puntuación entre 1 y 5 estrellas.');
      return;
    }

    void submit(this.formulario, () => {
      const comentario = this.modelo().comentario.trim();
      this.cargando.set(true);

      this.resenaApi
        .crear(this.idSolicitud(), {
          puntuacion: estrellas as PuntuacionEstrellas,
          ...(comentario ? { comentario } : {}),
        })
        .subscribe({
          next: (resena) => {
            this.cargando.set(false);
            this.resenaCreada.emit(resena);
          },
          error: (error: ErrorHttp) => {
            this.cargando.set(false);
            this.errorHttp.set(error);
          },
        });

      return Promise.resolve();
    });
  }
}
