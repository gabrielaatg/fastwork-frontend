# Módulo 6 — Calificaciones y Reseñas (`src/app/resena/`)

Permite a los clientes calificar servicios finalizados y visualizar la reputación histórica de los proveedores, alineado con `docs/backend_docs/modulos/06-resenas.md`.

---

## 1. Servicio HTTP

- **Servicio**: `ResenaApi` (`src/app/resena/resena-api.ts`, `providedIn: 'root'`)
  - `crear(idSolicitud, CrearResenaRequest): Observable<Resena>` → `POST /api/v1/resenas/solicitud/{idSolicitud}`
- **Modelos** (`src/app/dominio/resena.ts`): `PuntuacionEstrellas` (`1 | 2 | 3 | 4 | 5`), `Resena`, `CrearResenaRequest`.

---

## 2. Componentes del Módulo

### `FormularioResena` (`app-formulario-resena`)

- **Archivos**: `src/app/resena/formulario-resena/formulario-resena.{ts,html,css}`
- **Uso**: Panel lateral embebido en `ListaSolicitud` cuando `puedeCalificarSolicitud(solicitud.estado, rolActual)` es verdadero (`CLIENTE` y solicitud `FINALIZADA`).
- **Entradas**:
  - `idSolicitud = input.required<number>()`
  - `nombreProveedor = input<string>('')`
- **Salidas**:
  - `resenaCreada = output<Resena>()`
  - `cancelar = output<void>()`
- **Funcionamiento**:
  1. Utiliza `<app-calificacion-estrellas [(valor)]="puntuacion" [soloLectura]="false" />` para seleccionar de 1 a 5 estrellas (por defecto `5`) y Signal Forms para el `comentario` opcional (`maxLength(500)`).
  2. Valida que la puntuación redondeada esté en el rango `1..5` antes de invocar `resenaApi.crear(idSolicitud, ...)`.
  3. Al completarse, emite `resenaCreada` para que `ListaSolicitud` cierre el panel y notifique al usuario; ante errores de negocio (por ejemplo, reseña duplicada HTTP `400`), los muestra en `<app-alerta-mensaje />`.

### `ListaResenas` (`app-lista-resenas`)

- **Archivos**: `src/app/resena/lista-resenas/lista-resenas.{ts,html,css}`
- **Uso**: Embebido en `DetalleProveedor`.
- **Entrada**: `resenas = input.required<readonly Resena[]>()`
- **Funcionamiento**: Renderiza un estado vacío informativo si no existen reseñas, o la lista cronológica con `nombreCliente`, `fechaResena`, `<app-calificacion-estrellas [soloLectura]="true" />` y `comentario`.
