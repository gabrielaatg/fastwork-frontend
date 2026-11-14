import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { ErrorHttp } from '../../core/api/errores';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { Oficio } from '../../dominio/oficio';
import { OficioApi } from '../oficio-api';

interface FormularioOficioModelo {
  nombreOficio: string;
  descripcion: string;
}

@Component({
  selector: 'app-formulario-oficio',
  imports: [FormField, AlertaMensaje],
  templateUrl: './formulario-oficio.html',
  styleUrl: './formulario-oficio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioOficio {
  private readonly oficioApi = inject(OficioApi);

  readonly oficioCreado = output<Oficio>();

  protected readonly modelo = signal<FormularioOficioModelo>({
    nombreOficio: '',
    descripcion: '',
  });

  protected readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.nombreOficio, { message: 'El nombre del oficio es obligatorio.' });
  });

  protected readonly guardando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);

    void submit(this.formulario, () => {
      const datos = this.modelo();
      const descripcion = datos.descripcion.trim();
      this.guardando.set(true);

      this.oficioApi
        .crear({
          nombreOficio: datos.nombreOficio.trim(),
          ...(descripcion ? { descripcion } : {}),
        })
        .subscribe({
          next: (oficio) => {
            this.guardando.set(false);
            this.modelo.set({ nombreOficio: '', descripcion: '' });
            this.formulario().reset();
            this.oficioCreado.emit(oficio);
          },
          error: (error: ErrorHttp) => {
            this.guardando.set(false);
            this.errorHttp.set(error);
          },
        });

      return Promise.resolve();
    });
  }
}
