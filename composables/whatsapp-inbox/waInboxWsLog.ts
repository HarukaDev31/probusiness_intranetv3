const LS_DEBUG_KEY = 'wa_inbox_ws_debug'
const MAX_TRACES = 300

export type WaInboxWsTraceEntry = {
  t: number
  iso: string
  step: string
  level: 'log' | 'warn'
  detail?: Record<string, unknown>
}

function traceBuffer(): WaInboxWsTraceEntry[] {
  if (!import.meta.client) return []
  const w = globalThis as typeof globalThis & { __waInboxTraces?: WaInboxWsTraceEntry[] }
  if (!w.__waInboxTraces) w.__waInboxTraces = []
  return w.__waInboxTraces
}

export function getWaInboxTraces(limit = 80): WaInboxWsTraceEntry[] {
  const buf = traceBuffer()
  return buf.slice(-limit)
}

export function clearWaInboxTraces() {
  const w = globalThis as typeof globalThis & { __waInboxTraces?: WaInboxWsTraceEntry[] }
  w.__waInboxTraces = []
}

export function isWaInboxWsDebug(): boolean {
  if (!import.meta.client) return import.meta.dev
  try {
    // En dev siempre consola; en prod solo con flag explícito
    if (import.meta.dev) return true
    return localStorage.getItem(LS_DEBUG_KEY) === '1'
  } catch {
    return import.meta.dev
  }
}

/** Activa trazas en consola (prod): localStorage + recarga */
export function enableWaInboxWsDebug() {
  if (!import.meta.client) return
  localStorage.setItem(LS_DEBUG_KEY, '1')
  waInboxTrace('debug.enabled', undefined, 'log')
  // alert: no lo elimina terser drop_console
  window.alert('[WaInbox] Debug activado. Recarga la página (F5).')
}

export function disableWaInboxWsDebug() {
  if (!import.meta.client) return
  localStorage.removeItem(LS_DEBUG_KEY)
  window.alert('[WaInbox] Debug desactivado. Recarga la página.')
}

/**
 * Siempre guarda en window.__waInboxTraces (sobrevive drop_console del build).
 * Consola solo en dev o con wa_inbox_ws_debug=1.
 */
export function waInboxTrace(
  step: string,
  detail?: Record<string, unknown>,
  level: 'log' | 'warn' = 'log'
) {
  if (!import.meta.client) return

  const entry: WaInboxWsTraceEntry = {
    t: Date.now(),
    iso: new Date().toISOString(),
    step,
    level,
    ...(detail && Object.keys(detail).length > 0 ? { detail } : {})
  }

  const buf = traceBuffer()
  buf.push(entry)
  if (buf.length > MAX_TRACES) buf.splice(0, buf.length - MAX_TRACES)

  if (!isWaInboxWsDebug()) return

  const label = `[WaInbox:WS] ${step}`
  if (level === 'warn') {
    if (entry.detail) console.warn(label, entry.detail)
    else console.warn(label)
  } else if (entry.detail) {
    console.info(label, entry.detail)
  } else {
    console.info(label)
  }
}

export function waInboxLog(step: string, detail?: Record<string, unknown>) {
  waInboxTrace(step, detail, 'log')
}

/** Siempre al buffer; en consola si debug activo */
export function waInboxWarn(step: string, detail?: Record<string, unknown>) {
  waInboxTrace(step, detail, 'warn')
}

export function exposeWaInboxWsDiagnostics(getState: () => Record<string, unknown>) {
  if (!import.meta.client) return

  const w = globalThis as typeof globalThis & {
    __waInboxDiag?: () => Record<string, unknown>
    __waInboxTraces?: WaInboxWsTraceEntry[]
    enableWaInboxWsDebug?: () => void
    disableWaInboxWsDebug?: () => void
    clearWaInboxTraces?: () => void
  }

  w.__waInboxTraces = w.__waInboxTraces ?? []
  w.clearWaInboxTraces = clearWaInboxTraces

  w.__waInboxDiag = () => {
    const payload = {
      ...getState(),
      traces: getWaInboxTraces(100),
      debug: isWaInboxWsDebug(),
      hint: 'Historial en __waInboxTraces. Prod: drop_console elimina console; usa este objeto.'
    }
    return payload
  }

  w.enableWaInboxWsDebug = enableWaInboxWsDebug
  w.disableWaInboxWsDebug = disableWaInboxWsDebug

  waInboxTrace('diag.exposed', {
    traces: traceBuffer().length,
    prod: !import.meta.dev
  })
}
