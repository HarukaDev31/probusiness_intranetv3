---
name: nuxt-ui-tipado-contratos
description: >-
  UI con componentes Nuxt UI, tipado TypeScript estricto y contratos API sin
  mapeos innecesarios: el backend devuelve la forma exacta que consume el front.
  Usar al crear/editar páginas Vue, selects, tablas, formularios o endpoints
  nuevos en la intranet.
---

# Nuxt UI + tipado estricto + contratos sin mapeo

## UI

1. Preferir componentes **Nuxt UI** del proyecto (`UButton`, `USelect`, `USelectMenu`, `UCard`, `UBadge`, `UTabs`, `UFormField`, `UModal`, `UInput`, etc.).
2. Antes de inventar UI custom, reutilizar lo del repo (`PageHeader`, `DataTable`, modales commons).
3. Selects: si el API ya trae `{ label, value }`, usar `USelect` / `USelectMenu` directo. Si trae otra forma estable (`id`/`nombre`), usar `value-key` / `label-key` — **no** `.map()` solo para renombrar.
4. Drag & drop: `vuedraggable` (ya en el proyecto), con handles y tipado del `v-model`.

## Tipado

1. Tipado **estricto**: interfaces/types en `types/` o junto al service; evitar `any` y `as any` salvo puente puntual a Nuxt UI.
2. Respuestas API tipadas en el service (`Promise<{ success: boolean; data: T; message?: string }>`).
3. Pages/components consumen el **mismo** tipo que declara el service/composable; no redefinir DTOs “de vista” distintos sin necesidad.

## Contratos (back ↔ front)

1. El **backend devuelve tal cual** lo que la pantalla necesita (campos, nombres, opciones de select, árbol).
2. **No mapear** en el front para renombrar (`id`→`value`, `nombre`→`label`) si se puede ajustar el endpoint o usar `value-key`/`label-key`.
3. Transformaciones permitidas solo cuando son lógica de negocio real (p. ej. aplanar árbol al guardar **en el back**, no en el front).
4. Pages/components **no** llaman services: pasan por composables (`precheck-components-architecture`).

## Async

Guardar / cargar / borrar: `useSpinner` + `useModal` (`spinner-modal-async-actions`).

## Checklist rápido

- [ ] ¿Hay componente Nuxt UI / del repo?
- [ ] ¿Tipos estrictos alineados al JSON del API?
- [ ] ¿Se puede evitar el `.map()` cambiando el back o con `value-key`/`label-key`?
- [ ] ¿Composable entre page y service?
