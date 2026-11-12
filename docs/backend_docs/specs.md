# Especificaciones Técnicas del Proyecto: Fast Work (`specs.md`)

## 1. Resumen Ejecutivo y Reglas de Negocio

**Fast Work** es una plataforma web orientada exclusivamente a **navegadores de escritorio (*desktop*)** que funciona como un directorio digital interactivo (tipo agenda) para conectar a trabajadores independientes de oficios eventuales con clientes en **toda la ciudad de Trujillo, Perú**.

### Reglas de Negocio Inmutables

1. **Cobertura única en todo Trujillo:** No existen filtros, tablas ni validaciones por zonas, urbanizaciones o distritos. Todo proveedor registrado ofrece cobertura en toda la ciudad de Trujillo.
2. **Múltiples oficios por proveedor:** Un proveedor puede registrar uno o varios oficios en su perfil (ej. Gasfitería, Plomería, Electricidad, Carpintería, Jardinería, Soldadura) y definir un rango de precios (`precio_minimo` y `precio_maximo`) independiente por cada oficio.
3. **Rol de intermediario:** La plataforma facilita el descubrimiento, la solicitud de servicio, la agenda básica y la mensajería interna. **No** procesa pagos en línea ni actúa como empleador o aseguradora.
4. **Enfoque exclusivo Desktop Web:** No se desarrollan aplicaciones móviles nativas (Android/iOS) ni vistas móviles.
5. **Protección de Datos Personales:** Cumplimiento obligatorio de la **Ley N.° 29733** y el **D.S. N.° 016-2024-JUS** (Perú), exigiendo consentimiento explícito y registro de fecha/hora al crear una cuenta.

## 2. Stack Tecnológico y Entorno

| Capa / Herramienta | Tecnología | Versión Especificada | Notas Técnicas |
| :--- | :--- | :--- | :--- |
| **Lenguaje Backend** | Java (JDK) | `17` | Uso de `records` para DTOs y sintaxis moderna de Java 17. |
| **Framework Backend** | Spring Boot | `3.3.5` | Namespace `jakarta.*` (Jakarta EE 10). |
| **Seguridad / Tokens** | JJWT (`io.jsonwebtoken`) | `0.12.6` | `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (API moderna no deprecada). |
| **Base de Datos** | Microsoft SQL Server | T-SQL | Driver `com.microsoft.sqlserver:mssql-jdbc`. |
| **Runtime Frontend** | Node.js | `24.19.0` | Entorno de compilación y gestión de paquetes (`npm`). |
| **Framework Frontend** | Angular CLI | `21.2.6` | Arquitectura SPA (*Single Page Application*) para escritorio. |

## 3. Arquitectura y Seguridad (Spring Boot 3.3.5 + JJWT 0.12.6)

### 3.1. Estilo Arquitectónico

* **Backend:** API RESTful *stateless* estructurada por capas (`Controller` -> `Service` -> `Repository` -> `Entity`), con manejo centralizado de excepciones (`@RestControllerAdvice`) y validación de entrada (`jakarta.validation`).
* **Frontend:** SPA en Angular 21.2.6 con componentes *standalone*, gestión reactiva mediante *Signals*, interceptores HTTP funcionales para adjuntar el token JWT y *Guards* de rutas por rol.

### 3.2. Especificación de Autenticación JWT (`jjwt 0.12.6`)

> **Nota crítica para generación de código:** En `jjwt 0.12.6`, los métodos antiguos como `setSubject()`, `signWith(SignatureAlgorithm, String)` y `parserBuilder()` fueron eliminados. Se debe utilizar estrictamente la API fluida actual:

* **Firma de Token:**

```java
SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
String jwt = Jwts.builder()
    .subject(usuario.getCorreo())
    .claim("idUsuario", usuario.getIdUsuario())
    .claim("rol", usuario.getRol())
    .issuedAt(new Date())
    .expiration(new Date(System.currentTimeMillis() + expirationMs))
    .signWith(key)
    .compact();
```

* **Validación y Parseo de Token:**

```java
Claims claims = Jwts.parser()
    .verifyWith(key)
    .build()
    .parseSignedClaims(token)
    .getPayload();
