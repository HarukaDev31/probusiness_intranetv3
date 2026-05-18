import { soporteTiChatChannelName, SOPORTE_TI_WS_EVENTS } from '~/constants/soporteTi'
import { useEcho, getEchoInstance } from '~/composables/websocket/useEcho'
import type {
  SoporteTiWsEstadoPayload,
  SoporteTiWsMensajePayload,
  SoporteTiWsMensajesLeidosPayload
} from '~/types/soporteTi'
import {
  notifySoporteTiChatEvent,
  tituloNotificacionEstado,
  tituloNotificacionMensaje
} from '~/utils/soporteTiChatNotify'
import { resolveEsPropioMensaje } from '~/utils/soporteTiChatMensaje'
import { debeIgnorarNotifEstadoWs } from '~/utils/soporteTiWsEstadoSkip'

export type SoporteTiChatRoomHandlers = {
  onMensajeCreado?: (p: SoporteTiWsMensajePayload) => void
  onMensajeActualizado?: (p: SoporteTiWsMensajePayload) => void
  onMensajesLeidos?: (p: SoporteTiWsMensajesLeidosPayload) => void
  onEstadoActualizado?: (p: SoporteTiWsEstadoPayload) => void
}

const echoRooms = new Set<string>()
const pendingRooms = new Map<string, SoporteTiChatRoomHandlers>()
let flushTimer: ReturnType<typeof setInterval> | null = null

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

function shouldNotify(chatUuid: string, salaActivaUuid: string | null): boolean {
  return salaActivaUuid !== chatUuid
}

function esMensajePropio(payload: SoporteTiWsMensajePayload): boolean {
  if (!payload.mensaje) return false
  return resolveEsPropioMensaje(payload.mensaje)
}

function stopFlushLoop() {
  if (flushTimer != null) {
    clearInterval(flushTimer)
    flushTimer = null
  }
}

export function useSoporteTiChatRoom() {
  const salaActivaUuid = useState<string | null>('soporte-ti-sala-activa', () => null)
  const { subscribeToChannel, unsubscribeFromChannel } = useEcho()

  function setSalaActiva(chatUuid: string | null) {
    salaActivaUuid.value = chatUuid
  }

  function suscribirSalaEcho(chatUuid: string, handlers: SoporteTiChatRoomHandlers) {
    if (!chatUuid || echoRooms.has(chatUuid)) return true

    if (!getEchoInstance()) {
      pendingRooms.set(chatUuid, handlers)
      return false
    }

    try {
      const channelName = soporteTiChatChannelName(chatUuid)
      subscribeToChannel({
        name: channelName,
        type: 'private',
        handlers: [
          {
            event: SOPORTE_TI_WS_EVENTS.MENSAJE_CREADO,
            callback: (raw: unknown) => {
              const p = parsePayload<SoporteTiWsMensajePayload>(raw)
              if (!p?.chat_uuid) return
              handlers.onMensajeCreado?.(p)
              const esSistema = Boolean(p.mensaje?.es_sistema)
              if (
                !esSistema &&
                !esMensajePropio(p) &&
                shouldNotify(p.chat_uuid, salaActivaUuid.value)
              ) {
                notifySoporteTiChatEvent(
                  p.chat_uuid,
                  p.codigo,
                  tituloNotificacionMensaje(p),
                  p.mensaje?.texto || 'Nuevo mensaje en el chat',
                  'mensaje'
                )
              }
            }
          },
          {
            event: SOPORTE_TI_WS_EVENTS.MENSAJE_ACTUALIZADO,
            callback: (raw: unknown) => {
              const p = parsePayload<SoporteTiWsMensajePayload>(raw)
              if (!p?.chat_uuid) return
              handlers.onMensajeActualizado?.(p)
              if (
                !esMensajePropio(p) &&
                shouldNotify(p.chat_uuid, salaActivaUuid.value)
              ) {
                notifySoporteTiChatEvent(
                  p.chat_uuid,
                  p.codigo,
                  'Mensaje actualizado',
                  p.mensaje?.texto || 'Se actualizó un mensaje',
                  'mensaje'
                )
              }
            }
          },
          {
            event: SOPORTE_TI_WS_EVENTS.MENSAJES_LEIDOS,
            callback: (raw: unknown) => {
              const p = parsePayload<SoporteTiWsMensajesLeidosPayload>(raw)
              if (!p?.chat_uuid) return
              handlers.onMensajesLeidos?.(p)
            }
          },
          {
            event: SOPORTE_TI_WS_EVENTS.ESTADO_ACTUALIZADO,
            callback: (raw: unknown) => {
              const p = parsePayload<SoporteTiWsEstadoPayload>(raw)
              if (!p?.chat_uuid) return
              handlers.onEstadoActualizado?.(p)
              if (
                shouldNotify(p.chat_uuid, salaActivaUuid.value) &&
                !debeIgnorarNotifEstadoWs(p.chat_uuid)
              ) {
                notifySoporteTiChatEvent(
                  p.chat_uuid,
                  p.codigo,
                  tituloNotificacionEstado(p),
                  `Nuevo estado: ${p.estado}`,
                  'estado'
                )
              }
            }
          }
        ]
      })
      echoRooms.add(chatUuid)
      pendingRooms.delete(chatUuid)
      return true
    } catch (e) {
      console.warn('[SoporteTI] No se pudo suscribir al canal de chat:', chatUuid, e)
      pendingRooms.set(chatUuid, handlers)
      return false
    }
  }

  function flushPendingRooms() {
    if (!getEchoInstance() || pendingRooms.size === 0) return
    for (const [uuid, handlers] of [...pendingRooms.entries()]) {
      suscribirSalaEcho(uuid, handlers)
    }
    if (pendingRooms.size === 0) {
      stopFlushLoop()
    }
  }

  function ensureFlushLoop() {
    if (flushTimer != null || typeof window === 'undefined') return
    flushTimer = setInterval(() => {
      flushPendingRooms()
    }, 500)
  }

  function suscribirSala(chatUuid: string, handlers: SoporteTiChatRoomHandlers) {
    if (!chatUuid) return
    const ok = suscribirSalaEcho(chatUuid, handlers)
    if (!ok) {
      ensureFlushLoop()
    }
  }

  function desuscribirSala(chatUuid: string) {
    if (!chatUuid) return
    pendingRooms.delete(chatUuid)
    if (!echoRooms.has(chatUuid)) return
    try {
      unsubscribeFromChannel(soporteTiChatChannelName(chatUuid))
    } catch (e) {
      console.warn('[SoporteTI] Error al desuscribir canal:', chatUuid, e)
    }
    echoRooms.delete(chatUuid)
  }

  function desuscribirTodas() {
    pendingRooms.clear()
    stopFlushLoop()
    ;[...echoRooms].forEach(desuscribirSala)
  }

  return {
    salaActivaUuid,
    setSalaActiva,
    suscribirSala,
    desuscribirSala,
    desuscribirTodas,
    flushPendingRooms
  }
}
