-- =============================================================================
-- Fast Work - Script Unificado de Base de Datos (Esquema + Datos Semilla)
-- =============================================================================
-- Motor      : Microsoft SQL Server (SSMS / T-SQL)
-- Base Datos : fast_work_db
-- Comportamiento:
--   1. Crea la base de datos fast_work_db si no existe.
--   2. Reinicia por completo todas las tablas y datos registrados (IDENTITY desde 1).
--   3. Recrea las 8 tablas, restricciones, llaves foráneas y trigger de auditoría.
--   4. Carga el catálogo base de oficios y todos los datos semilla de prueba.
--
-- Contraseña común para TODOS los usuarios semilla (BCrypt validado):
--   Password plano : FastWork2026!
--   Hash BCrypt    : $2a$10$P0ZWTpWagqa1hDEmw.WWa.zT/aa9PCYRIlD7xuI7CZiePUSpQmoTG
-- =============================================================================

IF DB_ID(N'fast_work_db') IS NULL
BEGIN
    CREATE DATABASE fast_work_db;
END;
GO

USE fast_work_db;
GO

-- =============================================================================
-- 1. REINICIO COMPLETO DE TABLAS Y DATOS REGISTRADOS (ORDEN INVERSO DE FKs)
-- =============================================================================
IF OBJECT_ID(N'dbo.metricas_piloto', N'U') IS NOT NULL
    DROP TABLE dbo.metricas_piloto;
IF OBJECT_ID(N'dbo.calificaciones_resenas', N'U') IS NOT NULL
    DROP TABLE dbo.calificaciones_resenas;
IF OBJECT_ID(N'dbo.mensajes', N'U') IS NOT NULL
    DROP TABLE dbo.mensajes;
IF OBJECT_ID(N'dbo.solicitudes_servicio', N'U') IS NOT NULL
    DROP TABLE dbo.solicitudes_servicio;
IF OBJECT_ID(N'dbo.proveedor_oficios', N'U') IS NOT NULL
    DROP TABLE dbo.proveedor_oficios;
IF OBJECT_ID(N'dbo.perfiles_proveedores', N'U') IS NOT NULL
    DROP TABLE dbo.perfiles_proveedores;
IF OBJECT_ID(N'dbo.oficios', N'U') IS NOT NULL
    DROP TABLE dbo.oficios;
IF OBJECT_ID(N'dbo.usuarios', N'U') IS NOT NULL
    DROP TABLE dbo.usuarios;
GO

-- =============================================================================
-- 2. CREACION DEL ESQUEMA DDL ACTUALIZADO
-- =============================================================================

-- 2.1. Tabla base de usuarios (Clientes, Proveedores y Administradores)
CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombres NVARCHAR(100) NOT NULL,
    apellidos NVARCHAR(100) NOT NULL,
    correo NVARCHAR(150) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    telefono NVARCHAR(20) NOT NULL,
    documento_identidad NVARCHAR(20) NOT NULL,
    rol NVARCHAR(20) NOT NULL DEFAULT 'CLIENTE',
    acepto_politica_datos BIT NOT NULL DEFAULT 0,
    fecha_consentimiento DATETIME2 NULL,
    estado_cuenta NVARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_registro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('CLIENTE', 'PROVEEDOR', 'ADMIN')),
    CONSTRAINT chk_usuarios_estado CHECK (estado_cuenta IN ('ACTIVO', 'SUSPENDIDO', 'INACTIVO'))
);
GO

-- 2.2. Perfil extendido de proveedores (Cobertura en todo Trujillo)
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

-- 2.3. Catálogo de oficios disponibles
CREATE TABLE oficios (
    id_oficio INT IDENTITY(1,1) PRIMARY KEY,
    nombre_oficio NVARCHAR(80) NOT NULL UNIQUE,
    descripcion NVARCHAR(255) NULL,
    activo BIT NOT NULL DEFAULT 1
);
GO

-- 2.4. Relación N:M entre proveedores y múltiples oficios con rango de precios
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

-- 2.5. Solicitudes de servicio y agenda básica de coordinación
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

-- 2.6. Mensajería interna entre cliente y proveedor
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

-- 2.7. Calificaciones y reseñas post-servicio
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

-- 2.8. Métricas de usabilidad y satisfacción para la validación piloto
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