```

### 3.3. Roles y Control de Acceso

* `CLIENTE`: Busca proveedores, visualiza perfiles/reseñas, crea solicitudes de servicio, usa mensajería interna y califica trabajos finalizados.
* `PROVEEDOR`: Gestiona su perfil comercial, asigna múltiples oficios con rangos de precios, actualiza su disponibilidad (`DISPONIBLE`, `OCUPADO`, `NO_DISPONIBLE`), responde solicitudes y chatea con clientes.
* `ADMIN`: Valida/verifica perfiles básicos de proveedores (`PENDIENTE` -> `VERIFICADO` / `RECHAZADO`), gestiona el catálogo maestro de oficios y consulta métricas del piloto.

## 4. Diseño de Base de Datos (SQL Server)

Base de datos: `fast_work_db`. Se emplean tipos nativos de SQL Server (`IDENTITY(1,1)`, `NVARCHAR`, `BIT`, `DATETIME2`) y restricciones `CHECK` en lugar de `ENUM`.

### 4.1. Resumen de Tablas

1. **`usuarios`**: `id_usuario` (PK), `nombres`, `apellidos`, `correo` (UNIQUE), `password_hash`, `telefono`, `rol` (`CLIENTE`, `PROVEEDOR`, `ADMIN`), `acepto_politica_datos` (BIT), `fecha_consentimiento` (DATETIME2), `estado_cuenta`, `fecha_registro`.
2. **`perfiles_proveedores`**: `id_perfil_proveedor` (PK), `id_usuario` (FK UNIQUE -> `usuarios`), `descripcion_perfil`, `estado_disponibilidad` (`DISPONIBLE`, `OCUPADO`, `NO_DISPONIBLE`), `documento_identidad`, `estado_verificacion` (`PENDIENTE`, `VERIFICADO`, `RECHAZADO`), `calificacion_promedio` (DECIMAL(3,2)), `total_resenas` (INT), `fecha_actualizacion`.
3. **`oficios`**: `id_oficio` (PK), `nombre_oficio` (UNIQUE), `descripcion`, `activo` (BIT).
4. **`proveedor_oficios`** *(Relación N:M con tarifa por especialidad)*: `id_proveedor_oficio` (PK), `id_perfil_proveedor` (FK), `id_oficio` (FK), `precio_minimo` (DECIMAL(10,2)), `precio_maximo` (DECIMAL(10,2)), `detalle_tarifa`. Restricción `UNIQUE(id_perfil_proveedor, id_oficio)` y `CHECK(precio_maximo >= precio_minimo)`.
5. **`solicitudes_servicio`**: `id_solicitud` (PK), `id_cliente` (FK), `id_perfil_proveedor` (FK), `id_oficio` (FK), `direccion_trujillo`, `fecha_programada` (DATE), `hora_programada` (TIME), `descripcion_trabajo`, `presupuesto_referencial` (DECIMAL(10,2)), `estado` (`PENDIENTE`, `ACEPTADA`, `RECHAZADA`, `EN_PROCESO`, `FINALIZADA`, `CANCELADA`), `fecha_creacion`.
6. **`mensajes`**: `id_mensaje` (PK), `id_solicitud` (FK), `id_emisor` (FK), `contenido`, `leido` (BIT), `fecha_envio`.
7. **`calificaciones_resenas`**: `id_resena` (PK), `id_solicitud` (FK UNIQUE), `id_cliente` (FK), `id_perfil_proveedor` (FK), `puntuacion` (TINYINT 1..5), `comentario`, `fecha_resena`.
8. **`metricas_piloto`**: `id_metrica` (PK), `id_usuario` (FK), `puntaje_usabilidad` (TINYINT 1..5), `puntaje_satisfaccion` (TINYINT 1..5), `observaciones`, `fecha_registro`.

### 4.2. Script DDL y Carga Inicial (T-SQL / SQL Server)

```sql
-- Creación de la base de datos en SQL Server
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'fast_work_db')
BEGIN
    CREATE DATABASE fast_work_db;
END;
GO

USE fast_work_db;
GO

-- 1. Tabla base de usuarios (Clientes, Proveedores y Administradores)
CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombres NVARCHAR(100) NOT NULL,
    apellidos NVARCHAR(100) NOT NULL,
    correo NVARCHAR(150) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    telefono NVARCHAR(20) NOT NULL,
    rol NVARCHAR(20) NOT NULL DEFAULT 'CLIENTE',
    acepto_politica_datos BIT NOT NULL DEFAULT 0,
    fecha_consentimiento DATETIME2 NULL,
    estado_cuenta NVARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_registro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('CLIENTE', 'PROVEEDOR', 'ADMIN')),
    CONSTRAINT chk_usuarios_estado CHECK (estado_cuenta IN ('ACTIVO', 'SUSPENDIDO', 'INACTIVO'))
);
GO

