import type { EchoConfig } from '~/types/websocket/echo'

export const getWebSocketConfig = (): EchoConfig => {
  const config = useRuntimeConfig()
  
  // Verificar si las variables de entorno están configuradas
  const hasPusherConfig = config.public.pusherAppKey && config.public.pusherAppCluster
  
  if (!hasPusherConfig) {
    console.warn('⚠️ Variables de entorno de Pusher no configuradas')
    console.warn('Configuración actual:', {
      pusherAppKey: config.public.pusherAppKey,
      pusherAppCluster: config.public.pusherAppCluster,
      pusherWsHost: config.public.pusherWsHost
    })
  }
  
  // Si tienes un WebSocket personalizado (Laravel Echo Server)
  if (config.public.pusherWsHost) {
    return {
      broadcaster: 'pusher',
      key: config.public.pusherAppKey || 'local',
      cluster: config.public.pusherAppCluster || 'mt1',
      wsHost: config.public.pusherWsHost,
      wsPort: 443,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `https://${config.public.pusherWsHost}/api/broadcasting/auth`
    }
  }
  
  // Configuración por defecto para Pusher Cloud
  return {
    broadcaster: 'pusher',
    key: config.public.pusherAppKey || 'local',
    cluster: config.public.pusherAppCluster || 'mt1',
    forceTLS: true,
    enabledTransports: ['ws', 'wss']
  }
}

export const validateWebSocketConfig = (): boolean => {
  const config = useRuntimeConfig()
  
  const requiredVars = [
    'pusherAppKey',
    'pusherAppCluster'
  ]
  
  const missingVars = requiredVars.filter(varName => !config.public[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars)
    console.error('Configuración actual:', config.public)
    return false
  }
  
  
  return true
}

/** Prueba async de la configuración WebSocket (uso interno). Para test en UI usar utils/websocket-test. */
export const testWebSocketConnectionAsync = async (): Promise<boolean> => {
  try {
    getWebSocketConfig()
    return validateWebSocketConfig()
  } catch (error) {
    console.error('❌ Error probando conexión WebSocket:', error)
    return false
  }
} 