import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormField,
  email,
  form,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { RolRegistro } from '../../dominio/rol';

interface RegistroModelo {
  rol: RolRegistro;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  password: string;
  documentoIdentidad: string;
  aceptoPoliticaDatos: boolean;
}

@Component({
  selector: 'app-registro',
  imports: [FormField, RouterLink, AlertaMensaje],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  protected readonly modelo = signal<RegistroModelo>({
    rol: 'CLIENTE',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    password: '',
    documentoIdentidad: '',
    aceptoPoliticaDatos: false,
  });

  protected readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.nombres, { message: 'Los nombres son obligatorios.' });
    required(ruta.apellidos, { message: 'Los apellidos son obligatorios.' });
    required(ruta.correo, { message: 'El correo electrónico es obligatorio.' });
    email(ruta.correo, { message: 'Ingresa un correo electrónico válido.' });
    required(ruta.telefono, { message: 'El teléfono es obligatorio.' });
    required(ruta.password, { message: 'La contraseña es obligatoria.' });
    minLength(ruta.password, 6, {
      message: 'La contraseña debe tener al menos 6 caracteres.',
    });
    required(ruta.documentoIdentidad, {
      message: 'El DNI o documento de identidad es obligatorio.',
    });
    validate(ruta.aceptoPoliticaDatos, ({ value }) => {
      if (!value()) {
        return {
          kind: 'politicaRequerida',
          message: 'Debes aceptar la política de protección de datos personales (Ley N.° 29733).',
        };
      }
      return null;
    });
  });

  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);

  protected seleccionarRol(rol: RolRegistro): void {
    this.modelo.update((actual) => ({
      ...actual,
      rol,
    }));
  }

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);

    void submit(this.formulario, () => {
      const datos = this.modelo();
      this.cargando.set(true);

      this.authApi
        .registrar({
          nombres: datos.nombres.trim(),
          apellidos: datos.apellidos.trim(),
          correo: datos.correo.trim(),
          telefono: datos.telefono.trim(),
          password: datos.password,
          rol: datos.rol,
          aceptoPoliticaDatos: datos.aceptoPoliticaDatos,
          documentoIdentidad: datos.documentoIdentidad.trim(),
        })
        .subscribe({
          next: () => {
            this.cargando.set(false);
            const rutaDestino = datos.rol === 'PROVEEDOR' ? '/proveedor/perfil' : '/directorio';
            void this.router.navigate([rutaDestino]);
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