-- 2. Perfil extendido de proveedores (Cobertura en todo Trujillo)
CREATE TABLE perfiles_proveedores (
    id_perfil_proveedor INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    descripcion_perfil NVARCHAR(MAX) NULL,
    estado_disponibilidad NVARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    documento_identidad NVARCHAR(20) NOT NULL,
    estado_verificacion NVARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    calificacion_promedio DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    total_resenas INT NOT NULL DEFAULT 0,
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_proveedor_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_proveedor_disponibilidad CHECK (estado_disponibilidad IN ('DISPONIBLE', 'OCUPADO', 'NO_DISPONIBLE')),
    CONSTRAINT chk_proveedor_verificacion CHECK (estado_verificacion IN ('PENDIENTE', 'VERIFICADO', 'RECHAZADO'))
);
GO

-- Trigger para actualizar automáticamente fecha_actualizacion en perfiles_proveedores
CREATE TRIGGER trg_perfiles_proveedores_update
ON perfiles_proveedores
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(fecha_actualizacion)
    BEGIN
        UPDATE p
        SET fecha_actualizacion = SYSDATETIME()
        FROM perfiles_proveedores p
        INNER JOIN inserted i ON p.id_perfil_proveedor = i.id_perfil_proveedor;
    END
END;
GO

-- 3. Catálogo de oficios disponibles
CREATE TABLE oficios (
    id_oficio INT IDENTITY(1,1) PRIMARY KEY,
    nombre_oficio NVARCHAR(80) NOT NULL UNIQUE,
    descripcion NVARCHAR(255) NULL,
    activo BIT NOT NULL DEFAULT 1
);
GO

-- 4. Relación N:M entre proveedores y múltiples oficios con rango de precios
CREATE TABLE proveedor_oficios (
    id_proveedor_oficio INT IDENTITY(1,1) PRIMARY KEY,
    id_perfil_proveedor INT NOT NULL,
    id_oficio INT NOT NULL,
    precio_minimo DECIMAL(10, 2) NOT NULL,
    precio_maximo DECIMAL(10, 2) NOT NULL,
    detalle_tarifa NVARCHAR(150) NULL,
    CONSTRAINT fk_po_proveedor FOREIGN KEY (id_perfil_proveedor) 
        REFERENCES perfiles_proveedores(id_perfil_proveedor) ON DELETE CASCADE,
    CONSTRAINT fk_po_oficio FOREIGN KEY (id_oficio) 
        REFERENCES oficios(id_oficio) ON DELETE NO ACTION,
    CONSTRAINT uq_proveedor_oficio UNIQUE (id_perfil_proveedor, id_oficio),
    CONSTRAINT chk_rango_precios CHECK (precio_maximo >= precio_minimo AND precio_minimo >= 0)
);
GO

-- 5. Solicitudes de servicio y agenda básica de coordinación
CREATE TABLE solicitudes_servicio (
    id_solicitud INT IDENTITY(1,1) PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_perfil_proveedor INT NOT NULL,
    id_oficio INT NOT NULL,
    direccion_trujillo NVARCHAR(255) NOT NULL,
    fecha_programada DATE NOT NULL,
    hora_programada TIME NOT NULL,
    descripcion_trabajo NVARCHAR(MAX) NOT NULL,
    presupuesto_referencial DECIMAL(10, 2) NULL,
    estado NVARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_solicitud_cliente FOREIGN KEY (id_cliente) 
        REFERENCES usuarios(id_usuario) ON DELETE NO ACTION,
    CONSTRAINT fk_solicitud_proveedor FOREIGN KEY (id_perfil_proveedor) 
        REFERENCES perfiles_proveedores(id_perfil_proveedor) ON DELETE NO ACTION,
    CONSTRAINT fk_solicitud_oficio FOREIGN KEY (id_oficio) 
        REFERENCES oficios(id_oficio) ON DELETE NO ACTION,
    CONSTRAINT chk_solicitud_estado CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA'))
);
GO

