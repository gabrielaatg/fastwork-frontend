# TODO por Fases — Fast Work Frontend (Angular 21)

Hoja de ruta de la SPA desktop **Fast Work** (Trujillo, Perú), alineada a `docs/backend_docs/specs.md` y los 8 módulos (17 endpoints) de `docs/backend_docs/modulos/README.md`.

> **Convención acordada:** Cada módulo de negocio vive en su propia carpeta en singular dentro de `src/app/` (`oficio/`, `proveedor/`, `solicitud/`, `mensaje/`, `resena/`, `admin/`, `piloto/`), alojando su `*-api.ts` (sin `*.spec.ts`) y, en fases posteriores, las subcarpetas de sus componentes.

---

## Fase 0: Base del Proyecto, Core API y Dominio (Completado)

### Scaffold y Documentación

- [x] Proyecto Angular `21.2.6` inicializado con TypeScript estricto (`strict: true`, `isolatedModules: true`), Prettier y Vitest (`src/app/app.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`, `src/app/app.spec.ts`).
- [x] Documentación técnica, scripts SQL y contratos del backend disponibles en `docs/backend_docs/`.

### Core API (`src/app/core/api/`)

- [x] `src/app/core/api/jsend.ts`: Contratos `JsendStatus`, `JsendResponse<T>`, `JsendErroresValidacion` y helper `extraerData<T>`.
- [x] `src/app/core/api/errores.ts`: Tipos `CodigoErrorHttp`, `TipoError`, `ErrorHttp` y función pura `normalizarError` para respuestas `0`, `400`, `401`, `403`, `404` y `500`.

### Capa de Dominio (`src/app/dominio/`)

- [x] `src/app/dominio/rol.ts`: `RolUsuario`, `RolRegistro`, `EstadoCuenta`.
- [x] `src/app/dominio/auth.ts`: `LoginRequest`, `RegistroUsuarioRequest`, `AuthResponse`, `UsuarioSesion`.
- [x] `src/app/dominio/oficio.ts`: `Oficio`, `CrearOficioRequest`.
- [x] `src/app/dominio/resena.ts`: `PuntuacionEstrellas`, `Resena`, `CrearResenaRequest`.
- [x] `src/app/dominio/proveedor.ts`: `EstadoDisponibilidad`, `EstadoVerificacion`, `EstadoVerificacionDecision`, `ProveedorOficio`, `ProveedorDirectorio`, `ProveedorDetalle`, `FiltroProveedoresQuery`, DTOs de actualización y regla `esRangoTarifaValido`.
- [x] `src/app/dominio/solicitud.ts`: `EstadoSolicitud`, `EstadoDestinoSolicitud`, `SolicitudServicio`, DTOs de creación/estado, `TRANSICIONES_SOLICITUD_POR_ROL`, `obtenerTransicionesPermitidas`, `puedeTransicionarEstado` y `puedeCalificarSolicitud`.
- [x] `src/app/dominio/mensaje.ts`: `Mensaje`, `EnviarMensajeRequest`.
- [x] `src/app/dominio/piloto.ts`: `ActualizarVerificacionRequest`, `CrearMetricaPilotoRequest`, `MetricaPiloto`, `ResumenPiloto`.

---

## Fase 1: Configuración Global, Sesión JWT y Seguridad HTTP (Completado)

- [x] Definir configuración de entorno con la URL base del backend (`http://localhost:8081/api/v1`) en `src/environments/` y `angular.json`.
- [x] Configurar `provideHttpClient(withInterceptors([tokenInterceptor, sesionVencidaInterceptor]))` en `src/app/app.config.ts`.
- [x] Actualizar `src/index.html` (`lang="es"`, título `Fast Work — Directorio de Oficios en Trujillo`) y limpiar el placeholder de `src/app/app.html`.
- [x] Definir estilos base desktop y tokens visuales en `src/styles.css`.
- [x] Implementar gestión de sesión reactiva con Signals en `src/app/core/auth/auth-api.ts` (`token`, `usuario`, `rol`, `estaAutenticado`, `esSesionVigente`, persistencia en `localStorage`, validación de expiración y cierre de sesión).
- [x] Implementar `tokenInterceptor` (`src/app/core/auth/token-interceptor.ts`) y `sesionVencidaInterceptor` (`src/app/core/auth/sesion-vencida-interceptor.ts`) con pruebas en `sesion-vencida-interceptor.spec.ts`.
- [x] Implementar guards funcionales en `src/app/core/auth/sesion-guard.ts` (`sesionGuard`, `rolGuard`, `invitadoGuard`) con pruebas en `sesion-guard.spec.ts`.

---

## Fase 2: Servicios de Integración con la API REST (Completado)

- [x] **Módulo 1 — Autenticación (`/auth`)**: `registrar()` (`POST /auth/register`) e `iniciarSesion()` (`POST /auth/login`) en `src/app/core/auth/auth-api.ts` + pruebas en `auth-api.spec.ts`.
- [x] **Módulo 2 — Catálogo de Oficios (`/oficios`)**: `GET /oficios`, `POST /oficios` en `src/app/oficio/oficio-api.ts`.
- [x] **Módulo 3 — Proveedores (`/proveedores`)**: `GET /proveedores` (filtros `oficios`, `disponibilidad`, `calificacionMin`), `GET /proveedores/{idPerfilProveedor}`, `PUT /proveedores/mi-perfil`, `PATCH /proveedores/mi-disponibilidad` en `src/app/proveedor/proveedor-api.ts`.
- [x] **Módulo 4 — Solicitudes (`/solicitudes`)**: `POST /solicitudes`, `GET /solicitudes/mis-solicitudes`, `PATCH /solicitudes/{idSolicitud}/estado` en `src/app/solicitud/solicitud-api.ts`.
- [x] **Módulo 5 — Mensajería (`/solicitudes/{idSolicitud}/mensajes`)**: `GET` y `POST` en `src/app/mensaje/mensaje-api.ts`.
- [x] **Módulo 6 — Reseñas (`/resenas`)**: `POST /resenas/solicitud/{idSolicitud}` en `src/app/resena/resena-api.ts`.
- [x] **Módulo 7 — Administración (`/admin`)**: `PATCH /admin/proveedores/{idPerfilProveedor}/verificacion`, `GET /admin/piloto/resumen` en `src/app/admin/admin-api.ts`.
- [x] **Módulo 8 — Métricas del Piloto (`/piloto`)**: `POST /piloto/metricas` en `src/app/piloto/piloto-api.ts`.

