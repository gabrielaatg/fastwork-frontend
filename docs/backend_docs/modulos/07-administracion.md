# Módulo 7: Administración (`/api/v1/admin`)

**Componentes:** `AdminController`, `AdminPilotoService`  
**DTOs:** `ActualizarVerificacionRequest`, `ProveedorDetalleResponse`, `ResumenPilotoResponse`

---

## Descripción Funcional

Agrupa las operaciones exclusivas del administrador de la plataforma: validación básica de identidad de los proveedores registrados (`PENDIENTE` -> `VERIFICADO` / `RECHAZADO`) y consulta del tablero de indicadores estadísticos del piloto.

---

## Endpoints

### 1. Verificar o Rechazar Perfil de Proveedor
* **Método y Ruta:** `PATCH /api/v1/admin/proveedores/{idPerfilProveedor}/verificacion`
* **Acceso:** Protegido — Solo rol **`ADMIN`**.
* **Path Variable:** `idPerfilProveedor` (`Integer`).

#### Body Esperado (`ActualizarVerificacionRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `nuevoEstado` | `String` | Sí | `@NotBlank`. Valores permitidos: `"VERIFICADO"` o `"RECHAZADO"`. |

**Ejemplo de Body:**
```json
{
  "nuevoEstado": "VERIFICADO"
}
```

#### Posibles Respuestas

* **`200 OK` (`Jsend<ProveedorDetalleResponse>`):** Retorna el detalle del proveedor con `estadoVerificacion` actualizado.
```json
{
  "status": "success",
  "message": "Estado de verificación actualizado",
  "data": {
    "idPerfilProveedor": 1,
    "idUsuario": 12,
    "nombres": "Carlos",
    "apellidos": "Mendoza",
    "correo": "carlos.mendoza@fastwork.pe",
    "telefono": "944123456",
    "documentoIdentidad": "70123456",
    "descripcionPerfil": "Especialista en gasfitería.",
    "estadoDisponibilidad": "DISPONIBLE",
    "estadoVerificacion": "VERIFICADO",
    "calificacionPromedio": 4.80,
    "totalResenas": 1,
    "oficios": [],
    "resenas": []
  }
}
```

* **`400 Bad Request` (`Jsend`):** `nuevoEstado` distinto de `VERIFICADO` / `RECHAZADO` o campo vacío.
* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido.
* **`403 Forbidden` (`Jsend`):** Rol `CLIENTE` o `PROVEEDOR`.
* **`404 Not Found` (`Jsend`):** Perfil de proveedor no encontrado.

---

### 2. Obtener Resumen Estadístico del Piloto
* **Método y Ruta:** `GET /api/v1/admin/piloto/resumen`
* **Acceso:** Protegido — Solo rol **`ADMIN`**.
* **Body Esperado:** Ninguno.

#### Posibles Respuestas

* **`200 OK` (`Jsend<ResumenPilotoResponse>`):** Retorna los promedios redondeados a 2 decimales (si no existen encuestas devuelve `0.0`) y los totales del sistema.
```json
{
  "status": "success",
  "data": {
    "promedioUsabilidad": 4.65,
    "promedioSatisfaccion": 4.80,
    "totalEncuestas": 20,
    "totalUsuariosRegistrados": 35,
    "totalProveedoresVerificados": 12,
    "totalSolicitudesFinalizadas": 18
  }
}
```

* **`401 Unauthorized` (`Jsend`):** Token ausente o inválido.
* **`403 Forbidden` (`Jsend`):** Rol `CLIENTE` o `PROVEEDOR`.
