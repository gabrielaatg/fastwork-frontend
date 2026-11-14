import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { Mensaje } from '../../dominio/mensaje';
import { MensajeApi } from '../mensaje-api';

interface MensajeModelo {
  contenido: string;
}

@Component({
  selector: 'app-chat-solicitud',
  imports: [DatePipe, FormField, AlertaMensaje],
  templateUrl: './chat-solicitud.html',
  styleUrl: './chat-solicitud.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatSolicitud {
  private readonly mensajeApi = inject(MensajeApi);
  private readonly authApi = inject(AuthApi);

  readonly idSolicitud = input.required<number>();
  readonly tituloConversacion = input<string>('');
  readonly cerrado = output<void>();

  protected readonly idUsuarioActual = this.authApi.idUsuario;
  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly cargando = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);

  protected readonly modelo = signal<MensajeModelo>({ contenido: '' });
  protected readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.contenido, { message: 'Escribe un mensaje antes de enviar.' });
  });

  constructor() {
    effect(() => {
      const id = this.idSolicitud();
      this.cargarMensajes(id);
    });
  }

  protected recargar(): void {
    this.cargarMensajes(this.idSolicitud());
  }

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);

    void submit(this.formulario, () => {
      const contenido = this.modelo().contenido.trim();
      if (!contenido) {
        return Promise.resolve();
      }

      this.enviando.set(true);
      this.mensajeApi.enviar(this.idSolicitud(), { contenido }).subscribe({
        next: (nuevo) => {
          this.enviando.set(false);
          this.mensajes.update((lista) => [...lista, nuevo]);
          this.modelo.set({ contenido: '' });
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

  private cargarMensajes(idSolicitud: number): void {
    this.cargando.set(true);
    this.errorHttp.set(null);

    this.mensajeApi.listarPorSolicitud(idSolicitud).subscribe({
      next: (lista) => {
        this.cargando.set(false);
        this.mensajes.set(lista);
      },
      error: (error: ErrorHttp) => {
        this.cargando.set(false);
        this.errorHttp.set(error);
      },
    });
  }
}
