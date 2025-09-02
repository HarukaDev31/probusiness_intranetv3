import { useWebSocketRole } from '../composables/websocket/useWebSocketRole'
import { useEcho } from '../composables/websocket/useEcho'

export default defineNuxtPlugin(async () => {
  // Solo ejecutar en el cliente
  if (process.server) return

  const { initializeEcho } = useEcho()
  const { setupRoleChannels } = useWebSocketRole()

  // Función para inicializar websockets cuando el usuario esté autenticado
  const initializeWebSockets = async () => {
    // Verificar si el usuario está autenticado
    const authToken = localStorage.getItem('auth_token')
    const authUser = localStorage.getItem('auth_user')
    
    if (!authToken || !authUser) {
      console.log('🔌 Usuario no autenticado, esperando...')
      return
    }

    // Configuración de Echo
    const echoConfig = {
      wsHost: process.env.NUXT_WEBSOCKETS_URL || 'localhost',
      wsPort: 6001,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      auth: {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Authorization': `Bearer ${authToken}`
        }
      }
    }

    try {
      // Inicializar Echo
      await initializeEcho(echoConfig)

      // Configurar canales según el rol del usuario
      await setupRoleChannels()

      console.log('🔌 Plugin de WebSocket inicializado correctamente')
    } catch (error) {
      console.error('❌ Error inicializando WebSocket:', error)
    }
  }

  // Intentar inicializar inmediatamente
  await initializeWebSockets()

  // Escuchar cambios en el localStorage para detectar login/logout
  if (process.client) {
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth_token' || event.key === 'auth_user') {
        console.log('🔌 Cambio detectado en autenticación, reinicializando WebSocket...')
        initializeWebSockets()
      }
    })
  }
})
