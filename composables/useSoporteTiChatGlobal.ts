import { type WatchStopHandle } from 'vue'
import { useSoporteTiChatRoom } from '~/composables/useSoporteTiChatRoom'
import { getEchoInstance, useEcho } from '~/composables/websocket/useEcho'
import type { SoporteTiChatRoomHandlers } from '~/composables/useSoporteTiChatRoom'
import type { SoporteTiWsSolicitudCreadaPayload } from '~/services/soporteTi/apiTypes'
import type {
  SoporteTiWsEstadoPayload,
  SoporteTiWsMensajePayload
} from '~/types/soporteTi'
import { SoporteTiService } from '~/services/soporteTiService'
import {
  SOPORTE_TI_STAFF_CHANNEL,
  SOPORTE_TI_WS_EVENTS,
  soporteTiUserChannelName
} from '~/constants/soporteTi'
import { ROLES } from '~/constants/roles'
import {
  notifySoporteTiChatEvent,
  tituloNotificacionEstado,
  tituloNotificacionMensaje
} from '~/utils/soporteTiChatNotify'
import { resolveEsPropioMensaje } from '~/utils/soporteTiChatMensaje'
import { debeIgnorarNotifEstadoWs } from '~/utils/soporteTiWsEstadoSkip'

const salasDetalleSuscritas = new Set<string>()
let listenersAttached = false
let stopWatchSolicitudes: WatchStopHandle | null = null
let staffChannelAttached = false
let userChannelAttached = false
let userChannelName: string | null = null

function parsePayload<T>(data: unknown): T | null {
  if (!data) return null
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T
    } catch {
      return null
    }
  }
  return data as T
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

function currentAuthUserId(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      id?: number | string
      raw?: { ID_Usuario?: number; id?: number }
    }
    const id = parsed?.id ?? parsed?.raw?.ID_Usuario ?? parsed?.raw?.id
    const n = Number(id)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

function salaActivaActual(): string | null {
  try {
    return useSoporteTiChatRoom().salaActivaUuid.value
  } catch {
    return null
  }
}

function esMensajePropio(payload: SoporteTiWsMensajePayload): boolean {
  if (!payload.mensaje) return false
  return resolveEsPropioMensaje(payload.mensaje)
}

/** Handlers de notificación global (staff / user): NO suscribe salas. */
function handlersNotificacionGlobal() {
  return [
    {
      event: SOPORTE_TI_WS_EVENTS.MENSAJE_CREADO,
      callback: (raw: unknown) => {
        const p = parsePayload<SoporteTiWsMensajePayload>(raw)
        if (!p?.chat_uuid) return
        const esSistema = Boolean(p.mensaje?.es_sistema)
        const activa = salaActivaActual()
        if (esSistema || esMensajePropio(p) || activa === p.chat_uuid) return
        notifySoporteTiChatEvent(
          p.chat_uuid,
          p.codigo,
          tituloNotificacionMensaje(p),
          p.mensaje?.texto || 'Nuevo mensaje en el chat',
          'mensaje'
        )
      }
    },
    {
      event: SOPORTE_TI_WS_EVENTS.ESTADO_ACTUALIZADO,
      callback: async (raw: unknown) => {
        const p = parsePayload<SoporteTiWsEstadoPayload>(raw)
        if (!p?.chat_uuid) return
        try {
          const { applyRemoteState } = await loadSoporteTiDeps()
          applyRemoteState(p)
        } catch {
          /* store puede no estar montado */
        }
        const activa = salaActivaActual()
        if (activa === p.chat_uuid || debeIgnorarNotifEstadoWs(p.chat_uuid)) return
        notifySoporteTiChatEvent(
          p.chat_uuid,
          p.codigo,
          tituloNotificacionEstado(p),
          `Nuevo estado: ${p.estado}`,
          'estado'
        )
      }
    }
  ]
}

function suscribirSalasConHandlers(
  uuids: string[],
  handlersSala: (chatUuid: string) => SoporteTiChatRoomHandlers
) {
  const { suscribirSala, flushPendingRooms } = useSoporteTiChatRoom()

  for (const uuid of uuids) {
    if (!uuid || salasDetalleSuscritas.has(uuid)) continue
    suscribirSala(uuid, handlersSala(uuid))
    salasDetalleSuscritas.add(uuid)
  }
  flushPendingRooms()
}

/**
 * Solo suscribe la(s) sala(s) del detalle abierto (chat en vivo).
 * Las notificaciones globales van por staff/user.
 */
export async function sincronizarSalasGlobales(extraUuids: string[] = []) {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem('auth_token')) return

  try {
    await waitForEchoReady()
    void suscribirCanalesNotificacionGlobales()

    const extras = [...new Set(extraUuids.filter(Boolean))]
    if (!extras.length) return

    const { handlersSala } = await loadSoporteTiDeps()
    suscribirSalasConHandlers(extras, handlersSala)
  } catch (e) {
    console.warn('[SoporteTI] No se pudo suscribir sala de detalle:', e)
  }
}

/**
 * @deprecated Las salas solo se abren en el detalle. Se mantiene por eventos legacy.
 */
export function suscribirSalaNuevaGlobal(_chatUuid: string) {
  // no-op: notificaciones van por staff/user; chat en vivo al abrir detalle
}

