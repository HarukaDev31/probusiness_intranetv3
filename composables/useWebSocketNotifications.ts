import { onMounted, onUnmounted } from 'vue'
import { useNotifications } from './useNotifications'

export const useWebSocketNotifications = () => {
  const { showSuccess, showError } = useNotifications()

  const handleWebSocketNotification = (event: CustomEvent) => {
    const { type, title, subtitle, message, details, autoClose, duration } = event.detail

    if (type === 'success') {
      showSuccess({
        title,
        subtitle,
        message,
        details,
        autoClose,
        duration
      })
    } else if (type === 'error') {
      showError({
        title,
        subtitle,
        message,
        details,
        autoClose,
        duration
      })
    }
  }

  onMounted(() => {
    // Escuchar eventos de notificaciones de WebSocket
    window.addEventListener('websocket-notification', handleWebSocketNotification as EventListener)
  })

  onUnmounted(() => {
    // Limpiar el listener cuando el componente se desmonte
    window.removeEventListener('websocket-notification', handleWebSocketNotification as EventListener)
  })

  return {
    handleWebSocketNotification
  }
}

