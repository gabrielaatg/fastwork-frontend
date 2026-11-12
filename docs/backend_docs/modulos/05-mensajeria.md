# Módulo 5: Mensajería Interna (`/api/v1/solicitudes/{idSolicitud}/mensajes`)

**Componentes:** `MensajeController`, `MensajeService`, `MensajeRepository`  
**DTOs:** `EnviarMensajeRequest`, `MensajeResponse`

---

## Descripción Funcional

Provee un hilo de mensajería interna asociado a cada solicitud de servicio para que el cliente y el proveedor coordinen detalles de la visita o trabajo directamente dentro de la plataforma.

### Reglas de Negocio
* Solo pueden leer o enviar mensajes el **cliente** propietario de la solicitud o el **proveedor** asignado a la misma. Cualquier otro usuario recibe `401 Unauthorized` (`NoAutorizadoException`).
* El historial se devuelve ordenado cronológicamente de forma ascendente (`fechaEnvio ASC`).
* Todo mensaje nuevo se registra con `leido = false`.

---

## Endpoints

### 1. Listar Historial de Mensajes
* **Método y Ruta:** `GET /api/v1/solicitudes/{idSolicitud}/mensajes`
* **Acceso:** Protegido — Roles **`CLIENTE`** o **`PROVEEDOR`** (participantes de la solicitud).
* **Path Variable:** `idSolicitud` (`Integer`).
* **Body Esperado:** Ninguno.

#### Posibles Respuestas

* **`200 OK` (`Jsend<List<MensajeResponse>>`):**
```json
{
  "status": "success",
  "data": [
    {
      "idMensaje": 101,
      "idSolicitud": 18,
      "idEmisor": 4,
      "nombreEmisor": "Lucía Fernández",
      "contenido": "Buenas tardes, ¿podría confirmar si llega a las 3:30 pm?",
      "leido": false,
      "fechaEnvio": "2026-11-14T14:15:00"
    },
    {
      "idMensaje": 102,
      "idSolicitud": 18,
      "idEmisor": 12,
      "nombreEmisor": "Carlos Mendoza",
      "contenido": "Sí, confirmado. Estaré puntual a esa hora.",
      "leido": false,
      "fechaEnvio": "2026-11-14T14:18:30"
    }
  ]
}
```

* **`401 Unauthorized` (`Jsend`):** Token ausente/inválido o usuario ajeno a la solicitud.
* **`403 Forbidden` (`Jsend`):** Rol `ADMIN`.
* **`404 Not Found` (`Jsend`):** Solicitud no encontrada.

---

### 2. Enviar Mensaje en la Solicitud
* **Método y Ruta:** `POST /api/v1/solicitudes/{idSolicitud}/mensajes`
* **Acceso:** Protegido — Roles **`CLIENTE`** o **`PROVEEDOR`** (participantes de la solicitud).
* **Path Variable:** `idSolicitud` (`Integer`).

#### Body Esperado (`EnviarMensajeRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `contenido` | `String` | Sí | `@NotBlank`. |

**Ejemplo de Body:**
```json
{
  "contenido": "Llevaré los repuestos de tubería necesarios."
}
```

#### Posibles Respuestas

* **`201 Created` (`Jsend<MensajeResponse>`):**
```json
{
  "status": "success",
  "message": "Mensaje enviado exitosamente",
  "data": {
    "idMensaje": 103,
    "idSolicitud": 18,
    "idEmisor": 12,
    "nombreEmisor": "Carlos Mendoza",
    "contenido": "Llevaré los repuestos de tubería necesarios.",
    "leido": false,
    "fechaEnvio": "2026-11-14T14:22:00"
  }
}
```

* **`400 Bad Request` (`Jsend`):** `contenido` vacío o JSON malformado.
* **`401 Unauthorized` (`Jsend`):** Token ausente/inválido o usuario ajeno a la solicitud.
* **`403 Forbidden` (`Jsend`):** Rol `ADMIN`.
* **`404 Not Found` (`Jsend`):** Solicitud o usuario emisor no encontrado.
