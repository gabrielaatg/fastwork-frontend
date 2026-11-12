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