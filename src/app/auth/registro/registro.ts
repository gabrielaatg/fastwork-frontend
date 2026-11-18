import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormField,
  email,
  form,
  minLength,
  readonly,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ErrorHttp } from '../../core/api/errores';
import { AuthApi } from '../../core/auth/auth-api';
import { AlertaMensaje } from '../../core/layout/alerta-mensaje/alerta-mensaje';
import { CabeceraPublica } from '../../core/layout/cabecera-publica/cabecera-publica';
import { Oficio } from '../../dominio/oficio';
import { RolRegistro } from '../../dominio/rol';
import { Zona } from '../../dominio/zona';
import { OficioApi } from '../../oficio/oficio-api';
import { ZonaApi } from '../../zona/zona-api';

const MAX_BYTES_CUL = 5 * 1024 * 1024;
const MAX_BYTES_FOTO = 5 * 1024 * 1024;
const TIPOS_FOTO_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSIONES_FOTO_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp'];
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
  imports: [FormField, RouterLink, AlertaMensaje, CabeceraPublica],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro {
  private readonly authApi = inject(AuthApi);
  private readonly zonaApi = inject(ZonaApi);
  private readonly oficioApi = inject(OficioApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private timerCooldownId: ReturnType<typeof setInterval> | null = null;
  private catalogosProveedorCargados = false;

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
    readonly(ruta.nombres, () => this.heredadoDeRol() !== null);
    required(ruta.apellidos, { message: 'Los apellidos son obligatorios.' });
    readonly(ruta.apellidos, () => this.heredadoDeRol() !== null);
    required(ruta.correo, { message: 'El correo electrónico es obligatorio.' });
    email(ruta.correo, { message: 'Ingresa un correo electrónico válido.' });
    readonly(ruta.correo, () => this.heredadoDeRol() !== null);
    required(ruta.telefono, { message: 'El teléfono es obligatorio.' });
    readonly(ruta.telefono, () => this.heredadoDeRol() !== null);
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
  protected readonly validandoCul = signal(false);
  protected readonly claveCulVerificado = signal<string | null>(null);
  protected readonly mensajeCulVerificado = signal<string | null>(null);
  protected readonly culVerificado = computed(() => {
    const cul = this.archivoCul();
    const dni = this.modelo().dni.trim();
    if (!cul || !/^\d{8}$/.test(dni)) {
      return false;
    }
    return this.claveCulVerificado() === `${dni}|${cul.name}|${cul.size}`;
  });
  protected readonly archivoFotoPerfil = signal<File | null>(null);
  protected readonly previewFotoPerfil = signal<string | null>(null);
  protected readonly errorFotoPerfil = signal<string | null>(null);
  protected readonly catalogoZonas = signal<Zona[]>([]);
  protected readonly zonasSeleccionadas = signal<number[]>([]);
  protected readonly errorZonas = signal<string | null>(null);
  protected readonly catalogoOficios = signal<Oficio[]>([]);
  protected readonly oficiosSeleccionados = signal<number[]>([]);
  protected readonly errorOficios = signal<string | null>(null);
  protected readonly heredadoDeRol = signal<RolRegistro | null>(null);
  protected readonly consultandoDni = signal(false);
  protected readonly errorDniConsulta = signal<string | null>(null);
  private ultimaConsultaDniClave: string | null = null;
  protected readonly urlPortalCul = URL_PORTAL_CUL_MTPE;
  protected readonly registroExitoso = signal<RegistroExitosoInfo | null>(null);
  protected readonly mostrarPassword = signal(false);
  protected readonly mostrarConfirmarPassword = signal(false);
  protected readonly contrasenasCoinciden = computed(() => {
    const { password, confirmarPassword } = this.modelo();
    return password.length > 0 && confirmarPassword.length > 0 && password === confirmarPassword;
  });

  protected readonly claveCorreoVerificado = signal<string | null>(null);
  protected readonly correoVerificado = computed(() => {
    const { correo, rol } = this.modelo();
    const normalizado = correo.trim().toLowerCase();
    return normalizado.length > 0 && this.claveCorreoVerificado() === `${normalizado}|${rol}`;
  });
  protected readonly enviandoCodigo = signal(false);
  protected readonly verificandoCodigo = signal(false);
  protected readonly modalCodigoAbierto = signal(false);
  protected readonly codigoIngresado = signal('');
  protected readonly errorVerificacionModal = signal<string | null>(null);
  protected readonly errorCorreoVerificacion = signal<string | null>(null);
  protected readonly cooldownSegundos = signal(0);

  constructor() {
    effect(() => {
      const dni = this.modelo().dni.trim();
      const rol = this.modelo().rol;
      if (!/^\d{8}$/.test(dni)) {
        this.ultimaConsultaDniClave = null;
        this.heredadoDeRol.set(null);
        this.errorDniConsulta.set(null);
        return;
      }
      const clave = `${dni}|${rol}`;
      if (this.ultimaConsultaDniClave === clave) {
        return;
      }
      this.ultimaConsultaDniClave = clave;
      this.consultarDniHeredado(dni, rol);
    });

    this.destroyRef.onDestroy(() => {
      this.detenerCooldown();
      this.revocarPreviewFoto();
    });
  }

  private consultarDniHeredado(dni: string, rol: RolRegistro): void {
    this.consultandoDni.set(true);
    this.errorDniConsulta.set(null);
    this.heredadoDeRol.set(null);

    this.authApi.consultarDni(dni, rol).subscribe({
      next: (res) => {
        this.consultandoDni.set(false);
        if (this.modelo().dni.trim() !== dni || this.modelo().rol !== rol) {
          return;
        }
        if (res.existeEnOtroRol) {
          this.heredadoDeRol.set(res.rolOrigen);
          this.modelo.update((actual) => ({
            ...actual,
            nombres: res.nombres ?? actual.nombres,
            apellidos: res.apellidos ?? actual.apellidos,
            telefono: res.telefono ?? actual.telefono,
            correo: res.correo ?? actual.correo,
          }));
        }
      },
      error: (error: ErrorHttp) => {
        this.consultandoDni.set(false);
        if (this.modelo().dni.trim() !== dni || this.modelo().rol !== rol) {
          return;
        }
        this.heredadoDeRol.set(null);
        this.errorDniConsulta.set(error.mensaje);
      },
    });
  }

  private cargarCatalogosProveedorSiFalta(): void {
    if (this.catalogosProveedorCargados) {
      return;
    }
    this.catalogosProveedorCargados = true;
    forkJoin({
      zonas: this.zonaApi.listarActivas(),
      oficios: this.oficioApi.listarActivos(),
    }).subscribe({
      next: ({ zonas, oficios }) => {
        this.catalogoZonas.set(zonas);
        this.catalogoOficios.set(oficios);
      },
      error: (error: ErrorHttp) => {
        this.catalogosProveedorCargados = false;
        this.errorHttp.set(error);
      },
    });
  }

  protected estaZonaSeleccionada(idZona: number): boolean {
    return this.zonasSeleccionadas().includes(idZona);
  }

  protected alternarZona(idZona: number): void {
    this.errorZonas.set(null);
    this.zonasSeleccionadas.update((actual) =>
      actual.includes(idZona) ? actual.filter((id) => id !== idZona) : [...actual, idZona],
    );
  }

  protected estaOficioSeleccionado(idOficio: number): boolean {
    return this.oficiosSeleccionados().includes(idOficio);
  }

  protected alternarOficio(idOficio: number): void {
    this.errorOficios.set(null);
    this.oficiosSeleccionados.update((actual) =>
      actual.includes(idOficio) ? actual.filter((id) => id !== idOficio) : [...actual, idOficio],
    );
  }

  protected solicitarCodigoCorreo(desdeModal = false): void {
    this.errorHttp.set(null);
    this.errorCorreoVerificacion.set(null);
    this.errorVerificacionModal.set(null);

    const correo = this.modelo().correo.trim();
    const rol = this.modelo().rol;

    if (!correo || this.formulario.correo().invalid()) {
      this.formulario.correo().markAsTouched();
      this.errorCorreoVerificacion.set(
        'Ingresa un correo electrónico válido antes de enviar el código.',
      );
      return;
    }

    this.enviandoCodigo.set(true);
    this.authApi.enviarCodigoCorreo({ correo, rol }).subscribe({
      next: (estado) => {
        this.enviandoCodigo.set(false);
        this.codigoIngresado.set('');
        this.errorVerificacionModal.set(null);
        this.iniciarCooldown(estado.cooldownSegundos || 60);
        this.modalCodigoAbierto.set(true);
      },
      error: (error: ErrorHttp) => {
        this.enviandoCodigo.set(false);
        if (desdeModal || this.modalCodigoAbierto()) {
          this.errorVerificacionModal.set(error.mensaje);
        } else {
          this.errorCorreoVerificacion.set(error.mensaje);
        }
      },
    });
  }

  protected alEscribirCodigo(evento: Event): void {
    const input = evento.target as HTMLInputElement | null;
    const soloDigitos = (input?.value ?? '').replace(/\D/g, '').slice(0, 6);
    if (input) {
      input.value = soloDigitos;
    }
    this.codigoIngresado.set(soloDigitos);
    this.errorVerificacionModal.set(null);
  }

  protected confirmarCodigoCorreo(): void {
    const codigo = this.codigoIngresado().trim();
    if (!/^\d{6}$/.test(codigo)) {
      this.errorVerificacionModal.set('Ingresa el código numérico de 6 dígitos.');
      return;
    }

    const correo = this.modelo().correo.trim().toLowerCase();
    const rol = this.modelo().rol;

    this.verificandoCodigo.set(true);
    this.errorVerificacionModal.set(null);
    this.authApi.verificarCodigoCorreo({ correo, rol, codigo }).subscribe({
      next: () => {
        this.verificandoCodigo.set(false);
        this.claveCorreoVerificado.set(`${correo}|${rol}`);
        this.errorCorreoVerificacion.set(null);
        this.modalCodigoAbierto.set(false);
      },
      error: (error: ErrorHttp) => {
        this.verificandoCodigo.set(false);
        this.errorVerificacionModal.set(error.mensaje);
      },
    });
  }

  protected cerrarModalCodigo(): void {
    this.modalCodigoAbierto.set(false);
    this.errorVerificacionModal.set(null);
  }

  private iniciarCooldown(segundos: number): void {
    this.detenerCooldown();
    if (segundos <= 0) {
      this.cooldownSegundos.set(0);
      return;
    }
    this.cooldownSegundos.set(segundos);
    this.timerCooldownId = setInterval(() => {
      const siguiente = this.cooldownSegundos() - 1;
      if (siguiente <= 0) {
        this.detenerCooldown();
      } else {
        this.cooldownSegundos.set(siguiente);
      }
    }, 1000);
  }

  private detenerCooldown(): void {
    if (this.timerCooldownId !== null) {
      clearInterval(this.timerCooldownId);
      this.timerCooldownId = null;
    }
    this.cooldownSegundos.set(0);
  }

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
    this.errorFotoPerfil.set(null);
    this.errorZonas.set(null);
    this.errorOficios.set(null);
    this.errorCorreoVerificacion.set(null);
    if (rol === 'CLIENTE') {
      this.claveCulVerificado.set(null);
      this.mensajeCulVerificado.set(null);
      this.limpiarFotoPerfil();
    } else {
      this.cargarCatalogosProveedorSiFalta();
    }
  }

  protected alSeleccionarCul(evento: Event): void {
    const input = evento.target as HTMLInputElement | null;
    const archivo = input?.files?.[0] ?? null;

    this.claveCulVerificado.set(null);
    this.mensajeCulVerificado.set(null);
    this.limpiarFotoPerfil();

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

    if (/^\d{8}$/.test(this.modelo().dni.trim())) {
      this.validarCulEnServidor();
    }
  }

  protected validarCulEnServidor(): void {
    this.errorCul.set(null);
    this.mensajeCulVerificado.set(null);

    const dni = this.modelo().dni.trim();
    if (!/^\d{8}$/.test(dni)) {
      this.formulario.dni().markAsTouched();
      this.errorCul.set('Ingresa primero tu DNI válido de 8 dígitos para verificar el CUL.');
      return;
    }

    const cul = this.archivoCul();
    if (!cul) {
      this.errorCul.set('Adjunta tu Certificado Único Laboral (CUL) en formato PDF.');
      return;
    }

    this.validandoCul.set(true);
    this.authApi.validarCul(dni, cul).subscribe({
      next: (res) => {
        this.validandoCul.set(false);
        this.claveCulVerificado.set(`${dni}|${cul.name}|${cul.size}`);
        this.mensajeCulVerificado.set(res.detalleValidacion);
        this.errorCul.set(null);
      },
      error: (error: ErrorHttp) => {
        this.validandoCul.set(false);
        this.claveCulVerificado.set(null);
        this.limpiarFotoPerfil();
        this.errorCul.set(error.mensaje);
      },
    });
  }

  protected alSeleccionarFotoPerfil(evento: Event): void {
    const input = evento.target as HTMLInputElement | null;
    const archivo = input?.files?.[0] ?? null;

    if (!archivo) {
      this.limpiarFotoPerfil();
      this.errorFotoPerfil.set('Debes subir una foto de perfil para completar tu registro.');
      return;
    }

    const nombreLower = archivo.name.toLowerCase();
    const tipoValido =
      TIPOS_FOTO_PERMITIDOS.has(archivo.type) ||
      EXTENSIONES_FOTO_PERMITIDAS.some((ext) => nombreLower.endsWith(ext));
    if (!tipoValido) {
      this.limpiarFotoPerfil();
      this.errorFotoPerfil.set('La foto de perfil debe ser una imagen JPG, PNG o WEBP.');
      return;
    }

    if (archivo.size === 0 || archivo.size > MAX_BYTES_FOTO) {
      this.limpiarFotoPerfil();
      this.errorFotoPerfil.set('La foto de perfil no puede estar vacía ni exceder los 5 MB.');
      return;
    }

    this.revocarPreviewFoto();
    this.archivoFotoPerfil.set(archivo);
    this.errorFotoPerfil.set(null);
    if (typeof URL.createObjectURL === 'function') {
      this.previewFotoPerfil.set(URL.createObjectURL(archivo));
    }
  }

  private limpiarFotoPerfil(): void {
    this.revocarPreviewFoto();
    this.archivoFotoPerfil.set(null);
    this.errorFotoPerfil.set(null);
  }

  private revocarPreviewFoto(): void {
    const actual = this.previewFotoPerfil();
    if (actual && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(actual);
    }
    this.previewFotoPerfil.set(null);
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

    if (!this.correoVerificado()) {
      this.errorCorreoVerificacion.set(
        'Debes verificar tu correo electrónico con el código de verificación antes de registrarte.',
      );
    }

    if (this.modelo().rol === 'PROVEEDOR') {
      if (this.zonasSeleccionadas().length === 0) {
        this.errorZonas.set('Selecciona al menos un distrito de atención en Trujillo.');
      }
      if (this.oficiosSeleccionados().length === 0) {
        this.errorOficios.set('Selecciona al menos un oficio.');
      }
      if (!this.archivoCul()) {
        this.errorCul.set(
          'Debes adjuntar tu Certificado Único Laboral (CUL) en PDF para registrarte como proveedor.',
        );
      } else if (!this.culVerificado()) {
        this.errorCul.set('Debes validar tu CUL antes de continuar.');
      } else if (!this.archivoFotoPerfil()) {
        this.errorFotoPerfil.set('Debes subir tu foto de perfil para completar el registro.');
      }
    }

    void submit(this.formulario, () => {
      if (this.errorDniConsulta()) {
        return Promise.resolve();
      }
      if (!this.correoVerificado()) {
        this.errorCorreoVerificacion.set(
          'Debes verificar tu correo electrónico con el código de verificación antes de registrarte.',
        );
        return Promise.resolve();
      }

      const datos = this.modelo();

      if (datos.rol === 'PROVEEDOR') {
        if (this.zonasSeleccionadas().length === 0) {
          this.errorZonas.set('Selecciona al menos un distrito de atención en Trujillo.');
          return Promise.resolve();
        }
        if (this.oficiosSeleccionados().length === 0) {
          this.errorOficios.set('Selecciona al menos un oficio.');
          return Promise.resolve();
        }
        const cul = this.archivoCul();
        if (!cul || this.errorCul() || !this.culVerificado()) {
          if (!cul && !this.errorCul()) {
            this.errorCul.set(
              'Debes adjuntar tu Certificado Único Laboral (CUL) en PDF para registrarte como proveedor.',
            );
          } else if (cul && !this.culVerificado() && !this.errorCul()) {
            this.errorCul.set('Debes validar tu CUL antes de subir tu foto y registrarte.');
          }
          return Promise.resolve();
        }

        const foto = this.archivoFotoPerfil();
        if (!foto || this.errorFotoPerfil()) {
          if (!foto && !this.errorFotoPerfil()) {
            this.errorFotoPerfil.set('Debes subir tu foto de perfil para completar el registro.');
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
              idsZonas: this.zonasSeleccionadas(),
              idsOficios: this.oficiosSeleccionados(),
            },
            cul,
            foto,
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
