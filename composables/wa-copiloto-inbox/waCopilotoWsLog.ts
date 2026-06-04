const LS_DEBUG_KEY = 'WA_COPILOTO_ws_debug'
const MAX_TRACES = 300

export type WaCopilotoWsTraceEntry = {
  t: number
  iso: string
  step: string
  level: 'log' | 'warn'
  detail?: Record<string, unknown>
}

function traceBuffer(): WaCopilotoWsTraceEntry[] {
  if (!import.meta.client) return []
  const w = globalThis as typeof globalThis & { __WaCopilotoTraces?: WaCopilotoWsTraceEntry[] }
  if (!w.__WaCopilotoTraces) w.__WaCopilotoTraces = []
  return w.__WaCopilotoTraces
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

export function getWaCopilotoTraces(limit = 80): WaCopilotoWsTraceEntry[] {
  return traceBuffer().slice(-limit)
}

export function clearWaCopilotoTraces() {
  const w = globalThis as typeof globalThis & { __WaCopilotoTraces?: WaCopilotoWsTraceEntry[] }
  w.__WaCopilotoTraces = []
}

export function isWaCopilotoWsDebug(): boolean {
  return shouldLogToConsole()
}

export function enableWaCopilotoWsDebug() {
  if (!import.meta.client) return
  localStorage.setItem(LS_DEBUG_KEY, '1')
  WaCopilotoTrace('debug.enabled')
  window.alert('[WaCopiloto] Debug activado. Recarga la página (F5).')
}

export function disableWaCopilotoWsDebug() {
  if (!import.meta.client) return
  localStorage.removeItem(LS_DEBUG_KEY)
  window.alert('[WaCopiloto] Debug desactivado. Recarga la página.')
}

export function WaCopilotoTrace(
  step: string,
  detail?: Record<string, unknown>,
  level: 'log' | 'warn' = 'log'
) {
  if (!import.meta.client) return

  const entry: WaCopilotoWsTraceEntry = {
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

  const label = `[WaCopiloto:WS] ${step}`
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

export function WaCopilotoLog(step: string, detail?: Record<string, unknown>) {
  WaCopilotoTrace(step, detail, 'log')
}

export function waCopilotoWarn(step: string, detail?: Record<string, unknown>) {
  WaCopilotoTrace(step, detail, 'warn')
}

export function exposeWaCopilotoWsDiagnostics(getState: () => Record<string, unknown>) {
  if (!import.meta.client) return

  const w = globalThis as typeof globalThis & {
    __WaCopilotoDiag?: () => Record<string, unknown>
    __WaCopilotoTraces?: WaCopilotoWsTraceEntry[]
    enableWaCopilotoWsDebug?: () => void
    disableWaCopilotoWsDebug?: () => void
    clearWaCopilotoTraces?: () => void
  }

  w.__WaCopilotoTraces = w.__WaCopilotoTraces ?? []
  w.clearWaCopilotoTraces = clearWaCopilotoTraces

  w.__WaCopilotoDiag = () => ({
    ...getState(),
    traces: getWaCopilotoTraces(100),
    debug: shouldLogToConsole(),
    hint: 'Historial: __WaCopilotoTraces'
  })

  w.enableWaCopilotoWsDebug = enableWaCopilotoWsDebug
  w.disableWaCopilotoWsDebug = disableWaCopilotoWsDebug

  WaCopilotoTrace('diag.exposed', {
    traces: traceBuffer().length,
    prod: !import.meta.dev
  })
}
