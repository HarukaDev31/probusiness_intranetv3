import type { SoporteTiWsEstadoPayload, SoporteTiWsMensajePayload } from '~/types/soporteTi'
import { mostrarNotificacionNavegadorSoporteTi } from '~/utils/soporteTiBrowserNotification'
import { canShowWsNotification, WS_NOTIFICATION_KEYS } from '~/composables/notifications/preferences'

export function notifySoporteTiModal(
  type: 'info' | 'success' | 'warning',
  title: string,
  message: string
) {
  if (!canShowWsNotification(WS_NOTIFICATION_KEYS.SOPORTE_TI_MENSAJE, 'modal')) return
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('websocket-modal', {
      detail: {
        type,
        title,
        message,
        duration: 6000,
        key: WS_NOTIFICATION_KEYS.SOPORTE_TI_MENSAJE,
        canal: 'modal',
      }
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

  const key = kind === 'estado'
    ? WS_NOTIFICATION_KEYS.SOPORTE_TI_ESTADO
    : WS_NOTIFICATION_KEYS.SOPORTE_TI_MENSAJE

  const detail = { chatUuid, codigo, title, message, kind }

  if (canShowWsNotification(key, 'modal')) {
    window.dispatchEvent(
      new CustomEvent('soporte-ti-chat-event', { detail })
    )
  }

  if (kind !== 'mensaje') return
  if (!canShowWsNotification(WS_NOTIFICATION_KEYS.SOPORTE_TI_MENSAJE, 'navegador')) return

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
