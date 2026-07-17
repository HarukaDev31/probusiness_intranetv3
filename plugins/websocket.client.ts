import { useEcho, getEchoInstance } from '../composables/websocket/useEcho'
import { getAllEventHandlers } from '../config/websocket/channels'
import { CALENDAR_EVENTS, getUserCalendarChannelName } from '../config/websocket/events/calendar'
import { syncRoleChannelsFromAuthUser } from '../composables/websocket/syncRoleChannelsFromAuth'
import { buildEchoClientConfig } from '../utils/websocket-config'

export default defineNuxtPlugin({
  name: 'websocket',
  dependsOn: ['auth', 'websocket-events'],
  setup(nuxtApp) {
    if (import.meta.server) return

    let isInitializing = false
    let isInitialized = false

    const { initializeEcho, resetEcho, subscribeToChannel } = useEcho()

    const initializeWebSockets = async () => {
      if (isInitializing || isInitialized) {
        syncRoleChannelsFromAuthUser()
        return
      }

      const authToken = localStorage.getItem('auth_token')
      const authUser = localStorage.getItem('auth_user')

      if (!authToken || !authUser) return

      isInitializing = true

      const echoConfig = buildEchoClientConfig(authToken)

      try {
        await initializeEcho(echoConfig)

        const echoInstance = getEchoInstance()
        if (echoInstance) {
          ;(window as any).Echo = echoInstance
        }

        const user = JSON.parse(authUser) as {
          id?: number | string
          raw?: { ID_Usuario?: number; id?: number; grupo?: { nombre?: string } }
        }
        const userId = user?.id ?? user?.raw?.ID_Usuario ?? user?.raw?.id

        if (userId != null) {
          try {
            const channelName = getUserCalendarChannelName(userId)
            const allHandlers = getAllEventHandlers()
            const handlers = CALENDAR_EVENTS.map((event) => ({
              event,
              callback: allHandlers[event] ?? (() => {})
            }))
            subscribeToChannel({
              name: channelName,
              type: 'private',
              handlers
            })
          } catch (e) {
            console.warn('Calendar user channel:', e)
          }
        }

        syncRoleChannelsFromAuthUser()
        isInitialized = true

        try {
          const { waInboxLog } = await import('~/composables/whatsapp-inbox/waInboxWsLog')
          waInboxLog('plugin.echo-ready')
        } catch {
          /* noop */
        }
        syncRoleChannelsFromAuthUser()
        window.dispatchEvent(new CustomEvent('echo-ready'))
        const { sincronizarSalasGlobales } = await import(
          '~/composables/useSoporteTiChatGlobal'
        )
        void sincronizarSalasGlobales()
      } catch (error) {
        console.error('❌ Error inicializando WebSocket:', error)
      } finally {
        isInitializing = false
      }
    }

    // Tras el primer paint: no bloquear montaje de la app
    nuxtApp.hook('app:mounted', () => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => { void initializeWebSockets() }, { timeout: 3000 })
      } else {
        setTimeout(() => { void initializeWebSockets() }, 300)
      }
    })

    window.addEventListener('storage', (event) => {
      if (event.key === 'auth_token' || event.key === 'auth_user') {
        const authToken = localStorage.getItem('auth_token')
        const authUser = localStorage.getItem('auth_user')

        if (!authToken || !authUser) {
          resetEcho()
          isInitialized = false
          isInitializing = false
          window.dispatchEvent(new CustomEvent('soporte-ti-chat-reset'))
          delete (window as any).Echo
        } else {
          void initializeWebSockets()
        }
      }
    })
  }
})