-- =============================================================================
-- 3. CARGA INICIAL DE DATOS SEMILLA (TRANSACCIONAL)
-- =============================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @PasswordHash NVARCHAR(255) = N'$2a$10$P0ZWTpWagqa1hDEmw.WWa.zT/aa9PCYRIlD7xuI7CZiePUSpQmoTG';
    DECLARE @Ahora DATETIME2 = SYSDATETIME();
    DECLARE @Hoy DATE = CAST(@Ahora AS DATE);

    -- 3.1. Catálogo base de oficios
    INSERT INTO oficios (nombre_oficio, descripcion, activo) VALUES
    (N'Gasfitería', N'Instalación y reparación de tuberías de agua, desagüe y sanitarios.', 1),
    (N'Plomería', N'Mantenimiento de redes hidráulicas, grifería y detección de fugas.', 1),
    (N'Electricidad', N'Instalaciones eléctricas domiciliarias, cableado, tableros y luminarias.', 1),
    (N'Carpintería', N'Fabricación, reparación e instalación de muebles y estructuras de madera.', 1),
    (N'Jardinería', N'Mantenimiento de áreas verdes, poda, diseño y limpieza de jardines.', 1),
    (N'Soldadura', N'Estructuras metálicas, portones, rejas y reparaciones en metal.', 1);

    DECLARE @IdGasfiteria INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Gasfitería');
    DECLARE @IdPlomeria INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Plomería');
    DECLARE @IdElectricidad INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Electricidad');
    DECLARE @IdCarpinteria INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Carpintería');
    DECLARE @IdJardineria INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Jardinería');
    DECLARE @IdSoldadura INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Soldadura');

    -- 3.2. Usuarios de prueba (1 ADMIN, 2 CLIENTES, 4 PROVEEDORES)
    INSERT INTO usuarios (nombres, apellidos, correo, password_hash, telefono, documento_identidad, rol, acepto_politica_datos, fecha_consentimiento, estado_cuenta) VALUES
    (N'Sofía', N'Paredes Saldaña', N'admin@fastwork.pe', @PasswordHash, N'944000100', N'70000001', N'ADMIN', 1, @Ahora, N'ACTIVO'),
    (N'Lucía', N'Mendoza Ríos', N'cliente1@fastwork.pe', @PasswordHash, N'944111222', N'70000002', N'CLIENTE', 1, @Ahora, N'ACTIVO'),
    (N'Carlos', N'Huamán Vera', N'cliente2@fastwork.pe', @PasswordHash, N'944333444', N'70000003', N'CLIENTE', 1, @Ahora, N'ACTIVO'),
    (N'Mario', N'Vargas León', N'proveedor1@fastwork.pe', @PasswordHash, N'944555666', N'70112233', N'PROVEEDOR', 1, @Ahora, N'ACTIVO'),
    (N'Jorge', N'Quispe Flores', N'proveedor2@fastwork.pe', @PasswordHash, N'944777888', N'70223344', N'PROVEEDOR', 1, @Ahora, N'ACTIVO'),
    (N'Elena', N'Rojas Morales', N'proveedor3@fastwork.pe', @PasswordHash, N'944888999', N'70334455', N'PROVEEDOR', 1, @Ahora, N'ACTIVO'),
    (N'Pedro', N'Castillo Ruiz', N'proveedor4@fastwork.pe', @PasswordHash, N'944999000', N'70445566', N'PROVEEDOR', 1, @Ahora, N'ACTIVO');

    DECLARE @IdCliente1 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'cliente1@fastwork.pe');
    DECLARE @IdCliente2 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'cliente2@fastwork.pe');
    DECLARE @IdUsuProv1 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'proveedor1@fastwork.pe');
    DECLARE @IdUsuProv2 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'proveedor2@fastwork.pe');
    DECLARE @IdUsuProv3 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'proveedor3@fastwork.pe');
    DECLARE @IdUsuProv4 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'proveedor4@fastwork.pe');

    -- 3.3. Perfiles de proveedores
    INSERT INTO perfiles_proveedores (id_usuario, descripcion_perfil, estado_disponibilidad, documento_identidad, estado_verificacion, calificacion_promedio, total_resenas) VALUES
    (@IdUsuProv1, N'Técnico gasfitero y plomero con 10 años de experiencia atendiendo emergencias y mantenimiento en todo Trujillo.', N'DISPONIBLE', N'70112233', N'VERIFICADO', 0.00, 0),
    (@IdUsuProv2, N'Especialista en instalaciones eléctricas domiciliarias, tableros térmicos y trabajos de soldadura en metal.', N'DISPONIBLE', N'70223344', N'VERIFICADO', 0.00, 0),
    (@IdUsuProv3, N'Diseño, poda y mantenimiento integral de jardines residenciales y áreas verdes en Trujillo.', N'OCUPADO', N'70334455', N'VERIFICADO', 0.00, 0),
    (@IdUsuProv4, N'Maestro carpintero: fabricación y reparación de reposteros, closets, puertas y muebles a medida.', N'NO_DISPONIBLE', N'70445566', N'PENDIENTE', 0.00, 0);

    DECLARE @IdPerfilProv1 INT = (SELECT id_perfil_proveedor FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv1);
    DECLARE @IdPerfilProv2 INT = (SELECT id_perfil_proveedor FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv2);
    DECLARE @IdPerfilProv3 INT = (SELECT id_perfil_proveedor FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv3);
    DECLARE @IdPerfilProv4 INT = (SELECT id_perfil_proveedor FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv4);

    -- 3.4. Oficios y tarifas por proveedor (N:M)
    INSERT INTO proveedor_oficios (id_perfil_proveedor, id_oficio, precio_minimo, precio_maximo, detalle_tarifa) VALUES
    (@IdPerfilProv1, @IdGasfiteria, 50.00, 150.00, N'Incluye diagnóstico en Trujillo; repuestos aparte.'),
    (@IdPerfilProv1, @IdPlomeria, 60.00, 180.00, N'Detección de fugas y cambio de grifería.'),
    (@IdPerfilProv2, @IdElectricidad, 70.00, 220.00, N'Revisión de cortos, llaves térmicas y luminarias.'),
    (@IdPerfilProv2, @IdSoldadura, 100.00, 350.00, N'Reparación de rejas, portones y estructuras metálicas.'),
    (@IdPerfilProv3, @IdJardineria, 45.00, 120.00, N'Corte de césped, poda y limpieza general.'),
    (@IdPerfilProv4, @IdCarpinteria, 80.00, 260.00, N'Ajuste de puertas, bisagras y muebles de madera.');

    -- 3.5. Solicitudes de servicio
    DECLARE @IdSolFinalizada1 INT;
    DECLARE @IdSolFinalizada2 INT;
    DECLARE @IdSolFinalizada3 INT;
    DECLARE @IdSolAceptada INT;
    DECLARE @IdSolEnProceso INT;

    -- Solicitud FINALIZADA #1 (con reseña de 5 estrellas para proveedor1)
    INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
    VALUES (@IdCliente1, @IdPerfilProv1, @IdGasfiteria, N'Av. España 1240, Centro Histórico, Trujillo', DATEADD(DAY, -10, @Hoy), '09:30:00', N'Cambio de llave de paso y reparación de fuga debajo del lavadero.', 90.00, N'FINALIZADA');
    SET @IdSolFinalizada1 = SCOPE_IDENTITY();

    -- Solicitud FINALIZADA #2 (con reseña de 4 estrellas para proveedor1)
    INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
    VALUES (@IdCliente2, @IdPerfilProv1, @IdPlomeria, N'Urb. California Mz. B Lt. 12, Trujillo', DATEADD(DAY, -6, @Hoy), '14:00:00', N'Limpieza de trampa de grasa y revisión de presión de agua.', 110.00, N'FINALIZADA');
    SET @IdSolFinalizada2 = SCOPE_IDENTITY();

    -- Solicitud FINALIZADA #3 (con reseña de 5 estrellas para proveedor2)
    INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
    VALUES (@IdCliente1, @IdPerfilProv2, @IdElectricidad, N'Av. Larco 850, Urb. La Merced, Trujillo', DATEADD(DAY, -4, @Hoy), '11:00:00', N'Instalación de 2 llaves termomagnéticas y 4 tomacorrientes dobles.', 150.00, N'FINALIZADA');
    SET @IdSolFinalizada3 = SCOPE_IDENTITY();

    -- Solicitud FINALIZADA #4 sin reseña (para probar POST /api/v1/resenas/solicitud/{id})
    INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
    VALUES (@IdCliente1, @IdPerfilProv1, @IdPlomeria, N'Av. España 1240, Centro Histórico, Trujillo', DATEADD(DAY, -1, @Hoy), '16:00:00', N'Cambio de mezcladora de ducha en segundo piso.', 85.00, N'FINALIZADA');

    -- Solicitud PENDIENTE (para probar ACEPTADA / RECHAZADA / CANCELADA)
    INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
    VALUES (@IdCliente2, @IdPerfilProv1, @IdGasfiteria, N'Urb. San Andrés II Etapa Mz. K Lt. 5, Trujillo', DATEADD(DAY, 2, @Hoy), '10:00:00', N'Desatoro de tubería de desagüe principal en patio.', 120.00, N'PENDIENTE');

    -- Solicitud ACEPTADA (para probar paso a EN_PROCESO)
    INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
    VALUES (@IdCliente1, @IdPerfilProv2, @IdSoldadura, N'Jr. Pizarro 415, Centro Histórico, Trujillo', DATEADD(DAY, 3, @Hoy), '15:30:00', N'Refuerzo de bisagras en portón metálico de cochera.', 180.00, N'ACEPTADA');
    SET @IdSolAceptada = SCOPE_IDENTITY();

    -- Solicitud EN_PROCESO (para probar chat activo y paso a FINALIZADA)
    INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
    VALUES (@IdCliente2, @IdPerfilProv2, @IdElectricidad, N'Av. América Sur 1920, Trujillo', @Hoy, '17:00:00', N'Revisión de tablero eléctrico por caída frecuente de diferencial.', 130.00, N'EN_PROCESO');
    SET @IdSolEnProceso = SCOPE_IDENTITY();

    -- Solicitud CANCELADA
    INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
    VALUES (@IdCliente1, @IdPerfilProv3, @IdJardineria, N'Urb. El Golf Mz. C Lt. 8, Trujillo', DATEADD(DAY, 5, @Hoy), '08:30:00', N'Poda de cerco vivo y mantenimiento de jardín exterior.', 95.00, N'CANCELADA');

    -- 3.6. Mensajes de chat interno
    INSERT INTO mensajes (id_solicitud, id_emisor, contenido, leido) VALUES
    (@IdSolFinalizada1, @IdCliente1, N'Hola Mario, ¿puedes traer cinta teflón y una llave de paso de 1/2 pulgada?', 1),
    (@IdSolFinalizada1, @IdUsuProv1, N'Sí claro Lucía, llevo todo el material y llego puntual a las 9:30 am.', 1),
    (@IdSolAceptada, @IdCliente1, N'Buenos días Jorge, el portón está en la entrada lateral por Jr. Pizarro.', 1),
    (@IdSolAceptada, @IdUsuProv2, N'Recibido Lucía, ya agendé la visita y llevaré equipo portátil de soldadura.', 0),
    (@IdSolEnProceso, @IdCliente2, N'Ya estamos en casa para recibirte en el primer piso.', 1),
    (@IdSolEnProceso, @IdUsuProv2, N'Estoy en camino, llego en 15 minutos con el multímetro.', 1);

    -- 3.7. Calificaciones y reseñas post-servicio
    INSERT INTO calificaciones_resenas (id_solicitud, id_cliente, id_perfil_proveedor, puntuacion, comentario) VALUES
    (@IdSolFinalizada1, @IdCliente1, @IdPerfilProv1, 5, N'Excelente trabajo, muy puntual y dejó todo limpio.'),
    (@IdSolFinalizada2, @IdCliente2, @IdPerfilProv1, 4, N'Buen servicio, solucionó el problema de presión rápidamente.'),
    (@IdSolFinalizada3, @IdCliente1, @IdPerfilProv2, 5, N'Muy profesional con el tablero eléctrico, explicó cada detalle.');

    -- Recalcular promedio y total de reseñas en los perfiles de proveedor
    UPDATE p
    SET
        calificacion_promedio = ISNULL(r.promedio, 0.00),
        total_resenas = ISNULL(r.total, 0)
    FROM perfiles_proveedores p
    LEFT JOIN (
        SELECT
            id_perfil_proveedor,
            CAST(AVG(CAST(puntuacion AS DECIMAL(10, 2))) AS DECIMAL(3, 2)) AS promedio,
            COUNT(*) AS total
        FROM calificaciones_resenas
        GROUP BY id_perfil_proveedor
    ) r ON p.id_perfil_proveedor = r.id_perfil_proveedor;

    -- 3.8. Métricas de validación piloto
    INSERT INTO metricas_piloto (id_usuario, puntaje_usabilidad, puntaje_satisfaccion, observaciones) VALUES
    (@IdCliente1, 5, 5, N'Muy fácil encontrar gasfiteros en Trujillo y coordinar por el chat interno.'),
    (@IdCliente2, 4, 5, N'La agenda muestra claramente el estado de cada solicitud.'),
    (@IdUsuProv1, 5, 4, N'Me ayuda a organizar mis trabajos y mostrar mis tarifas por oficio.');

    COMMIT TRANSACTION;
    PRINT N'Base de datos Fast Work reiniciada y poblada correctamente.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

-- =============================================================================
-- 4. CONSULTAS DE VERIFICACION RAPIDA EN SSMS
-- =============================================================================
SELECT rol, COUNT(*) AS total FROM usuarios GROUP BY rol;

SELECT
    p.id_perfil_proveedor,
    u.nombres + N' ' + u.apellidos AS proveedor,
    u.documento_identidad,
    p.estado_disponibilidad,
    p.estado_verificacion,
    p.calificacion_promedio,
    p.total_resenas
FROM perfiles_proveedores p
INNER JOIN usuarios u ON u.id_usuario = p.id_usuario;

SELECT estado, COUNT(*) AS total FROM solicitudes_servicio GROUP BY estado;
GO
