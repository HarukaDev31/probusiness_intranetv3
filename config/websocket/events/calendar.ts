import { registerEventHandler, registerRole, WS_EVENTS } from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { notifyCalendarUpdateFromSocket } from '~/composables/useCalendarUpdateNotification'

/** Nombres de eventos de calendario (canal por usuario). */
export const CALENDAR_EVENTS = [
  WS_EVENTS.CALENDAR_ACTIVITY_CREATED,
  WS_EVENTS.CALENDAR_ACTIVITY_UPDATED,
  WS_EVENTS.CALENDAR_ACTIVITY_DELETED
]

/**
 * Nombre del canal privado del usuario para eventos de calendario.
 * Backend usa modelo Usuario (ID_Usuario): private-App.Models.Usuario.{userId}
 */
export const getUserCalendarChannelName = (userId: number | string): string =>
  `App.Models.Usuario.${userId}`

/**
 * Al recibir un evento de calendario por socket: mostrar popup para recargar la vista.
 * No se muestra al usuario que realizó la acción (triggered_by_user_id).
 */
function onCalendarSocketEvent(data: { triggered_by_user_id?: number | null }) {
  if (data?.triggered_by_user_id != null && typeof process !== 'undefined' && process.client) {
    try {
      const authUser = localStorage.getItem('auth_user')
      if (authUser) {
        const user = JSON.parse(authUser) as { id?: number | string; raw?: { ID_Usuario?: number; id?: number } }
        const myId = user?.id ?? user?.raw?.ID_Usuario ?? user?.raw?.id
        if (myId != null && Number(data.triggered_by_user_id) === Number(myId)) return
      }
    } catch (_) { /* ignore */ }
  }
  notifyCalendarUpdateFromSocket()
}

/**
 * Registra handlers de eventos de calendario.
 * La suscripción al canal se hace por usuario en el plugin (App.Models.User.{userId}).
 * Se registra el rol Jefe Importacion sin canales por rol para evitar el aviso
 * "No se encontró configuración para el rol" (el jefe recibe calendario por canal de usuario).
 */
export const registerCalendarEvents = () => {
  registerEventHandler(WS_EVENTS.CALENDAR_ACTIVITY_CREATED, onCalendarSocketEvent)
  registerEventHandler(WS_EVENTS.CALENDAR_ACTIVITY_UPDATED, onCalendarSocketEvent)
  registerEventHandler(WS_EVENTS.CALENDAR_ACTIVITY_DELETED, onCalendarSocketEvent)
  registerRole(ROLES.JEFE_IMPORTACIONES, [])
}
