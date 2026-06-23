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

  if (
    typeof localStorage !== 'undefined'
    && localStorage.getItem('auth_token')
    && typeof Notification !== 'undefined'
    && Notification.permission === 'granted'
  ) {
    void registrarServiceWorkerNotificacionesWaInbox()
    precalentarSonidoWaInbox()
  }
})
