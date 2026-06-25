import { useModal } from '~/composables/commons/useModal'
import type { WsNotificationChannel } from '~/types/notifications/preferences'
import { canShowWsNotification } from './useNotificationPreferences'
import type { WsNotificationKey } from './keys'

/** Atajo para consultar si un canal está habilitado. */
export function canShowWs(key: WsNotificationKey | string, canal: WsNotificationChannel = 'modal'): boolean {
  return canShowWsNotification(key, canal)
}

/** Muestra modal de éxito solo si la preferencia lo permite. */
export function wsShowSuccess(
  key: WsNotificationKey | string,
  title: string,
  message: string,
  options?: { duration?: number }
): void {
  if (!canShowWsNotification(key, 'modal')) return
  const { showSuccess } = useModal()
  showSuccess(title, message, options)
}

/** Muestra modal de error solo si la preferencia lo permite. */
export function wsShowError(key: WsNotificationKey | string, title: string, message: string): void {
  if (!canShowWsNotification(key, 'modal')) return
  const { showError } = useModal()
  showError(title, message)
}

/** Emite evento `websocket-modal` respetando preferencias (para listeners globales). */
export function dispatchWsModal(detail: {
  key: WsNotificationKey | string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  canal?: WsNotificationChannel
}): void {
  const canal = detail.canal || 'modal'
  if (!canShowWsNotification(detail.key, canal)) return
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('websocket-modal', {
      detail: {
        type: detail.type,
        title: detail.title,
        message: detail.message,
        duration: detail.duration,
        key: detail.key,
        canal,
      },
    })
  )
}
