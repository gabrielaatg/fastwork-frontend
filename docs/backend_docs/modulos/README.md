# Documentación de Módulos del Backend — Fast Work API

Documentación técnica de la API RESTful de **Fast Work** para conectar trabajadores independientes de oficios eventuales con clientes en la ciudad de **Trujillo, Perú**.

---

## 1. Información General de Conexión

| Concepto | Valor |
| :--- | :--- |
| **URL Base (Desarrollo)** | `http://localhost:8081/api/v1` |
| **Puerto Configurable** | `${SERVER_PORT:8081}` |
| **Swagger UI** | `http://localhost:8081/swagger-ui.html` |
| **Especificación OpenAPI JSON** | `http://localhost:8081/v3/api-docs` |
| **Formato de Intercambio** | `application/json; charset=UTF-8` |
| **CORS Permitido** | `http://localhost:4200` (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`) |

---

## 2. Seguridad, JWT y Roles

La API es **stateless** y utiliza tokens **JWT (HS256)** generados con `JJWT 0.12.6`.

* **Encabezado requerido en rutas protegidas:**
  ```http
  Authorization: Bearer <token_jwt>
  ```
* **Claims incluidos en el token:**
  * `sub`: correo electrónico normalizado del usuario.
  * `idUsuario`: identificador numérico del usuario (`Integer`).
  * `rol`: rol del usuario (`CLIENTE`, `PROVEEDOR`, `ADMIN`).
  * `iat` / `exp`: fecha de emisión y expiración (`86400000 ms` = 24 horas por defecto).
* **Control de estado de cuenta:** Solo las cuentas con `estadoCuenta = "ACTIVO"` pueden autenticar o usar un token válido. Cuentas `SUSPENDIDO` o `INACTIVO` reciben `401 Unauthorized`.

### Roles del Sistema

| Rol | Alcance Principal |
| :--- | :--- |
| **`CLIENTE`** | Consultar directorio de proveedores, crear/cancelar solicitudes de servicio, usar mensajería interna, calificar servicios finalizados y registrar encuestas piloto. |
| **`PROVEEDOR`** | Gestionar perfil comercial, asignar múltiples oficios con rangos de precios, cambiar disponibilidad, atender solicitudes (`ACEPTADA`, `RECHAZADA`, `EN_PROCESO`, `FINALIZADA`), usar mensajería interna y registrar encuestas piloto. |
| **`ADMIN`** | Crear oficios en el catálogo maestro, aprobar o rechazar la verificación de proveedores y consultar el resumen estadístico del piloto. |

---

## 3. Formato Estándar de Respuestas (`Jsend`)

Todas las respuestas de la API siguen el formato `Jsend<T>` (`@JsonInclude(NON_NULL)`, por lo que los campos `null` se omiten del JSON):

### Respuesta Exitosa (`200 OK` / `201 Created`)
```json
{
  "status": "success",
  "message": "Mensaje descriptivo opcional",
  "data": { }
}
```

### Error de Validación o Negocio (`400 Bad Request` / `404 Not Found`)
```json
{
  "status": "fail",
  "message": "Descripción del error",
  "data": { }
}
```

### Error de Autenticación, Autorización o Servidor (`401` / `403` / `500`)
```json
{
  "status": "error",
  "message": "Descripción del error",
  "code": 401
}
```

### Errores Transversales Comunes a Todos los Endpoints

| Código HTTP | `status` JSend | Causa |
| :---: | :---: | :--- |
| **`400`** | `fail` | Errores de `@Valid` en el body (`data` incluye `{ "campo": "mensaje" }`), JSON malformado, parámetro obligatorio faltante o tipo inválido en ruta/query (`GlobalExceptionHandler`), o violación de regla de negocio (`ReglaNegocioException`). |
| **`401`** | `error` | Token JWT ausente, expirado, malformado o usuario inactivo/suspendido (`RestAuthenticationEntryPoint` / `NoAutorizadoException`). |
| **`403`** | `error` | Usuario autenticado pero sin el rol requerido para el endpoint (`RestAccessDeniedHandler`). |
| **`404`** | `fail` | Entidad solicitada no encontrada (`RecursoNoEncontradoException`). |
| **`500`** | `error` | Error interno inesperado del servidor (`GlobalExceptionHandler`). |

---

## 4. Índice de Módulos (8 Módulos — 17 Endpoints)

| # | Módulo | Documento | Endpoints |
| :---: | :--- | :--- | :--- |
| 1 | **Autenticación** | [01-autenticacion.md](./01-autenticacion.md) | `POST /auth/register`, `POST /auth/login` |
| 2 | **Catálogo de Oficios** | [02-oficios.md](./02-oficios.md) | `GET /oficios`, `POST /oficios` |
| 3 | **Directorio y Perfiles de Proveedores** | [03-proveedores.md](./03-proveedores.md) | `GET /proveedores`, `GET /proveedores/{id}`, `PUT /proveedores/mi-perfil`, `PATCH /proveedores/mi-disponibilidad` |
| 4 | **Solicitudes de Servicio y Agenda** | [04-solicitudes.md](./04-solicitudes.md) | `POST /solicitudes`, `GET /solicitudes/mis-solicitudes`, `PATCH /solicitudes/{id}/estado` |
| 5 | **Mensajería Interna** | [05-mensajeria.md](./05-mensajeria.md) | `GET /solicitudes/{id}/mensajes`, `POST /solicitudes/{id}/mensajes` |
| 6 | **Calificaciones y Reseñas** | [06-resenas.md](./06-resenas.md) | `POST /resenas/solicitud/{id}` |
| 7 | **Administración** | [07-administracion.md](./07-administracion.md) | `PATCH /admin/proveedores/{id}/verificacion`, `GET /admin/piloto/resumen` |
| 8 | **Métricas del Piloto** | [08-piloto.md](./08-piloto.md) | `POST /piloto/metricas` |
