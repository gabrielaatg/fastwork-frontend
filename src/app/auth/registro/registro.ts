import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

const MAX_BYTES_CUL = 5 * 1024 * 1024;
export const URL_PORTAL_CUL_MTPE = 'https://www.empleosperu.gob.pe/portal-mtpe/#/ingreso';

interface RegistroModelo {
  rol: RolRegistro;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  password: string;
  confirmarPassword: string;
  dni: string;
  aceptoPoliticaDatos: boolean;
}

interface RegistroExitosoInfo {
  rol: RolRegistro;
  nombres: string;
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
    confirmarPassword: '',
    dni: '',
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
    required(ruta.confirmarPassword, { message: 'Debes confirmar la contraseña.' });
    validate(ruta.confirmarPassword, ({ value }) => {
      const confirmacion = value();
      const principal = this.modelo().password;
      if (confirmacion && principal !== confirmacion) {
        return {
          kind: 'contrasenaNoCoincide',
          message: 'Las contraseñas no coinciden.',
        };
      }
      return null;
    });
    required(ruta.dni, {
      message: 'El DNI es obligatorio.',
    });
    validate(ruta.dni, ({ value }) => {
      const texto = value().trim();
      if (texto && !/^\d{8}$/.test(texto)) {
        return {
          kind: 'dniInvalido',
          message: 'El DNI debe tener exactamente 8 dígitos numéricos.',
        };
      }
      return null;
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
  protected readonly archivoCul = signal<File | null>(null);
  protected readonly errorCul = signal<string | null>(null);
  protected readonly urlPortalCul = URL_PORTAL_CUL_MTPE;
  protected readonly registroExitoso = signal<RegistroExitosoInfo | null>(null);
  protected readonly mostrarPassword = signal(false);
  protected readonly mostrarConfirmarPassword = signal(false);
  protected readonly contrasenasCoinciden = computed(() => {
    const { password, confirmarPassword } = this.modelo();
    return password.length > 0 && confirmarPassword.length > 0 && password === confirmarPassword;
  });

  protected alternarMostrarPassword(): void {
    this.mostrarPassword.update((v) => !v);
  }

  protected alternarMostrarConfirmarPassword(): void {
    this.mostrarConfirmarPassword.update((v) => !v);
  }

  protected seleccionarRol(rol: RolRegistro): void {
    this.modelo.update((actual) => ({
      ...actual,
      rol,
    }));
    this.errorHttp.set(null);
    this.errorCul.set(null);
  }

  protected alSeleccionarCul(evento: Event): void {
    const input = evento.target as HTMLInputElement | null;
    const archivo = input?.files?.[0] ?? null;

    if (!archivo) {
      this.archivoCul.set(null);
      this.errorCul.set(
        'Debes adjuntar tu Certificado Único Laboral (CUL) en PDF para registrarte como proveedor.',
      );
      return;
    }

    const esPdf =
      archivo.type === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf');
    if (!esPdf) {
      this.archivoCul.set(null);
      this.errorCul.set('El Certificado Único Laboral debe estar en formato PDF (.pdf).');
      return;
    }

    if (archivo.size === 0) {
      this.archivoCul.set(null);
      this.errorCul.set('El archivo PDF seleccionado está vacío.');
      return;
    }

    if (archivo.size > MAX_BYTES_CUL) {
      this.archivoCul.set(null);
      this.errorCul.set('El archivo PDF no debe exceder los 5 MB.');
      return;
    }

    this.archivoCul.set(archivo);
    this.errorCul.set(null);
  }

  protected formatearTamanoArchivo(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);

    if (this.modelo().rol === 'PROVEEDOR' && !this.archivoCul()) {
      this.errorCul.set(
        'Debes adjuntar tu Certificado Único Laboral (CUL) en PDF para registrarte como proveedor.',
      );
    }

    void submit(this.formulario, () => {
      const datos = this.modelo();

      if (datos.rol === 'PROVEEDOR') {
        const cul = this.archivoCul();
        if (!cul || this.errorCul()) {
          if (!cul && !this.errorCul()) {
            this.errorCul.set(
              'Debes adjuntar tu Certificado Único Laboral (CUL) en PDF para registrarte como proveedor.',
            );
          }
          return Promise.resolve();
        }

        this.cargando.set(true);
        this.authApi
          .registrarProveedor(
            {
              nombres: datos.nombres.trim(),
              apellidos: datos.apellidos.trim(),
              correo: datos.correo.trim(),
              telefono: datos.telefono.trim(),
              password: datos.password,
              confirmarPassword: datos.confirmarPassword,
              aceptoPoliticaDatos: datos.aceptoPoliticaDatos,
              dni: datos.dni.trim(),
            },
            cul,
          )
          .subscribe({
            next: () => {
              this.cargando.set(false);
              this.registroExitoso.set({ rol: 'PROVEEDOR', nombres: datos.nombres.trim() });
            },
            error: (error: ErrorHttp) => {
              this.cargando.set(false);
              this.errorHttp.set(error);
            },
          });

        return Promise.resolve();
      }

      this.cargando.set(true);
      this.authApi
        .registrar({
          nombres: datos.nombres.trim(),
          apellidos: datos.apellidos.trim(),
          correo: datos.correo.trim(),
          telefono: datos.telefono.trim(),
          password: datos.password,
          confirmarPassword: datos.confirmarPassword,
          rol: 'CLIENTE',
          aceptoPoliticaDatos: datos.aceptoPoliticaDatos,
          dni: datos.dni.trim(),
        })
        .subscribe({
          next: () => {
            this.cargando.set(false);
            this.registroExitoso.set({ rol: 'CLIENTE', nombres: datos.nombres.trim() });
          },
          error: (error: ErrorHttp) => {
            this.cargando.set(false);
            this.errorHttp.set(error);
          },
        });

      return Promise.resolve();
    });
  }

  protected continuarDespuesDeRegistro(): void {
    const info = this.registroExitoso();
    const rutaDestino = info?.rol === 'PROVEEDOR' ? '/proveedor/perfil' : '/directorio';
    void this.router.navigate([rutaDestino]);
  }
}
