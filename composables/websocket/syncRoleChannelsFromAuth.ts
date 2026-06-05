import { getWebsocketRoles } from '~/config/websocket/channels'
import { getEchoInstance, useEcho } from '~/composables/websocket/useEcho'

function readAuthRole(): string | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return null
    const user = JSON.parse(raw) as { raw?: { grupo?: { nombre?: string } } }
    const role = user?.raw?.grupo?.nombre
    return typeof role === 'string' && role.trim() ? role.trim() : null
  } catch {
    return null
  }
}

/**
 * Suscribe canales del rol actual (p. ej. whatsapp-copiloto.ventas) cuando Echo ya está listo.
 * Idempotente: subscribeToChannel reutiliza suscripciones existentes.
 */
export function syncRoleChannelsFromAuthUser(): boolean {
  if (!import.meta.client) return false
  if (!getEchoInstance()) return false

  const role = readAuthRole()
  if (!role) return false

  const roleConfig = getWebsocketRoles()[role]
  if (!roleConfig?.channels?.length) return false

  try {
    const { subscribeToRoleChannels } = useEcho()
    subscribeToRoleChannels(roleConfig)
  } catch (err) {
    console.warn('[WS] syncRoleChannelsFromAuthUser:', err)
    return false
  }

  return true
}
