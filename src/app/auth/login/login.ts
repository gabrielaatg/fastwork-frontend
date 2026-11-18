import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormField, form, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { CabeceraPublica } from '../../core/layout/cabecera-publica/cabecera-publica';
import { RolUsuario } from '../../dominio/rol';

const PATRON_DNI = /^\d{8}$/;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginModelo {
  identificador: string;
  password: string;
}

const ETIQUETAS_ROL: Record<RolUsuario, { titulo: string; descripcion: string }> = {
  CLIENTE: {
    titulo: 'Ingresar como Cliente',
    descripcion: 'Buscar técnicos en Trujillo, solicitar servicios y calificar trabajos.',
  },
  PROVEEDOR: {
    titulo: 'Ingresar como Proveedor',
    descripcion: 'Gestionar mi perfil comercial, tarifas, disponibilidad y agenda.',
  },
  ADMIN: {
    titulo: 'Ingresar como Administrador',
    descripcion: 'Verificar proveedores, administrar oficios y ver resumen del piloto.',
  },
};

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink, AlertaMensaje, CabeceraPublica],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  protected readonly modelo = signal<LoginModelo>({
    identificador: '',
    password: '',
  });

  protected readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.identificador, { message: 'El correo electrónico o DNI es obligatorio.' });
    validate(ruta.identificador, ({ value }) => {
      const texto = value().trim();
      if (!texto) {
        return null;
      }
      if (!PATRON_DNI.test(texto) && !PATRON_CORREO.test(texto)) {
        return {
          kind: 'identificadorInvalido',
          message: 'Ingresa un correo electrónico válido o un DNI de 8 dígitos.',
        };
      }
      return null;
    });
    required(ruta.password, { message: 'La contraseña es obligatoria.' });
  });

  protected readonly cargando = signal(false);
  protected readonly errorHttp = signal<ErrorHttp | null>(null);
  protected readonly rolesDisponibles = signal<RolUsuario[] | null>(null);
  protected readonly rolCargando = signal<RolUsuario | null>(null);
  protected readonly mostrarPassword = signal(false);

  protected alternarMostrarPassword(): void {
    this.mostrarPassword.update((v) => !v);
  }

  @HostListener('document:keydown.escape')
  protected alPresionarEscape(): void {
    if (this.rolesDisponibles() && !this.rolCargando()) {
      this.cerrarSelectorRol();
    }
  }

  protected alEnviar(evento: Event): void {
    evento.preventDefault();
    this.errorHttp.set(null);

    void submit(this.formulario, () => {
      const { identificador, password } = this.modelo();
      this.cargando.set(true);

      this.authApi
        .iniciarSesion({
          identificador: identificador.trim(),
          password,
        })
        .subscribe({
          next: (respuesta) => {
            this.cargando.set(false);
            if (respuesta.requiereSeleccionRol && respuesta.rolesDisponibles?.length) {
              this.rolesDisponibles.set(respuesta.rolesDisponibles);
              return;
            }
            if (respuesta.rol) {
              void this.router.navigate([this.obtenerRutaPorRol(respuesta.rol)]);
            }
          },
          error: (error: ErrorHttp) => {
            this.cargando.set(false);
            this.errorHttp.set(error);
          },
        });

      return Promise.resolve();
    });
  }

  protected ingresarConRol(rol: RolUsuario): void {
    if (this.rolCargando()) {
      return;
    }

    const { identificador, password } = this.modelo();
    this.rolCargando.set(rol);
    this.errorHttp.set(null);

    this.authApi
      .iniciarSesion({
        identificador: identificador.trim(),
        password,
        rol,
      })
      .subscribe({
        next: (respuesta) => {
          this.rolCargando.set(null);
          this.rolesDisponibles.set(null);
          if (respuesta.rol) {
            void this.router.navigate([this.obtenerRutaPorRol(respuesta.rol)]);
          }
        },
        error: (error: ErrorHttp) => {
          this.rolCargando.set(null);
          this.rolesDisponibles.set(null);
          this.errorHttp.set(error);
        },
      });
  }

  protected cerrarSelectorRol(): void {
    if (!this.rolCargando()) {
      this.rolesDisponibles.set(null);
    }
  }

  protected tituloRol(rol: RolUsuario): string {
    return ETIQUETAS_ROL[rol].titulo;
  }

  protected descripcionRol(rol: RolUsuario): string {
    return ETIQUETAS_ROL[rol].descripcion;
  }

  private obtenerRutaPorRol(rol: RolUsuario): string {
    if (rol === 'ADMIN') return '/admin/verificaciones';
    return rol === 'PROVEEDOR' ? '/solicitudes' : '/directorio';
  }
}
