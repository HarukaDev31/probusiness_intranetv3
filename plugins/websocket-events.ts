import { registerAllRoleEvents } from '~/config/websocket/events'

/**
 * Registra handlers y mapa de canales por rol (debe ejecutarse antes de auth/websocket).
 */
export default defineNuxtPlugin({
  name: 'websocket-events',
  setup() {
    registerAllRoleEvents()
  }
})
