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
        try {
          const PusherJs = await import('pusher-js')
          ;(window as any).Pusher = PusherJs.default

          // Habilitar logs de Pusher
          ;(window as any).Pusher.logToConsole = true
          console.log('✅ Pusher importado correctamente')
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
      
      console.log('🔧 Configuración final de Echo:', finalConfig)
      
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
            console.log('✅ Usando método bind para eventos de conexión')
            connection.bind('connected', () => {
              console.log('🟢 Pusher: Conectado')
              console.log('🔌 Socket ID:', echoInstance?.socketId())
            })

            connection.bind('disconnected', () => {
              console.log('🔴 Pusher: Desconectado')
            })

            connection.bind('error', (err: any) => {
              console.error('❌ Pusher: Error de conexión', err)
            })
          }
          // Método 2: on (alternativa)
          else if (typeof connection.on === 'function') {
            console.log('✅ Usando método on para eventos de conexión')
            connection.on('connected', () => {
              console.log('🟢 Pusher: Conectado')
              console.log('🔌 Socket ID:', echoInstance?.socketId())
            })

            connection.on('disconnected', () => {
              console.log('🔴 Pusher: Desconectado')
            })

            connection.on('error', (err: any) => {
              console.error('❌ Pusher: Error de conexión', err)
            })
          }
          // Método 3: addEventListener (DOM)
          else if (typeof connection.addEventListener === 'function') {
            console.log('✅ Usando método addEventListener para eventos de conexión')
            connection.addEventListener('connected', () => {
              console.log('🟢 Pusher: Conectado')
              console.log('🔌 Socket ID:', echoInstance?.socketId())
            })

            connection.addEventListener('disconnected', () => {
              console.log('🔴 Pusher: Desconectado')
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

    // Verificar si ya estamos suscritos a este canal para evitar duplicados
    if (activeChannels.value.has(channel.name)) {
      console.log(`ℹ️ Ya suscrito al canal: ${channel.name}, omitiendo...`)
      return activeChannels.value.get(channel.name)
    }

    console.log(`📡 Intentando suscribirse al canal: ${channel.name} (${channel.type})`)
    let channelInstance: any

    try {
      switch (channel.type) {
        case 'private':
          console.log(`🔧 Creando canal privado: ${channel.name}`)
          channelInstance = echoInstance.private(channel.name)
          console.log(`🔧 Canal privado creado:`, channelInstance)
          break
        case 'presence':
          console.log(`🔧 Creando canal de presencia: ${channel.name}`)
          channelInstance = echoInstance.join(channel.name)
          console.log(`🔧 Canal de presencia creado:`, channelInstance)
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
              console.log(`✅ Suscripción exitosa al canal: ${channel.name}`)
            })

            channelInstance.bind('pusher:subscription_error', (err: any) => {
              console.error(`❌ Error en suscripción al canal ${channel.name}:`, err)
            })
          } else if (typeof channelInstance.listen === 'function') {
            channelInstance.listen('pusher:subscription_succeeded', () => {
              console.log(`✅ Suscripción exitosa al canal: ${channel.name}`)
            })

            channelInstance.listen('pusher:subscription_error', (err: any) => {
              console.error(`❌ Error en suscripción al canal ${channel.name}:`, err)
            })
          } else {
            console.log(`ℹ️ No se pudieron registrar los eventos de suscripción para el canal: ${channel.name}`)
          }
        } catch (err) {
          console.warn(`⚠️ Error registrando eventos de suscripción para ${channel.name}:`, err)
        }
      }

      // Registrar los manejadores de eventos para este canal
      channel.handlers.forEach(({ event, callback }) => {
        console.log(`🎯 Registrando evento '${event}' en canal '${channel.name}'`)
        console.log(`🔍 Tipo de canalInstance:`, typeof channelInstance)
        console.log(`🔍 Métodos disponibles:`, Object.getOwnPropertyNames(channelInstance))
        
        try {
          // Intentar diferentes métodos para registrar eventos
          if (channelInstance && typeof channelInstance === 'object') {
            // Método 1: bind (Pusher) - PRIORITARIO para eventos de Pusher
            if (typeof channelInstance.bind === 'function') {
              console.log(`✅ Usando método 'bind' para evento '${event}'`)
              channelInstance.bind(event, (data: any) => {
                console.log(`📨 Evento recibido '${event}' en canal '${channel.name}':`, data)
                callback(data)
              })
            }
            // Método 2: Acceder al objeto pusher del canal para usar bind
            else if (channelInstance.pusher && typeof channelInstance.pusher.bind === 'function') {
              console.log(`✅ Usando método 'bind' del objeto pusher para evento '${event}'`)
              channelInstance.pusher.bind(event, (data: any) => {
                console.log(`📨 Evento recibido '${event}' en canal '${channel.name}':`, data)
                callback(data)
              })
            }
            // Método 3: listen (Laravel Echo) - Para eventos de Laravel
            else if (typeof channelInstance.listen === 'function') {
              console.log(`✅ Usando método 'listen' para evento '${event}'`)
              channelInstance.listen(event, (data: any) => {
                console.log(`📨 Evento recibido '${event}' en canal '${channel.name}':`, data)
                callback(data)
              })
            }
            // Método 4: on (alternativa)
            else if (typeof channelInstance.on === 'function') {
              console.log(`✅ Usando método 'on' para evento '${event}'`)
              channelInstance.on(event, (data: any) => {
                console.log(`📨 Evento recibido '${event}' en canal '${channel.name}':`, data)
                callback(data)
              })
            }
            // Método 5: addEventListener (DOM)
            else if (typeof channelInstance.addEventListener === 'function') {
              console.log(`✅ Usando método 'addEventListener' para evento '${event}'`)
              channelInstance.addEventListener(event, (data: any) => {
                console.log(`📨 Evento recibido '${event}' en canal '${channel.name}':`, data)
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