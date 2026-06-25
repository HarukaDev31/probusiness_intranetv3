import { onMounted, onUnmounted } from 'vue'
import { useModal } from './commons/useModal'
import { canShowWsNotification } from '~/composables/notifications/preferences'
import type { WsNotificationChannel } from '~/types/notifications/preferences'

export const useWebSocketNotifications = () => {
  const { showSuccess, showError, showWarning, showInfo } = useModal()

  const handleWebSocketModal = (event: CustomEvent) => {
    const { type, title, message, duration, key, canal } = event.detail || {}

    // Si el emisor incluye una clave del catálogo, respetar la preferencia del usuario.
    if (key && !canShowWsNotification(key, (canal as WsNotificationChannel) || 'modal')) {
      return
    }

    switch (type) {
      case 'success':
        showSuccess(title, message, { duration })
        break
      case 'error':
        showError(title, message, { persistent: true })
        break
      case 'warning':
        showWarning(title, message, { duration })
        break
      case 'info':
        showInfo(title, message, { duration })
        break
      default:
        showInfo(title, message, { duration })
    }
  }

  onMounted(() => {
    // Escuchar eventos de modales de WebSocket
    window.addEventListener('websocket-modal', handleWebSocketModal as EventListener)
  })

  onUnmounted(() => {
    // Limpiar el listener cuando el componente se desmonte
    window.removeEventListener('websocket-modal', handleWebSocketModal as EventListener)
  })

  return {
    handleWebSocketModal
  }
}

