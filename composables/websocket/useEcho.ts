import Echo from 'laravel-echo'
import type { Channel, PresenceChannel } from 'pusher-js'
import { ref, onMounted, onUnmounted } from 'vue'
import type { EchoConfig, WebSocketRole, WebSocketChannel } from '../../types/websocket/echo'

let echoInstance: Echo | null = null
let isInitializing = false
let isInitialized = false

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
          const PusherJs = await import('pusher-js')
          ;(window as any).Pusher = PusherJs.default

          // Habilitar logs de Pusher
          ;(window as any).Pusher.logToConsole = true
          
        } catch (error) {
          console.error('❌ Error importando Pusher:', error)
          throw error
        }
      }
      
      console.log('🔄 Iniciando Echo con config:', {
        ...echoConfig,
        key: config.public.pusherAppKey,
        cluster: config.public.pusherAppCluster
      })

      const finalConfig = {
        broadcaster: 'pusher',
        key: config.public.pusherAppKey,
        cluster: config.public.pusherAppCluster,
        ...echoConfig,
        enabledTransports: ['ws', 'wss']
        // No sobrescribir forceTLS, usar el valor del echoConfig
      }
      
      
      
      echoInstance = new Echo(finalConfig)

      // Agregar listeners globales de Pusher
      if ((echoInstance as any).connector?.pusher) {
        const pusher = (echoInstance as any).connector.pusher
        const connection = pusher.connection
        
        console.log('🔍 Verificando métodos de conexión Pusher:', {
          hasConnection: !!connection,
          connectionType: typeof connection,
          hasBind: typeof connection?.bind === 'function',
          hasOn: typeof connection?.on === 'function',
          hasAddEventListener: typeof connection?.addEventListener === 'function'
        })
        
        // Intentar diferentes métodos para registrar eventos de conexión
        if (connection && typeof connection === 'object') {
          // Método 1: bind (Pusher tradicional)
          if (typeof connection.bind === 'function') {
            
            connection.bind('connected', () => {
              console.log('🔗 Pusher: Conexión establecida')
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

      // Registrar los manejadores de eventos para este canal
      const registeredEvents = new Set()
      channel.handlers.forEach(({ event, callback }) => {
        // Evitar registrar el mismo evento múltiples veces
        const eventKey = `${channel.name}:${event}`
        if (registeredEvents.has(eventKey)) {
          
          return
        }
        registeredEvents.add(eventKey)
        
        
        
        try {
          // Intentar diferentes métodos para registrar eventos
          if (channelInstance && typeof channelInstance === 'object') {
            // Método 1: bind (Pusher) - PRIORITARIO para eventos de Pusher
            if (typeof channelInstance.bind === 'function') {
              
              channelInstance.bind(event, (data: any) => {
                
                callback(data)
              })
            }
            // Método 2: Acceder al objeto pusher del canal para usar bind
            else if (channelInstance.pusher && typeof channelInstance.pusher.bind === 'function') {
              
              channelInstance.pusher.bind(event, (data: any) => {
                
                callback(data)
              })
            }
            // Método 3: listen (Laravel Echo) - Para eventos de Laravel
            else if (typeof channelInstance.listen === 'function') {
              
              channelInstance.listen(event, (data: any) => {
                
                callback(data)
              })
            }
            // Método 4: on (alternativa)
            else if (typeof channelInstance.on === 'function') {
              
              channelInstance.on(event, (data: any) => {
                
                callback(data)
              })
            }
            // Método 5: addEventListener (DOM)
            else if (typeof channelInstance.addEventListener === 'function') {
              
              channelInstance.addEventListener(event, (data: any) => {
                
                callback(data)
              })
            }
            else {
              console.warn(`⚠️ El canal no soporta ningún método conocido para el evento: ${event}`)
              console.warn(`⚠️ Métodos disponibles:`, Object.getOwnPropertyNames(channelInstance))
              console.warn(`⚠️ Objeto pusher disponible:`, !!channelInstance.pusher)
              if (channelInstance.pusher) {
                console.warn(`⚠️ Métodos del objeto pusher:`, Object.getOwnPropertyNames(channelInstance.pusher))
              }
            }
          } else {
            console.error(`❌ channelInstance no es un objeto válido:`, channelInstance)
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
    resetEcho,
    getActiveChannels,
    getChannelStatus
  }
}

export const getEchoInstance = () => echoInstance