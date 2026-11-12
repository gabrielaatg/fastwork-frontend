# Módulo 3: Directorio y Perfiles de Proveedores (`/api/v1/proveedores`)

**Componentes:** `ProveedorController`, `ProveedorService`, `ProveedorMapper`  
**DTOs:** `ProveedorDirectorioResponse`, `ProveedorDetalleResponse`, `ProveedorOficioResponse`, `ActualizarPerfilProveedorRequest`, `ActualizarOficioTarifaRequest`, `ActualizarDisponibilidadRequest`

---

## Descripción Funcional

Implementa el directorio tipo agenda de trabajadores independientes en Trujillo (sin segmentación por distritos), la vista detallada de perfil comercial con reseñas y tarifas por oficio, y las operaciones del proveedor autenticado para mantener su perfil y disponibilidad.

### Reglas de Negocio
1. **Cobertura única:** Todos los proveedores atienden en toda la ciudad de Trujillo.
2. **Múltiples oficios y tarifas propias:** Un proveedor puede registrar uno o varios oficios activos sin duplicados, definiendo `precioMinimo` y `precioMaximo` (`precioMaximo >= precioMinimo >= 0`).
3. **Estados de disponibilidad válidos:** `DISPONIBLE`, `OCUPADO`, `NO_DISPONIBLE`.

---

## Endpoints

### 1. Buscar Proveedores en Directorio
* **Método y Ruta:** `GET /api/v1/proveedores`
* **Acceso:** Protegido — Cualquier usuario autenticado (`CLIENTE`, `PROVEEDOR`, `ADMIN`).
* **Body Esperado:** Ninguno.

#### Parámetros Query (Opcionales)

| Parámetro | Tipo | Ejemplo | Descripción |
| :--- | :--- | :--- | :--- |
| `oficios` | `List<Integer>` | `?oficios=1,3` | Filtra por uno o más IDs de oficio. |
| `disponibilidad` | `String` | `?disponibilidad=DISPONIBLE` | `DISPONIBLE`, `OCUPADO` o `NO_DISPONIBLE`. |
| `calificacionMin` | `BigDecimal` | `?calificacionMin=4.0` | Calificación promedio mínima (`calificacionPromedio >= calificacionMin`). |

#### Posibles Respuestas

* **`200 OK` (`Jsend<List<ProveedorDirectorioResponse>>`):**
```json
{
  "status": "success",
  "data": [
    {
      "idPerfilProveedor": 1,
      "idUsuario": 12,
      "nombres": "Carlos",
      "apellidos": "Mendoza",
      "telefono": "944123456",
      "descripcionPerfil": "Especialista en instalaciones domiciliarias con 8 años de experiencia.",
      "estadoDisponibilidad": "DISPONIBLE",
      "estadoVerificacion": "VERIFICADO",
      "calificacionPromedio": 4.80,
      "totalResenas": 5,
      "oficios": [
        {
          "idProveedorOficio": 3,
          "idOficio": 1,
          "nombreOficio": "Gasfitería",
          "precioMinimo": 50.00,
          "precioMaximo": 140.00,
          "detalleTarifa": "Incluye revisión general"
        }
      ]
    }
  ]
}
```

* **`400 Bad Request` (`Jsend`):** Valor inválido en `disponibilidad` o tipo incorrecto en query params.
* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido.

---

### 2. Obtener Detalle Completo de Proveedor
* **Método y Ruta:** `GET /api/v1/proveedores/{idPerfilProveedor}`
* **Acceso:** Protegido — Cualquier usuario autenticado.
* **Path Variable:** `idPerfilProveedor` (`Integer`).
* **Body Esperado:** Ninguno.

#### Posibles Respuestas

