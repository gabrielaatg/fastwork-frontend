# Módulo 8 — Métricas del Piloto (`src/app/piloto/`)

Permite a clientes y proveedores enviar su evaluación de usabilidad y satisfacción durante el piloto en Trujillo, alineado con `docs/backend_docs/modulos/08-piloto.md`.

---

## 1. Servicio HTTP

- **Servicio**: `PilotoApi` (`src/app/piloto/piloto-api.ts`, `providedIn: 'root'`)
  - `registrarMetrica(CrearMetricaPilotoRequest): Observable<MetricaPiloto>` → `POST /api/v1/piloto/metricas`
- **Modelos** (`src/app/dominio/piloto.ts`, `src/app/dominio/resena.ts`): `CrearMetricaPilotoRequest`, `MetricaPiloto`, `PuntuacionEstrellas`.

---

## 2. Componentes del Módulo

### `EncuestaPiloto` (`app-encuesta-piloto`)

- **Archivos**: `src/app/piloto/encuesta-piloto/encuesta-piloto.{ts,html,css}`
- **Ruta**: `/piloto` (`sesionGuard`, `rolGuard('CLIENTE', 'PROVEEDOR')`)
- **Funcionamiento**:
  1. Presenta dos selectores interactivos `<app-calificacion-estrellas [soloLectura]="false" />` enlazados con `[(valor)]` para `puntajeUsabilidad` y `puntajeSatisfaccion` (inicializados en `5`).
  2. Incluye campo `observaciones` opcional controlado con Signal Forms (`maxLength(500)`).
  3. Valida que ambos puntajes estén en `1..5` antes de invocar `pilotoApi.registrarMetrica(...)`.
  4. Al registrarse con éxito, muestra una alerta `<app-alerta-mensaje tipo="exito" />` y limpia las observaciones.
