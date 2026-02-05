import type { User, LoginCredentials as _LoginCredentials, LoginResponse as _LoginResponse, ApiLoginResponse } from '../types/auth'
import { getWebsocketRoles, getAllEventHandlers } from '../config/websocket/channels'
import { CALENDAR_EVENTS, getUserCalendarChannelName } from '../config/websocket/events/calendar'
import { useEcho } from '../composables/websocket/useEcho'

interface ApiPlugin {
  call: <T>(endpoint: string, options?: any) => Promise<T>
  auth: <T>(endpoint: string, credentials: { No_Usuario: string; No_Password: string }) => Promise<T>
  config: any
}

export interface AuthUser {
  id: number | string
  email: string
  name: string
  role?: string
  avatar?: string | null
  lastLogin?: string
  isActive?: boolean
  raw?: any
}

export interface AuthMenu {
  ID_Menu: number
  ID_Padre: number
  Nu_Orden: number
  No_Menu: string
  No_Menu_Url: string
  No_Class_Controller: string
  Txt_Css_Icons: string
  Nu_Separador: number
  Nu_Seguridad: number
  Nu_Activo: number
  Nu_Tipo_Sistema: number
  Txt_Url_Video: string | null
  No_Menu_China: string
  show_father: number
  url_intranet_v2?: string | null
  Nu_Cantidad_Menu_Padre: number
  Hijos: AuthMenu[]
  SubHijos?: AuthMenu[]
}

class AuthService {
  private static instance: AuthService
  private currentUser: AuthUser | null = null
  private token: string | null = null
  private menu: AuthMenu[] = []
  private nuxtApp: any = null
  private echo = useEcho()
  private isEchoInitialized = false

  private constructor() {
    this.initializeFromStorage()
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  setNuxtApp(app: any) {
    this.nuxtApp = app
  }

  async initializeEcho() {
    if (!this.isEchoInitialized && this.token) {
      const config = {
        wsHost: this.nuxtApp.$config.public.pusherWsHost,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `https://${this.nuxtApp.$config.public.pusherWsHost}/api/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/json'
          }
        }
      }

      await this.echo.initializeEcho(config)
      this.isEchoInitialized = true
      // 1) Canal del usuario (calendario): private-App.Models.Usuario.{id} — debe existir una llamada a auth por usuario
      this.setupUserChannel()
      // 2) Canales por rol (Coordinación, Documentación, etc.)
      const role = this.currentUser?.raw?.grupo.nombre
      if (role) {
        this.setupWebSocketChannels(role)
      }
    }
  }

  /** Suscripción al canal privado del usuario para eventos de calendario. */
  private setupUserChannel() {
    if (!this.isEchoInitialized) return
    let userId: number | string | null = null
    if (this.currentUser) {
      const raw = (this.currentUser as any).raw
      userId = this.currentUser.id ?? raw?.ID_Usuario ?? raw?.id ?? null
    }
    if (userId == null && process.client) {
      try {
        const stored = localStorage.getItem('auth_user')
        if (stored) {
          const parsed = JSON.parse(stored) as { id?: number | string; raw?: { ID_Usuario?: number; id?: number } }
          userId = parsed?.id ?? parsed?.raw?.ID_Usuario ?? parsed?.raw?.id ?? null
        }
      } catch (_) { /* ignore */ }
    }
    if (userId == null) return
    try {
      const channelName = getUserCalendarChannelName(userId)
      const allHandlers = getAllEventHandlers()
      const handlers = CALENDAR_EVENTS.map((event) => ({
        event,
        callback: allHandlers[event] ?? (() => {})
      }))
      this.echo.subscribeToChannel({
        name: channelName,
        type: 'private',
        handlers
      })
    } catch (e) {
      console.warn('Canal de usuario (calendario):', e)
    }
  }

  private initializeFromStorage(): void {
    if (process.client) {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      const storedMenu = localStorage.getItem('auth_menu')

      if (storedToken && storedUser) {
        this.token = storedToken
        this.currentUser = JSON.parse(storedUser)
      }
      if (storedMenu) {
        this.menu = JSON.parse(storedMenu)
      }
    }
  }

  private setupWebSocketChannels(role: string) {
    if (!this.isEchoInitialized) {
      console.warn('Echo no está inicializado. Los canales se configurarán después de la inicialización.')
      return
    }

    // Obtener la configuración actualizada (incluye registros dinámicos)
    const websocketRoles = getWebsocketRoles()
    const roleConfig = websocketRoles[role]
    if (roleConfig) {
      
      this.echo.subscribeToRoleChannels(roleConfig)
    }
  }

  private saveToStorage(): void {
    if (process.client) {
      if (this.token) {
        localStorage.setItem('auth_token', this.token)
      }
      if (this.currentUser) {
        localStorage.setItem('auth_user', JSON.stringify(this.currentUser))
      }
      if (this.menu) {
        localStorage.setItem('auth_menu', JSON.stringify(this.menu))
      }
    }
  }

  private clearStorage(): void {
    if (process.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_menu')
    }
  }

  async login(credentials: _LoginCredentials): Promise<_LoginResponse> {
    try {
      if (!this.nuxtApp) throw new Error('Nuxt app not initialized')

      const response = await this.nuxtApp.$api.auth<any>('/api/auth/login', {
        No_Usuario: credentials.email,
        No_Password: credentials.password
      })

      if (response.success && response.token && response.user) {
        const user: AuthUser = {
          id: response.user.ID_Usuario,
          email: response.user.Txt_Email || response.user.No_Usuario,
          name: response.user.No_Usuario,
          role: response.user.role || 'user',
          avatar: null,
          lastLogin: response.user.Fe_Creacion,
          isActive: response.user.Nu_Estado === 1,
          raw: response.user
        }
        const token = response.token
        const menu: AuthMenu[] = response.menus || []

        this.currentUser = user
        this.token = token
        //if menu.show_father=0 then remove menu.Hijos
        menu.forEach(
          (item) => {
            if (item.show_father == 0) {
              item.Hijos = []
            }
          }
        )
        this.menu = menu
        this.saveToStorage()

        // Inicializar Echo y configurar canales
        await this.initializeEcho()

        return {
          success: true,
          data: {
            user: user as any,
            token
          },
          message: response.message || 'Login exitoso'
        }
      } else {
        return {
          success: false,
          data: null,
          error: response.message || 'Credenciales incorrectas'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Error de conexión'
      }
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.isEchoInitialized) {
        this.echo.disconnect()
        this.isEchoInitialized = false
      }

      this.currentUser = null
      this.token = null
      this.menu = []
      this.clearStorage()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser
  }

  getMenu(): AuthMenu[] {
    return this.menu
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser
  }

  getToken(): string | null {
    return this.token
  }
}

export default AuthService
export type { _LoginCredentials as LoginCredentials, _LoginResponse as LoginResponse }