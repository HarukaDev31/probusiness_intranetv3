import type { Locator, Page } from '@playwright/test'
import type { CaptureShot, CaptureType } from './types'

export type CaptureIntent = 'create' | 'edit' | 'delete' | 'view' | 'save' | 'filters' | 'tabs' | 'modal' | 'destination' | 'unknown'

function plain(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function literalPattern(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || '.+', 'i')
}

function sourceText(shot: CaptureShot): string {
  return `${shot.intent?.title ?? ''} ${shot.intent?.hint ?? ''}`.trim()
}

export function inferIntent(title = '', hint = ''): CaptureIntent {
  const value = plain(`${title} ${hint}`)
  if (/\b(filtros?|filtrar|busqueda|buscar)\b/.test(value)) return 'filters'
  if (/\b(tab|tabs|pestana|pestanas)\b/.test(value)) return 'tabs'
  if (/\b(guardar|grabar|confirmar)\b/.test(value)) return 'save'
  if (/\b(crear|nuevo|nueva|agregar|registrar)\b/.test(value)) return 'create'
  if (/\b(editar|modificar|lapiz)\b/.test(value)) return 'edit'
  if (/\b(eliminar|borrar|papelera)\b/.test(value)) return 'delete'
  if (/\b(ver|visualizar|ojo|ficha|detalle)\b/.test(value)) return 'view'
  if (/\b(destino|navegar|redireccion|otra pantalla)\b/.test(value)) return 'destination'
  if (/\b(modal|dialogo|ventana emergente)\b/.test(value)) return 'modal'
  return 'unknown'
}

export function inferCaptureType(title = '', hint = ''): CaptureType {
  const combined = `${title} ${hint}`
  if (/\b(modal|diálogo|dialogo|ventana emergente|formulario)\b/i.test(combined)) return 'modal'
  if (/\b(tarjeta|tabla|listado|filtros?|pestañas?)\b/i.test(combined)) return 'seccion'
  const intent = inferIntent(title, hint)
  if (intent === 'destination' || intent === 'view') return 'destino'
  if (intent === 'filters' || intent === 'tabs' || intent === 'create' || intent === 'edit') return 'seccion'
  return 'control'
}

function quotedLabels(value: string): string[] {
  return [...value.matchAll(/["“”'«]([^"“”'»]{2,60})["“”'»]/g)]
    .map(match => match[1].trim())
    .filter(Boolean)
}

async function firstVisible(candidates: Locator[]): Promise<Locator | null> {
  for (const candidate of candidates) {
    const count = await candidate.count().catch(() => 0)
    for (let index = 0; index < Math.min(count, 8); index += 1) {
      const item = candidate.nth(index)
      if (await item.isVisible().catch(() => false)) return item
    }
  }
  return null
}

function controls(page: Page, intent: CaptureIntent, labels: string[]): Locator[] {
  const pattern = intentPattern(intent)
  const attributeSelectors: Record<CaptureIntent, string> = {
    create: '[title*="crear" i], [title*="nuevo" i], [title*="agregar" i], [aria-label*="crear" i], [aria-label*="nuevo" i], [aria-label*="agregar" i]',
    edit: '[title*="editar" i], [title*="modificar" i], [title*="lápiz" i], [aria-label*="editar" i], [aria-label*="modificar" i]',
    delete: '[title*="eliminar" i], [title*="borrar" i], [title*="papelera" i], [aria-label*="eliminar" i], [aria-label*="borrar" i]',
    view: '[title*="ver" i], [title*="detalle" i], [title*="ficha" i], [aria-label*="ver" i], [aria-label*="detalle" i]',
    save: '[title*="guardar" i], [title*="confirmar" i], [aria-label*="guardar" i], [aria-label*="confirmar" i]',
    filters: '[title*="filtro" i], [aria-label*="filtro" i]',
    tabs: '[title*="pestaña" i], [aria-label*="pestaña" i]',
    modal: '[title*="abrir" i], [aria-label*="abrir" i]',
    destination: '[title*="abrir" i], [title*="detalle" i], [aria-label*="abrir" i], [aria-label*="detalle" i]',
    unknown: '[data-manual-capture="__manual_intent_unresolved__"]',
  }
  const iconSelectors: Partial<Record<CaptureIntent, string>> = {
    create: 'button:has([class*="plus" i]), button:has([class*="add" i])',
    edit: 'button:has([class*="pencil" i]), button:has([class*="edit" i])',
    delete: 'button:has([class*="trash" i]), button:has([class*="delete" i])',
    view: 'button:has([class*="eye" i]), a:has([class*="eye" i])',
    save: 'button:has([class*="save" i]), button:has([class*="check" i])',
  }
  const candidates: Locator[] = [
    page.getByRole('button', { name: pattern }),
    page.getByRole('link', { name: pattern }),
    page.locator(attributeSelectors[intent]),
  ]
  if (iconSelectors[intent]) candidates.push(page.locator(iconSelectors[intent]!))
  for (const label of labels) {
    candidates.push(
      page.getByRole('button', { name: label, exact: false }),
      page.getByRole('link', { name: label, exact: false }),
      page.getByText(label, { exact: false }),
      page.locator(`[title=${JSON.stringify(label)}], [aria-label=${JSON.stringify(label)}]`),
    )
  }
  return candidates
}