-- 6. Mensajería interna entre cliente y proveedor
CREATE TABLE mensajes (
    id_mensaje INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_emisor INT NOT NULL,
    contenido NVARCHAR(MAX) NOT NULL,
    leido BIT NOT NULL DEFAULT 0,
    fecha_envio DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_mensaje_solicitud FOREIGN KEY (id_solicitud) 
        REFERENCES solicitudes_servicio(id_solicitud) ON DELETE CASCADE,
    CONSTRAINT fk_mensaje_emisor FOREIGN KEY (id_emisor) 
        REFERENCES usuarios(id_usuario) ON DELETE NO ACTION
);
GO

-- 7. Calificaciones y reseñas post-servicio
CREATE TABLE calificaciones_resenas (
    id_resena INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT NOT NULL UNIQUE,
    id_cliente INT NOT NULL,
    id_perfil_proveedor INT NOT NULL,
    puntuacion TINYINT NOT NULL,
    comentario NVARCHAR(MAX) NULL,
    fecha_resena DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_resena_solicitud FOREIGN KEY (id_solicitud) 
        REFERENCES solicitudes_servicio(id_solicitud) ON DELETE CASCADE,
    CONSTRAINT fk_resena_cliente FOREIGN KEY (id_cliente) 
        REFERENCES usuarios(id_usuario) ON DELETE NO ACTION,
    CONSTRAINT fk_resena_proveedor FOREIGN KEY (id_perfil_proveedor) 
        REFERENCES perfiles_proveedores(id_perfil_proveedor) ON DELETE NO ACTION,
    CONSTRAINT chk_puntuacion CHECK (puntuacion BETWEEN 1 AND 5)
);
GO

-- 8. Métricas de usabilidad y satisfacción para la validación piloto
CREATE TABLE metricas_piloto (
    id_metrica INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    puntaje_usabilidad TINYINT NOT NULL,
    puntaje_satisfaccion TINYINT NOT NULL,
    observaciones NVARCHAR(MAX) NULL,
    fecha_registro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_metrica_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_usabilidad CHECK (puntaje_usabilidad BETWEEN 1 AND 5),
    CONSTRAINT chk_satisfaccion CHECK (puntaje_satisfaccion BETWEEN 1 AND 5)
);
GO

