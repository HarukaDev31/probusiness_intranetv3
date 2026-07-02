import { getRoleEventsConfig } from '~/config/websocket/events-config'
import { CALENDAR_PERMISSIONS, ROLES } from '~/constants/roles'
import { WA_INBOX_ALLOWED_ROLES } from '~/constants/whatsappInboxAccess'
import { WS_EVENT_TO_NOTIFICATION_KEY } from './eventKeyMap'
import { WS_NOTIFICATION_KEYS } from './keys'

/** Comparación tolerante de nombres de rol (acentos / mayúsculas). */
export function rolesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

const SEGUIMIENTO_DRIVE_ROLES: string[] = [
  ROLES.COTIZADOR,
  ROLES.COORDINACION,
  ROLES.CONTENEDOR_CONSOLIDADO,
  ROLES.JEFE_IMPORTACIONES,
  ROLES.DOCUMENTACION,
]

function keysFromRoleWebsocketConfig(role: string): Set<string> {
  const keys = new Set<string>()
  const roleConfig = getRoleEventsConfig().find(c => rolesMatch(c.role, role))
  if (!roleConfig) return keys

  for (const channel of roleConfig.channels) {
    for (const event of channel.events) {
      const key = WS_EVENT_TO_NOTIFICATION_KEY[event]
      if (key) keys.add(key)
    }
  }
  return keys
}

function hasSoporteTiMenuAccess(menuRoutes: string[]): boolean {
  return menuRoutes.some(
    r => r === '/soporte-ti' || r.startsWith('/soporte-ti/')
  )
}

function hasCargaConsolidadaMenuAccess(menuRoutes: string[]): boolean {
  return menuRoutes.some(
    r => r.includes('carga-consolidada') || r.includes('cotizaciones')
  )
}

/**
 * Claves de preferencias que el usuario puede ver/editar según su rol y menú.
 * Solo incluye eventos websocket que realmente puede recibir.
 */
export function getAvailableNotificationKeysForUser(
  role: string,
  menuRoutes: string[] = []
): string[] {
  const keys = keysFromRoleWebsocketConfig(role)

  // WhatsApp Inbox (canal por rol; refuerzo por lista de roles autorizados).
  if (WA_INBOX_ALLOWED_ROLES.some(r => rolesMatch(r, role))) {
    keys.add(WS_NOTIFICATION_KEYS.WHATSAPP_INBOX_MENSAJE)
  }

  // Calendario: canal privado por usuario; solo roles con permisos de calendario.
  if (role in CALENDAR_PERMISSIONS) {
    keys.add(WS_NOTIFICATION_KEYS.CALENDARIO_ACTIVIDAD)
  }

  // Soporte TI: suscripción dinámica por sala si tiene el módulo en menú.
  if (hasSoporteTiMenuAccess(menuRoutes)) {
    keys.add(WS_NOTIFICATION_KEYS.SOPORTE_TI_MENSAJE)
    keys.add(WS_NOTIFICATION_KEYS.SOPORTE_TI_ESTADO)
  }

  // Seguimiento Drive: canal por contenedor al usar cotizaciones / carga consolidada.
  if (
    SEGUIMIENTO_DRIVE_ROLES.some(r => rolesMatch(r, role))
    || hasCargaConsolidadaMenuAccess(menuRoutes)
  ) {
    keys.add(WS_NOTIFICATION_KEYS.SEGUIMIENTO_DRIVE)
  }

  return Array.from(keys)
}
