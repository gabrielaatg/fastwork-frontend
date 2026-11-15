# Módulo 5 — Mensajería Interna (`src/app/mensaje/`)

Provee el hilo de comunicación directa entre `CLIENTE` y `PROVEEDOR` asociado a una solicitud de servicio, en correspondencia con `docs/backend_docs/modulos/05-mensajeria.md`.

---

## 1. Servicio HTTP

- **Servicio**: `MensajeApi` (`src/app/mensaje/mensaje-api.ts`, `providedIn: 'root'`)
  - `listarPorSolicitud(idSolicitud): Observable<Mensaje[]>` → `GET /api/v1/solicitudes/{idSolicitud}/mensajes`
  - `enviar(idSolicitud, EnviarMensajeRequest): Observable<Mensaje>` → `POST /api/v1/solicitudes/{idSolicitud}/mensajes`
- **Modelos** (`src/app/dominio/mensaje.ts`): `Mensaje`, `EnviarMensajeRequest`.

---

## 2. Componentes del Módulo

### `ChatSolicitud` (`app-chat-solicitud`)

- **Archivos**: `src/app/mensaje/chat-solicitud/chat-solicitud.{ts,html,css}`
- **Uso**: Panel lateral embebido en `ListaSolicitud` (`src/app/solicitud/lista-solicitud/`).
- **Entradas**:
  - `idSolicitud = input.required<number>()`
  - `tituloConversacion = input<string>('')`
- **Salida**:
  - `cerrado = output<void>()`
- **Funcionamiento**:
  1. Mediante `effect()`, cada cambio de `idSolicitud()` dispara `mensajeApi.listarPorSolicitud(id)` para cargar el historial cronológico.
  2. Compara `msg.idEmisor === idUsuarioActual()` (`authApi.idUsuario`) para alinear y estilizar de manera diferenciada las burbujas propias frente a las de la contraparte, mostrando `nombreEmisor` y `fechaEnvio`.
  3. Dispone de botón manual **Actualizar** para refrescar mensajes nuevos sin recargar la agenda completa.
  4. Incluye formulario Signal Forms (`contenido` obligatorio) que envía mediante `mensajeApi.enviar(...)`, añade el mensaje retornado a la señal `mensajes` y limpia el campo de texto.
