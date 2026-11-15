# Módulo 7 — Administración (`src/app/admin/`)

Agrupa las herramientas de supervisión y métricas globales exclusivas del rol `ADMIN`, en correspondencia con `docs/backend_docs/modulos/07-administracion.md`.

---

## 1. Servicio HTTP

- **Servicio**: `AdminApi` (`src/app/admin/admin-api.ts`, `providedIn: 'root'`)
  - `actualizarVerificacion(idPerfilProveedor, ActualizarVerificacionRequest)` → `PATCH /api/v1/admin/proveedores/{idPerfilProveedor}/verificacion`
  - `obtenerResumenPiloto()` → `GET /api/v1/admin/piloto/resumen`
- **Modelos** (`src/app/dominio/piloto.ts`, `src/app/dominio/proveedor.ts`): `ActualizarVerificacionRequest`, `EstadoVerificacionDecision` (`'VERIFICADO' | 'RECHAZADO'`), `ResumenPiloto`.

---

## 2. Componentes del Módulo

### `VerificacionProveedores` (`app-verificacion-proveedores`)

- **Archivos**: `src/app/admin/verificacion-proveedores/verificacion-proveedores.{ts,html,css}`
- **Ruta**: `/admin/verificaciones` (`sesionGuard`, `rolGuard('ADMIN')`)
- **Funcionamiento**:
  1. Carga la lista de proveedores mediante `proveedorApi.buscarDirectorio()` (incluye estados `PENDIENTE`, `VERIFICADO` y `RECHAZADO`).
  2. Filtra localmente con pestañas (`Pendientes` activa por defecto, `Verificados`, `Rechazados`, `Todos`).
  3. Muestra nombre, descripción breve, teléfono, oficios declarados, `<app-badge-estado />` y botones **Verificar** / **Rechazar** según el estado actual.
  4. Al pulsar **Verificar** o **Rechazar**, abre `<app-modal-confirmacion />` (`variante="peligro"` para rechazo) y, tras confirmar, ejecuta `adminApi.actualizarVerificacion(...)` actualizando el estado de la fila en la señal `proveedores`.

### `ResumenPiloto` (`app-resumen-piloto`)

- **Archivos**: `src/app/admin/resumen-piloto/resumen-piloto.{ts,html,css}`
- **Ruta**: `/admin/piloto` (`sesionGuard`, `rolGuard('ADMIN')`)
- **Funcionamiento**:
  1. Consulta `adminApi.obtenerResumenPiloto()` al iniciar y permite recargar con el botón **Actualizar métricas**.
  2. Renderiza una grilla de 6 tarjetas KPI desktop:
     - `promedioUsabilidad` (con `<app-calificacion-estrellas [soloLectura]="true" />`)
     - `promedioSatisfaccion` (con `<app-calificacion-estrellas [soloLectura]="true" />`)
     - `totalEncuestas`
     - `totalUsuariosRegistrados`
     - `totalProveedoresVerificados`
     - `totalSolicitudesFinalizadas`
