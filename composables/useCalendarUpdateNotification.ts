import { ref, computed } from 'vue'

const showCalendarUpdatePopup = ref(false)

/**
 * Llamar desde el handler de WebSocket (fuera de setup).
 * Activa el popup de "Calendario actualizado" para que el usuario recargue la vista.
 */
export function notifyCalendarUpdateFromSocket() {
  showCalendarUpdatePopup.value = true
}

/**
 * Composable para notificar actualizaciones del calendario vía WebSocket.
 * Muestra un popup con botón "Recargar vista actual" cuando se recibe un evento;
 * al hacer clic se recarga la vista solo si el usuario está en una página del calendario.
 */
export function useCalendarUpdateNotification() {
  const route = useRoute()

  const isOnCalendarPage = computed(() =>
    typeof route.path === 'string' && route.path.startsWith('/calendar')
  )

  /** Marca que hay una actualización pendiente y muestra el popup. */
  const notifyCalendarUpdate = () => {
    showCalendarUpdatePopup.value = true
  }

  const dismiss = () => {
    showCalendarUpdatePopup.value = false
  }

  /**
   * Recarga la vista actual del calendario (solo si estamos en /calendar/*).
   * Incluye vista principal (mes/semana/día/actividades) y vista de progreso (/calendar/progreso).
   * Si no estamos en calendario, solo cierra el popup.
   */
  const reloadCurrentView = async () => {
    if (!isOnCalendarPage.value) {
      dismiss()
      return
    }
    try {
      const { refresh, loadProgress } = useCalendarStore()
      await refresh()
      // Siempre recargar progreso para que la vista de progreso (/calendar/progreso) se actualice
      await loadProgress(true)
    } catch (e) {
      console.debug('Calendar reload failed', e)
    }
    dismiss()
  }

  return {
    showCalendarUpdatePopup,
    isOnCalendarPage,
    notifyCalendarUpdate,
    dismiss,
    reloadCurrentView
  }
}
