# Módulo 8: Métricas del Piloto (`/api/v1/piloto`)

**Componentes:** `PilotoController`, `AdminPilotoService`, `MetricaPilotoRepository`  
**DTOs:** `CrearMetricaPilotoRequest`, `MetricaPilotoResponse`

---

## Descripción Funcional

Recopila las encuestas de evaluación del piloto aplicadas a clientes y proveedores para medir la usabilidad y satisfacción general de la plataforma web.

---

## Endpoints

### 1. Registrar Métrica de Usabilidad y Satisfacción
* **Método y Ruta:** `POST /api/v1/piloto/metricas`
* **Acceso:** Protegido — Roles **`CLIENTE`** o **`PROVEEDOR`** (el usuario se identifica desde el JWT).

#### Body Esperado (`CrearMetricaPilotoRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `puntajeUsabilidad` | `Integer` | Sí | `@NotNull`, `@Min(1)`, `@Max(5)`. |
| `puntajeSatisfaccion` | `Integer` | Sí | `@NotNull`, `@Min(1)`, `@Max(5)`. |
| `observaciones` | `String` | No | Comentarios u observaciones libres del participante. |

**Ejemplo de Body:**
```json
{
  "puntajeUsabilidad": 5,
  "puntajeSatisfaccion": 5,
  "observaciones": "La búsqueda por oficio y la agenda son muy fáciles de usar."
}
```

#### Posibles Respuestas

* **`201 Created` (`Jsend<MetricaPilotoResponse>`):**
```json
{
  "status": "success",
  "message": "Encuesta registrada exitosamente",
  "data": {
    "idMetrica": 4,
    "idUsuario": 4,
    "nombreUsuario": "Lucía Fernández",
    "puntajeUsabilidad": 5,
    "puntajeSatisfaccion": 5,
    "observaciones": "La búsqueda por oficio y la agenda son muy fáciles de usar.",
    "fechaRegistro": "2026-11-14T19:00:00"
  }
}
```

* **`400 Bad Request` (`Jsend`):** Puntajes fuera del rango `1..5`, campos obligatorios nulos o JSON malformado.
* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido.
* **`403 Forbidden` (`Jsend`):** Rol `ADMIN`.
* **`404 Not Found` (`Jsend`):** Usuario no encontrado en base de datos.
