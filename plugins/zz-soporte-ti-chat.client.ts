import {
  attachSoporteTiChatGlobalListeners,
  watchSoporteTiSolicitudesParaSalas
} from '~/composables/useSoporteTiChatGlobal'
import {
  registrarServiceWorkerNotificaciones,
  registrarSolicitudPermisoNotificacionEnPrimerClic
} from '~/utils/soporteTiBrowserNotification'
import { useSoporteTiChatNotificacion } from '~/composables/useSoporteTiChatNotificacion'
import type { SoporteTiChatNotificacionPayload } from '~/composables/useSoporteTiChatNotificacion'

let notificacionListenerAttached = false

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  nuxtApp.hook('app:mounted', () => {
    nuxtApp.runWithContext(() => {
      attachSoporteTiChatGlobalListeners()
      watchSoporteTiSolicitudesParaSalas()
      registrarSolicitudPermisoNotificacionEnPrimerClic()
      if (localStorage.getItem('auth_token') && Notification.permission === 'granted') {
        void registrarServiceWorkerNotificaciones()
      }

      if (!notificacionListenerAttached) {
        notificacionListenerAttached = true
        window.addEventListener('soporte-ti-chat-event', (ev) => {
          nuxtApp.runWithContext(() => {
            const detail = (ev as CustomEvent<SoporteTiChatNotificacionPayload>).detail
            if (!detail?.chatUuid) return
            useSoporteTiChatNotificacion().mostrar(detail)
          })
        })
      }
    })
  })
})
