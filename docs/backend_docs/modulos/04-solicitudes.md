# Módulo 4: Solicitudes de Servicio y Agenda (`/api/v1/solicitudes`)

**Componentes:** `SolicitudController`, `SolicitudService`, `SolicitudServicioRepository`  
**DTOs:** `CrearSolicitudRequest`, `ActualizarEstadoSolicitudRequest`, `SolicitudResponse`

---

## Descripción Funcional

Permite a los clientes generar solicitudes de trabajo indicando dirección en Trujillo, fecha y hora programada, descripción y presupuesto referencial. Provee la vista de agenda (`mis-solicitudes`) y controla la máquina de estados según el rol participante.

### Máquina de Estados Permitida

| Estado Actual | Rol Autorizado | Estados Destino Permitidos |
| :--- | :--- | :--- |
| `PENDIENTE` | `PROVEEDOR` | `ACEPTADA`, `RECHAZADA` |
| `PENDIENTE` | `CLIENTE` | `CANCELADA` |
| `ACEPTADA` | `PROVEEDOR` | `EN_PROCESO` |
| `ACEPTADA` | `CLIENTE` | `CANCELADA` |
| `EN_PROCESO` | `PROVEEDOR` | `FINALIZADA` |

---

## Endpoints

### 1. Crear Solicitud de Servicio
* **Método y Ruta:** `POST /api/v1/solicitudes`
* **Acceso:** Protegido — Solo rol **`CLIENTE`**.

#### Reglas de Negocio
* La `fechaProgramada` no puede ser anterior a la fecha actual (`LocalDate.now()`).
* Un usuario no puede crear una solicitud dirigida a su propio perfil proveedor.
* El oficio debe estar activo y el proveedor seleccionado debe tener asignado dicho `idOficio` en `proveedor_oficios`.
* El estado inicial es siempre `"PENDIENTE"`.

#### Body Esperado (`CrearSolicitudRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `idPerfilProveedor` | `Integer` | Sí | `@NotNull`. |
| `idOficio` | `Integer` | Sí | `@NotNull`. |
| `direccionTrujillo` | `String` | Sí | `@NotBlank`. |
| `fechaProgramada` | `LocalDate` | Sí | `@NotNull` (formato `YYYY-MM-DD`, no pasada). |
| `horaProgramada` | `LocalTime` | Sí | `@NotNull` (formato `HH:mm[:ss]`). |
| `descripcionTrabajo` | `String` | Sí | `@NotBlank`. |
| `presupuestoReferencial` | `BigDecimal` | No | `@DecimalMin("0.0")`. |

**Ejemplo de Body:**
```json
{
  "idPerfilProveedor": 1,
  "idOficio": 1,
  "direccionTrujillo": "Av. España 450, Trujillo",
  "fechaProgramada": "2026-11-20",
  "horaProgramada": "15:30:00",
  "descripcionTrabajo": "Fuga de agua debajo del lavadero de cocina.",
  "presupuestoReferencial": 95.00
}
```

#### Posibles Respuestas

* **`201 Created` (`Jsend<SolicitudResponse>`):**
```json
{
  "status": "success",
  "message": "Solicitud creada exitosamente",
  "data": {
    "idSolicitud": 18,
    "idCliente": 4,
    "nombreCliente": "Lucía Fernández",
    "telefonoCliente": "944300400",
    "idPerfilProveedor": 1,
    "nombreProveedor": "Carlos Mendoza",
    "telefonoProveedor": "944123456",
    "idOficio": 1,
    "nombreOficio": "Gasfitería",
    "direccionTrujillo": "Av. España 450, Trujillo",
    "fechaProgramada": "2026-11-20",
    "horaProgramada": "15:30:00",
    "descripcionTrabajo": "Fuga de agua debajo del lavadero de cocina.",
    "presupuestoReferencial": 95.00,
    "estado": "PENDIENTE",
    "fechaCreacion": "2026-11-14T23:05:10"
  }
}
```

* **`400 Bad Request` (`Jsend`):** Errores `@Valid`, fecha pasada, auto-solicitud, oficio inactivo o no ofrecido por el proveedor.
* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido.
* **`403 Forbidden` (`Jsend`):** Rol distinto de `CLIENTE`.
* **`404 Not Found` (`Jsend`):** Proveedor u oficio no encontrado.

---

### 2. Listar Mi Agenda de Solicitudes
* **Método y Ruta:** `GET /api/v1/solicitudes/mis-solicitudes`
* **Acceso:** Protegido — Roles **`CLIENTE`** o **`PROVEEDOR`**.
* **Body Esperado:** Ninguno.

#### Posibles Respuestas

* **`200 OK` (`Jsend<List<SolicitudResponse>>`):** Retorna las solicitudes del usuario ordenadas de la más reciente a la más antigua (`fechaCreacion DESC`).
* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido.
* **`403 Forbidden` (`Jsend`):** Rol `ADMIN` (no autorizado en esta ruta).

---

### 3. Actualizar Estado de Solicitud
* **Método y Ruta:** `PATCH /api/v1/solicitudes/{idSolicitud}/estado`
* **Acceso:** Protegido — Roles **`CLIENTE`** o **`PROVEEDOR`** (debe ser el cliente o proveedor involucrado en la solicitud).
* **Path Variable:** `idSolicitud` (`Integer`).

#### Body Esperado (`ActualizarEstadoSolicitudRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `nuevoEstado` | `String` | Sí | `@NotBlank`. Valores válidos: `ACEPTADA`, `RECHAZADA`, `EN_PROCESO`, `FINALIZADA`, `CANCELADA`. |

**Ejemplo de Body:**
```json
{
  "nuevoEstado": "ACEPTADA"
}
```

#### Posibles Respuestas

* **`200 OK` (`Jsend<SolicitudResponse>`):** Solicitud actualizada con el nuevo estado.
* **`400 Bad Request` (`Jsend`):** Estado desconocido o transición inválida para el estado actual y rol del usuario.
* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido, o usuario ajeno a la solicitud (`NoAutorizadoException`).
* **`403 Forbidden` (`Jsend`):** Rol `ADMIN`.
* **`404 Not Found` (`Jsend`):** Solicitud no encontrada.
