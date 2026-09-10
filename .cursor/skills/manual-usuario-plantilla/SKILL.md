---
name: manual-usuario-plantilla
description: Plantilla y estilos 1:1 del Manual de Usuario (propuesta Probusiness). Usar al crear o editar artículos del CMS, bloques de manual-usuario, seeds/migraciones de manual_paginas/manual_bloques, o cuando el usuario pida documentar un módulo (p. ej. Pedidos de Curso, Alumnos).
---

# Manual de usuario — plantilla y estilos

Fuente visual: `propuesta_manual_probusiness_1.html`. El lector (`pages/manual-usuario/index.vue` + `ManualBlockRenderer.vue`) debe verse **1 a 1** con esa propuesta.

## Tokens

| Token | Valor |
|-------|--------|
| Navy | `#1F2A44` |
| Orange | `#E8672C` |
| Orange soft | `#FCE8DE` |
| Amber / aviso | `#9A5B00` / `#FDF3E3` |
| Gray / border | `#6B7280` / `#E5E7EB` |
| Resultado | `#1B7A4B` / `#EAF7EF` |
| Nota | `#1E3A8A` / `#EAF2FF` |

CSS: `assets/css/manual-usuario.css` (prefijo `mu-`). No reinventar paleta ni tipografía.

## Arquitectura CMS

- Back: `../intranet_back` (PHP 7). Tablas `manual_paginas`, `manual_bloques`, `manual_media`.
- Una **página** = un artículo (`role_slug` + `modulo_key` único).
- Raíz = **grupo** `snapshot.variant = articulo` (tags + título). El breadcrumb del lector es dinámico: Inicio → rol → menú (página) → artículo.
- Widgets solo como hijos. Pages/components no llaman `ManualUsuarioService`; usan `useManualUsuario`.

## Plantilla de cada funcionalidad (orden fijo)

1. Encabezado — grupo `articulo`: `tags` (rol, módulo, keywords). Breadcrumb dinámico (no se edita en el CMS).
2. `texto` + `snapshot.qa = true` — ¿Qué es?
3. `texto` qa — ¿Para qué sirve?
4. `texto` qa — ¿Quién lo utiliza?
5. `texto` qa — ¿Cuándo utilizarlo?
6. `flow` — Pasos (una acción por ítem). Varios `flow` si hay más de un procedimiento.
7. Grupo `colapsable` — Campos (`tabla` `variant: doc`, columnas Campo · Origen · Ejemplo).
8. Grupo `colapsable` — Consideraciones.
9. Grupo `colapsable` — Errores (`tabla` doc: Situación · Causa · Solución).
10. `texto` qa — Ejemplo práctico (**solo datos ficticios**).
11. `callout` `tone: success` — Resultado esperado.
12. `texto` qa — Ver también.

## Payloads

```json
{ "subtitulo": null, "snapshot": { "variant": "articulo", "tags": ["Rol: Comercial"] } }
```

```json
{ "snapshot": { "qa": true, "body": "…" } }
```

```json
{ "snapshot": { "colapsable": true } }
```

```json
{ "snapshot": { "variant": "doc", "columns": ["Campo","Origen","Ejemplo"], "rows": [["Fecha","Automático","12-08-2026"]] } }
```

```json
{ "snapshot": { "tone": "success", "title": "Resultado esperado:", "body": "…" } }
```

Callouts: `warning` (ámbar), `info`/`note` (azul), `danger`, `success` (caja verde).

## Contenido

- Orientado a la **tarea**, no al orden de la UI.
- Frases cortas, pasos numerados, sin rutas de API ni env vars.
- Capturas recortadas; nunca datos reales de clientes.
- Si falta un dato: escribir `pendiente de definir` (se ve en itálica gris). No inventar comportamiento.

## Cómo insertar en BD

Idempotente (borra bloques de esa página y los recrea):

```bash
php artisan manual:seed-curso-alumnos
```

Clase: `app/Services/ManualUsuario/ManualUsuarioCursoAlumnosSeeder.php`.

Para un módulo nuevo: copiar ese seeder, cambiar `ROLE_SLUG` / `MODULO_KEY` / copy, y una migración que llame `->seed()`. Unique: `(role_slug, modulo_key)`.

Rol Comercial = `comercial`, `id_grupo` 1203. Pedidos de Curso Alumnos = `curso/alumnos`.

## Mantenedor CMS

En `/manual-usuario/admin/{id}`:

- **Generar plantilla completa** — modal con título, clave y tags; crea el artículo y las 12 subsecciones.
- **Agregar subsección** — selector (barra de bloques o dentro del grupo artículo) para insertar una subsección suelta.
- Lógica: `composables/manual-usuario/useManualPlantilla.ts` (`MANUAL_PLANTILLA_SECCIONES`, `applyPlantillaCompleta`, `applySeccion`).
