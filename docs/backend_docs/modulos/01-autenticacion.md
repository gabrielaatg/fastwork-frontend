# Módulo 1: Autenticación (`/api/v1/auth`)

**Componentes:** `AuthController`, `AuthService`, `JwtService`, `PasswordEncoderConfig`  
**DTOs:** `RegistroUsuarioRequest`, `LoginRequest`, `AuthResponse`

---

## Descripción Funcional

Gestiona el registro público de cuentas (`CLIENTE` o `PROVEEDOR`) y el inicio de sesión mediante credenciales verificadas con **BCrypt**, emitiendo tokens JWT Bearer.

### Reglas de Negocio
1. **Ley N.° 29733 (Protección de Datos Personales):** El registro exige `aceptoPoliticaDatos = true`, registrando automáticamente `fechaConsentimiento` con la fecha y hora del servidor.
2. **Unicidad de correo:** El correo se normaliza (`trim().toLowerCase()`) y no puede duplicarse en `usuarios`.
3. **Control de roles permitidos:** Solo se permite registrar `CLIENTE` (por defecto si se omite) o `PROVEEDOR`. Intentar registrarse como `ADMIN` u otro valor es rechazado.
4. **Inicialización automática de proveedor:** Si el rol es `PROVEEDOR`, `documentoIdentidad` es obligatorio y se crea automáticamente su registro en `perfiles_proveedores` con `estadoDisponibilidad = "DISPONIBLE"`, `estadoVerificacion = "PENDIENTE"`, `calificacionPromedio = 0.00` y `totalResenas = 0`.

---

## Endpoints

### 1. Registrar Usuario
* **Método y Ruta:** `POST /api/v1/auth/register`
* **Acceso:** Público (no requiere token).

#### Body Esperado (`RegistroUsuarioRequest`)

| Campo | Tipo | Obligatorio | Validaciones y Reglas |
| :--- | :--- | :---: | :--- |
| `nombres` | `String` | Sí | `@NotBlank`, máximo 100 caracteres. |
| `apellidos` | `String` | Sí | `@NotBlank`, máximo 100 caracteres. |
| `correo` | `String` | Sí | `@NotBlank`, `@Email`, máximo 150 caracteres. |
| `password` | `String` | Sí | `@NotBlank`, mínimo 6 caracteres. |
| `telefono` | `String` | Sí | `@NotBlank`, máximo 20 caracteres. |
| `rol` | `String` | No | `"CLIENTE"` (por defecto) o `"PROVEEDOR"`. |
| `aceptoPoliticaDatos` | `Boolean` | Sí | `@NotNull`; debe ser `true` por regla de negocio. |
| `documentoIdentidad` | `String` | Condicional | Obligatorio (no vacío) cuando `rol` es `"PROVEEDOR"`. |

**Ejemplo de Body (Registro Proveedor):**
```json
{
  "nombres": "Carlos",
  "apellidos": "Mendoza",
  "correo": "carlos.mendoza@fastwork.pe",
  "password": "Password123",
  "telefono": "944123456",
  "rol": "PROVEEDOR",
  "aceptoPoliticaDatos": true,
  "documentoIdentidad": "70123456"
}
```

#### Posibles Respuestas

* **`201 Created` (`Jsend<AuthResponse>`):** Usuario creado y token JWT emitido.
```json
{
  "status": "success",
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "tipo": "Bearer",
    "idUsuario": 12,
    "rol": "PROVEEDOR",
    "nombres": "Carlos"
  }
}
```

* **`400 Bad Request` (`Jsend<Map<String, String>>` — Error `@Valid`):**
```json
{
  "status": "fail",
  "message": "Errores de validación en la solicitud",
  "data": {
    "correo": "Formato de correo electrónico inválido",
    "password": "La contraseña debe tener al menos 6 caracteres"
  }
}
```

* **`400 Bad Request` (`Jsend<Void>` — Regla de negocio):**
  * No aceptó política de datos (`aceptoPoliticaDatos` = `false`).
  * Correo ya registrado.
  * Rol distinto de `CLIENTE` / `PROVEEDOR`.
  * Proveedor sin `documentoIdentidad`.
```json
{
  "status": "fail",
  "message": "Debe aceptar la política de protección de datos personales (Ley N.° 29733)"
}
```

---

### 2. Iniciar Sesión
* **Método y Ruta:** `POST /api/v1/auth/login`
* **Acceso:** Público (no requiere token).

#### Body Esperado (`LoginRequest`)

| Campo | Tipo | Obligatorio | Validaciones |
| :--- | :--- | :---: | :--- |
| `correo` | `String` | Sí | `@NotBlank`, `@Email`. |
| `password` | `String` | Sí | `@NotBlank`. |

**Ejemplo de Body:**
```json
{
  "correo": "carlos.mendoza@fastwork.pe",
  "password": "Password123"
}
```

#### Posibles Respuestas

* **`200 OK` (`Jsend<AuthResponse>`):** Autenticación exitosa.
```json
{
  "status": "success",
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "tipo": "Bearer",
    "idUsuario": 12,
    "rol": "PROVEEDOR",
    "nombres": "Carlos"
  }
}
```

* **`400 Bad Request` (`Jsend`):** Errores de `@Valid` o JSON malformado.
* **`401 Unauthorized` (`Jsend<Void>`):** Contraseña incorrecta, usuario inexistente o cuenta `SUSPENDIDO` / `INACTIVO`.
```json
{
  "status": "error",
  "message": "Credenciales inválidas o cuenta inactiva",
  "code": 401
}
```
