-- =============================================================================
-- Fast Work API - Script Seed de Datos de Prueba para SQL Server (SSMS)
-- =============================================================================
-- Requisitos previos:
--   1. Haber ejecutado previamente docs/ScriptFastWork.sql
--
-- Caracteristicas:
--   - Idempotente: verifica existencia por correo/nombre antes de insertar.
--   - No depende de IDs fijos (resuelve IDENTITY dinamicamente con variables).
--   - Contrasena comun para TODOS los usuarios de prueba (BCrypt validado):
--       Password plano : FastWork2026!
--       Hash BCrypt    : $2a$10$P0ZWTpWagqa1hDEmw.WWa.zT/aa9PCYRIlD7xuI7CZiePUSpQmoTG
-- =============================================================================

USE fast_work_db;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @PasswordHash NVARCHAR(255) = N'$2a$10$P0ZWTpWagqa1hDEmw.WWa.zT/aa9PCYRIlD7xuI7CZiePUSpQmoTG';
    DECLARE @Ahora DATETIME2 = SYSDATETIME();

    -- =========================================================================
    -- 1. CATALOGO BASE DE OFICIOS (por si falta alguno de ScriptFastWork.sql)
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM oficios WHERE nombre_oficio = N'Gasfitería')
        INSERT INTO oficios (nombre_oficio, descripcion, activo)
        VALUES (N'Gasfitería', N'Instalación y reparación de tuberías de agua, desagüe y sanitarios.', 1);

    IF NOT EXISTS (SELECT 1 FROM oficios WHERE nombre_oficio = N'Plomería')
        INSERT INTO oficios (nombre_oficio, descripcion, activo)
        VALUES (N'Plomería', N'Mantenimiento de redes hidráulicas, grifería y detección de fugas.', 1);

    IF NOT EXISTS (SELECT 1 FROM oficios WHERE nombre_oficio = N'Electricidad')
        INSERT INTO oficios (nombre_oficio, descripcion, activo)
        VALUES (N'Electricidad', N'Instalaciones eléctricas domiciliarias, cableado, tableros y luminarias.', 1);

    IF NOT EXISTS (SELECT 1 FROM oficios WHERE nombre_oficio = N'Carpintería')
        INSERT INTO oficios (nombre_oficio, descripcion, activo)
        VALUES (N'Carpintería', N'Fabricación, reparación e instalación de muebles y estructuras de madera.', 1);

    IF NOT EXISTS (SELECT 1 FROM oficios WHERE nombre_oficio = N'Jardinería')
        INSERT INTO oficios (nombre_oficio, descripcion, activo)
        VALUES (N'Jardinería', N'Mantenimiento de áreas verdes, poda, diseño y limpieza de jardines.', 1);

    IF NOT EXISTS (SELECT 1 FROM oficios WHERE nombre_oficio = N'Soldadura')
        INSERT INTO oficios (nombre_oficio, descripcion, activo)
        VALUES (N'Soldadura', N'Estructuras metálicas, portones, rejas y reparaciones en metal.', 1);

    DECLARE @IdGasfiteria INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Gasfitería');
    DECLARE @IdPlomeria INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Plomería');
    DECLARE @IdElectricidad INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Electricidad');
    DECLARE @IdCarpinteria INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Carpintería');
    DECLARE @IdJardineria INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Jardinería');
    DECLARE @IdSoldadura INT = (SELECT id_oficio FROM oficios WHERE nombre_oficio = N'Soldadura');

    -- =========================================================================
    -- 2. USUARIOS DE PRUEBA (1 ADMIN, 2 CLIENTES, 4 PROVEEDORES)
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = N'admin@fastwork.pe')
        INSERT INTO usuarios (nombres, apellidos, correo, password_hash, telefono, rol, acepto_politica_datos, fecha_consentimiento, estado_cuenta)
        VALUES (N'Sofía', N'Paredes Saldaña', N'admin@fastwork.pe', @PasswordHash, N'944000100', N'ADMIN', 1, @Ahora, N'ACTIVO');

    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = N'cliente1@fastwork.pe')
        INSERT INTO usuarios (nombres, apellidos, correo, password_hash, telefono, rol, acepto_politica_datos, fecha_consentimiento, estado_cuenta)
        VALUES (N'Lucía', N'Mendoza Ríos', N'cliente1@fastwork.pe', @PasswordHash, N'944111222', N'CLIENTE', 1, @Ahora, N'ACTIVO');

    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = N'cliente2@fastwork.pe')
        INSERT INTO usuarios (nombres, apellidos, correo, password_hash, telefono, rol, acepto_politica_datos, fecha_consentimiento, estado_cuenta)
        VALUES (N'Carlos', N'Huamán Vera', N'cliente2@fastwork.pe', @PasswordHash, N'944333444', N'CLIENTE', 1, @Ahora, N'ACTIVO');

    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = N'proveedor1@fastwork.pe')
        INSERT INTO usuarios (nombres, apellidos, correo, password_hash, telefono, rol, acepto_politica_datos, fecha_consentimiento, estado_cuenta)
        VALUES (N'Mario', N'Vargas León', N'proveedor1@fastwork.pe', @PasswordHash, N'944555666', N'PROVEEDOR', 1, @Ahora, N'ACTIVO');

    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = N'proveedor2@fastwork.pe')
        INSERT INTO usuarios (nombres, apellidos, correo, password_hash, telefono, rol, acepto_politica_datos, fecha_consentimiento, estado_cuenta)
        VALUES (N'Jorge', N'Quispe Flores', N'proveedor2@fastwork.pe', @PasswordHash, N'944777888', N'PROVEEDOR', 1, @Ahora, N'ACTIVO');

    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = N'proveedor3@fastwork.pe')
        INSERT INTO usuarios (nombres, apellidos, correo, password_hash, telefono, rol, acepto_politica_datos, fecha_consentimiento, estado_cuenta)
        VALUES (N'Elena', N'Rojas Morales', N'proveedor3@fastwork.pe', @PasswordHash, N'944888999', N'PROVEEDOR', 1, @Ahora, N'ACTIVO');

    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = N'proveedor4@fastwork.pe')
        INSERT INTO usuarios (nombres, apellidos, correo, password_hash, telefono, rol, acepto_politica_datos, fecha_consentimiento, estado_cuenta)
        VALUES (N'Pedro', N'Castillo Ruiz', N'proveedor4@fastwork.pe', @PasswordHash, N'944999000', N'PROVEEDOR', 1, @Ahora, N'ACTIVO');

    DECLARE @IdAdmin INT = (SELECT id_usuario FROM usuarios WHERE correo = N'admin@fastwork.pe');
    DECLARE @IdCliente1 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'cliente1@fastwork.pe');
    DECLARE @IdCliente2 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'cliente2@fastwork.pe');
    DECLARE @IdUsuProv1 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'proveedor1@fastwork.pe');
    DECLARE @IdUsuProv2 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'proveedor2@fastwork.pe');
    DECLARE @IdUsuProv3 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'proveedor3@fastwork.pe');
    DECLARE @IdUsuProv4 INT = (SELECT id_usuario FROM usuarios WHERE correo = N'proveedor4@fastwork.pe');

    -- =========================================================================
    -- 3. PERFILES DE PROVEEDORES
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv1)
        INSERT INTO perfiles_proveedores (id_usuario, descripcion_perfil, estado_disponibilidad, documento_identidad, estado_verificacion, calificacion_promedio, total_resenas)
        VALUES (@IdUsuProv1, N'Técnico gasfitero y plomero con 10 años de experiencia atendiendo emergencias y mantenimiento en todo Trujillo.', N'DISPONIBLE', N'70112233', N'VERIFICADO', 0.00, 0);

    IF NOT EXISTS (SELECT 1 FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv2)
        INSERT INTO perfiles_proveedores (id_usuario, descripcion_perfil, estado_disponibilidad, documento_identidad, estado_verificacion, calificacion_promedio, total_resenas)
        VALUES (@IdUsuProv2, N'Especialista en instalaciones eléctricas domiciliarias, tableros térmicos y trabajos de soldadura en metal.', N'DISPONIBLE', N'70223344', N'VERIFICADO', 0.00, 0);

    IF NOT EXISTS (SELECT 1 FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv3)
        INSERT INTO perfiles_proveedores (id_usuario, descripcion_perfil, estado_disponibilidad, documento_identidad, estado_verificacion, calificacion_promedio, total_resenas)
        VALUES (@IdUsuProv3, N'Diseño, poda y mantenimiento integral de jardines residenciales y áreas verdes en Trujillo.', N'OCUPADO', N'70334455', N'VERIFICADO', 0.00, 0);

    IF NOT EXISTS (SELECT 1 FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv4)
        INSERT INTO perfiles_proveedores (id_usuario, descripcion_perfil, estado_disponibilidad, documento_identidad, estado_verificacion, calificacion_promedio, total_resenas)
        VALUES (@IdUsuProv4, N'Maestro carpintero: fabricación y reparación de reposteros, closets, puertas y muebles a medida.', N'NO_DISPONIBLE', N'70445566', N'PENDIENTE', 0.00, 0);

    DECLARE @IdPerfilProv1 INT = (SELECT id_perfil_proveedor FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv1);
    DECLARE @IdPerfilProv2 INT = (SELECT id_perfil_proveedor FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv2);
    DECLARE @IdPerfilProv3 INT = (SELECT id_perfil_proveedor FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv3);
    DECLARE @IdPerfilProv4 INT = (SELECT id_perfil_proveedor FROM perfiles_proveedores WHERE id_usuario = @IdUsuProv4);

    -- =========================================================================
    -- 4. OFICIOS Y TARIFAS POR PROVEEDOR (N:M)
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM proveedor_oficios WHERE id_perfil_proveedor = @IdPerfilProv1 AND id_oficio = @IdGasfiteria)
        INSERT INTO proveedor_oficios (id_perfil_proveedor, id_oficio, precio_minimo, precio_maximo, detalle_tarifa)
        VALUES (@IdPerfilProv1, @IdGasfiteria, 50.00, 150.00, N'Incluye diagnóstico en Trujillo; repuestos aparte.');

    IF NOT EXISTS (SELECT 1 FROM proveedor_oficios WHERE id_perfil_proveedor = @IdPerfilProv1 AND id_oficio = @IdPlomeria)
        INSERT INTO proveedor_oficios (id_perfil_proveedor, id_oficio, precio_minimo, precio_maximo, detalle_tarifa)
        VALUES (@IdPerfilProv1, @IdPlomeria, 60.00, 180.00, N'Detección de fugas y cambio de grifería.');

    IF NOT EXISTS (SELECT 1 FROM proveedor_oficios WHERE id_perfil_proveedor = @IdPerfilProv2 AND id_oficio = @IdElectricidad)
        INSERT INTO proveedor_oficios (id_perfil_proveedor, id_oficio, precio_minimo, precio_maximo, detalle_tarifa)
        VALUES (@IdPerfilProv2, @IdElectricidad, 70.00, 220.00, N'Revisión de cortos, llaves térmicas y luminarias.');

    IF NOT EXISTS (SELECT 1 FROM proveedor_oficios WHERE id_perfil_proveedor = @IdPerfilProv2 AND id_oficio = @IdSoldadura)
        INSERT INTO proveedor_oficios (id_perfil_proveedor, id_oficio, precio_minimo, precio_maximo, detalle_tarifa)
        VALUES (@IdPerfilProv2, @IdSoldadura, 100.00, 350.00, N'Reparación de rejas, portones y estructuras metálicas.');

    IF NOT EXISTS (SELECT 1 FROM proveedor_oficios WHERE id_perfil_proveedor = @IdPerfilProv3 AND id_oficio = @IdJardineria)
        INSERT INTO proveedor_oficios (id_perfil_proveedor, id_oficio, precio_minimo, precio_maximo, detalle_tarifa)
        VALUES (@IdPerfilProv3, @IdJardineria, 45.00, 120.00, N'Corte de césped, poda y limpieza general.');

    IF NOT EXISTS (SELECT 1 FROM proveedor_oficios WHERE id_perfil_proveedor = @IdPerfilProv4 AND id_oficio = @IdCarpinteria)
        INSERT INTO proveedor_oficios (id_perfil_proveedor, id_oficio, precio_minimo, precio_maximo, detalle_tarifa)
        VALUES (@IdPerfilProv4, @IdCarpinteria, 80.00, 260.00, N'Ajuste de puertas, bisagras y muebles de madera.');

    -- =========================================================================
    -- 5. SOLICITUDES, MENSAJES, RESENAS Y METRICAS PILOTO
    --    (Solo se insertan si cliente1 aun no tiene solicitudes semilla)
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM solicitudes_servicio WHERE id_cliente = @IdCliente1)
    BEGIN
        DECLARE @Hoy DATE = CAST(SYSDATETIME() AS DATE);
        DECLARE @IdSolFinalizada1 INT;
        DECLARE @IdSolFinalizada2 INT;
        DECLARE @IdSolFinalizada3 INT;
        DECLARE @IdSolSinResena INT;
        DECLARE @IdSolPendiente INT;
        DECLARE @IdSolAceptada INT;
        DECLARE @IdSolEnProceso INT;
        DECLARE @IdSolCancelada INT;

        -- 5.1 Solicitud FINALIZADA #1 (con reseña de 5 estrellas para proveedor1)
        INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
        VALUES (@IdCliente1, @IdPerfilProv1, @IdGasfiteria, N'Av. España 1240, Centro Histórico, Trujillo', DATEADD(DAY, -10, @Hoy), '09:30:00', N'Cambio de llave de paso y reparación de fuga debajo del lavadero.', 90.00, N'FINALIZADA');
        SET @IdSolFinalizada1 = SCOPE_IDENTITY();

        -- 5.2 Solicitud FINALIZADA #2 (con reseña de 4 estrellas para proveedor1)
        INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
        VALUES (@IdCliente2, @IdPerfilProv1, @IdPlomeria, N'Urb. California Mz. B Lt. 12, Trujillo', DATEADD(DAY, -6, @Hoy), '14:00:00', N'Limpieza de trampa de grasa y revisión de presión de agua.', 110.00, N'FINALIZADA');
        SET @IdSolFinalizada2 = SCOPE_IDENTITY();

        -- 5.3 Solicitud FINALIZADA #3 (con reseña de 5 estrellas para proveedor2)
        INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
        VALUES (@IdCliente1, @IdPerfilProv2, @IdElectricidad, N'Av. Larco 850, Urb. La Merced, Trujillo', DATEADD(DAY, -4, @Hoy), '11:00:00', N'Instalación de 2 llaves termomagnéticas y 4 tomacorrientes dobles.', 150.00, N'FINALIZADA');
        SET @IdSolFinalizada3 = SCOPE_IDENTITY();

        -- 5.4 Solicitud FINALIZADA #4 SIN RESENA (para probar POST /api/v1/resenas/solicitud/{id})
        INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
        VALUES (@IdCliente1, @IdPerfilProv1, @IdPlomeria, N'Av. España 1240, Centro Histórico, Trujillo', DATEADD(DAY, -1, @Hoy), '16:00:00', N'Cambio de mezcladora de ducha en segundo piso.', 85.00, N'FINALIZADA');
        SET @IdSolSinResena = SCOPE_IDENTITY();

        -- 5.5 Solicitud PENDIENTE (para probar ACEPTADA / RECHAZADA / CANCELADA)
        INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
        VALUES (@IdCliente2, @IdPerfilProv1, @IdGasfiteria, N'Urb. San Andrés II Etapa Mz. K Lt. 5, Trujillo', DATEADD(DAY, 2, @Hoy), '10:00:00', N'Desatoro de tubería de desagüe principal en patio.', 120.00, N'PENDIENTE');
        SET @IdSolPendiente = SCOPE_IDENTITY();

        -- 5.6 Solicitud ACEPTADA (para probar paso a EN_PROCESO)
        INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
        VALUES (@IdCliente1, @IdPerfilProv2, @IdSoldadura, N'Jr. Pizarro 415, Centro Histórico, Trujillo', DATEADD(DAY, 3, @Hoy), '15:30:00', N'Refuerzo de bisagras en portón metálico de cochera.', 180.00, N'ACEPTADA');
        SET @IdSolAceptada = SCOPE_IDENTITY();

        -- 5.7 Solicitud EN_PROCESO (para probar chat activo y paso a FINALIZADA)
        INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
        VALUES (@IdCliente2, @IdPerfilProv2, @IdElectricidad, N'Av. América Sur 1920, Trujillo', @Hoy, '17:00:00', N'Revisión de tablero eléctrico por caída frecuente de diferencial.', 130.00, N'EN_PROCESO');
        SET @IdSolEnProceso = SCOPE_IDENTITY();

        -- 5.8 Solicitud CANCELADA
        INSERT INTO solicitudes_servicio (id_cliente, id_perfil_proveedor, id_oficio, direccion_trujillo, fecha_programada, hora_programada, descripcion_trabajo, presupuesto_referencial, estado)
        VALUES (@IdCliente1, @IdPerfilProv3, @IdJardineria, N'Urb. El Golf Mz. C Lt. 8, Trujillo', DATEADD(DAY, 5, @Hoy), '08:30:00', N'Poda de cerco vivo y mantenimiento de jardín exterior.', 95.00, N'CANCELADA');
        SET @IdSolCancelada = SCOPE_IDENTITY();

        -- =====================================================================
        -- 6. MENSAJES DE CHAT INTERNO
        -- =====================================================================
        INSERT INTO mensajes (id_solicitud, id_emisor, contenido, leido) VALUES
        (@IdSolFinalizada1, @IdCliente1, N'Hola Mario, ¿puedes traer cinta teflón y una llave de paso de 1/2 pulgada?', 1),
        (@IdSolFinalizada1, @IdUsuProv1, N'Sí claro Lucía, llevo todo el material y llego puntual a las 9:30 am.', 1),

        (@IdSolAceptada, @IdCliente1, N'Buenos días Jorge, el portón está en la entrada lateral por Jr. Pizarro.', 1),
        (@IdSolAceptada, @IdUsuProv2, N'Recibido Lucía, ya agendé la visita y llevaré equipo portátil de soldadura.', 0),

        (@IdSolEnProceso, @IdCliente2, N'Ya estamos en casa para recibirte en el primer piso.', 1),
        (@IdSolEnProceso, @IdUsuProv2, N'Estoy en camino, llego en 15 minutos con el multímetro.', 1);

        -- =====================================================================
        -- 7. CALIFICACIONES Y RESENAS POST-SERVICIO
        -- =====================================================================
        INSERT INTO calificaciones_resenas (id_solicitud, id_cliente, id_perfil_proveedor, puntuacion, comentario) VALUES
        (@IdSolFinalizada1, @IdCliente1, @IdPerfilProv1, 5, N'Excelente trabajo, muy puntual y dejó todo limpio.'),
        (@IdSolFinalizada2, @IdCliente2, @IdPerfilProv1, 4, N'Buen servicio, solucionó el problema de presión rápidamente.'),
        (@IdSolFinalizada3, @IdCliente1, @IdPerfilProv2, 5, N'Muy profesional con el tablero eléctrico, explicó cada detalle.');

        -- Recalcular promedio y total de reseñas solo en los perfiles semilla
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
        ) r ON p.id_perfil_proveedor = r.id_perfil_proveedor
        WHERE p.id_perfil_proveedor IN (@IdPerfilProv1, @IdPerfilProv2, @IdPerfilProv3, @IdPerfilProv4);
    END

    -- =========================================================================
    -- 8. METRICAS PILOTO (si aun no existen encuestas registradas)
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM metricas_piloto WHERE id_usuario IN (@IdCliente1, @IdCliente2, @IdUsuProv1))
    BEGIN
        INSERT INTO metricas_piloto (id_usuario, puntaje_usabilidad, puntaje_satisfaccion, observaciones) VALUES
        (@IdCliente1, 5, 5, N'Muy fácil encontrar gasfiteros en Trujillo y coordinar por el chat interno.'),
        (@IdCliente2, 4, 5, N'La agenda muestra claramente el estado de cada solicitud.'),
        (@IdUsuProv1, 5, 4, N'Me ayuda a organizar mis trabajos y mostrar mis tarifas por oficio.');
    END

    COMMIT TRANSACTION;
    PRINT N'Seed de Fast Work ejecutada correctamente.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

-- =============================================================================
-- CONSULTA DE VERIFICACION RAPIDA EN SSMS
-- =============================================================================
SELECT rol, COUNT(*) AS total FROM usuarios GROUP BY rol;
SELECT p.id_perfil_proveedor, u.nombres + N' ' + u.apellidos AS proveedor, p.estado_disponibilidad, p.estado_verificacion, p.calificacion_promedio, p.total_resenas
FROM perfiles_proveedores p
INNER JOIN usuarios u ON u.id_usuario = p.id_usuario;
SELECT estado, COUNT(*) AS total FROM solicitudes_servicio GROUP BY estado;
GO
