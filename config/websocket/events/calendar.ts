import { registerEventHandler, WS_EVENTS } from '~/config/websocket/channels'
import { notifyCalendarUpdateFromSocket } from '~/composables/useCalendarUpdateNotification'

/** Nombres de eventos de calendario (canal por usuario). */
export const CALENDAR_EVENTS = [
  WS_EVENTS.CALENDAR_ACTIVITY_CREATED,
  WS_EVENTS.CALENDAR_ACTIVITY_UPDATED,
  WS_EVENTS.CALENDAR_ACTIVITY_DELETED
]

/**
 * Nombre del canal privado del usuario para eventos de calendario.
 * El backend emite a private-App.Models.User.{userId} para el dueño y responsables.
 */
export const getUserCalendarChannelName = (userId: number | string): string =>
  `App.Models.User.${userId}`

/**
 * Al recibir un evento de calendario por socket: mostrar popup para que el usuario
 * recargue la vista actual (solo recarga si está en una página /calendar/*).
 */
function onCalendarSocketEvent() {
  notifyCalendarUpdateFromSocket()
}

/**
 * Registra handlers de eventos de calendario.
 * La suscripción al canal se hace por usuario en el plugin (App.Models.User.{userId}).
 */
export const registerCalendarEvents = () => {
  registerEventHandler(WS_EVENTS.CALENDAR_ACTIVITY_CREATED, onCalendarSocketEvent)
  registerEventHandler(WS_EVENTS.CALENDAR_ACTIVITY_UPDATED, onCalendarSocketEvent)
  registerEventHandler(WS_EVENTS.CALENDAR_ACTIVITY_DELETED, onCalendarSocketEvent)
}
