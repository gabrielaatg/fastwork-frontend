# Módulo 6: Calificaciones y Reseñas (`/api/v1/resenas`)

**Componentes:** `ResenaController`, `ResenaService`, `CalificacionResenaRepository`  
**DTOs:** `CrearResenaRequest`, `ResenaResponse`

---

## Descripción Funcional

Gestiona la evaluación post-servicio mediante puntuación de **1 a 5 estrellas** y comentario opcional, alimentando la reputación visible de los proveedores en el directorio de Trujillo.

### Reglas de Negocio
1. **Autoría exclusiva:** Solo el `CLIENTE` propietario de la solicitud puede emitir la reseña (`NoAutorizadoException` si otro cliente lo intenta).
2. **Estado requerido:** La solicitud debe encontrarse en estado **`FINALIZADA`**.
3. **Unicidad (1:1):** Cada solicitud solo admite **una única reseña** (`id_solicitud` `UNIQUE` en BD).
4. **Recálculo automático:** Tras guardar la reseña, el servicio recalcula automáticamente `calificacionPromedio` (redondeado a 2 decimales con `RoundingMode.HALF_UP`) y `totalResenas` en el `PerfilProveedor` correspondiente.

---

## Endpoints

### 1. Registrar Reseña de Solicitud Finalizada
* **Método y Ruta:** `POST /api/v1/resenas/solicitud/{idSolicitud}`
* **Acceso:** Protegido — Solo rol **`CLIENTE`**.
* **Path Variable:** `idSolicitud` (`Integer`).

#### Body Esperado (`CrearResenaRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `puntuacion` | `Integer` | Sí | `@NotNull`, `@Min(1)`, `@Max(5)`. |
| `comentario` | `String` | No | Comentario opcional sobre el servicio recibido. |

**Ejemplo de Body:**
```json
{
  "puntuacion": 5,
  "comentario": "Excelente atención, solucionó la fuga rápidamente."
}
```

#### Posibles Respuestas

* **`201 Created` (`Jsend<ResenaResponse>`):**
```json
{
  "status": "success",
  "message": "Reseña registrada exitosamente",
  "data": {
    "idResena": 10,
    "idSolicitud": 18,
    "idCliente": 4,
    "nombreCliente": "Lucía Fernández",
    "idPerfilProveedor": 1,
    "puntuacion": 5,
    "comentario": "Excelente atención, solucionó la fuga rápidamente.",
    "fechaResena": "2026-11-14T18:20:00"
  }
}
```

* **`400 Bad Request` (`Jsend`):** Puntuación fuera del rango `1..5`, solicitud no `FINALIZADA` o reseña ya registrada para esa solicitud.
```json
{
  "status": "fail",
  "message": "Solo se puede calificar una solicitud en estado FINALIZADA"
}
```
* **`401 Unauthorized` (`Jsend`):** Token ausente/inválido o el cliente autenticado no es dueño de la solicitud.
* **`403 Forbidden` (`Jsend`):** Rol `PROVEEDOR` o `ADMIN`.
* **`404 Not Found` (`Jsend`):** Solicitud no encontrada.
