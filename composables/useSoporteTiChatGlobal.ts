import { watch, type WatchStopHandle } from 'vue'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import { getEchoInstance } from '~/composables/websocket/useEcho'
import type { SoporteTiSolicitud } from '~/types/soporteTi'
import type { SoporteTiChatRoomHandlers } from '~/composables/useSoporteTiChatRoom'

const salasGlobalesSuscritas = new Set<string>()
let sincronizando: Promise<void> | null = null
let listenersAttached = false
let stopWatchSolicitudes: WatchStopHandle | null = null

function extraerChatUuids(list: SoporteTiSolicitud[]): string[] {
  return list.map((s) => s.chatUuid).filter((uuid): uuid is string => Boolean(uuid))
}

/** Cualquier ruta bajo /soporte-ti (listado, detalle, config). */
function enRutaSoporteTi(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.includes('/soporte-ti')
}

/** En detalle no hace falta el listado completo ni suscribir todas las salas al entrar. */
function enRutaDetalleSoporteTi(): boolean {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname.replace(/\/+$/, '')
  return /^\/soporte-ti\/[^/]+$/.test(path) && path !== '/soporte-ti'
}

export async function waitForEchoReady(timeoutMs = 20000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (getEchoInstance()) return true
    await new Promise((r) => setTimeout(r, 250))
  }
  return false
}

async function loadSoporteTiDeps() {
  const { useSoporteTi } = await import('~/composables/useSoporteTi')
  return useSoporteTi()
}

function suscribirSalasConHandlers(
  uuids: string[],
  handlersSala: (chatUuid: string) => SoporteTiChatRoomHandlers
) {
  const { suscribirSala, flushPendingRooms } = useSoporteTiChatRoom()

  for (const uuid of uuids) {
    if (!uuid || salasGlobalesSuscritas.has(uuid)) continue
    suscribirSala(uuid, handlersSala(uuid))
    salasGlobalesSuscritas.add(uuid)
  }
  flushPendingRooms()
}

/**
 * Sincroniza suscripciones WS a salas.
 * No hace GET /api/soporte-ti/solicitudes fuera de rutas /soporte-ti.
 */
export async function sincronizarSalasGlobales(extraUuids: string[] = []) {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem('auth_token')) return
  if (sincronizando) return sincronizando

  sincronizando = (async () => {
    try {
      const echoOk = await waitForEchoReady()
      if (!echoOk) {
        console.warn('[SoporteTI] Echo no disponible; salas en cola pendiente')
      }

      const { handlersSala, asegurarListadoCargado, solicitudes } = await loadSoporteTiDeps()
      const extras = [...new Set(extraUuids.filter(Boolean))]

      // Fuera de Soporte TI: solo salas explícitas, sin listar solicitudes.
      if (!enRutaSoporteTi()) {
        if (extras.length) {
          suscribirSalasConHandlers(extras, handlersSala)
        }
        return
      }

      if (enRutaDetalleSoporteTi()) {
        if (extras.length) {
          suscribirSalasConHandlers(extras, handlersSala)
        }
        return
      }

      const desdeEstado =
        solicitudes.value.length > 0
          ? solicitudes.value.map((s) => s.chatUuid).filter(Boolean)
          : await asegurarListadoCargado()
      const uuids = [...new Set([...desdeEstado, ...extras])]

      if (process.dev) {
        console.log('[SoporteTI] Sincronizando salas globales:', uuids.length, uuids)
      }

      suscribirSalasConHandlers(uuids, handlersSala)
    } catch (e) {
      console.warn('[SoporteTI] No se pudieron sincronizar salas globales:', e)
    }
  })().finally(() => {
    sincronizando = null
  })

  return sincronizando
}

export function suscribirSalaNuevaGlobal(chatUuid: string) {
  if (!chatUuid) return
  void (async () => {
    const { handlersSala } = await loadSoporteTiDeps()
    suscribirSalasConHandlers([chatUuid], handlersSala)
  })()
}

export function limpiarSuscripcionesGlobales() {
  salasGlobalesSuscritas.clear()
  const { desuscribirTodas } = useSoporteTiChatRoom()
  desuscribirTodas()
}

export function useSoporteTiChatGlobal() {
  return {
    sincronizarSalasGlobales,
    suscribirSalaNueva: suscribirSalaNuevaGlobal,
    limpiarSuscripcionesGlobales
  }
}

/** Registra listeners (plugin / layout). Idempotente. */
export function attachSoporteTiChatGlobalListeners() {
  if (typeof window === 'undefined' || listenersAttached) return
  listenersAttached = true

  const boot = () => {
    if (!enRutaSoporteTi()) return
    void sincronizarSalasGlobales()
  }

  window.addEventListener('echo-ready', boot)
  // Sin visibilitychange: no re-pedir /solicitudes al cambiar de pestaña.
  window.addEventListener('soporte-ti-chat-reset', () => limpiarSuscripcionesGlobales())
  window.addEventListener('soporte-ti-suscribir-sala', (ev) => {
    const chatUuid = (ev as CustomEvent<{ chatUuid?: string }>).detail?.chatUuid
    if (chatUuid) suscribirSalaNuevaGlobal(chatUuid)
  })
}

/** Watch del listado en memoria (requiere contexto Vue). */
export function watchSoporteTiSolicitudesParaSalas() {
  if (stopWatchSolicitudes) return

  void loadSoporteTiDeps().then(({ solicitudes, handlersSala }) => {
    stopWatchSolicitudes = watch(
      () => solicitudes.value.map((s) => s.chatUuid).filter(Boolean).join('|'),
      () => {
        if (!enRutaSoporteTi()) return
        if (enRutaDetalleSoporteTi()) return
        suscribirSalasConHandlers(extraerChatUuids(solicitudes.value), handlersSala)
      }
    )
  })
}
