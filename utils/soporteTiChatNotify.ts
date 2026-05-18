import type { SoporteTiWsEstadoPayload, SoporteTiWsMensajePayload } from '~/types/soporteTi'
import { mostrarNotificacionNavegadorSoporteTi } from '~/utils/soporteTiBrowserNotification'

export function notifySoporteTiModal(
  type: 'info' | 'success' | 'warning',
  title: string,
  message: string
) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('websocket-modal', {
      detail: { type, title, message, duration: 6000 }
    })
  )
}

export function notifySoporteTiChatEvent(
  chatUuid: string,
  codigo: string,
  title: string,
  message: string,
  kind: 'mensaje' | 'estado' = 'mensaje'
) {
  if (typeof window === 'undefined') return

  const detail = { chatUuid, codigo, title, message, kind }
  window.dispatchEvent(
    new CustomEvent('soporte-ti-chat-event', {
      detail
    })
  )

  if (kind !== 'mensaje') return

  const urlDetalle = `/soporte-ti/${encodeURIComponent(chatUuid)}`
  void mostrarNotificacionNavegadorSoporteTi({
    chatUuid,
    codigo,
    title,
    message,
    kind,
    urlDetalle
  })
}

export function tituloNotificacionMensaje(payload: SoporteTiWsMensajePayload): string {
  return `Nuevo mensaje — ${payload.codigo}`
}

export function tituloNotificacionEstado(payload: SoporteTiWsEstadoPayload): string {
  return `Estado actualizado — ${payload.codigo}`
}
