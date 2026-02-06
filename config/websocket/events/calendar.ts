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
 * Obtiene el ID del usuario actual desde localStorage (mismo criterio que auth/websocket).
 */
function getCurrentUserId(): number | string | null {
  if (typeof process === 'undefined' || !process.client) return null
  try {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) return null
    const user = JSON.parse(authUser) as {
      id?: number | string
      raw?: { ID_Usuario?: number; id?: number; Id_Usuario?: number }
    }
    return user?.id ?? user?.raw?.ID_Usuario ?? user?.raw?.id ?? user?.raw?.Id_Usuario ?? null
  } catch {
    return null
  }
}

const CALENDAR_ACTION_COOLDOWN_MS = 18_000 // No mostrar modal si el usuario acaba de crear/editar/eliminar (backend job tarda unos segundos)

/** Indica que el usuario actual acaba de crear/editar/eliminar una actividad (para no mostrarle el modal). */
export function markCalendarActionByCurrentUser(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('calendar_action_ts', String(Date.now()))
    } catch (_) { /* ignore */ }
  }
}

function isOnCalendarPath(): boolean {
  if (typeof window === 'undefined') return false
  const path = window.location?.pathname ?? ''
  return path.startsWith('/calendar')
}

function didCurrentUserJustAct(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const ts = sessionStorage.getItem('calendar_action_ts')
    if (!ts) return false
    const age = Date.now() - Number(ts)
    return age >= 0 && age < CALENDAR_ACTION_COOLDOWN_MS
  } catch {
    return false
  }
}

/**
 * Al recibir un evento de calendario por socket: mostrar popup solo si está en vista calendario
 * y no es el usuario que acaba de crear/editar/eliminar.
 */
function onCalendarSocketEvent(payload: unknown) {
  if (!isOnCalendarPath()) return

  const data = payload && typeof payload === 'object' && 'triggered_by_user_id' in payload
    ? (payload as { triggered_by_user_id?: number | string | null })
    : null
  const triggeredBy = data?.triggered_by_user_id
  console.log('triggeredBy', triggeredBy)
  console.log('data', data)
  if (triggeredBy != null && triggeredBy !== '') {
    const myId = getCurrentUserId()
    if (myId != null) {
      const a = Number(triggeredBy)
      const b = Number(myId)
      if (!Number.isNaN(a) && !Number.isNaN(b) && a === b) return
    }
  }
  if (didCurrentUserJustAct()) return

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
