# Módulo 1 — Autenticación (`src/app/auth/`)

Implementa el acceso y registro de usuarios en la plataforma mediante **Signal Forms** (`@angular/forms/signals`) y el servicio [AuthApi](../../../src/app/core/auth/auth-api.ts), en correspondencia con `docs/backend_docs/modulos/01-autenticacion.md`.

---

## 1. Endpoints y Modelos Asociados

- **Servicio**: `AuthApi` (`src/app/core/auth/auth-api.ts`)
  - `iniciarSesion(LoginRequest)` → `POST /api/v1/auth/login`
  - `registrar(RegistroUsuarioRequest)` → `POST /api/v1/auth/register`
- **Modelos de dominio** (`src/app/dominio/auth.ts`, `src/app/dominio/rol.ts`): `LoginRequest`, `RegistroUsuarioRequest`, `AuthResponse`, `UsuarioSesion`, `RolUsuario`, `RolRegistro`.

---

## 2. Componentes del Módulo

### `Login` (`app-login`)

- **Archivos**: `src/app/auth/login/login.{ts,html,css}`
- **Ruta**: `/login` (protegida por `invitadoGuard`)
- **Funcionamiento**:
  1. Define un formulario reactivo con señales (`correo`, `password`) validando obligatoriedad y formato de correo electrónico.
  2. Al enviar (`submit`), recorta espacios en `correo` y llama a `authApi.iniciarSesion(...)` deshabilitando el botón mientras `cargando()` es `true`.
  3. Ante éxito, `AuthApi` persiste la sesión JWT y el componente redirige según rol:
     - `ADMIN` → `/admin/verificaciones`
     - `CLIENTE` o `PROVEEDOR` → `/directorio`
  4. Ante fallo HTTP (`400`/`401`), muestra el `ErrorHttp` en `<app-alerta-mensaje />`.
  5. Incluye enlace directo hacia `/registro`.

### `Registro` (`app-registro`)

- **Archivos**: `src/app/auth/registro/registro.{ts,html,css}`
- **Ruta**: `/registro` (protegida por `invitadoGuard`)
- **Funcionamiento**:
  1. Selector de rol (`CLIENTE` o `PROVEEDOR`) mediante `seleccionarRol(rol)` que ajusta el modelo y limpia `documentoIdentidad` al cambiar a `CLIENTE`.
  2. Campos validados con Signal Forms:
     - `nombres`, `apellidos`, `telefono`: obligatorios.
     - `correo`: obligatorio y formato email válido.
     - `password`: obligatorio, mínimo 6 caracteres (`minLength`).
     - `documentoIdentidad`: visible y **condicionalmente obligatorio** cuando `rol === 'PROVEEDOR'` (`when` en esquema).
     - `aceptoPoliticaDatos`: validación personalizada que exige aceptación explícita de la **Ley N.° 29733 (Protección de Datos Personales)**.
  3. Al registrar con `authApi.registrar(...)`, redirige a `/proveedor/perfil` si es `PROVEEDOR` (para completar su perfil y tarifas) o a `/directorio` si es `CLIENTE`.
  4. Errores del servidor (`correo` duplicado, campos inválidos) se muestran mediante `<app-alerta-mensaje />`.