-- Carga inicial de oficios base identificados en el proyecto
INSERT INTO oficios (nombre_oficio, descripcion) VALUES
(N'Gasfitería', N'Instalación y reparación de tuberías de agua, desagüe y sanitarios.'),
(N'Plomería', N'Mantenimiento de redes hidráulicas, grifería y detección de fugas.'),
(N'Electricidad', N'Instalaciones eléctricas domiciliarias, cableado, tableros y luminarias.'),
(N'Carpintería', N'Fabricación, reparación e instalación de muebles y estructuras de madera.'),
(N'Jardinería', N'Mantenimiento de áreas verdes, poda, diseño y limpieza de jardines.'),
(N'Soldadura', N'Estructuras metálicas, portones, rejas y reparaciones en metal.');
GO
```

## 5. Contrato de Endpoints de la API REST (`/api/v1`)

### 5.1. Autenticación (`/api/v1/auth`)

* `POST /register`: Registro de usuario (`CLIENTE` o `PROVEEDOR`). Valida `aceptoPoliticaDatos == true`. Si es proveedor, inicializa su registro en `perfiles_proveedores`.
* `POST /login`: Autentica credenciales con BCrypt y retorna `{ token, tipo: "Bearer", idUsuario, rol, nombres }`.

### 5.2. Catálogo de Oficios (`/api/v1/oficios`)

* `GET /`: Lista todos los oficios activos disponibles en Trujillo (público).
* `POST /`: Crea un nuevo oficio en el catálogo (`ADMIN`).

### 5.3. Directorio y Perfiles de Proveedores (`/api/v1/proveedores`)

* `GET /`: Directorio general tipo agenda en Trujillo. Soporta filtros opcionales por *query params*:
  * `oficios` (lista de IDs, ej. `?oficios=1,3` para filtrar por uno o más oficios).
  * `disponibilidad` (`DISPONIBLE`, `OCUPADO`, `NO_DISPONIBLE`).
  * `calificacionMin` (ej. `4.0`).
* `GET /{idPerfilProveedor}`: Detalle completo del proveedor, sus múltiples oficios con rangos de precios, estado de verificación y lista de reseñas.
* `PUT /mi-perfil`: Actualiza descripción, documento de identidad y lista de oficios con sus respectivos `precioMinimo` y `precioMaximo` (`PROVEEDOR`).
* `PATCH /mi-disponibilidad`: Cambia el `estadoDisponibilidad` del proveedor (`PROVEEDOR`).

### 5.4. Solicitudes de Servicio y Agenda (`/api/v1/solicitudes`)

* `POST /`: Crea una nueva solicitud de servicio indicando proveedor, oficio, dirección en Trujillo, fecha, hora, descripción y presupuesto referencial (`CLIENTE`).
* `GET /mis-solicitudes`: Lista las solicitudes creadas por el cliente autenticado o recibidas por el proveedor autenticado (vista de agenda).
* `PATCH /{idSolicitud}/estado`: Actualiza el flujo de estado (`ACEPTADA`, `RECHAZADA`, `EN_PROCESO`, `FINALIZADA`, `CANCELADA`).

### 5.5. Mensajería Interna (`/api/v1/solicitudes/{idSolicitud}/mensajes`)

* `GET /`: Obtiene el historial de mensajes de la solicitud (validando que el usuario sea el cliente o el proveedor involucrado).
* `POST /`: Envía un nuevo mensaje dentro del hilo de la solicitud.

### 5.6. Calificaciones y Reseñas (`/api/v1/resenas`)

* `POST /solicitud/{idSolicitud}`: Registra puntuación (1-5) y comentario solo cuando la solicitud está en estado `FINALIZADA` (`CLIENTE`). Recalcula `calificacion_promedio` y `total_resenas` del proveedor.

### 5.7. Verificación y Métricas Piloto (`/api/v1/admin` & `/api/v1/piloto`)

* `PATCH /api/v1/admin/proveedores/{idPerfilProveedor}/verificacion`: Aprueba o rechaza la verificación básica del proveedor (`ADMIN`).
* `POST /api/v1/piloto/metricas`: Registra encuesta de usabilidad y satisfacción del piloto (`CLIENTE` / `PROVEEDOR`).
* `GET /api/v1/admin/piloto/resumen`: Obtiene promedios e indicadores del piloto (`ADMIN`).

## 6. Estructura de Directorios Sugerida

### Backend (`fastwork-backend` - Maven / Spring Boot 3.3.5)

```text
src/main/java/com/upn/fastwork/
├── config/          # CorsConfig, OpenApiConfig, PasswordEncoderConfig
├── security/        # JwtService (jjwt 0.12.6), JwtAuthenticationFilter, SecurityConfig
├── controller/      # AuthController, ProveedorController, OficioController, SolicitudController, MensajeController, ResenaController, PilotoController
├── service/         # Interfaces e implementaciones de lógica de negocio
├── repository/      # Interfaces JpaRepository con consultas JPQL / Specifications para filtros dinámicos
├── entity/          # Entidades JPA mapeadas a SQL Server
├── dto/             # Java 17 Records para Request y Response
└── exception/       # GlobalExceptionHandler y excepciones de negocio personalizadas
```

### Frontend (`fastwork-frontend` - Angular CLI 21.2.6 / Node 24.19.0)

```text
src/app/
├── core/
│   ├── guards/      # authGuard, roleGuard
│   ├── interceptors/# jwtInterceptor, errorInterceptor
│   ├── models/      # Interfaces TypeScript alineadas a los DTOs
│   └── services/    # AuthService, ProveedorService, SolicitudService, OficioService
├── shared/
│   └── components/  # NavbarDesktop, RatingStars, BadgeVerificado, ModalConfirmacion
└── features/
    ├── auth/        # Login, Registro (con checkbox obligatorio Ley N.° 29733)
    ├── directorio/  # Listado tipo agenda de Trujillo, panel de filtros multi-oficio y detalle de proveedor
    ├── proveedor/   # Gestión de perfil, selector múltiple de oficios + tarifas, toggle disponibilidad
    ├── solicitudes/ # Formulario de solicitud, agenda de coordinación y chat interno
    └── admin/       # Verificación básica de proveedores y panel de métricas del piloto
```

## 7. Directrices para Asistentes de IA (Prompting Rules)

Al solicitar generación de código usando este `specs.md`:

1. **No agregar filtros por distritos o zonas** de Trujillo en el frontend, backend ni base de datos.
2. **No implementar pasarelas de pago** ni cálculo de comisiones.
3. **Diseñar vistas enfocadas en escritorio (*desktop*)** (layouts amplios tipo tabla/agenda y paneles laterales de filtro), sin lógica para apps móviles nativas.
4. **Respetar estrictamente las versiones:** Java 17, Spring Boot 3.3.5, SQL Server, JJWT 0.12.6 y Angular 21.2.6.