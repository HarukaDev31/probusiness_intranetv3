# API Trámites Consolidado Cotizacion Aduana

El frontend consume los siguientes endpoints. Implementarlos en el backend (Laravel u otro) con el prefijo indicado.

## Base URL
`/api/base-datos/consolidado-cotizacion-aduana/tramites`

## Endpoints

### GET `/api/base-datos/consolidado-cotizacion-aduana/tramites`
Lista trámites con paginación y filtros.

**Query params:**
- `page` (opcional)
- `limit` (opcional)
- `search` (opcional)
- `id_consolidado` (opcional)
- `id_entidad` (opcional)
- `estado` (opcional): PENDIENTE | SD | PAGADO | EN_TRAMITE | RECHAZADO | COMPLETADO

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_cotizacion": null,
      "id_consolidado": 1,
      "id_cliente": 1,
      "id_entidad": 1,
      "id_tipo_permiso": 1,
      "derecho_entidad": 125.00,
      "precio": 300.00,
      "f_inicio": "2026-01-01",
      "f_termino": "2026-01-01",
      "f_caducidad": "2027-01-01",
      "dias": 10,
      "estado": "PENDIENTE",
      "consolidado": { "id": 1, "codigo": "#01 - 2026" },
      "entidad": { "id": 1, "nombre": "MTC" },
      "tipo_permiso": { "id": 1, "nombre_permiso": "Registro sanitario" },
      "cliente": { "id": 1, "nombre": "...", "ruc": "...", "telefono": "...", "email": "..." }
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 50,
    "total": 100,
    "from": 1,
    "to": 50
  }
}
```

### GET `/api/base-datos/consolidado-cotizacion-aduana/tramites/{id}`
Obtiene un trámite por ID. Misma estructura de objeto en `data`.

### POST `/api/base-datos/consolidado-cotizacion-aduana/tramites`
Crear trámite. El formulario solo envía estos 6 campos obligatorios.

**Body (JSON) – campos requeridos:**
```json
{
  "id_consolidado": 1,
  "id_cliente": 1,
  "id_entidad": 1,
  "id_tipo_permiso": 1,
  "derecho_entidad": 125.00,
  "precio": 300.00
}
```

**Backend:** Validar solo estos campos. Los campos `id_cotizacion`, `f_inicio`, `f_termino`, `f_caducidad`, `dias`, `estado` son opcionales; si no se envían, usar valores por defecto (por ejemplo `estado = 'PENDIENTE'`, fechas/días `null`).

### PUT `/api/base-datos/consolidado-cotizacion-aduana/tramites/{id}`
Actualizar trámite. Mismo body que POST; solo se envían los 6 campos del formulario (el resto se puede ignorar o mantener en el backend).

### DELETE `/api/base-datos/consolidado-cotizacion-aduana/tramites/{id}`
Eliminar trámite.

**Respuesta:** `{ "success": true }`

---

Tabla: `consolidado_cotizacion_aduana_tramites` (ver migración en `database/migrations/`).
Modelo Eloquent: `App\Models\CargaConsolidada\ConsolidadoCotizacionAduanaTramite`.

## Backend – validación (Laravel)

En el controlador o FormRequest, validar solo los 6 campos obligatorios y rellenar el resto por defecto:

**Campos requeridos:** `id_consolidado`, `id_entidad`, `id_tipo_permiso`, `derecho_entidad`, `precio`. Opcional: `id_cliente`, `id_cotizacion`.

Al crear/actualizar, si no vienen en el request, asignar por defecto: `estado = 'PENDIENTE'`, `f_inicio`, `f_termino`, `f_caducidad`, `dias` = `null`.

---

## Catálogos (entidad y tipo permiso) – nuevas tablas

Entidad y tipo de permiso deben servirse desde un **controlador dedicado** que use **solo las nuevas tablas** (no regulaciones):

- **Entidades:** tabla `tramite_aduana_entidades` (id, nombre, created_at, deleted_at).
- **Tipos de permiso:** tabla `tramite_aduana_tipos_permiso` (id, nombre, created_at, deleted_at).

**Base URL del controlador de catálogos (nuevas tablas):**  
`/api/base-datos/tramite-aduana-catalogos`

El backend debe registrar rutas que apunten a un controlador (ej. `TramiteAduanaCatalogosController`) que use los modelos de estas tablas, no el de regulaciones.

### GET `/api/base-datos/tramite-aduana-catalogos/entidades`
Lista entidades **solo activas** (sin soft delete). En Laravel: `TramiteAduanaEntidad::whereNull('deleted_at')->get()` o equivalente.

### POST `/api/base-datos/tramite-aduana-catalogos/entidades`
Crear entidad. Body: `{ "nombre": "string" }`.

### GET `/api/base-datos/tramite-aduana-catalogos/tipos-permiso`
Lista tipos de permiso **solo activos** (sin soft delete). Misma lógica que entidades.

### POST `/api/base-datos/tramite-aduana-catalogos/tipos-permiso`
Crear tipo de permiso. Body: `{ "nombre_permiso": "string" }` (o `nombre` según migración).

### Borrado (soft delete únicamente)

Cualquier “baja” de entidad o tipo de permiso debe ser **solo soft delete**: actualizar `deleted_at`, no eliminar el registro. Los listados GET deben excluir registros con `deleted_at` no nulo. No implementar borrado físico (hard delete) para estos catálogos.

### Ejemplo de rutas (Laravel)

Registrar un controlador que use **solo** las tablas `tramite_aduana_entidades` y `tramite_aduana_tipos_permiso`:

```php
// routes/api.php o routes/modules/base-datos.php
Route::prefix('tramite-aduana-catalogos')->group(function () {
    Route::get('entidades', [TramiteAduanaCatalogosController::class, 'indexEntidades']);
    Route::post('entidades', [TramiteAduanaCatalogosController::class, 'storeEntidad']);
    Route::get('tipos-permiso', [TramiteAduanaCatalogosController::class, 'indexTiposPermiso']);
    Route::post('tipos-permiso', [TramiteAduanaCatalogosController::class, 'storeTipoPermiso']);
});
// Prefijo global: /api/base-datos/ → base path completo: /api/base-datos/tramite-aduana-catalogos/...
```

El controlador debe inyectar/uso los modelos `TramiteAduanaEntidad` y `TramiteAduanaTipoPermiso` (que usan las tablas nuevas), no `EntidadReguladora` ni modelos de regulaciones.

---

## Documentos del trámite (carpetas y archivos)

Las categorías son **carpetas** con nombre libre. El front envía y espera `categoria` como **string** (nombre de la categoría), no un enum.

### GET `.../tramites/{id}/documentos`
Lista documentos del trámite. Cada item debe incluir `categoria` (string), `nombre_documento`, `nombre_original`, `url`, etc.

### POST `.../tramites/{id}/documentos`
Subir documento. **FormData:**
- `categoria` (string): nombre de la carpeta/categoría (ej. "Documentos para tramite", "CPB de tramite", o cualquier nombre que cree el usuario).
- `nombre_documento` (string): nombre del tipo de documento o del archivo.
- `archivo` (file): el archivo.

El backend debe **aceptar cualquier string** en `categoria` y almacenarlo tal cual (no limitar a TRAMITE/CPB/RESOLUTIVO).

### DELETE `.../tramites/documentos/{id}`
Eliminar un documento por ID.

---

## Categorías (carpetas) del trámite

Las categorías se gestionan en la tabla `tramite_aduana_categorias` (id, id_tramite, nombre). Al crear un trámite, el backend crea las 3 categorías por defecto. El front lista y crea categorías con estos endpoints.

### GET `.../tramites/{idTramite}/categorias`
Lista categorías del trámite.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "id_tramite": 1, "nombre": "Documentos para tramite" },
    { "id": 2, "id_tramite": 1, "nombre": "CPB de tramite" },
    { "id": 3, "id_tramite": 1, "nombre": "Documento resolutivo" }
  ]
}
```

### POST `.../tramites/{idTramite}/categorias`
Crear categoría (carpeta). firstOrCreate por (id_tramite, nombre).

**Body (JSON):**
```json
{ "nombre": "Mi carpeta" }
```

**Respuesta:** `{ "success": true, "data": { "id": 4, "id_tramite": 1, "nombre": "Mi carpeta" } }`
