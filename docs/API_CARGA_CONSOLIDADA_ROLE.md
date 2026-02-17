# API Carga Consolidada: parámetro de rol (vista)

El frontend envía el **rol de vista** en las peticiones de listado (index) y de pasos para que, cuando el usuario sea **Jefe Importación**, el backend use ese rol en lugar del rol del token.

## Endpoints afectados

### 1. GET `/api/carga-consolidada/contenedor`

Listado de contenedores (abiertos o completados) según filtros.

**Query params (existentes):**
- `page`, `limit`, `search`, `fecha_inicio`, `fecha_fin`, `estado_china`, `completado`, `estado_documentacion`

**Query param nuevo:**
- **`role`** (opcional): Rol de la vista desde la que se llama.
  - Valores esperados: `Coordinación`, `Documentacion`, o el valor que use el frontend para el rol actual de la sección (abiertos/completados por coordinación o documentación).

**Comportamiento requerido en backend:**
- Si el **rol del token** del usuario es **Jefe Importación** (p. ej. `Jefe Importacion` o el valor que tengan en BD) y la petición incluye **`role`**:
  - Usar el valor de **`role`** de la petición como rol efectivo para:
    - Autorización (permisos)
    - Filtrado o lógica de negocio que dependa del rol (columnas, estados, etc.)
- Si el usuario **no** es Jefe Importación, ignorar el query `role` y seguir usando solo el rol del token.

---

### 2. GET `/api/carga-consolidada/contenedor/pasos/{id}`

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
