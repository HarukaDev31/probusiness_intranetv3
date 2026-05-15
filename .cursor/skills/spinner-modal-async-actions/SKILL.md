---
name: spinner-modal-async-actions
description: >-
  Acciones asíncronas con useSpinner y useModal (éxito / error), y tablas DataTable con USelect:
  una columna por control, cell con h(USelect) directo. Usar al guardar, cambiar estado,
  POST/PUT/DELETE o columnas editables en tablas.
---

# Acciones async: spinner y modales

## Cuándo aplicar

- Cualquier operación que **llame al backend o a un composable async** y el usuario deba ver feedback claro: **carga global** + **resultado** (éxito o error).
- Especialmente: **cambio de estado**, guardados, eliminaciones, envíos de formularios.

## Herramientas del proyecto

- **`useSpinner()`** (`composables/commons/useSpinner.ts`): `withSpinner(operation, mensajeOpcional)` muestra el spinner mientras la promesa está en curso y lo oculta en `finally`.
- **`useModal()`** (`composables/commons/useModal.ts`):
  - `showSuccess(title, message)` — operación correcta.
  - `showError(title, message)` — fallo; suele ser persistente hasta cerrar.

## Patrón recomendado

1. Validaciones y reglas de negocio **antes** del spinner (si fallan, `showError` y `return`).

2. Envolver la llamada real en **`withSpinner`**:

```ts
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()

await withSpinner(async () => {
  try {
    const res = await operacionDesdeComposable()
    if (res.ok === false) throw new Error(res.error ?? 'Operación no completada')
    // o si la función lanza, solo await
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ocurrió un error.'
    throw new Error(msg)
  }
}, 'Guardando…')
```

3. Tras **éxito** (después del `await withSpinner` sin excepción): `showSuccess('Título', 'Detalle breve')` y actualizar UI / mensajes locales si aplica.

4. En **`catch`** exterior (si el spinner re-lanza o hay lógica alrededor): `showError('Título', mensaje)`.

Referencia en el repo: `pages/cotizaciones/index.vue` (confirmación + `withSpinner` + `showSuccess` / `showError`).

## Composables y mutación de estado

- Si una operación **actualiza el estado local y luego persiste en API**, el composable debe poder **devolver `{ ok, error }`** o **lanzar**, y **revertir** el estado local si la API falla — para no mostrar éxito con datos incoherentes.
- Las **pages/components** siguen usando el composable; no duplicar llamadas a `services/*` si ya existe `useXxx` que las encapsule.

## Detalles UX

- Mensaje del spinner: corto, con puntos suspensivos si es largo (ej. `Actualizando estado…`).
- Títulos de modal: una frase; cuerpo: concreto (qué pasó, qué hacer si falló).

## Tablas: USelect y columnas (evitar sobre-ingeniería)

- **Una columna por control.** Si hay complejidad y estado, son **dos** entradas en el array de columnas (`TableColumn`), cada una con su `header` y su `cell`.
- En `cell`, lo habitual en el repo es devolver **`h(USelect as any, { modelValue, items, … })`** (ver `pages/inspeccionados/index.vue`, `pages/curso/index.vue`). Opcional: envolver en un `div` mínimo con `onClick` / `onPointerdown` que hagan `stopPropagation` si la fila tiene `@row-click`.
- **No** acoplar dos selects en una sola columna con grids, labels extra y funciones tipo “pintar celda compuesta” salvo requisito de diseño explícito.
- **No** crear helpers genéricos solo para montar el mismo `h()`; repetir el objeto columna o el bloque `cell` es preferible a otra capa de indirección.

## Alcance de mutaciones con feedback

- Mismo patrón (`withSpinner`, `showSuccess`, `showError`) para **complejidad**, **estado** y el resto de campos persistidos que el usuario cambie desde la UI, tras validar reglas de negocio.
