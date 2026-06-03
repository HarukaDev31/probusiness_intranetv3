import Echo from 'laravel-echo'
import type { Channel, PresenceChannel } from 'pusher-js'
import { ref } from 'vue'
import type { EchoConfig, WebSocketRole, WebSocketChannel } from '../../types/websocket/echo'

let echoInstance: Echo | null = null
let isInitializing = false
let isInitialized = false

/** Eventos ya enlazados al socket Pusher (solo una vez por canal+evento). */
const boundHandlersByChannel = new Map<string, Set<string>>()
/** Último callback por canal+evento (se actualiza en cada subscribe sin re-bind). */
const handlerCallbacksByChannel = new Map<string, Map<string, (data: unknown) => void>>()

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

  const bindChannelHandlers = (channelName: string, channelInstance: any, handlers: WebSocketChannel['handlers']) => {
    const boundKeys = boundHandlersByChannel.get(channelName) ?? new Set<string>()
    let channelCallbacks = handlerCallbacksByChannel.get(channelName)
    if (!channelCallbacks) {
      channelCallbacks = new Map()
      handlerCallbacksByChannel.set(channelName, channelCallbacks)
    }

    handlers.forEach(({ event, callback }) => {
      const eventKey = event.startsWith('.') ? event : `.${event}`
      channelCallbacks!.set(eventKey, callback)

      const eventNamePusher = eventKey.slice(1)
      const eventNameEcho = eventKey

      const onEvent = (data: unknown) => {
        if (process.dev && eventNamePusher.startsWith('Calendar')) {
          console.log('[WS] Evento calendario recibido:', eventNamePusher, data)
        }
        if (process.dev && eventNamePusher.startsWith('WaInbox')) {
          console.log('[WS] WhatsApp Inbox:', eventNamePusher, data)
        }
        handlerCallbacksByChannel.get(channelName)?.get(eventKey)?.(data)
      }

      if (boundKeys.has(eventKey)) return
      boundKeys.add(eventKey)

      try {
        if (!channelInstance || typeof channelInstance !== 'object') {
          return
        }
        // Laravel broadcastAs → escuchar con .EventName (listen); bind nativo es respaldo.
        if (typeof channelInstance.listen === 'function') {
          channelInstance.listen(eventNameEcho, onEvent)
        }
        const subscription = channelInstance.subscription
        if (subscription && typeof subscription.bind === 'function') {
          subscription.bind(eventNamePusher, onEvent)
        } else if (typeof channelInstance.bind === 'function') {
          channelInstance.bind(eventNamePusher, onEvent)
        }
      } catch (err) {
        console.error('❌ Error registrando evento:', eventKey, err)
      }
    })

    boundHandlersByChannel.set(channelName, boundKeys)
  }

  const subscribeToChannel = (channel: WebSocketChannel) => {
    if (!echoInstance) {
      throw new Error('Echo instance not initialized')
    }

    const existing = activeChannels.value.get(channel.name)
    if (existing) {
      bindChannelHandlers(channel.name, existing, channel.handlers)
      return existing
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

      if (channelInstance) {
        try {
          if (typeof channelInstance.bind === 'function') {
            channelInstance.bind('pusher:subscription_succeeded', () => {})
            channelInstance.bind('pusher:subscription_error', (err: unknown) => {
              console.error(`❌ Error en suscripción al canal ${channel.name}:`, err)
            })
          } else if (typeof channelInstance.listen === 'function') {
            channelInstance.listen('pusher:subscription_succeeded', () => {})
            channelInstance.listen('pusher:subscription_error', (err: unknown) => {
              console.error(`❌ Error en suscripción al canal ${channel.name}:`, err)
            })
          }
        } catch (err) {
          console.warn(`⚠️ Error registrando eventos de suscripción para ${channel.name}:`, err)
        }
      }

      bindChannelHandlers(channel.name, channelInstance, channel.handlers)
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
        boundHandlersByChannel.delete(channelName)
        handlerCallbacksByChannel.delete(channelName)
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
    boundHandlersByChannel.clear()
    handlerCallbacksByChannel.clear()
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