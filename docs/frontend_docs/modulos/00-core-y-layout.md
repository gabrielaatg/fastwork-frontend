# Módulo 0 — Núcleo, Seguridad y Componentes Compartidos (`core/` y Shell)

Documentación de la infraestructura transversal en `src/app/core/`, la configuración raíz en `src/app/app.*` y los 5 componentes reutilizables de `src/app/core/layout/`.

---

## 1. Shell Raíz y Configuración

| Elemento    | Archivo                 | Función Principal                                                                                                                                                                                 |
| :---------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `App`       | `src/app/app.ts`        | Selector `app-root`. Renderiza `<app-barra-navegacion />` fijo arriba y `<main class="fw-contenedor"><router-outlet /></main>`.                                                                   |
| `appConfig` | `src/app/app.config.ts` | Configura `provideRouter(routes, withComponentInputBinding())` para enlazar parámetros de ruta a `input()` y `provideHttpClient(withInterceptors([tokenInterceptor, sesionVencidaInterceptor]))`. |

---

## 2. Capa API y Manejo de Errores (`src/app/core/api/`)

### `jsend.ts`

- Define `JsendResponse<T>`, `JsendStatus` (`'success' | 'fail' | 'error'`) y `JsendErroresValidacion` (`Record<string, string>`).
- Exporta `extraerData<T>(respuesta)`: extrae el campo `data` de las respuestas exitosas del backend o lanza un `Error` si `data` viene indefinido.

### `errores.ts`

- Define `ErrorHttp` (`statusHttp`, `tipo`, `mensaje`, `erroresCampo?`) y `TipoError` (`VALIDACION`, `REGLA_NEGOCIO`, `NO_AUTORIZADO`, `ACCESO_DENEGADO`, `NO_ENCONTRADO`, `ERROR_SERVIDOR`, `CONEXION`).
- Exporta `normalizarError(statusHttp, body?)`: transforma respuestas JSend de error (`400`, `401`, `403`, `404`, `500` y `0`) en un `ErrorHttp` uniforme para las vistas. En HTTP `400`, distingue errores de campo `@Valid` (`VALIDACION` con `erroresCampo`) de reglas de negocio (`REGLA_NEGOCIO`).

---

## 3. Seguridad, Sesión JWT, Interceptores y Guards (`src/app/core/auth/`)

### `AuthApi` (`auth-api.ts`)

Servicio `providedIn: 'root'` contra `${environment.apiUrl}/auth` que centraliza la sesión en `localStorage` bajo la clave `fastwork_sesion`:

- **Señales públicas de solo lectura**: `usuario`, `token`, `rol`, `idUsuario`, `estaAutenticado` (verifica existencia y expiración del JWT).
- **Métodos**: `registrar(request)` (`POST /auth/register`), `iniciarSesion(request)` (`POST /auth/login`), `cambiarModo(modo)` (`POST /auth/cambiar-modo`), `establecerSesion(respuesta)`, `cerrarSesion()`, `esSesionVigente()` y `tieneRol(...rolesPermitidos)`.
- Decodifica el claim `exp` del JWT en el cliente para invalidar tokens vencidos antes de enviar peticiones.

### Interceptores HTTP

