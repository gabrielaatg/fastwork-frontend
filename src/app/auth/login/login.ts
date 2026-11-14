import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { RolUsuario } from '../../dominio/rol';

interface LoginModelo {
  correo: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink, AlertaMensaje],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  protected readonly modelo = signal<LoginModelo>({
    correo: '',
    password: '',
  });

  protected readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.correo, { message: 'El correo electrónico es obligatorio.' });
    email(ruta.correo, { message: 'Ingresa un correo electrónico válido.' });
    required(ruta.password, { message: 'La contraseña es obligatoria.' });
  });

  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);

    void submit(this.formulario, () => {
      const { correo, password } = this.modelo();
      this.cargando.set(true);

      this.authApi
        .iniciarSesion({
          correo: correo.trim(),
          password,
        })
        .subscribe({
          next: (respuesta) => {
            this.cargando.set(false);
            void this.router.navigate([this.obtenerRutaPorRol(respuesta.rol)]);
          },
          error: (error: ErrorHttp) => {
            this.cargando.set(false);
            this.errorHttp.set(error);
          },
        });

      return Promise.resolve();
    });
  }

  private obtenerRutaPorRol(rol: RolUsuario): string {
    return rol === 'ADMIN' ? '/admin/verificaciones' : '/directorio';
  }
}
