# API Carga Consolidada: parámetro de rol (vista)

El frontend envía el **rol de vista** en las peticiones de listado (index) y de pasos para que, cuando el usuario sea **Jefe Importación**, el backend use ese rol en lugar del rol del token.

## Endpoints afectados

### 1. GET `/api/carga-consolidada/contenedor`

Listado de contenedores (abiertos o completados) según filtros.

**Query params (existentes):**
- `page`, `limit`, `search`, `fecha_inicio`, `fecha_fin`, `estado_china`, `completado`, `estado_documentacion`

**Comportamiento del parámetro `completado`:**
- **`completado=false`** (booleano): el backend debe devolver **solo contenedores que NO están en completados** (contenedores no completados / abiertos). El frontend (p. ej. permisos de trámite) usa este valor para listar contenedores disponibles sin filtrar por `estado_documentacion`.
- **`completado=true`**: solo contenedores completados.
- Si no se envía `completado`: comportamiento por defecto del listado (según implementación actual).

**Query param nuevo:**
- **`role`** (opcional): Rol de la vista desde la que se llama.
  - Valores esperados: `Coordinación`, `Documentacion`, o el valor que use el frontend para el rol actual de la sección (abiertos/completados por coordinación o documentación).

**Comportamiento requerido en backend:**
- Si el **rol del token** del usuario es **Jefe Importación** (p. ej. `Jefe Importacion` o el valor que tengan en BD) y la petición incluye **`role`**:
  - Usar el valor de **`role`** de la petición como rol efectivo para:
    - Autorización (permisos)
    - Filtrado o lógica de negocio que dependa del rol (columnas, estados, etc.)
- Si el usuario **no** es Jefe Importación, ignorar el query `role` y seguir usando solo el rol del token.

**Campo opcional por contenedor (vista Coordinación / Documentación):**
- **`estado_permiso_por_tipo`** (array, opcional): **por fila/por cotización** (no por contenedor). Cada contenedor en el listado puede incluir este array con el estado del permiso por tipo asociado a esa cotización. Estructura: `[{ id_tipo_permiso?: number, nombre_permiso: string, estado: string }]`. El front lo muestra en la columna Estado debajo del estado principal (estado_china / estado_documentacion).

---

### 2. GET `/api/carga-consolidada/contenedor/valid-containers-documentacion`

Endpoint **ligero** para el modal de crear/editar trámite (permisos). Devuelve solo contenedores cuyo **`estado_documentacion` no está completado** (p. ej. pendiente, en proceso), sin paginación ni el payload pesado del listado principal.

**Método:** `GET`  
**Query params:** ninguno (opcional: los que el backend necesite para filtros internos).

**Respuesta esperada (cuadrada con el frontend para el select del modal):**

```json
{
  "success": true,
  "data": [
    { "id": 1, "carga": "101" },
    { "id": 2, "carga": "102" }
  ]
}
```

- **`data`**: array de objetos. Cada uno debe tener al menos:
  - **`id`** (number): ID del contenedor (se usa como `value` en el select).
  - **`carga`** (string o number, opcional): número de carga; el frontend muestra en el select como `#carga`. Si no se envía, se usa `#id`.

El frontend mapea cada item a `{ id, carga }` para rellenar las opciones del select "Selecciona el consolidado" (label: `#carga`, value: `id`).

---

### 3. Estado permiso por tipo **por cotización** (por fila)

En las páginas de detalle (cotizaciones/clientes), el estado de permiso por tipo se obtiene **por fila (por cotización)**, no por contenedor. Los endpoints que devuelven listas de cotizaciones o de pagos por contenedor deben incluir **`estado_permiso_por_tipo`** en cada elemento de la lista cuando el rol sea Coordinación, Documentación, Jefe Importación o Cotizador:

- **GET** `.../contenedor/cotizaciones/{idContenedor}` (prospectos): cada cotización en `data` debe incluir `estado_permiso_por_tipo` (array) calculado a partir de `ConsolidadoCotizacionAduanaTramite` con `id_cotizacion` = esa cotización.
- **GET** `.../cotizaciones-pagos/{idContenedor}` (pagos en tab cotizaciones): cada fila debe incluir `estado_permiso_por_tipo`.
- **GET** `.../contenedor/clientes/pagos/{idContenedor}` (pagos en tab clientes): cada fila debe incluir `estado_permiso_por_tipo`.
- **GET** `.../contenedor/clientes/general/{idContenedor}` (tab general de clientes): cada elemento en `data` debe incluir `estado_permiso_por_tipo` (array) cuando el rol sea Documentación, Coordinación, Jefe Importación o Cotizador (o cuando la petición envíe `role` con uno de esos valores). El front lo usa en la columna Estado del perfil Documentación.

Estructura: `[{ id_tipo_permiso?: number, nombre_permiso: string, estado: string }, ...]`.

---

### 4. GET `/api/carga-consolidada/contenedor/pasos/{id}`

Pasos disponibles para un contenedor (vista pasos).

**Query param nuevo:**
- **`role`** (opcional): Rol de la vista (ej. `Coordinación`, `Documentacion`).

**Comportamiento requerido en backend:**
- Si el **rol del token** es **Jefe Importación** y la petición incluye **`role`**:
  - Usar el **`role`** de la petición como rol efectivo para decidir qué pasos devolver y con qué permisos.
- En caso contrario, ignorar `role` y usar solo el rol del token.

---

## Resumen

| Condición                         | Acción del backend                          |
|----------------------------------|---------------------------------------------|
| Token = Jefe Importación y hay `role` | Usar `role` de la petición como rol efectivo |
| Token = Jefe Importación y no hay `role` | Comportamiento actual (solo token)          |
| Token ≠ Jefe Importación         | Ignorar `role`; usar solo rol del token      |

## Valores de rol que envía el frontend

Según `~/constants/roles.ts`:
- `Coordinación`
- `Documentacion`
- `Jefe Importacion` (rol del usuario; no se envía como vista, sino que el backend lo detecta por el token)

El frontend envía en `role` el rol de la **sección** desde la que se abre la pantalla (coordinación o documentación), para que un Jefe Importación pueda ver la misma lógica/permisos que Coordinación o Documentación según la ruta elegida.
