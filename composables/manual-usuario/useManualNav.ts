import type { InjectionKey, ComputedRef } from 'vue'
import type { ManualBlock, ManualUsuarioManualData } from '~/types/manualUsuario'

export type ManualTocNode = {
  key: string
  title: string
  children?: ManualTocNode[]
}

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

export function manualNavGroupLabel(moduloKey: string): string {
  const k = String(moduloKey || '').trim().replace(/^\/+/, '')
  if (k.startsWith('curso/') || k === 'curso') return 'Pedidos de Curso'
  if (
    k === 'basedatos/productos'
    || k === 'basedatos/regulaciones'
    || k === 'basedatos/permisos'
    || k === 'basedatos/boletin-quimico'
  ) {
    return 'Aduanas'
  }
  if (k.startsWith('cargaconsolidada/coordinacion')) return 'Coordinación'
  if (k.startsWith('cargaconsolidada/documentacion')) return 'Documentación'
  if (k.startsWith('cargaconsolidada/')) return 'Carga consolidada'
  if (k.startsWith('landing/')) return 'Landing'
  if (k === 'viaticos' || k.startsWith('viaticos/')) return 'Viáticos'
  if (k.startsWith('panel-acceso/')) return 'Panel de acceso'
  if (k.startsWith('agente-compra')) return 'Agente de compra'
  return ''
}

export function manualLeafTitle(page: ManualUsuarioManualData['pages'][number]): string {
  const articulo = (page.blocks || []).find(
    (b) => b.tipo === 'grupo' && String(b.payload?.snapshot?.variant || '') === 'articulo'
  )
  const fromArticulo = String(articulo?.titulo || '').trim()
  if (fromArticulo) return fromArticulo
  const titulo = String(page.titulo || '').trim()
  const parts = titulo.split(/\s*[—–]\s*/).map((p) => p.trim()).filter(Boolean)
  return parts.length > 1 ? parts[parts.length - 1] : titulo
}

function cleanTocTitle(raw: string): string {
  return String(raw || '').replace(/^Pasos\s*[—–-]?\s*/i, '').trim()
}

function innerTocFromBlock(block: ManualBlock): ManualTocNode[] {
  const groups: ManualTocNode[] = []
  const flows: ManualTocNode[] = []
  for (const child of block.children || []) {
    if (child.tipo === 'flow') {
      const title = cleanTocTitle(String(child.titulo || ''))
      if (title) flows.push({ key: `b-${child.id}`, title })
      continue
    }
    if (child.tipo !== 'grupo') continue
    if (child.payload?.snapshot?.colapsable) continue
    const title = String(child.titulo || child.clave || '').trim()
    if (!title) continue
    const nested = innerTocFromBlock(child)
    groups.push({
      key: `b-${child.id}`,
      title,
      children: nested.length ? nested : undefined,
    })
  }
  // Un artículo: los flujos son las hojas del menú (p. ej. pasos de carga).
  return groups.length ? groups : flows
}

export function buildGroupedManualToc(
  pages: ManualUsuarioManualData['pages']
): ManualTocNode[] {
  const sorted = [...(pages || [])].sort((a, b) => a.orden - b.orden || a.id - b.id)
  type Bucket = { label: string; pages: typeof sorted }
  const buckets: Bucket[] = []
  const indexByLabel = new Map<string, number>()

  for (const page of sorted) {
    const label = manualNavGroupLabel(String(page.modulo_key || ''))
    if (!label) {
      buckets.push({ label: '', pages: [page] })
      continue
    }
    const existing = indexByLabel.get(label)
    if (existing === undefined) {
      indexByLabel.set(label, buckets.length)
      buckets.push({ label, pages: [page] })
    } else {
      buckets[existing].pages.push(page)
    }
  }

  const pageNode = (page: typeof sorted[number]): ManualTocNode => {
    const articulo = (page.blocks || []).find(
      (b) => b.tipo === 'grupo' && String(b.payload?.snapshot?.variant || '') === 'articulo'
    )
    const inner = articulo ? innerTocFromBlock(articulo) : []
    return {
      key: `p-${page.id}`,
      title: manualLeafTitle(page),
      children: inner.length ? inner : undefined,
    }
  }

  const toc: ManualTocNode[] = []
  for (const bucket of buckets) {
    if (!bucket.label) {
      toc.push(pageNode(bucket.pages[0]))
      continue
    }
    toc.push({
      key: `g-${normalizeManualNavLabel(bucket.label).replace(/\s+/g, '-')}`,
      title: bucket.label,
      children: bucket.pages.map(pageNode),
    })
  }
  return toc
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
    const group = manualNavGroupLabel(String(hit.page.modulo_key || ''))
    const leaf = manualLeafTitle(hit.page)
    if (group) {
      pushUniqueCrumb(crumbs, { label: group, anchorKey: `p-${hit.page.id}` })
    }
    if (leaf) {
      pushUniqueCrumb(crumbs, { label: leaf, anchorKey: `p-${hit.page.id}` })
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
