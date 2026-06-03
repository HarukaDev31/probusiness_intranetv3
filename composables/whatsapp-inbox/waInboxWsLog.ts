const LS_DEBUG_KEY = 'wa_inbox_ws_debug'

export function isWaInboxWsDebug(): boolean {
  if (!import.meta.client) return import.meta.dev
  try {
    return import.meta.dev || localStorage.getItem(LS_DEBUG_KEY) === '1'
  } catch {
    return import.meta.dev
  }
}

/** Activa trazas en consola: localStorage.setItem('wa_inbox_ws_debug','1') y recarga */
export function enableWaInboxWsDebug() {
  if (!import.meta.client) return
  localStorage.setItem(LS_DEBUG_KEY, '1')
  console.info('[WaInbox:WS] Debug activado. Recarga la página.')
}

export function disableWaInboxWsDebug() {
  if (!import.meta.client) return
  localStorage.removeItem(LS_DEBUG_KEY)
  console.info('[WaInbox:WS] Debug desactivado.')
}

export function waInboxLog(step: string, detail?: Record<string, unknown>) {
  if (!isWaInboxWsDebug()) return
  if (detail && Object.keys(detail).length > 0) {
    console.info(`[WaInbox:WS] ${step}`, detail)
  } else {
    console.info(`[WaInbox:WS] ${step}`)
  }
}

/** Siempre visible en consola (handlers ausentes, parse fallido, etc.) */
export function waInboxWarn(step: string, detail?: Record<string, unknown>) {
  if (detail && Object.keys(detail).length > 0) {
    console.warn(`[WaInbox:WS] ${step}`, detail)
  } else {
    console.warn(`[WaInbox:WS] ${step}`)
  }
}

export function exposeWaInboxWsDiagnostics(getState: () => Record<string, unknown>) {
  if (!import.meta.client) return
  const w = globalThis as typeof globalThis & {
    __waInboxDiag?: () => Record<string, unknown>
    enableWaInboxWsDebug?: () => void
    disableWaInboxWsDebug?: () => void
  }
  w.__waInboxDiag = () => {
    const state = getState()
    console.info('[WaInbox:WS] diagnóstico', state)
    return state
  }
  w.enableWaInboxWsDebug = enableWaInboxWsDebug
  w.disableWaInboxWsDebug = disableWaInboxWsDebug
  waInboxLog('diag.exposed', {
    hint: "localStorage.setItem('wa_inbox_ws_debug','1') o enableWaInboxWsDebug()"
  })
}
