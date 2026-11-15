# Módulo 3 — Directorio y Perfiles de Proveedores (`src/app/proveedor/`)

Implementa la búsqueda de proveedores en Trujillo (sin segmentación por distritos), la ficha pública de detalle y la edición del perfil comercial del trabajador, alineado con `docs/backend_docs/modulos/03-proveedores.md`.

---

## 1. Servicio HTTP y Reglas de Dominio

- **Servicio**: `ProveedorApi` (`src/app/proveedor/proveedor-api.ts`, `providedIn: 'root'`)
  - `buscarDirectorio(FiltroProveedoresQuery?): Observable<ProveedorDirectorio[]>` → `GET /api/v1/proveedores` (`oficios`, `disponibilidad`, `calificacionMin`; excluye el propio perfil en backend)
  - `obtenerMiPerfil(): Observable<ProveedorDetalle>` → `GET /api/v1/proveedores/mi-perfil`
  - `obtenerDetalle(idPerfilProveedor): Observable<ProveedorDetalle>` → `GET /api/v1/proveedores/{idPerfilProveedor}`
  - `actualizarMiPerfil(ActualizarPerfilProveedorRequest): Observable<ProveedorDetalle>` → `PUT /api/v1/proveedores/mi-perfil`
  - `actualizarDisponibilidad(ActualizarDisponibilidadRequest): Observable<ProveedorDetalle>` → `PATCH /api/v1/proveedores/mi-disponibilidad`
- **Dominio** (`src/app/dominio/proveedor.ts`):
  - `esRangoTarifaValido(precioMinimo, precioMaximo)`: valida finitud, `precioMinimo >= 0` y `precioMaximo >= precioMinimo`.

---

## 2. Componentes del Módulo

### `ListaProveedores` (`app-lista-proveedores`)

- **Archivos**: `src/app/proveedor/lista-proveedores/lista-proveedores.{ts,html,css}`
- **Ruta**: `/directorio` (`sesionGuard`, `rolGuard('CLIENTE', 'ADMIN')`)
- **Funcionamiento**:
  1. Carga en `ngOnInit` el catálogo activo (`oficioApi.listarActivos()`) para poblar los filtros de oficios y ejecuta la búsqueda inicial (`proveedorApi.buscarDirectorio()`).
  2. Layout desktop de 2 columnas: barra lateral izquierda fija (`280px`) con filtros reactivos y grilla de 2 columnas con `<app-tarjeta-proveedor />`.
  3. Soporta filtro multi-oficio (checkboxes), disponibilidad (`Todos` por defecto o `Disponibles`) y calificación mínima (`3`, `4`, `4.5`), relanzando la consulta al backend en cada cambio. No incluye filtros de distrito o zona (regla de cobertura única en Trujillo).
  4. Incluye botón para restablecer filtros y estados de carga/vacío.

### `TarjetaProveedor` (`app-tarjeta-proveedor`)

- **Archivos**: `src/app/proveedor/tarjeta-proveedor/tarjeta-proveedor.{ts,html,css}`
- **Entrada**: `proveedor = input.required<ProveedorDirectorio>()`
- **Funcionamiento**: Muestra nombre completo, `<app-calificacion-estrellas />` con total de reseñas, `<app-badge-estado />` para verificación y disponibilidad, extracto de perfil, chips de oficios con su rango de precios en soles (`S/ precioMinimo – S/ precioMaximo`), teléfono y enlace `Ver perfil y tarifas` hacia `/proveedores/:idPerfilProveedor`.

### `DetalleProveedor` (`app-detalle-proveedor`)

- **Archivos**: `src/app/proveedor/detalle-proveedor/detalle-proveedor.{ts,html,css}`
- **Ruta**: `/proveedores/:idPerfilProveedor` (`sesionGuard`, `rolGuard('CLIENTE', 'ADMIN')`)
- **Entrada por ruta**: `idPerfilProveedor = input.required<string>()` (mediante `withComponentInputBinding()`)
- **Funcionamiento**:
  1. Reacciona con `effect()` al parámetro de ruta numérico para consultar `proveedorApi.obtenerDetalle(id)`.
  2. Presenta badges de estado, calificación promedio, teléfono, correo, cobertura declarada en Trujillo, tabla completa de oficios/tarifas y listado de reseñas mediante `<app-lista-resenas />`.
  3. Si el usuario autenticado tiene rol `CLIENTE` y el perfil consultado no le pertenece, habilita el botón CTA **Solicitar servicio** apuntando a `/solicitudes/nueva/:idPerfilProveedor`.

### `FormularioProveedor` (`app-formulario-proveedor`)

- **Archivos**: `src/app/proveedor/formulario-proveedor/formulario-proveedor.{ts,html,css}`
- **Ruta**: `/proveedor/perfil` (`sesionGuard`, `rolGuard('PROVEEDOR')`)
- **Funcionamiento**:
  1. En `ngOnInit` consulta en paralelo `oficioApi.listarActivos()` y `proveedorApi.obtenerMiPerfil()` para precargar los datos del proveedor autenticado.
  2. Muestra el DNI en un campo de solo lectura (`readonly` / `disabled`), impidiendo su modificación.
  3. Incluye selector rápido de disponibilidad (`DISPONIBLE`, `OCUPADO`, `NO_DISPONIBLE`) que persiste inmediatamente con `proveedorApi.actualizarDisponibilidad(...)`.
  4. Usa Signal Forms con arreglo dinámico (`applyEach` sobre `oficios`): permite añadir o quitar filas (`idOficio`, `precioMinimo`, `precioMaximo`, `detalleTarifa`), valida cada rango con `esRangoTarifaValido(...)`, impide oficios duplicados antes de enviar y guarda con `proveedorApi.actualizarMiPerfil(...)` (sin enviar `documentoIdentidad`).
