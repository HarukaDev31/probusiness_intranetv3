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

/** Inline: evita ReferenceError con minify/circular imports entre useEcho y este módulo */
function shouldLogToConsole(): boolean {
  if (!import.meta.client) return false
  if (import.meta.dev) return true
  try {
    return localStorage.getItem(LS_DEBUG_KEY) === '1'
  } catch {
    return false
  }
}

export function getWaInboxTraces(limit = 80): WaInboxWsTraceEntry[] {
  return traceBuffer().slice(-limit)
}

export function clearWaInboxTraces() {
  const w = globalThis as typeof globalThis & { __waInboxTraces?: WaInboxWsTraceEntry[] }
  w.__waInboxTraces = []
}

export function isWaInboxWsDebug(): boolean {
  return shouldLogToConsole()
}

export function enableWaInboxWsDebug() {
  if (!import.meta.client) return
  localStorage.setItem(LS_DEBUG_KEY, '1')
  waInboxTrace('debug.enabled')
  window.alert('[WaInbox] Debug activado. Recarga la página (F5).')
}

export function disableWaInboxWsDebug() {
  if (!import.meta.client) return
  localStorage.removeItem(LS_DEBUG_KEY)
  window.alert('[WaInbox] Debug desactivado. Recarga la página.')
}

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

  if (!shouldLogToConsole()) return

  const label = `[WaInbox:WS] ${step}`
  try {
    if (level === 'warn') {
      if (entry.detail) console.warn(label, entry.detail)
      else console.warn(label)
    } else if (entry.detail) {
      console.info(label, entry.detail)
    } else {
      console.info(label)
    }
  } catch {
    /* drop_console en prod puede dejar stubs rotos */
  }
}

export function waInboxLog(step: string, detail?: Record<string, unknown>) {
  waInboxTrace(step, detail, 'log')
}

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

  w.__waInboxDiag = () => ({
    ...getState(),
    traces: getWaInboxTraces(100),
    debug: shouldLogToConsole(),
    hint: 'Historial: __waInboxTraces'
  })

  w.enableWaInboxWsDebug = enableWaInboxWsDebug
  w.disableWaInboxWsDebug = disableWaInboxWsDebug

  waInboxTrace('diag.exposed', {
    traces: traceBuffer().length,
    prod: !import.meta.dev
  })
}
