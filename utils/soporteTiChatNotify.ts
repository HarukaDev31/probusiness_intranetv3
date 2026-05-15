import type { SoporteTiWsEstadoPayload, SoporteTiWsMensajePayload } from '~/types/soporteTi'

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
  message: string
) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('soporte-ti-chat-event', {
      detail: { chatUuid, codigo, title, message }
    })
  )
  notifySoporteTiModal('info', title, message)
}

export function tituloNotificacionMensaje(payload: SoporteTiWsMensajePayload): string {
  return `Nuevo mensaje — ${payload.codigo}`
}

export function tituloNotificacionEstado(payload: SoporteTiWsEstadoPayload): string {
  return `Estado actualizado — ${payload.codigo}`
}
