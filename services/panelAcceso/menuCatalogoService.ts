import { BaseService } from '~/services/base/BaseService'

export interface MenuCatalogo {
  id: number
  id_padre: number
  padre_nombre: string
  nombre: string
  icono: string | null
  ruta: string | null
  ruta_legacy: string | null
  orden: number
  activo: number  // 1=activo, 0=inactivo (ya invertido desde backend)
  url_video: string | null
  show_father: number
  seguridad: number
}

export interface CreateMenuRequest {
  nombre: string
  id_padre: number
  orden: number
  icono?: string
  ruta?: string
  activo: boolean
  url_video?: string
  show_father?: boolean
}

export interface GrupoConAcceso {
  id: number
  cargo: string
  privilegio: number
  privilegio_nombre: string
}

export interface MenuListResponse {
  success: boolean
  data: MenuCatalogo[]
  message?: string
}

export interface SimpleResponse {
  success: boolean
  message?: string
  data?: any
}

export interface GruposConAccesoResponse {
  success: boolean
  data: GrupoConAcceso[]
  message?: string
}

export class MenuCatalogoService extends BaseService {

  static async getMenus(): Promise<MenuListResponse> {
    try {
      return await this.apiCall<MenuListResponse>('/api/panel-acceso/menus')
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async createMenu(data: CreateMenuRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>('/api/panel-acceso/menus', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateMenu(id: number, data: CreateMenuRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/menus/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async deleteMenu(id: number): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/menus/${id}`, {
        method: 'DELETE',
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async getGruposConAcceso(id: number): Promise<GruposConAccesoResponse> {
    try {
      return await this.apiCall<GruposConAccesoResponse>(`/api/panel-acceso/menus/${id}/grupos`)
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async uploadIcon(file: File): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
      const authService = (await import('~/services/authService')).default
      const token = authService.getInstance().getToken?.() ?? localStorage.getItem('auth_token') ?? ''
      const config = useRuntimeConfig()
      const baseUrl = config.public.apiBaseUrl

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${baseUrl}/api/panel-acceso/menus/icon-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      return await res.json()
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default MenuCatalogoService