| Interceptor                | Archivo                         | Comportamiento                                                                                                                                                                          |
| :------------------------- | :------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokenInterceptor`         | `token-interceptor.ts`          | Clona la petición e inyecta `Authorization: Bearer <token>` solo si la URL apunta a `environment.apiUrl`, no pertenece a `/auth/login` ni `/auth/register` (usando `esRutaAuthPublica` de `rutas-auth.ts`) y `esSesionVigente()` es verdadero. |
| `sesionVencidaInterceptor` | `sesion-vencida-interceptor.ts` | Intercepta `HttpErrorResponse`, lo normaliza a `ErrorHttp` con `normalizarError(...)` y, si recibe HTTP `401` fuera de `/auth/login` y `/auth/register`, invoca `authApi.cerrarSesion()` y redirige a `/login`. |

### Guards Funcionales (`sesion-guard.ts`)

| Guard                | Función                                                                        | Redirección al Fallar                           |
| :------------------- | :----------------------------------------------------------------------------- | :---------------------------------------------- |
| `sesionGuard`        | Permite acceso solo si `authApi.esSesionVigente()` es verdadero.               | `/login?returnUrl=<url>`                        |
| `rolGuard(...roles)` | Verifica sesión vigente y que el usuario posea alguno de los roles permitidos. | `/login` (sin sesión) o `/` (rol no autorizado) |
| `invitadoGuard`      | Impide que usuarios ya autenticados entren a `/login` o `/registro`.           | `/`                                             |
| `inicioRedirectGuard`| Redirige la ruta raíz `/` hacia la vista inicial correspondiente al rol activo (`CLIENTE` → `/directorio`, `PROVEEDOR` → `/solicitudes`, `ADMIN` → `/admin/verificaciones`, sin sesión → `/login`). | Ruta por rol |

---

## 4. Componentes Compartidos de Layout (`src/app/core/layout/`)

### `BarraNavegacion` (`app-barra-navegacion`)

- **Ubicación**: `src/app/core/layout/barra-navegacion/`
- **Funcionamiento**: Lee `estaAutenticado` y `usuario` de `AuthApi`. Calcula enlaces dinámicos según el rol activo:
  - **Invitado**: `Iniciar sesión` (`/login`), `Registrarse` (`/registro`).
  - **`CLIENTE`**: `Directorio` (`/directorio`), `Mis Solicitudes` (`/solicitudes`), `Encuesta Piloto` (`/piloto`) y botón `Cambiar a Modo Proveedor`.
  - **`PROVEEDOR`**: `Mi Perfil` (`/proveedor/perfil`), `Agenda` (`/solicitudes`), `Encuesta Piloto` (`/piloto`) y botón `Cambiar a Modo Cliente`.
  - **`ADMIN`**: `Directorio` (`/directorio`), `Verificaciones` (`/admin/verificaciones`), `Oficios` (`/admin/oficios`), `Resumen Piloto` (`/admin/piloto`).
- Al cambiar entre modo `CLIENTE` y `PROVEEDOR`, invoca `authApi.cambiarModo(...)`, actualiza el JWT y redirige a `/directorio` o `/proveedor/perfil` respectivamente.
- Incluye botón `Cerrar sesión` que limpia la sesión y navega a `/login`.

### `CalificacionEstrellas` (`app-calificacion-estrellas`)

- **Ubicación**: `src/app/core/layout/calificacion-estrellas/`
- **Entradas / Modelo**:
  - `valor = model<number>(0)`: Puntuación enlazable bidireccionalmente (`[(valor)]`).
  - `soloLectura = input(true)`: Desactiva clics cuando se usa para mostrar promedios o reseñas.
  - `mostrarNumero = input(true)`: Muestra el decimal formateado (`toFixed(2)`).
  - `totalResenas = input<number | null>(null)`: Muestra el conteo de reseñas junto al promedio.
- **Funcionamiento**: Renderiza 5 estrellas (`1..5`); en modo interactivo (`soloLectura = false`), permite elegir un valor entero `PuntuacionEstrellas`.

### `BadgeEstado` (`app-badge-estado`)

- **Ubicación**: `src/app/core/layout/badge-estado/`
- **Entrada**: `estado = input.required<EstadoBadge>()` (`EstadoVerificacion | EstadoDisponibilidad | EstadoSolicitud`).
- **Funcionamiento**: Mapea cada estado a una etiqueta legible en español y un tono visual (`exito`, `advertencia`, `peligro`, `neutro`).

### `AlertaMensaje` (`app-alerta-mensaje`)

- **Ubicación**: `src/app/core/layout/alerta-mensaje/`
- **Entradas / Salida**:
  - `error = input<ErrorHttp | null>(null)`
  - `tipo = input<'error' | 'exito' | 'info'>('error')`
  - `mensaje = input<string | null>(null)`
  - `cerrable = input(false)`
  - `cerrado = output<void>()`
- **Funcionamiento**: Prioriza `error()` cuando está presente (forzando estilo `error` y listando los pares campo/mensaje de `erroresCampo` si existen); de lo contrario muestra `mensaje()` con el `tipo` indicado.

### `ModalConfirmacion` (`app-modal-confirmacion`)

- **Ubicación**: `src/app/core/layout/modal-confirmacion/`
- **Entradas / Salidas**:
  - `abierto = input.required<boolean>()`
  - `titulo = input.required<string>()`
  - `mensaje = input.required<string>()`
  - `textoConfirmar = input('Confirmar')`, `textoCancelar = input('Cancelar')`
  - `variante = input<'primario' | 'peligro'>('primario')`
  - `cargando = input(false)`
  - `confirmar = output<void>()`, `cancelar = output<void>()`
- **Funcionamiento**: Diálogo modal accesible (`Escape` cierra salvo cuando `cargando()` está activo) usado en rechazos/cancelaciones de solicitudes y verificaciones de proveedores.
