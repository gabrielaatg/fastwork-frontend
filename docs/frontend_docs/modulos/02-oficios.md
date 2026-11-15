# Módulo 2 — Catálogo de Oficios (`src/app/oficio/`)

Gestiona la visualización y creación de categorías de oficios técnicos disponibles en Trujillo para uso exclusivo del rol `ADMIN`, en correspondencia con `docs/backend_docs/modulos/02-oficios.md`.

---

## 1. Servicio HTTP y Modelos

- **Servicio**: `OficioApi` (`src/app/oficio/oficio-api.ts`, `providedIn: 'root'`)
  - `listarActivos(): Observable<Oficio[]>` → `GET /api/v1/oficios`
  - `crear(CrearOficioRequest): Observable<Oficio>` → `POST /api/v1/oficios`
- **Modelos** (`src/app/dominio/oficio.ts`): `Oficio`, `CrearOficioRequest`.

---

## 2. Componentes del Módulo

### `ListaOficios` (`app-lista-oficios`)

- **Archivos**: `src/app/oficio/lista-oficios/lista-oficios.{ts,html,css}`
- **Ruta**: `/admin/oficios` (`sesionGuard`, `rolGuard('ADMIN')`)
- **Funcionamiento**:
  1. Al inicializar (`ngOnInit`), carga los oficios activos mediante `oficioApi.listarActivos()` y los almacena en la señal `oficios`.
  2. Muestra una vista desktop de 2 columnas: tabla del catálogo (`idOficio`, `nombreOficio`, `descripcion`, estado `Activo`) a la izquierda y el componente `<app-formulario-oficio />` fijado a la derecha.
  3. Escucha el evento `(oficioCreado)` para añadir inmediatamente el nuevo oficio a la tabla y mostrar un mensaje de éxito con `<app-alerta-mensaje tipo="exito" />`.

### `FormularioOficio` (`app-formulario-oficio`)

- **Archivos**: `src/app/oficio/formulario-oficio/formulario-oficio.{ts,html,css}`
- **Uso**: Embebido en `ListaOficios`.
- **Salida**: `oficioCreado = output<Oficio>()`
- **Funcionamiento**:
  1. Formulario Signal Forms con `nombreOficio` (obligatorio) y `descripcion` (opcional).
  2. Envía la petición `oficioApi.crear(...)` omitiendo `descripcion` si queda vacía.
  3. Tras una creación exitosa, limpia y resetea el formulario y emite `oficioCreado` al componente padre.
  4. Ante errores (`400` por oficio duplicado o validación), renderiza `<app-alerta-mensaje />`.