* **`200 OK` (`Jsend<ProveedorDetalleResponse>`):**
```json
{
  "status": "success",
  "data": {
    "idPerfilProveedor": 1,
    "idUsuario": 12,
    "nombres": "Carlos",
    "apellidos": "Mendoza",
    "correo": "carlos.mendoza@fastwork.pe",
    "telefono": "944123456",
    "documentoIdentidad": "70123456",
    "descripcionPerfil": "Especialista en instalaciones domiciliarias.",
    "estadoDisponibilidad": "DISPONIBLE",
    "estadoVerificacion": "VERIFICADO",
    "calificacionPromedio": 4.80,
    "totalResenas": 1,
    "oficios": [
      {
        "idProveedorOficio": 3,
        "idOficio": 1,
        "nombreOficio": "Gasfitería",
        "precioMinimo": 50.00,
        "precioMaximo": 140.00,
        "detalleTarifa": "Incluye revisión general"
      }
    ],
    "resenas": [
      {
        "idResena": 10,
        "idSolicitud": 25,
        "idCliente": 4,
        "nombreCliente": "Lucía Fernández",
        "idPerfilProveedor": 1,
        "puntuacion": 5,
        "comentario": "Muy puntual y prolijo.",
        "fechaResena": "2026-11-14T18:20:00"
      }
    ]
  }
}
```

* **`400 Bad Request` (`Jsend`):** `idPerfilProveedor` no numérico.
* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido.
* **`404 Not Found` (`Jsend<Void>`):** Perfil no encontrado.

---

### 3. Actualizar Mi Perfil Comercial
* **Método y Ruta:** `PUT /api/v1/proveedores/mi-perfil`
* **Acceso:** Protegido — Solo rol **`PROVEEDOR`** (identificado por el JWT).

#### Body Esperado (`ActualizarPerfilProveedorRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `descripcionPerfil` | `String` | No | Descripción comercial libre. |
| `documentoIdentidad` | `String` | Sí | `@NotBlank`, máximo 20 caracteres. |
| `oficios` | `List<ActualizarOficioTarifaRequest>` | No | Si se envía, reemplaza los oficios/tarifas actuales del proveedor (sin duplicar `idOficio`). |

**Estructura de cada elemento en `oficios` (`ActualizarOficioTarifaRequest`):**

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `idOficio` | `Integer` | Sí | `@NotNull`. El oficio debe existir y estar activo. |
| `precioMinimo` | `BigDecimal` | Sí | `@NotNull`, `>= 0.0`. |
| `precioMaximo` | `BigDecimal` | Sí | `@NotNull`, `>= 0.0` y `>= precioMinimo`. |
| `detalleTarifa` | `String` | No | Máximo 150 caracteres. |

**Ejemplo de Body:**
```json
{
  "descripcionPerfil": "Técnico gasfitero y electricista en todo Trujillo",
  "documentoIdentidad": "70123456",
  "oficios": [
    {
      "idOficio": 1,
      "precioMinimo": 50.00,
      "precioMaximo": 140.00,
      "detalleTarifa": "Diagnóstico y reparación básica"
    },
    {
      "idOficio": 3,
      "precioMinimo": 60.00,
      "precioMaximo": 180.00,
      "detalleTarifa": "Instalación de puntos y tableros"
    }
  ]
}
```

#### Posibles Respuestas

* **`200 OK` (`Jsend<ProveedorDetalleResponse>`):** Retorna el perfil actualizado con sus oficios y reseñas.
* **`400 Bad Request` (`Jsend`):** Errores de `@Valid`, oficio repetido, oficio inactivo o `precioMaximo < precioMinimo`.
* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido.
* **`403 Forbidden` (`Jsend`):** Rol distinto de `PROVEEDOR`.
* **`404 Not Found` (`Jsend`):** Perfil del proveedor o `idOficio` inexistente.

---

### 4. Actualizar Mi Disponibilidad
* **Método y Ruta:** `PATCH /api/v1/proveedores/mi-disponibilidad`
* **Acceso:** Protegido — Solo rol **`PROVEEDOR`**.

#### Body Esperado (`ActualizarDisponibilidadRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `estadoDisponibilidad` | `String` | Sí | `@NotBlank`. Valores: `DISPONIBLE`, `OCUPADO`, `NO_DISPONIBLE`. |

**Ejemplo de Body:**
```json
{
  "estadoDisponibilidad": "OCUPADO"
}
```

#### Posibles Respuestas

* **`200 OK` (`Jsend<ProveedorDetalleResponse>`):** Perfil actualizado con el nuevo estado de disponibilidad.
* **`400 Bad Request` (`Jsend`):** Estado inválido o campo vacío.
* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido.
* **`403 Forbidden` (`Jsend`):** Rol distinto de `PROVEEDOR`.
* **`404 Not Found` (`Jsend`):** Perfil del usuario no encontrado.
