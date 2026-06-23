import {
  registrarServiceWorkerNotificacionesWaInbox,
  registrarSolicitudPermisoNotificacionWaInboxEnPrimerClic
} from '~/utils/waInboxBrowserNotification'
import {
  precalentarSonidoWaInbox,
  registrarPrecalentadoSonidoWaInboxEnPrimerClic
} from '~/utils/waInboxNotificationSound'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  registrarPrecalentadoSonidoWaInboxEnPrimerClic()
  registrarSolicitudPermisoNotificacionWaInboxEnPrimerClic()

  if (localStorage.getItem('auth_token') && Notification.permission === 'granted') {
    void registrarServiceWorkerNotificacionesWaInbox()
    precalentarSonidoWaInbox()
  }
})
