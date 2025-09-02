import Echo from 'laravel-echo'
import type { Channel, PresenceChannel } from 'pusher-js'
import { ref, onMounted, onUnmounted } from 'vue'
import type { EchoConfig, WebSocketRole, WebSocketChannel } from '../../types/websocket/echo'

let echoInstance: Echo | null = null

export const useEcho = () => {
  const isConnected = ref(false)
  const error = ref<Error | null>(null)
  const activeChannels = ref<Map<string, Channel | PresenceChannel>>(new Map())
  const config = useRuntimeConfig()

  const initializeEcho = async (echoConfig: EchoConfig) => {
    try {
      if (typeof window !== 'undefined') {
        const PusherJs = await import('pusher-js')
        ;(window as any).Pusher = PusherJs.default

        // Habilitar logs de Pusher
        ;(window as any).Pusher.logToConsole = true
      }
      
      console.log('🔄 Iniciando Echo con config:', {
        ...echoConfig,
        key: config.public.pusherAppKey,
        cluster: config.public.pusherAppCluster
      })

      echoInstance = new Echo({
        broadcaster: 'pusher',
        key: config.public.pusherAppKey,
        cluster: config.public.pusherAppCluster,
        ...echoConfig,
        enabledTransports: ['ws', 'wss'],
        forceTLS: false
      })

      // Agregar listeners globales de Pusher
      if ((echoInstance as any).connector?.pusher) {
        (echoInstance as any).connector.pusher.connection.bind('connected', () => {
          console.log('🟢 Pusher: Conectado')
          console.log('🔌 Socket ID:', echoInstance?.socketId())
        })

        (echoInstance as any).connector.pusher.connection.bind('disconnected', () => {
          console.log('🔴 Pusher: Desconectado')
        })

        (echoInstance as any).connector.pusher.connection.bind('error', (err: any) => {
          console.error('❌ Pusher: Error de conexión', err)
        })
      }

      isConnected.value = true
      error.value = null
      console.log('✅ Echo inicializado correctamente')
    } catch (err) {
      error.value = err as Error
      console.error('❌ Error inicializando Echo:', err)
    }
  }

  const subscribeToChannel = (channel: WebSocketChannel) => {
    if (!echoInstance) {
      throw new Error('Echo instance not initialized')
    }

    console.log(`📡 Intentando suscribirse al canal: ${channel.name} (${channel.type})`)
    let channelInstance: any

    try {
      switch (channel.type) {
        case 'private':
          channelInstance = echoInstance.private(channel.name)
          break
        case 'presence':
          channelInstance = echoInstance.join(channel.name)
          break
        default:
          throw new Error(`Tipo de canal no soportado: ${channel.type}`)
      }

      // Agregar listeners de estado del canal
      if (channelInstance) {
        (channelInstance as any).bind('pusher:subscription_succeeded', () => {
          console.log(`✅ Suscripción exitosa al canal: ${channel.name}`)
        })

        (channelInstance as any).bind('pusher:subscription_error', (err: any) => {
          console.error(`❌ Error en suscripción al canal ${channel.name}:`, err)
        })
      }

      // Registrar los manejadores de eventos para este canal
      channel.handlers.forEach(({ event, callback }) => {
        console.log(`🎯 Registrando evento '${event}' en canal '${channel.name}'`)
        try {
          // Para Laravel Echo con Pusher, usar bind
          if (typeof (channelInstance as any).bind === 'function') {
            (channelInstance as any).bind(event, (data: any) => {
              console.log(`📨 Evento recibido '${event}' en canal '${channel.name}':`, data)
              callback(data)
            })
          } else if (typeof (channelInstance as any).listen === 'function') {
            (channelInstance as any).listen(event, (data: any) => {
              console.log(`📨 Evento recibido '${event}' en canal '${channel.name}':`, data)
              callback(data)
            })
          } else {
            console.warn(`⚠️ El canal no soporta 'bind' ni 'listen' para el evento: ${event}`)
          }
        } catch (err) {
          console.error(`❌ Error registrando evento '${event}':`, err)
        }
      })

      activeChannels.value.set(channel.name, channelInstance)
      return channelInstance
    } catch (err) {
      console.error(`❌ Error suscribiéndose al canal ${channel.name}:`, err)
      throw err
    }
  }

  const subscribeToRoleChannels = (roleConfig: WebSocketRole) => {
    console.log(`👥 Configurando canales para rol: ${roleConfig.role}`)
    roleConfig.channels.forEach(channel => {
      try {
        subscribeToChannel(channel)
      } catch (err) {
        console.error(`❌ Error configurando canal ${channel.name}:`, err)
      }
    })
  }

  const unsubscribeFromChannel = (channelName: string) => {
    console.log(`🔌 Desuscribiendo del canal: ${channelName}`)
    const channel = activeChannels.value.get(channelName)
    if (channel) {
      try {
        echoInstance?.leave(channelName)
        activeChannels.value.delete(channelName)
        console.log(`✅ Desuscripción exitosa del canal: ${channelName}`)
      } catch (err) {
        console.error(`❌ Error desuscribiendo del canal ${channelName}:`, err)
      }
    }
  }

  const disconnect = () => {
    if (echoInstance) {
      console.log('🔌 Desconectando todos los canales')
      activeChannels.value.forEach((_, channelName) => {
        unsubscribeFromChannel(channelName)
      })
      echoInstance.disconnect()
      echoInstance = null
      isConnected.value = false
      console.log('✅ Desconexión completa')
    }
  }

  const getActiveChannels = () => {
    const channels = Array.from(activeChannels.value.keys())
    console.log('📻 Canales activos:', channels)
    return channels
  }

  const getChannelStatus = (channelName: string) => {
    const channel = activeChannels.value.get(channelName)
    if (channel) {
      return {
        name: channelName,
        isSubscribed: true,
        type: (channel as any).members ? 'presence' : 'private'
      }
    }
    return null
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    error,
    activeChannels,
    initializeEcho,
    subscribeToChannel,
    subscribeToRoleChannels,
    unsubscribeFromChannel,
    disconnect,
    getActiveChannels,
    getChannelStatus
  }
}

export const getEchoInstance = () => echoInstance