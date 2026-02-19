# API Trámite Aduana – Fechas y Días por tipo_permiso

Las fechas **F. Inicio**, **F. Termino**, **F. Caducidad** y el campo **Días** son **por tipo_permiso** (pivot trámite–tipo_permiso), no a nivel trámite.

## Respuesta (listado y detalle)

En cada elemento de `tipos_permiso` el backend debe incluir:

- `id`, `nombre_permiso`, `derecho_entidad`, `estado`
- **Por tipo_permiso:** `f_inicio`, `f_termino`, `f_caducidad`, `dias` (todos opcionales)

Ejemplo:

```json
{
  "tipos_permiso": [
    {
      "id": 1,
      "nombre_permiso": "Permiso A",
      "derecho_entidad": 100.50,
      "estado": "PENDIENTE",
      "f_inicio": "2025-01-15",
      "f_termino": "2025-06-15",
      "f_caducidad": "2025-12-31",
      "dias": 90
    }
  ]
}
```

- Fechas: string en formato `YYYY-MM-DD` o `null`.
- `dias`: número entero o `null`.

## Create / Update (body)

En el array `tipos_permiso` cada elemento puede enviar:

- `id_tipo_permiso` (number, requerido)
- `derecho_entidad` (number, requerido)
- `f_inicio`, `f_termino`, `f_caducidad` (string `YYYY-MM-DD` o null, opcionales)
- `dias` (number o null, opcional)

El backend debe persistir estos cuatro campos en la tabla pivot (o equivalente) trámite–tipo_permiso.

---

## Documentos por tipo_permiso (upload)

Al subir un documento (`POST .../tramites/{id}/documentos`) el body es **FormData** con:

- `id_tipo_permiso` (number)
- `seccion` (string: `documentos_tramite` | `fotos` | `seguimiento`)
- `archivo` (binary)
- `nombre_documento` (string)
- `categoria` (string, nombre de la categoría)
- **`id_categoria`**: número. Si se envía **-1**, el backend debe **crear una nueva categoría** con el nombre indicado en `categoria` (y asociarla al trámite y tipo_permiso). Si es un id existente, se asocia el documento a esa categoría.

---

## Actualización de fechas al subir documentos (por tipo_permiso)

El frontend, al subir un documento cuya **categoría** (nombre) coincide con las siguientes, llama al endpoint de fechas para actualizar el pivot de ese **tipo_permiso**:

| Categoría (nombre, sin importar mayúsculas) | Campo actualizado |
|--------------------------------------------|-------------------|
| **Expediente CPB**                          | `f_inicio` = fecha de hoy |
| **Decreto** o **Hoja resumen**              | `f_termino` = fecha de hoy |

- **Días:** el backend debe calcular `dias` como la diferencia en días entre `f_termino` y `f_inicio` (solo cuando ambos estén definidos). Se recomienda recalcular `dias` en el endpoint `PATCH .../fechas` cuando se actualice `f_inicio` o `f_termino`.

### PATCH `.../tramites/{id}/tipos-permiso/{idTipoPermiso}/fechas`

Actualiza solo las fechas del tipo_permiso (pivot) para ese trámite.

**Body (JSON):**

- `f_inicio` (string `YYYY-MM-DD` o null, opcional)
- `f_termino` (string `YYYY-MM-DD` o null, opcional)

**Comportamiento backend:**

- Actualizar en la tabla pivot los campos enviados.
- Si tras la actualización existen ambos `f_inicio` y `f_termino`, calcular y persistir `dias = diferencia en días (f_termino - f_inicio)`.
- Respuesta: `{ "success": true }` o `{ "success": false, "error": "..." }`.

---

## Guardar todo (una sola petición)

El frontend envía **una única petición** al hacer "Guardar" en la vista de documentos: documentos (archivos), fecha de caducidad y guardar por tipo_permiso.

### POST `.../tramites/{id}/guardar-todo`

**Body (FormData):**

- **Archivos (mismo formato que batch):** `id_tipo_permiso[]`, `archivo[]`, `seccion[]`, `id_categoria[]`, `categoria[]`. Puede no enviarse ningún archivo (solo el resto).
- **`f_caducidad`** (string `YYYY-MM-DD`, opcional): actualiza la fecha de caducidad del trámite.
- **`guardar_tipos`** (string JSON, requerido): array de objetos, uno por tipo_permiso:
  - `id_tipo_permiso` (number)
  - `documentos_tramite_ids` (number[])
  - `fotos_ids` (number[])
  - `seguimiento_ids` (number[])

**Comportamiento backend (en este orden):**

1. Crear todos los documentos a partir de los archivos (misma lógica que `POST .../documentos/batch`). Si no hay archivos, este paso no hace nada.
2. Añadir los ids de los documentos recién creados a los arrays correspondientes en `guardar_tipos` (por `id_tipo_permiso` y `seccion` del documento).
3. Si se envió `f_caducidad`, actualizar el trámite con esa fecha.
4. Para cada elemento de `guardar_tipos` (ya con los nuevos ids incorporados), ejecutar la misma lógica que `POST .../tipos-permiso/{idTipoPermiso}/guardar` (sincronizar documentos_tramite_ids, fotos_ids, seguimiento_ids).

**Respuesta:** `{ "success": true, "data": TramiteDocumento[] }` donde `data` son solo los documentos creados en este request, o `{ "success": false, "error": "..." }`.
