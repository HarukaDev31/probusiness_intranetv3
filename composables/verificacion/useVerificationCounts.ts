/**
 * Contadores de Verificación / Pago a Proveedor / Viáticos.
 * - 1 GET al cargar o al reconectar el WebSocket
 * - Caché en useState + sessionStorage (por usuario)
 * - Actualización por evento VerificacionContadoresActualizados (sin polling)
 */

export type VerificationCounts = {
  consolidado: number
  cursos: number
  delivery: number
  permisos: number
  boletin_quimico: number
  supplier_payment: number
  supplier_approvals: number
  supplier_executions: number
  viaticos: number
  verificacion_total: number
}

const EMPTY: VerificationCounts = {
  consolidado: 0,
  cursos: 0,
  delivery: 0,
  permisos: 0,
  boletin_quimico: 0,
  supplier_payment: 0,
  supplier_approvals: 0,
  supplier_executions: 0,
  viaticos: 0,
  verificacion_total: 0
}

const SESSION_KEY = 'verificacion_counts_v1'
const SESSION_VERSION = 1

type SessionPayload = {
  v: number
  userId: string
  counts: VerificationCounts
}

function readAuthUserId(): string {
  if (!import.meta.client) return ''
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return ''
    const user = JSON.parse(raw) as { id?: number | string; raw?: { ID_Usuario?: number; id?: number } }
    const id = user?.id ?? user?.raw?.ID_Usuario ?? user?.raw?.id
    return id == null || id === '' ? '' : String(id)
  } catch {
    return ''
  }
}

function readSession(): SessionPayload | null {
  if (!import.meta.client) return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionPayload
    if (!parsed || parsed.v !== SESSION_VERSION || typeof parsed.userId !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(counts: VerificationCounts) {
  if (!import.meta.client) return
  const userId = readAuthUserId()
  if (!userId) return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ v: SESSION_VERSION, userId, counts } satisfies SessionPayload))
  } catch {
    /* ignore quota */
  }
}

function normalize(
  partial: Partial<VerificationCounts> | null | undefined,
  opts?: { preferProvidedTotal?: boolean }
): VerificationCounts {
  const preferProvidedTotal = !!opts?.preferProvidedTotal
    && partial != null
    && Object.prototype.hasOwnProperty.call(partial, 'verificacion_total')
  const providedTotal = preferProvidedTotal
    ? Math.max(0, Number((partial as VerificationCounts).verificacion_total || 0))
    : null

  const next = { ...EMPTY, ...(partial || {}) }
  for (const key of Object.keys(EMPTY) as (keyof VerificationCounts)[]) {
    next[key] = Math.max(0, Number(next[key] || 0))
  }
  next.verificacion_total = providedTotal != null
    ? providedTotal
    : next.consolidado + next.cursos + next.delivery
      + next.permisos + next.boletin_quimico + next.supplier_payment
  return next
}

let fetchInFlight: Promise<VerificationCounts> | null = null
let hydratedFromSession = false

export function useVerificationCounts() {
  const counts = useState<VerificationCounts>('verification-counts', () => ({ ...EMPTY }))
  const loaded = useState('verification-counts-loaded', () => false)
  const loading = useState('verification-counts-loading', () => false)
  /** true solo tras un GET exitoso o un patch WS en esta vida de página */
  const synced = useState('verification-counts-synced', () => false)

  function hydrateFromSession() {
    if (hydratedFromSession || !import.meta.client) return
    hydratedFromSession = true
    const session = readSession()
    const userId = readAuthUserId()
    if (!session || !userId || session.userId !== userId) return
    counts.value = normalize(session.counts)
    loaded.value = true
  }

  function applyPartial(partial: Partial<VerificationCounts>) {
    const hasServerTotal = Object.prototype.hasOwnProperty.call(partial, 'verificacion_total')
    counts.value = normalize(
      { ...counts.value, ...partial },
      { preferProvidedTotal: hasServerTotal }
    )
    writeSession(counts.value)
    loaded.value = true
    synced.value = true
  }

  async function refresh(force = false) {
    if (!import.meta.client) return counts.value
    hydrateFromSession()
    // Sin force: un solo GET por vida de página; navegación SPA no vuelve a pedir
    if (!force && synced.value && !fetchInFlight) return counts.value
    if (fetchInFlight) return fetchInFlight

    loading.value = true
    fetchInFlight = (async () => {
      try {
        const { VerificacionService } = await import('~/services/verificacionService')
        const res = await VerificacionService.contadores()
        counts.value = normalize(res?.data, { preferProvidedTotal: true })
        writeSession(counts.value)
        loaded.value = true
        synced.value = true
        return counts.value
      } catch {
        return counts.value
      } finally {
        loading.value = false
        fetchInFlight = null
      }
    })()

    return fetchInFlight
  }

  function clear() {
    counts.value = { ...EMPTY }
    loaded.value = false
    synced.value = false
    hydratedFromSession = false
    if (import.meta.client) {
      try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    }
  }

  return {
    counts,
    loaded,
    loading,
    synced,
    refresh,
    applyPartial,
    hydrateFromSession,
    clear
  }
}