function intentPattern(intent: CaptureIntent): RegExp {
  const patterns: Record<CaptureIntent, RegExp> = {
    create: /crear|nuevo|nueva|agregar|registrar/i,
    edit: /editar|modificar|lápiz|lapiz/i,
    delete: /eliminar|borrar|papelera/i,
    view: /ver|visualizar|ojo|ficha|detalle/i,
    save: /guardar|grabar|confirmar/i,
    filters: /filtro|filtrar|búsqueda|busqueda|buscar/i,
    tabs: /tab|pestaña|pestana/i,
    modal: /abrir|mostrar|modal|diálogo|dialogo/i,
    destination: /abrir|ir a|ver|detalle|destino/i,
    unknown: /$a/,
  }
  return patterns[intent]
}

function shouldOpenResult(shot: CaptureShot, intent: CaptureIntent): boolean {
  const hint = plain(shot.intent?.hint ?? '')
  const title = plain(shot.intent?.title ?? '')
  const combined = `${title} ${hint}`
  if (/\btarjetas?\b/.test(combined)) return false
  if (/\b(boton|control|icono|lapiz|papelera|ojo)\b/.test(hint) && !/\b(modal|dialogo|formulario|ficha|detalle|detalles|confirmacion|destino|pantalla)\b/.test(hint)) {
    return false
  }
  return intent === 'modal'
    || intent === 'destination'
    || intent === 'create'
    || intent === 'edit'
    || (intent === 'view' && /\b(ficha|detalle|detalles|pantalla|formulario)\b/.test(combined))
    || /\b(modal|dialogo|formulario|confirmacion|ventana emergente|destino|pantalla resultante|despues de)\b/.test(hint)
}

export async function resolveIntentTarget(page: Page, shot: CaptureShot): Promise<Locator> {
  const title = shot.intent?.title ?? ''
  const hint = shot.intent?.hint ?? ''
  const intent = inferIntent(title, hint)
  const labels = quotedLabels(`${title} ${hint}`)
  const context = `${shot.id} (${title || 'sin título'}${hint ? `; ${hint}` : ''})`

  if (intent === 'filters') {
    const filterButton = await firstVisible([
      page.getByRole('button', { name: /filtros?/i }),
      page.locator('[aria-label*="filtro" i], [title*="filtro" i]'),
    ])
    if (filterButton) {
      await filterButton.click()
      await page.waitForTimeout(400)
    }
    const target = await firstVisible([
      page.locator('[data-manual-capture="data-table"]'),
      page.locator('.filters-panel'),
      page.getByRole('region', { name: /filtro|búsqueda|buscar/i }),
      page.locator('form').filter({ hasText: /filtro|búsqueda|buscar/i }),
      page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="filtrar" i]'),
      page.locator('[data-manual-capture*="filtro" i]'),
      ...controls(page, intent, labels),
    ])
    if (target) return target
  } else if (/\btarjetas?\b/.test(plain(`${title} ${hint}`))) {
    const card = await firstVisible([
      page.locator('[data-manual-capture="news-card"]'),
      page.locator('article'),
    ])
    if (card) return card
  } else if (intent === 'tabs') {
    const target = await firstVisible([
      page.getByRole('tablist'),
      page.getByRole('tab', { name: labels[0] ? new RegExp(labels[0], 'i') : /.+/ }),
      page.locator('[aria-label*="pestaña" i], [data-manual-capture*="tab" i]'),
    ])
    if (target) return target
  } else {
    const trigger = await firstVisible(controls(page, intent, labels))
    if (trigger) {
      if (!shouldOpenResult(shot, intent)) return trigger
      await trigger.click()
      await page.waitForTimeout(500)
      await page.waitForLoadState('domcontentloaded').catch(() => undefined)
      const dialog = await firstVisible([
        page.getByRole('dialog'),
        page.locator('[aria-modal="true"]'),
        page.locator('[data-manual-capture*="modal" i]'),
      ])
      if (dialog) return dialog
      if (intent === 'destination' || intent === 'view' || intent === 'create' || intent === 'edit') {
        const destination = await firstVisible(labels.flatMap(label => [
          page.getByRole('heading', { name: label, exact: false }),
          page.getByText(label, { exact: false }),
        ]))
        if (destination) return destination
        const main = await firstVisible([
          page.getByRole('main'),
          page.locator('main'),
          page.locator('[data-page], [class*="page-container" i]'),
        ])
        if (main) return main
      }
      throw new Error(`La intención abrió un resultado, pero no apareció modal ni destino identificable para ${context}`)
    }

    if (intent === 'modal') {
      const dialog = await firstVisible([page.getByRole('dialog'), page.locator('[aria-modal="true"]')])
      if (dialog) return dialog
    }
  }

  const contentFallback = await firstVisible([
    ...labels.map(label => page.getByText(label, { exact: false })),
    page.locator('form').filter({ hasText: literalPattern(title || hint) }),
    page.locator('table'),
    page.getByRole('main'),
    page.locator('main'),
  ])
  if (contentFallback) return contentFallback

  const attempted = intent === 'unknown'
    ? 'texto entre comillas y atributos title/aria'
    : `controles asociados a la intención "${intent}"`
  throw new Error(`No se encontró un target conservador para ${context}. Se intentaron ${attempted}. Declara target/actions en el manifiesto o añade un data-manual-capture estable.`)
}

export function describeIntent(shot: CaptureShot): string {
  return `${inferIntent(shot.intent?.title, shot.intent?.hint)}: ${sourceText(shot)}`
}
