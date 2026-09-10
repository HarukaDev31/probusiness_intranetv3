# Runner Playwright de capturas del manual

Genera capturas reproducibles desde un manifiesto declarativo, sin modificar datos ni simular elementos visuales. El frontend y la API deben estar levantados antes de ejecutarlo.

## Rutas

- Manifiesto por defecto: `../intranet_back/resources/manual/capturas/manifest.json`.
- Salida por defecto: `../intranet_back/resources/manual/capturas/`. En el formato canónico se respeta `output`.
- Reporte: `../intranet_back/resources/manual/capturas/report.json`.
- Plantilla: `e2e/manual-captures/manifest.example.json`.

Si el manifiesto del backend aún no existe, `--list` usa la plantilla para poder validar la instalación. Una ejecución real requiere crear el manifiesto del backend y definir las credenciales en el entorno.

## Ejecución

PowerShell:

```powershell
$env:MANUAL_CAPTURE_COMERCIAL_USER = "usuario_qa"
$env:MANUAL_CAPTURE_COMERCIAL_PASSWORD = "valor-local"
pnpm manual:captures:list
pnpm manual:captures
```

Filtros opcionales (aceptan varios valores separados por coma):

```powershell
$env:MANUAL_CAPTURE_ROLE = "comercial"
$env:MANUAL_CAPTURE_SCREEN = "alumnos"
$env:MANUAL_CAPTURE_SHOT = "crear,detalle"
pnpm manual:captures
```

Las rutas y URLs se pueden cambiar con `MANUAL_CAPTURE_MANIFEST`, `MANUAL_CAPTURE_OUTPUT`, `MANUAL_CAPTURE_BACKEND`, `MANUAL_CAPTURE_BASE_URL` y `MANUAL_CAPTURE_API_URL`. El archivo `.env.example` solo documenta nombres: Playwright no lo carga ni contiene secretos.

## Manifiesto

El loader acepta el formato anidado (`version` + `roles/screens/shots`) y el formato plano canónico que exporta inicialmente el backend (`schema_version` + `captures`). En el anidado también hidrata `output`, `manual.step.title` y `manual.hint`. El canónico plano equivalente es:

```json
{
  "schema_version": 1,
  "screens": {
    "curso/alumnos": { "url": "/curso/alumnos" }
  },
  "captures": [{
    "capture_key": "comercial__curso-alumnos__crear",
    "roles": ["comercial"],
    "screen": "curso/alumnos",
    "modulo": "curso",
    "flow": "Registrar alumno",
    "step": { "number": 1, "title": "Nuevo alumno" },
    "hint": "Abre el modal y recórtalo completo.",
    "output": "comercial__curso-alumnos__crear.png"
  }]
}
```

Cada captura necesita:

- `capture_key` estable y al menos un elemento en `roles`.
- URL relativa en `capture.url`, en `screen.url` cuando `screen` es objeto, o en el catálogo superior `screens`. Si `screen` ya comienza con `/`, también se usa como URL. No se adivinan rutas a partir de `modulo`.
- `output` PNG relativo al directorio de capturas. La variante principal escribe ese nombre exacto; 2560×1440 añade `--2560x1440` antes de `.png`.
- `step.title` o `hint` si no hay `target` explícito.

Cuando faltan `actions` y `target`, el resolvedor interpreta de forma conservadora crear/nuevo, editar/lápiz, eliminar/papelera, ver/ojo/ficha, guardar, filtros, tabs, modal y destino. Busca controles reales por `role`, texto, `title` y `aria-label`; solo abre un resultado cuando el hint pide modal o destino. Si no encuentra un target inequívoco, falla indicando que debe declararse `target/actions` o añadirse un `data-manual-capture`: nunca cae silenciosamente a `body` o a una captura genérica.

Para casos ambiguos, el formato canónico puede añadir directamente `type`, `actions`, `target`, `expected_text`, `padding`, `masks`, `pii_allow` y `expected_hash`. Tipos válidos: `control`, `fila`, `modal`, `destino`, `seccion` y `page`. Los selectores pueden ser CSS (cadena o `{ "css": "..." }`), `testId`, `manualCapture` (atributo `data-manual-capture`), `text` o `role` + `name`.

Acciones:

- `click`: pulsa el target.
- `fill`: completa un input con `value`.
- `select`: selecciona uno o varios valores.
- `goto`: navega a `url`.
- `wait`: espera `ms` y/o un target en estado `visible`, `hidden`, `attached` o `detached`.

`expectedText` valida contenido visible y el target siempre se valida como visible. `expectedHash` puede ser un SHA-256 único o un objeto por variante (`1920x1200`, `2560x1440`).

## Garantías de captura

- Viewports 1920×1200 y 2560×1440.
- Zoom CSS 0.85, tema claro, sidebar colapsado y animaciones desactivadas.
- Espera de red, fuentes, indicadores de carga y skeletons.
- Recorte del locator con `padding` y máscaras declaradas.
- Detección preventiva de email, teléfono peruano, DNI y RUC dentro del target. `piiAllow` solo debe usarse para datos ficticios conocidos.
- SHA-256 calculado sobre los bytes PNG exactos y registrado junto con el hash del manifiesto.

## Pruebas

```powershell
pnpm manual:captures:test
```

Los tests cubren detección de PII y ejecución de acciones declarativas. Si una pantalla no tiene un selector estable, se permite agregar `data-manual-capture` únicamente al contenedor real; no deben añadirse overlays ni duplicarse controles para la captura.
