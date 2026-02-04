import {
  registerEventHandler,
  subscribeEventsToRole,
  WS_EVENTS
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'

const CALENDAR_EVENTS = [
  WS_EVENTS.CALENDAR_ACTIVITY_CREATED,
  WS_EVENTS.CALENDAR_ACTIVITY_UPDATED,
  WS_EVENTS.CALENDAR_ACTIVITY_DELETED
]

/**
 * Refresca datos del calendario (eventos y progreso) al recibir un evento por socket.
 * Usado por los roles Documentación, Coordinación y Jefe Importaciones.
 */
function refreshCalendarData() {
  try {
    const { loadEvents, loadProgress } = useCalendarStore()
    loadEvents(true)
    loadProgress(true)
  } catch (e) {
    // Store puede no estar inicializado si el usuario no está en el módulo calendario
    console.debug('Calendar socket: refresh skipped', e)
  }
}

/**
 * Configuración de eventos de calendario para los roles que ven el módulo:
 * Documentación, Coordinación y Jefe Importaciones.
 */
export const registerCalendarEvents = () => {
  registerEventHandler(WS_EVENTS.CALENDAR_ACTIVITY_CREATED, refreshCalendarData)
  registerEventHandler(WS_EVENTS.CALENDAR_ACTIVITY_UPDATED, refreshCalendarData)
  registerEventHandler(WS_EVENTS.CALENDAR_ACTIVITY_DELETED, refreshCalendarData)

  // Documentación: canal Documentacion-notifications
  subscribeEventsToRole(
    ROLES.DOCUMENTACION,
    `${ROLES.DOCUMENTACION}-notifications`,
    CALENDAR_EVENTS,
    'private'
  )

  // Coordinación: canal Coordinacion-notifications (sin tilde, como en backend)
  subscribeEventsToRole(
    ROLES.COORDINACION,
    'Coordinacion-notifications',
    CALENDAR_EVENTS,
    'private'
  )

  // Jefe Importaciones: canal JefeImportacion-notifications
  subscribeEventsToRole(
    ROLES.JEFE_IMPORTACIONES,
    'JefeImportacion-notifications',
    CALENDAR_EVENTS,
    'private'
  )
}
