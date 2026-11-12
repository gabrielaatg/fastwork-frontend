# Contexto General del Proyecto: Fast Work

## 1. Descripción General

**Fast Work** es una plataforma web (accesible desde navegadores de escritorio) diseñada para conectar de manera rápida y directa a trabajadores independientes que ofrecen oficios eventuales con clientes que requieren servicios para el hogar en **toda la ciudad de Trujillo, Perú**.

Funciona como un directorio digital interactivo tipo agenda (similar a unas *Páginas Amarillas* modernas), facilitando la búsqueda, comparación, contacto y coordinación de servicios, actuando únicamente como un intermediario digital.

## 2. Propuesta de Valor y Objetivos

* **Conexión directa:** Reducir el tiempo que toman los clientes en encontrar trabajadores confiables (gasfitería, plomería, electricidad, carpintería, jardinería, soldadura, entre otros) sin depender exclusivamente de recomendaciones informales.
* **Visibilidad digital:** Brindar un espacio en internet para que los trabajadores independientes de Trujillo exhiban sus habilidades, tarifas referenciales y reputación.
* **Confianza y transparencia:** Incorporar perfiles detallados, verificación básica de datos y un sistema de calificaciones y reseñas.
* **Validación:** Evaluar la usabilidad y aceptación mediante un piloto controlado con clientes y proveedores reales.

## 3. Reglas de Negocio Clave

* **Cobertura geográfica única (Todo Trujillo):** El sistema opera a nivel de toda la ciudad de Trujillo. **No** existen filtros, restricciones ni segmentación por zonas o distritos internos; se asume que todos los proveedores registrados atienden en toda la ciudad.
* **Múltiples oficios por proveedor:** Un trabajador independiente no está limitado a una sola categoría; puede seleccionar y registrar **múltiples oficios** dentro de su mismo perfil.
* **Tarifas referenciales propias:** Cada proveedor define y publica su propio rango de precios según los servicios/oficios que ofrece.
* **Rol de intermediario:** Fast Work no es empleador, aseguradora ni garante de la calidad final de los trabajos realizados.

## 4. Funcionalidades Principales (Alcance MVP / V1)

### Módulo de Usuarios y Perfiles

* Registro y autenticación de **Clientes** y **Proveedores**.
* Edición y actualización de perfiles (datos personales, múltiples oficios, rangos de precios y estado de disponibilidad).
* Mecanismo de **verificación básica** de datos durante el registro de proveedores.

### Directorio, Búsqueda y Filtrado

* Listado general (tipo agenda) de proveedores activos en Trujillo.
* Búsqueda y filtrado rápido por:
  * Uno o más **tipos de oficio**.
  * **Estado de disponibilidad** del proveedor.
  * **Calificación** (reputación).
* Visualización detallada del perfil del proveedor (oficios, tarifas, verificación, reseñas y puntuación).

### Solicitud y Coordinación de Servicios

* Creación de solicitudes de servicio por parte del cliente indicando: fecha, hora, descripción del trabajo y presupuesto referencial.
* Agenda básica de coordinación de citas/trabajos.
* **Mensajería interna** entre cliente y proveedor para acordar detalles.

### Reputación, Analítica y Normativa

* Sistema de **calificaciones y reseñas** posteriores al servicio para alimentar la reputación del proveedor.
* Registro de métricas e indicadores básicos de uso y satisfacción para evaluar el piloto.
* Cumplimiento de la **Ley N.° 29733** (Ley de Protección de Datos Personales del Perú) y su reglamento vigente (**D.S. N.° 016-2024-JUS**).

## 5. Arquitectura y Enfoque Técnico

* **Frontend:** Aplicación web optimizada para navegadores de escritorio (*desktop*).
* **Backend:** Desarrollo de una **API REST propia** encargada de la lógica de negocio, comunicación con el frontend y gestión/almacenamiento de usuarios, proveedores, oficios, solicitudes, mensajes y calificaciones.

## 6. Exclusiones Explícitas (Fuera de Alcance en V1)

Para mantener el enfoque del MVP y evitar alucinaciones o sugerencias fuera de lugar al desarrollar o documentar, tener en cuenta que **el sistema NO incluye**:

* **Pasarelas de pago en línea:** Los acuerdos y pagos económicos se realizan directamente fuera de la plataforma.
* **Aplicaciones móviles nativas (Android / iOS) ni versión móvil:** El sistema está orientado exclusivamente a navegadores web de escritorio.
* **Filtros por zonas o geolocalización por barrios:** La cobertura es global para todo Trujillo.
* **Verificación de antecedentes penales o policiales:** Solo se contempla verificación básica de identidad/datos de registro.
* **Seguros, garantías o reembolsos** por incumplimientos o daños en los trabajos.

## 7. Contexto Académico

* **Institución:** Universidad Privada del Norte (UPN) – Trujillo, Perú.
* **Curso:** Soluciones Web y Aplicaciones Distribuidas (2026-2).