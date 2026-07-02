import {
  loadNotificationPreferences,
  resetNotificationPreferences,
} from '~/composables/notifications/preferences'

/**
 * Precarga las preferencias de notificaciones websocket del usuario para que
 * los handlers de socket puedan consultarlas de forma sincrónica.
 */
export default defineNuxtPlugin(() => {
  if (process.server) return

  const tryLoad = (force = false) => {
    try {
      if (localStorage.getItem('auth_token')) {
        void loadNotificationPreferences(force)
      }
    } catch {
      /* noop */
    }
  }

  // Intento inicial y cuando Echo está listo (auth ya disponible).
  tryLoad()
  window.addEventListener('echo-ready', () => tryLoad())

  // Cambio de usuario en la MISMA pestaña: limpiar y recargar para el nuevo usuario.
  window.addEventListener('auth-login', () => {
    resetNotificationPreferences()
    tryLoad(true)
  })
  window.addEventListener('auth-logout', () => {
    resetNotificationPreferences()
  })

  // Reaccionar a login/logout en otra pestaña.
  window.addEventListener('storage', (event) => {
    if (event.key !== 'auth_token') return
    if (localStorage.getItem('auth_token')) {
      resetNotificationPreferences()
      tryLoad(true)
    } else {
      resetNotificationPreferences()
    }
  })
})
