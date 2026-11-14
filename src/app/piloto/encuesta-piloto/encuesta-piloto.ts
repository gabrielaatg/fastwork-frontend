import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, submit } from '@angular/forms/signals';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { CalificacionEstrellas } from '../../core/layout/calificacion-estrellas/calificacion-estrellas';
import { PuntuacionEstrellas } from '../../dominio/resena';
import { PilotoApi } from '../piloto-api';

interface EncuestaPilotoModelo {
  observaciones: string;
}

@Component({
  selector: 'app-encuesta-piloto',
  imports: [FormField, AlertaMensaje, CalificacionEstrellas],
  templateUrl: './encuesta-piloto.html',
  styleUrl: './encuesta-piloto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuestaPiloto {
  private readonly pilotoApi = inject(PilotoApi);

  protected readonly puntajeUsabilidad = signal<number>(5);
  protected readonly puntajeSatisfaccion = signal<number>(5);

  protected readonly modelo = signal<EncuestaPilotoModelo>({ observaciones: '' });
  protected readonly formulario = form(this.modelo, (ruta) => {
    maxLength(ruta.observaciones, 500, {
      message: 'Las observaciones no pueden superar los 500 caracteres.',
    });
  });

  protected readonly enviando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly errorPuntajes = signal<string | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);
    this.errorPuntajes.set(null);
    this.mensajeExito.set(null);

    const usabilidad = Math.round(this.puntajeUsabilidad());
    const satisfaccion = Math.round(this.puntajeSatisfaccion());

    if (usabilidad < 1 || usabilidad > 5 || satisfaccion < 1 || satisfaccion > 5) {
      this.errorPuntajes.set('Asigna entre 1 y 5 estrellas en ambos criterios.');
      return;
    }

    void submit(this.formulario, () => {
      const observaciones = this.modelo().observaciones.trim();
      this.enviando.set(true);

      this.pilotoApi
        .registrarMetrica({
          puntajeUsabilidad: usabilidad as PuntuacionEstrellas,
          puntajeSatisfaccion: satisfaccion as PuntuacionEstrellas,
          ...(observaciones ? { observaciones } : {}),
        })
        .subscribe({
          next: () => {
            this.enviando.set(false);
            this.mensajeExito.set('¡Gracias por completar la encuesta del piloto!');
            this.modelo.set({ observaciones: '' });
            this.formulario().reset();
          },
          error: (error: ErrorHttp) => {
            this.enviando.set(false);
            this.errorHttp.set(error);
          },
        });

      return Promise.resolve();
    });
  }
}