---

## Fase 3: Layout Desktop y Componentes Compartidos (Completado)

- [x] Shell principal (`src/app/app.ts`, `app.html`, `app.css`) y barra de navegación desktop contextual por rol en `src/app/core/layout/barra-navegacion/` (`Invitado`, `CLIENTE`, `PROVEEDOR`, `ADMIN`).
- [x] Componente de calificación con estrellas en `src/app/core/layout/calificacion-estrellas/` (modo lectura y selector `1..5`).
- [x] Badges de estado en `src/app/core/layout/badge-estado/` (`EstadoVerificacion`, `EstadoDisponibilidad`, `EstadoSolicitud`).
- [x] Componente para mostrar errores de validación por campo (`erroresCampo`) y mensajes globales de error/éxito en `src/app/core/layout/alerta-mensaje/`.
- [x] Modal reutilizable de confirmación para acciones críticas en `src/app/core/layout/modal-confirmacion/`.

---

## Fase 4: Vistas Funcionales por Módulo y Enrutamiento (Completada)

### 4.1 Autenticación (`src/app/auth/` — Público)

- [x] `login/`: Pantalla de inicio de sesión (`correo`, `password`, redirección según rol).
- [x] `registro/`: Pantalla de registro (`CLIENTE` / `PROVEEDOR`, `documentoIdentidad` condicional para proveedor, checkbox obligatorio Ley N.° 29733).

### 4.2 Directorio y Gestión de Proveedores (`src/app/proveedor/`)

- [x] `lista-proveedores/` y `tarjeta-proveedor/`: Directorio tipo agenda desktop en Trujillo con panel lateral de filtros (multi-oficio, disponibilidad, calificación mínima; **sin filtros de distrito o zona**).
- [x] `detalle-proveedor/`: Vista completa del proveedor con oficios, rangos de precios (`precioMinimo` - `precioMaximo`), estado de verificación y reseñas.
- [x] `formulario-proveedor/`: Edición de perfil comercial del `PROVEEDOR` (`descripcionPerfil`, `documentoIdentidad`), múltiples oficios/tarifas validando `esRangoTarifaValido`, y selector de disponibilidad (`DISPONIBLE`, `OCUPADO`, `NO_DISPONIBLE`).

### 4.3 Solicitudes, Agenda, Chat y Reseñas (`src/app/solicitud/`, `src/app/mensaje/`, `src/app/resena/`)

- [x] `solicitud/formulario-solicitud/`: Creación de solicitud (`idOficio` ofrecido por el proveedor, `direccionTrujillo`, `fechaProgramada >= hoy`, `horaProgramada`, `descripcionTrabajo`, `presupuestoReferencial`).
- [x] `solicitud/lista-solicitud/` y `solicitud/tarjeta-solicitud/`: Vista de agenda `Mis Solicitudes` con acciones habilitadas según `obtenerTransicionesPermitidas(estado, rol)`.
- [x] `mensaje/chat-solicitud/`: Hilo de mensajería interna por solicitud (`GET` / `POST` mensajes).
- [x] `resena/formulario-resena/` y `resena/lista-resenas/`: Calificación de solicitudes `FINALIZADA` (solo `CLIENTE`, `puedeCalificarSolicitud`) y visualización de reseñas.

### 4.4 Administración, Catálogo de Oficios y Piloto (`src/app/admin/`, `src/app/oficio/`, `src/app/piloto/`)

- [x] `admin/verificacion-proveedores/`: Verificación administrativa de proveedores (`VERIFICADO` / `RECHAZADO`).
- [x] `oficio/lista-oficios/` y `oficio/formulario-oficio/`: Gestión del catálogo maestro de oficios (`GET` / `POST /oficios` para `ADMIN`).
- [x] `admin/resumen-piloto/`: Tablero estadístico del piloto (`GET /admin/piloto/resumen`).
- [x] `piloto/encuesta-piloto/`: Formulario de encuesta de usabilidad y satisfacción para `CLIENTE` y `PROVEEDOR` (`POST /piloto/metricas`).

### 4.5 Enrutamiento (`src/app/app.routes.ts`)

- [x] Configurar rutas con lazy loading y protección mediante `sesionGuard`, `rolGuard(...)` e `invitadoGuard`.

---

## Fase 5: Pruebas y Validación Final (Pendiente)

- [ ] Verificar compilación (`npm run build`), chequeo estricto de tipos (`tsc --noEmit`) y formato Prettier.
- [ ] Ejecutar suite completa de pruebas (`ng test`, cubriendo actualmente `app.spec.ts` y `core/auth/*.spec.ts`).
- [ ] Validación end-to-end manual contra `fastwork-backend` ejecutándose en `http://localhost:8081`.
