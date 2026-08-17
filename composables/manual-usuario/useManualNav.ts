import type { InjectionKey, ComputedRef } from 'vue'
import type { ManualBlock, ManualUsuarioManualData } from '~/types/manualUsuario'

export type ManualNavCrumb = {
  label: string
  anchorKey?: string
  current?: boolean
}

export type ManualNavContext = {
  scrollTo: (key: string) => void
  scrollToTop: () => void
  resolveCrumbs: (breadcrumb: string, currentBlockId?: number) => ManualNavCrumb[]
}

export const MANUAL_NAV_KEY: InjectionKey<ComputedRef<ManualNavContext | null>> = Symbol('manualNav')

type NavEntry = {
  key: string
  labels: string[]
}

export function normalizeManualNavLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function titleVariants(title: string): string[] {
  const t = title.trim()
  if (!t) return []
  const parts = t.split(/\s*[—·|]\s*/)
  return [t, ...parts.map((p) => p.trim())].filter(Boolean)
}

function addEntry(map: Map<string, NavEntry>, key: string, ...labels: (string | null | undefined)[]) {
  const normalized = labels
    .flatMap((l) => (l ? titleVariants(l) : []))
    .map(normalizeManualNavLabel)
    .filter(Boolean)

  if (!normalized.length) return

  const existing = map.get(key)
  if (existing) {
    const merged = new Set([...existing.labels, ...normalized])
    existing.labels = [...merged]
  } else {
    map.set(key, { key, labels: [...new Set(normalized)] })
  }
}

function walkBlocks(blocks: ManualBlock[], map: Map<string, NavEntry>) {
  for (const block of blocks) {
    if (block.tipo === 'grupo') {
      addEntry(map, `b-${block.id}`, block.titulo, block.clave)
    }
    if (block.children?.length) walkBlocks(block.children, map)
  }
}

export function buildManualNavIndex(manual: ManualUsuarioManualData): NavEntry[] {
  const map = new Map<string, NavEntry>()
  const pages = [...(manual.pages || [])].sort((a, b) => a.orden - b.orden || a.id - b.id)
  const firstPage = pages[0]

  if (manual.role?.nombre && firstPage) {
    addEntry(map, `p-${firstPage.id}`, manual.role.nombre, manual.role.slug)
  }

  for (const page of pages) {
    addEntry(map, `p-${page.id}`, page.titulo, page.descripcion)
    const modulo = String(page.modulo_key || '').trim()
    if (modulo) {
      addEntry(map, `p-${page.id}`, modulo.replace(/\//g, ' '))
      for (const part of modulo.split('/').filter(Boolean)) {
        addEntry(map, `p-${page.id}`, part.replace(/-/g, ' '))
      }
    }
    walkBlocks(page.blocks || [], map)
  }

  return [...map.values()]
}

function findAnchor(label: string, entries: NavEntry[], reservedKeys: Set<string>): string | undefined {
  const normalized = normalizeManualNavLabel(label)
  if (!normalized) return undefined
  if (/^inicio$/i.test(label.trim())) return '__top__'

  const matches = (entry: NavEntry) =>
    !reservedKeys.has(entry.key) &&
    entry.labels.some((l) => l === normalized || l.includes(normalized) || normalized.includes(l))

  const exact = entries.find(
    (e) => !reservedKeys.has(e.key) && e.labels.some((l) => l === normalized)
  )
  if (exact) return exact.key

  const partial = entries.find(matches)
  return partial?.key
}

function isTocGrupo(block: ManualBlock): boolean {
  if (block.tipo !== 'grupo') return false
  return !block.payload?.snapshot?.colapsable
}

function findBlockTrail(
  pages: ManualUsuarioManualData['pages'],
  blockId: number
): { page: ManualUsuarioManualData['pages'][number]; trail: ManualBlock[] } | null {
  const walk = (blocks: ManualBlock[], ancestors: ManualBlock[]): ManualBlock[] | null => {
    for (const block of blocks) {
      const next = isTocGrupo(block) ? [...ancestors, block] : ancestors
      if (block.id === blockId) {
        return isTocGrupo(block) ? next : [...ancestors, block]
      }
      if (block.children?.length) {
        const hit = walk(block.children, next)
        if (hit) return hit
      }
    }
    return null
  }

  for (const page of pages) {
    const trail = walk(page.blocks || [], [])
    if (trail) return { page, trail }
  }
  return null
}

function pushUniqueCrumb(crumbs: ManualNavCrumb[], crumb: ManualNavCrumb) {
  const last = crumbs[crumbs.length - 1]
  if (last && normalizeManualNavLabel(last.label) === normalizeManualNavLabel(crumb.label)) {
    crumbs[crumbs.length - 1] = { ...last, ...crumb, label: last.label }
    return
  }
  crumbs.push(crumb)
}

/** Inicio → Rol → ítem del menú (página) → artículo */
export function crumbsFromManualTree(
  manual: ManualUsuarioManualData,
  currentBlockId: number
): ManualNavCrumb[] {
  const pages = [...(manual.pages || [])].sort((a, b) => a.orden - b.orden || a.id - b.id)
  const firstPage = pages[0]
  const hit = findBlockTrail(pages, currentBlockId)
  const crumbs: ManualNavCrumb[] = []

  pushUniqueCrumb(crumbs, { label: 'Inicio', anchorKey: '__top__' })

  const roleLabel = String(manual.role?.nombre || '').trim()
  if (roleLabel) {
    pushUniqueCrumb(crumbs, {
      label: roleLabel,
      anchorKey: firstPage ? `p-${firstPage.id}` : '__top__',
    })
  }

  if (hit) {
    const pageTitle = String(hit.page.titulo || '').trim()
    if (pageTitle) {
      pushUniqueCrumb(crumbs, { label: pageTitle, anchorKey: `p-${hit.page.id}` })
    }
    hit.trail.forEach((block, i) => {
      const label = String(block.titulo || block.clave || '').trim()
      if (!label) return
      const last = i === hit.trail.length - 1
      pushUniqueCrumb(crumbs, {
        label,
        anchorKey: last ? undefined : `b-${block.id}`,
        current: last,
      })
    })
  }

  if (crumbs.length) {
    crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1], current: true, anchorKey: undefined }
  }
  return crumbs
}

export function resolveManualBreadcrumbCrumbs(
  breadcrumb: string,
  entries: NavEntry[],
  currentBlockId?: number
): ManualNavCrumb[] {
  const labels = String(breadcrumb || '')
    .split(/\s*→\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!labels.length) return []

  const currentKey = currentBlockId ? `b-${currentBlockId}` : undefined
  const reservedKeys = new Set<string>()
  if (currentKey) reservedKeys.add(currentKey)

  return labels.map((label, i) => {
    const last = i === labels.length - 1
    if (last) {
      return { label, current: true }
    }

    const anchorKey = findAnchor(label, entries, reservedKeys)
    if (anchorKey && anchorKey !== '__top__') {
      reservedKeys.add(anchorKey)
    }

    return { label, anchorKey }
  })
}

export function createManualNavContext(
  manual: ManualUsuarioManualData,
  scrollTo: (key: string) => void,
  scrollToTop: () => void
): ManualNavContext {
  const entries = buildManualNavIndex(manual)
  return {
    scrollTo,
    scrollToTop,
    resolveCrumbs: (breadcrumb, currentBlockId) => {
      if (currentBlockId) {
        const fromTree = crumbsFromManualTree(manual, currentBlockId)
        if (fromTree.length > 1) return fromTree
      }
      return resolveManualBreadcrumbCrumbs(breadcrumb, entries, currentBlockId)
    },
  }
}
