# Módulo 4 — Solicitudes de Servicio y Agenda (`src/app/solicitud/`)

Gestiona la creación de solicitudes en Trujillo y la agenda operativa para `CLIENTE` y `PROVEEDOR`, integrando la mensajería y la creación de reseñas en una vista maestro-detalle, alineado con `docs/backend_docs/modulos/04-solicitudes.md`.

---

## 1. Servicio HTTP y Máquina de Estados

- **Servicio**: `SolicitudApi` (`src/app/solicitud/solicitud-api.ts`, `providedIn: 'root'`)
  - `crear(CrearSolicitudRequest)` → `POST /api/v1/solicitudes`
  - `listarMisSolicitudes()` → `GET /api/v1/solicitudes/mis-solicitudes`
  - `actualizarEstado(idSolicitud, ActualizarEstadoSolicitudRequest)` → `PATCH /api/v1/solicitudes/{idSolicitud}/estado`
- **Dominio** (`src/app/dominio/solicitud.ts`):
  - `obtenerTransicionesPermitidas(estadoActual, rol)`: calcula acciones válidas (`PROVEEDOR`: `PENDIENTE` → `ACEPTADA`/`RECHAZADA`, `ACEPTADA` → `EN_PROCESO`, `EN_PROCESO` → `FINALIZADA`; `CLIENTE`: `PENDIENTE`/`ACEPTADA` → `CANCELADA`).
  - `puedeCalificarSolicitud(estado, rol)`: retorna `true` solo cuando `estado === 'FINALIZADA'` y `rol === 'CLIENTE'`.

---

## 2. Componentes del Módulo

### `FormularioSolicitud` (`app-formulario-solicitud`)

- **Archivos**: `src/app/solicitud/formulario-solicitud/formulario-solicitud.{ts,html,css}`
- **Ruta**: `/solicitudes/nueva/:idPerfilProveedor` (`sesionGuard`, `rolGuard('CLIENTE')`)
- **Entrada por ruta**: `idPerfilProveedor = input.required<string>()`
- **Funcionamiento**:
  1. Carga el detalle del proveedor seleccionado (`proveedorApi.obtenerDetalle(id)`) para mostrar su nombre y poblar el `<select>` de `idOficio` **exclusivamente con los oficios que ese proveedor ofrece** (incluyendo rango de tarifa). Si solo tiene un oficio, lo preselecciona automáticamente.
  2. Valida con Signal Forms: `idOficio`, `direccionTrujillo`, `fechaProgramada` (mayor o igual a la fecha local de hoy `YYYY-MM-DD`), `horaProgramada` (normalizada a `HH:mm:ss`), `descripcionTrabajo` y `presupuestoReferencial` opcional (`>= 0`).
  3. Envía con `solicitudApi.crear(...)` y redirige a `/solicitudes`.

### `TarjetaSolicitud` (`app-tarjeta-solicitud`)

- **Archivos**: `src/app/solicitud/tarjeta-solicitud/tarjeta-solicitud.{ts,html,css}`
- **Entradas**:
  - `solicitud = input.required<SolicitudServicio>()`
  - `rolActual = input.required<RolUsuario>()`
  - `seleccionada = input(false)`
- **Salidas**:
  - `cambiarEstado = output<EstadoDestinoSolicitud>()`
  - `abrirChat = output<void>()`
  - `calificar = output<void>()`
- **Funcionamiento**: Muestra la contraparte según el rol activo (datos del proveedor para el cliente y viceversa), programación, dirección, presupuesto referencial, `<app-badge-estado />`, botones de transición generados dinámicamente con `obtenerTransicionesPermitidas(...)`, botón **Mensajes** y botón **Calificar servicio** cuando `puedeCalificarSolicitud(...)` se cumple.

### `ListaSolicitud` (`app-lista-solicitud`)

- **Archivos**: `src/app/solicitud/lista-solicitud/lista-solicitud.{ts,html,css}`
- **Ruta**: `/solicitudes` (`sesionGuard`, `rolGuard('CLIENTE', 'PROVEEDOR')`)
- **Funcionamiento**:
  1. Carga `solicitudApi.listarMisSolicitudes()` en `ngOnInit`.
  2. Ofrece pestañas de filtrado por estado (`Todas`, `Pendientes`, `Aceptadas`, `En proceso`, `Finalizadas`, `Canceladas`, `Rechazadas`).
  3. Layout maestro-detalle: al seleccionar **Mensajes** o **Calificar servicio**, abre a la derecha `<app-chat-solicitud />` o `<app-formulario-resena />`.
  4. Para transiciones críticas (`RECHAZADA` o `CANCELADA`), despliega `<app-modal-confirmacion variante="peligro" />` antes de llamar a `solicitudApi.actualizarEstado(...)`, actualizando la lista y la tarjeta activa en memoria.
