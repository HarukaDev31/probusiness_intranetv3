import Echo from 'laravel-echo'
import type { Channel, PresenceChannel } from 'pusher-js'
import { ref } from 'vue'
import type { EchoConfig, WebSocketRole, WebSocketChannel } from '../../types/websocket/echo'

let echoInstance: Echo | null = null
let isInitializing = false
let isInitialized = false

type PusherConstructor = typeof import('pusher-js').default

/** Resuelve el constructor Pusher con distintas formas de export (CJS/ESM en Vite). */
async function loadPusherConstructor(): Promise<PusherConstructor> {
  const mod = await import('pusher-js')
  const candidate =
    (mod as { default?: { default?: unknown } }).default?.default ??
    mod.default ??
    (mod as { Pusher?: unknown }).Pusher ??
    mod

  if (typeof candidate !== 'function') {
    throw new Error('pusher-js no exportó un constructor válido')
  }

  return candidate as PusherConstructor
}

export const useEcho = () => {
  const isConnected = ref(false)
  const error = ref<Error | null>(null)
  const activeChannels = ref<Map<string, Channel | PresenceChannel>>(new Map())
  const config = useRuntimeConfig()

  const initializeEcho = async (echoConfig: EchoConfig) => {
    // Evitar múltiples inicializaciones
    if (isInitializing) {
      
      return
    }
    
    if (isInitialized && echoInstance) {
      
      return echoInstance
    }

    isInitializing = true
    
    try {
      if (typeof window !== 'undefined') {
        try {
          const Pusher = await loadPusherConstructor()
          ;(window as any).Pusher = Pusher
          Pusher.logToConsole = import.meta.dev
        } catch (error) {
          console.error('❌ Error importando Pusher:', error)
          throw error
        }
      }
      

      const finalConfig = {
        ...echoConfig,
        broadcaster: 'pusher',
        key: String(echoConfig.key || config.public.pusherAppKey || '').trim(),
        cluster: String(echoConfig.cluster || config.public.pusherAppCluster || 'mt1').trim(),
        enabledTransports: echoConfig.enabledTransports ?? ['ws', 'wss']
      }

      if (process.dev) {
        console.info('[Echo] Inicializando', {
          wsHost: finalConfig.wsHost,
          wsPort: finalConfig.wsPort,
          authEndpoint: finalConfig.authEndpoint,
          forceTLS: finalConfig.forceTLS
        })
      }

      echoInstance = new Echo(finalConfig)

      // Agregar listeners globales de Pusher
      if ((echoInstance as any).connector?.pusher) {
        const pusher = (echoInstance as any).connector.pusher
        const connection = pusher.connection
        
        
        // Intentar diferentes métodos para registrar eventos de conexión
        if (connection && typeof connection === 'object') {
          // Método 1: bind (Pusher tradicional)
          if (typeof connection.bind === 'function') {
            
            connection.bind('connected', () => {
              // Conexión establecida
            })

            connection.bind('disconnected', () => {
              
            })

            connection.bind('error', (err: any) => {
              console.error('❌ Pusher: Error de conexión', err)
            })
          }
          // Método 2: on (alternativa)
          else if (typeof connection.on === 'function') {
            
            connection.on('connected', () => {
              
            })

            connection.on('disconnected', () => {
              
            })

            connection.on('error', (err: any) => {
              console.error('❌ Pusher: Error de conexión', err)
            })
          }
          // Método 3: addEventListener (DOM)
          else if (typeof connection.addEventListener === 'function') {
            
            connection.addEventListener('connected', () => {
              
            })

            connection.addEventListener('disconnected', () => {
              
            })

            connection.addEventListener('error', (err: any) => {
              console.error('❌ Pusher: Error de conexión', err)
            })
          }
          else {
            console.warn('⚠️ No se encontraron métodos válidos para eventos de conexión Pusher')
            console.warn('⚠️ Métodos disponibles:', Object.getOwnPropertyNames(connection))
          }
        } else {
          console.warn('⚠️ Objeto de conexión Pusher no válido')
        }
      }

      isConnected.value = true
      error.value = null
      isInitialized = true
      
    } catch (err) {
      error.value = err as Error
      console.error('❌ Error inicializando Echo:', err)
    } finally {
      isInitializing = false
    }
  }

  const subscribeToChannel = (channel: WebSocketChannel) => {
    if (!echoInstance) {
      throw new Error('Echo instance not initialized')
    }

    // Verificar si ya estamos suscritos a este canal para evitar duplicados
    if (activeChannels.value.has(channel.name)) {
      
      return activeChannels.value.get(channel.name)
    }

    
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
        try {
          // Intentar diferentes métodos para los eventos de suscripción
          if (typeof channelInstance.bind === 'function') {
            channelInstance.bind('pusher:subscription_succeeded', () => {
              
            })

            channelInstance.bind('pusher:subscription_error', (err: any) => {
              console.error(`❌ Error en suscripción al canal ${channel.name}:`, err)
            })
          } else if (typeof channelInstance.listen === 'function') {
            channelInstance.listen('pusher:subscription_succeeded', () => {
              
            })

            channelInstance.listen('pusher:subscription_error', (err: any) => {
              console.error(`❌ Error en suscripción al canal ${channel.name}:`, err)
            })
          } else {
            
          }
        } catch (err) {
          console.warn(`⚠️ Error registrando eventos de suscripción para ${channel.name}:`, err)
        }
      }

      // Registrar los manejadores de eventos para este canal.
      // Laravel Echo expone el canal real en .subscription; enlazar ahí garantiza el mismo comportamiento que los canales por rol.
      const registeredEvents = new Set()
      channel.handlers.forEach(({ event, callback }) => {
        const eventKey = `${channel.name}:${event}`
        if (registeredEvents.has(eventKey)) return
        registeredEvents.add(eventKey)

        const eventNamePusher = event.startsWith('.') ? event.slice(1) : event
        const eventNameEcho = event.startsWith('.') ? event : '.' + event

        const onEvent = (data: any) => {
          if (process.dev && eventNamePusher.startsWith('Calendar')) {
            console.log('[WS] Evento calendario recibido:', eventNamePusher, data)
          }
          callback(data)
        }

        try {
          if (!channelInstance || typeof channelInstance !== 'object') {
            console.error('❌ channelInstance no es un objeto válido:', channelInstance)
            return
          }
          let bound = false
          // 1) Mismo camino que los canales por rol: enlazar en el canal real de Pusher (.subscription)
          const subscription = channelInstance.subscription
          if (subscription && typeof subscription.bind === 'function') {
            subscription.bind(eventNamePusher, onEvent)
            bound = true
          }
          // 2) Si no hay .subscription (canal no Echo), usar .listen() del wrapper Echo
          if (!bound && typeof channelInstance.listen === 'function') {
            channelInstance.listen(eventNameEcho, onEvent)
            bound = true
          }
          if (!bound && typeof channelInstance.bind === 'function') {
            channelInstance.bind(eventNamePusher, onEvent)
            bound = true
          }
          if (!bound) {
            console.warn('⚠️ Canal sin subscription.bind/listen para evento:', event, Object.getOwnPropertyNames(channelInstance))
          }
        } catch (err) {
          console.error('❌ Error registrando evento:', event, err)
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
    
    roleConfig.channels.forEach(channel => {
      try {
        
        subscribeToChannel(channel)
        
      } catch (err) {
        console.error(`❌ Error configurando canal ${channel.name}:`, err)
        // Continuar con otros canales aunque uno falle
      }
    })
  }

  const unsubscribeFromChannel = (channelName: string) => {
    
    const channel = activeChannels.value.get(channelName)
    if (channel) {
      try {
        echoInstance?.leave(channelName)
        activeChannels.value.delete(channelName)
        
      } catch (err) {
        console.error(`❌ Error desuscribiendo del canal ${channelName}:`, err)
      }
    }
  }

  const disconnect = () => {
    if (echoInstance) {
      
      activeChannels.value.forEach((_, channelName) => {
        unsubscribeFromChannel(channelName)
      })
      echoInstance.disconnect()
      echoInstance = null
      isConnected.value = false
      isInitialized = false
      isInitializing = false
      
    }
  }

  const resetEcho = () => {
    
    echoInstance = null
    isInitialized = false
    isInitializing = false
    activeChannels.value.clear()
    isConnected.value = false
    error.value = null
  }

  const getActiveChannels = () => {
    const channels = Array.from(activeChannels.value.keys())
    
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

  return {
    isConnected,
    error,
    activeChannels,
    initializeEcho,
    subscribeToChannel,
    subscribeToRoleChannels,
    unsubscribeFromChannel,
    disconnect,
    resetEcho,
    getActiveChannels,
    getChannelStatus
  }
}

export const getEchoInstance = () => echoInstance