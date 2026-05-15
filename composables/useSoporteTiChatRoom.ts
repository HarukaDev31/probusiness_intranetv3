import { computed, onUnmounted } from 'vue'
import { soporteTiChatChannelName, SOPORTE_TI_WS_EVENTS } from '~/constants/soporteTi'
import { useEcho } from '~/composables/websocket/useEcho'
import type { SoporteTiWsEstadoPayload, SoporteTiWsMensajePayload } from '~/types/soporteTi'
import {
  notifySoporteTiChatEvent,
  tituloNotificacionEstado,
  tituloNotificacionMensaje
} from '~/utils/soporteTiChatNotify'

export type SoporteTiChatRoomHandlers = {
  onMensajeCreado?: (p: SoporteTiWsMensajePayload) => void
  onMensajeActualizado?: (p: SoporteTiWsMensajePayload) => void
  onEstadoActualizado?: (p: SoporteTiWsEstadoPayload) => void
}

type DemoListener = {
  bc: BroadcastChannel
  handlers: SoporteTiChatRoomHandlers
}

const demoRooms = new Map<string, DemoListener>()
const echoRooms = new Set<string>()

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
  if (salaActivaUuid === chatUuid) return false
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    const path = window.location?.pathname ?? ''
    if (path.includes('/soporte-ti') && salaActivaUuid === chatUuid) return false
  }
  return true
}

export function useSoporteTiChatRoom() {
  const config = useRuntimeConfig()
  const usarApi = computed(() => config.public.soporteTiUseApi !== false)
  const salaActivaUuid = useState<string | null>('soporte-ti-sala-activa', () => null)

  const { subscribeToChannel, unsubscribeFromChannel } = useEcho()

  function setSalaActiva(chatUuid: string | null) {
    salaActivaUuid.value = chatUuid
  }

  /** Publica en demo (misma pestaña / otras pestañas) simulando el broadcast de Laravel. */
  function publicarDemo(
    chatUuid: string,
    tipo: 'mensaje_creado' | 'mensaje_actualizado' | 'estado',
    payload: SoporteTiWsMensajePayload | SoporteTiWsEstadoPayload
  ) {
    if (typeof BroadcastChannel === 'undefined') return
    const bc = new BroadcastChannel(`soporte-ti-demo-${chatUuid}`)
    bc.postMessage({ tipo, payload })
    bc.close()
  }

  function suscribirSala(chatUuid: string, handlers: SoporteTiChatRoomHandlers) {
    if (!chatUuid) return

    if (usarApi.value) {
      if (echoRooms.has(chatUuid)) return
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
              if (shouldNotify(p.chat_uuid, salaActivaUuid.value)) {
                notifySoporteTiChatEvent(
                  p.chat_uuid,
                  p.codigo,
                  tituloNotificacionMensaje(p),
                  p.mensaje?.texto || 'Nuevo mensaje en el chat'
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
              if (shouldNotify(p.chat_uuid, salaActivaUuid.value)) {
                notifySoporteTiChatEvent(
                  p.chat_uuid,
                  p.codigo,
                  'Mensaje actualizado',
                  p.mensaje?.texto || 'Se actualizó un mensaje'
                )
              }
            }
          },
          {
            event: SOPORTE_TI_WS_EVENTS.ESTADO_ACTUALIZADO,
            callback: (raw: unknown) => {
              const p = parsePayload<SoporteTiWsEstadoPayload>(raw)
              if (!p?.chat_uuid) return
              handlers.onEstadoActualizado?.(p)
              if (shouldNotify(p.chat_uuid, salaActivaUuid.value)) {
                notifySoporteTiChatEvent(
                  p.chat_uuid,
                  p.codigo,
                  tituloNotificacionEstado(p),
                  `Nuevo estado: ${p.estado}`
                )
              }
            }
          }
        ]
      })
      echoRooms.add(chatUuid)
      return
    }

    if (demoRooms.has(chatUuid)) return
    if (typeof BroadcastChannel === 'undefined') return

    const bc = new BroadcastChannel(`soporte-ti-demo-${chatUuid}`)
    bc.onmessage = (ev) => {
      const { tipo, payload } = ev.data || {}
      if (tipo === 'mensaje_creado') {
        const p = payload as SoporteTiWsMensajePayload
        handlers.onMensajeCreado?.(p)
        if (shouldNotify(chatUuid, salaActivaUuid.value)) {
          notifySoporteTiChatEvent(
            chatUuid,
            p.codigo,
            tituloNotificacionMensaje(p),
            p.mensaje?.texto || 'Nuevo mensaje'
          )
        }
      } else if (tipo === 'mensaje_actualizado') {
        handlers.onMensajeActualizado?.(payload as SoporteTiWsMensajePayload)
      } else if (tipo === 'estado') {
        const p = payload as SoporteTiWsEstadoPayload
        handlers.onEstadoActualizado?.(p)
        if (shouldNotify(chatUuid, salaActivaUuid.value)) {
          notifySoporteTiChatEvent(
            chatUuid,
            p.codigo,
            tituloNotificacionEstado(p),
            `Nuevo estado: ${p.estado}`
          )
        }
      }
    }
    demoRooms.set(chatUuid, { bc, handlers })
  }

  function desuscribirSala(chatUuid: string) {
    if (!chatUuid) return
    if (usarApi.value) {
      if (!echoRooms.has(chatUuid)) return
      unsubscribeFromChannel(soporteTiChatChannelName(chatUuid))
      echoRooms.delete(chatUuid)
      return
    }
    const room = demoRooms.get(chatUuid)
    if (room) {
      room.bc.close()
      demoRooms.delete(chatUuid)
    }
  }

  function desuscribirTodas() {
    ;[...echoRooms].forEach(desuscribirSala)
    ;[...demoRooms.keys()].forEach(desuscribirSala)
  }

  onUnmounted(() => {
    desuscribirTodas()
  })

  return {
    usarApi,
    salaActivaUuid,
    setSalaActiva,
    suscribirSala,
    desuscribirSala,
    desuscribirTodas,
    publicarDemo
  }
}
