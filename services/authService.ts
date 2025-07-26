import type { User, LoginCredentials as _LoginCredentials, LoginResponse as _LoginResponse, ApiLoginResponse } from '../types/auth'
import { authApiCall } from '../utils/api'

export interface AuthUser {
  id: number | string
  email: string
  name: string
  role?: string
  avatar?: string | null
  lastLogin?: string
  isActive?: boolean
  raw?: any // datos originales
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

  private constructor() {
    this.initializeFromStorage()
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
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
      const response = await authApiCall<any>('/api/auth/login', {
        No_Usuario: credentials.email,
        No_Password: credentials.password
      })

      if (response.status === 'success' && response.token && response.user) {
        const user: AuthUser = {
          id: response.user.ID_Usuario,
          email: response.user.Txt_Email || response.user.No_Usuario,
          name: response.user.No_Usuario,
          role: '',
          avatar: null,
          lastLogin: response.user.Fe_Creacion,
          isActive: response.user.Nu_Estado === 1,
          raw: response.user
        }
        const token = response.token
        const menu: AuthMenu[] = response.menus || []

        this.currentUser = user
        this.token = token
        this.menu = menu
        this.saveToStorage()

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
        error: 'Error de conexión'
      }
    }
  }

  async logout(): Promise<void> {
    try {
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