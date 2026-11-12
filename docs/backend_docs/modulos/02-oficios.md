# Módulo 2: Catálogo de Oficios (`/api/v1/oficios`)

**Componentes:** `OficioController`, `OficioService`, `OficioRepository`  
**DTOs:** `CrearOficioRequest`, `OficioResponse`

---

## Descripción Funcional

Administra el catálogo maestro de especialidades u oficios eventuales ofrecidos en toda la ciudad de Trujillo. Provee el listado público de oficios activos para selectores del frontend y permite al administrador incorporar nuevas especialidades.

### Carga Inicial Base (`ScriptFastWork.sql`)
El catálogo inicial cuenta con 6 oficios activos:
1. Gasfitería
2. Plomería
3. Electricidad
4. Carpintería
5. Jardinería
6. Soldadura

---

## Endpoints

### 1. Listar Oficios Activos
* **Método y Ruta:** `GET /api/v1/oficios`
* **Acceso:** Público (no requiere token).
* **Body Esperado:** Ninguno.

#### Posibles Respuestas

* **`200 OK` (`Jsend<List<OficioResponse>>`):**
```json
{
  "status": "success",
  "data": [
    {
      "idOficio": 1,
      "nombreOficio": "Gasfitería",
      "descripcion": "Instalación y reparación de tuberías de agua, desagüe y sanitarios.",
      "activo": true
    },
    {
      "idOficio": 2,
      "nombreOficio": "Plomería",
      "descripcion": "Mantenimiento de redes hidráulicas, grifería y detección de fugas.",
      "activo": true
    }
  ]
}
```

---

### 2. Crear Nuevo Oficio
* **Método y Ruta:** `POST /api/v1/oficios`
* **Acceso:** Protegido — Solo rol **`ADMIN`**.

#### Body Esperado (`CrearOficioRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `nombreOficio` | `String` | Sí | `@NotBlank`, máximo 80 caracteres. Único (insensible a mayúsculas). |
| `descripcion` | `String` | No | Máximo 255 caracteres. |

**Ejemplo de Body:**
```json
{
  "nombreOficio": "Cerrajería",
  "descripcion": "Apertura de puertas, cambio de chapas y duplicado de llaves."
}
```

#### Posibles Respuestas

* **`201 Created` (`Jsend<OficioResponse>`):**
```json
{
  "status": "success",
  "message": "Oficio creado exitosamente",
  "data": {
    "idOficio": 7,
    "nombreOficio": "Cerrajería",
    "descripcion": "Apertura de puertas, cambio de chapas y duplicado de llaves.",
    "activo": true
  }
}
```

* **`400 Bad Request` (`Jsend`):** Validación `@Valid` o nombre duplicado:
```json
{
  "status": "fail",
  "message": "Ya existe un oficio registrado con el nombre: Cerrajería"
}
```
* **`401 Unauthorized` (`Jsend`):** Sin token Bearer válido.
* **`403 Forbidden` (`Jsend`):** Usuario autenticado con rol `CLIENTE` o `PROVEEDOR`.