/** Al salir del detalle: liberar auth de esa sala. */
export function liberarSalaDetalle(chatUuid: string) {
  if (!chatUuid) return
  salasDetalleSuscritas.delete(chatUuid)
  try {
    useSoporteTiChatRoom().desuscribirSala(chatUuid)
  } catch {
    /* ignore */
  }
}

/** Canal staff: nueva solicitud + notifs de mensajes/estado. */
export async function suscribirCanalStaff() {
  if (typeof window === 'undefined') return
  if (staffChannelAttached) return
  if (!localStorage.getItem('auth_token')) return

  const { useUserRole } = await import('~/composables/auth/useUserRole')
  const { hasRole } = useUserRole()
  if (!hasRole(ROLES.PM) && !hasRole(ROLES.SOPORTE)) return

  const echoOk = await waitForEchoReady()
  if (!echoOk || !getEchoInstance()) return

  const { subscribeToChannel } = useEcho()
  const { applyRemoteSolicitudCreada } = await loadSoporteTiDeps()

  subscribeToChannel({
    name: SOPORTE_TI_STAFF_CHANNEL,
    type: 'private',
    handlers: [
      ...handlersNotificacionGlobal(),
      {
        event: SOPORTE_TI_WS_EVENTS.SOLICITUD_CREADA,
        callback: (raw: unknown) => {
          const p = parsePayload<SoporteTiWsSolicitudCreadaPayload>(raw)
          if (!p?.solicitud) return
          const ui = SoporteTiService.adaptWsSolicitudCreada(p)
          if (!ui) return
          applyRemoteSolicitudCreada(ui)
          notifySoporteTiChatEvent(
            ui.chatUuid,
            ui.codigo,
            `Nueva solicitud — ${ui.codigo}`,
            ui.titulo || 'Se creó una solicitud de Soporte TI',
            'mensaje'
          )
        }
      }
    ]
  })
  staffChannelAttached = true
  if (process.dev) {
    console.log('[SoporteTI] Suscrito a canal staff', SOPORTE_TI_STAFF_CHANNEL)
  }
}

/** Canal personal del solicitante: notifs sin N salas. Staff ya escucha `soporte-ti.staff`. */
export async function suscribirCanalUsuario() {
  if (typeof window === 'undefined') return
  if (userChannelAttached) return
  if (!localStorage.getItem('auth_token')) return

  const { useUserRole } = await import('~/composables/auth/useUserRole')
  const { hasRole } = useUserRole()
  // PM/Soporte reciben todo por staff; evita doble notif + un auth innecesario.
  if (hasRole(ROLES.PM) || hasRole(ROLES.SOPORTE)) return

  const userId = currentAuthUserId()
  if (!userId) return

  const echoOk = await waitForEchoReady()
  if (!echoOk || !getEchoInstance()) return

  const { subscribeToChannel } = useEcho()
  const channelName = soporteTiUserChannelName(userId)

  subscribeToChannel({
    name: channelName,
    type: 'private',
    handlers: handlersNotificacionGlobal()
  })
  userChannelAttached = true
  userChannelName = channelName
  if (process.dev) {
    console.log('[SoporteTI] Suscrito a canal usuario', channelName)
  }
}

/** Al login / echo-ready: 1–2 canales de notif (no N chats). */
export async function suscribirCanalesNotificacionGlobales() {
  await Promise.all([suscribirCanalStaff(), suscribirCanalUsuario()])
}

export function limpiarSuscripcionesGlobales() {
  salasDetalleSuscritas.clear()
  staffChannelAttached = false
  userChannelAttached = false
  const prevUserChannel = userChannelName
  userChannelName = null
  const { desuscribirTodas } = useSoporteTiChatRoom()
  desuscribirTodas()
  try {
    const { unsubscribeFromChannel } = useEcho()
    unsubscribeFromChannel(SOPORTE_TI_STAFF_CHANNEL)
    if (prevUserChannel) unsubscribeFromChannel(prevUserChannel)
  } catch {
    /* ignore */
  }
}

export function useSoporteTiChatGlobal() {
  return {
    sincronizarSalasGlobales,
    suscribirSalaNueva: suscribirSalaNuevaGlobal,
    liberarSalaDetalle,
    suscribirCanalStaff,
    suscribirCanalUsuario,
    suscribirCanalesNotificacionGlobales,
    limpiarSuscripcionesGlobales
  }
}

/** Registra listeners (plugin / layout). Idempotente. */
export function attachSoporteTiChatGlobalListeners() {
  if (typeof window === 'undefined' || listenersAttached) return
  listenersAttached = true

  const boot = () => {
    void suscribirCanalesNotificacionGlobales()
  }

  window.addEventListener('echo-ready', boot)
  window.addEventListener('soporte-ti-chat-reset', () => limpiarSuscripcionesGlobales())
  window.addEventListener('soporte-ti-suscribir-sala', (ev) => {
    const chatUuid = (ev as CustomEvent<{ chatUuid?: string }>).detail?.chatUuid
    if (chatUuid) suscribirSalaNuevaGlobal(chatUuid)
  })

  if (getEchoInstance()) boot()
}

/**
 * Ya no suscribe N salas al listar. Se mantiene por compatibilidad del plugin.
 */
export function watchSoporteTiSolicitudesParaSalas() {
  if (stopWatchSolicitudes) return
  // Intencionalmente vacío: notificaciones van por staff/user.
}
