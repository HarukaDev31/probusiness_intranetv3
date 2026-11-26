/**
 * `ui` de `UTabs` (variant="link") para las pestañas del slot `body-top` de `DataTable variant="v3"`:
 * texto plano, sin recuadro en las inactivas y solo el subrayado naranja en la activa.
 * Anula el borde de las pestañas inactivas y la altura fija de `app.config.ts`.
 */
export const DATA_TABLE_V3_TABS_UI = {
  root: 'h-auto flex-1 min-w-0',
  list: 'gap-1 border-b-0 p-0',
  trigger: 'rounded-none px-4 py-3 data-[state=inactive]:border-0',
  indicator: 'h-0.5 rounded-none border-0'
} as const
