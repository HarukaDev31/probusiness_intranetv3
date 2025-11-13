import { registerAllRoleEvents } from '~/config/websocket/events'

/**
 * Plugin para registrar eventos de WebSocket dinámicamente por rol
 * Se ejecuta antes de la suscripción a los canales
 * 
 * Los eventos están organizados por rol en:
 * - config/websocket/events/cotizador.ts
 * - config/websocket/events/admin.ts
 * - config/websocket/events/documentacion.ts
 * - etc.
 */
export default defineNuxtPlugin(() => {
  // Solo ejecutar en el cliente
  if (process.server) return

  // Registrar todos los eventos de todos los roles
  registerAllRoleEvents()
})

