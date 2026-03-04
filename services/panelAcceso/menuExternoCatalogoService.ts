import { BaseService } from '~/services/base/BaseService'

export interface MenuExterno {
  id: number
  id_padre: number
  padre_nombre: string | null
  nombre: string
  icono: string | null
  ruta: string | null
  orden: number
  activo: number  // 1=activo, 0=inactivo (ya invertido desde backend)
  url_video: string | null
  show_father: number
  total_usuarios: number
}

export interface CreateMenuExternoRequest {
  nombre: string
  id_padre: number
  orden: number
  icono?: string
  ruta?: string
  activo: boolean
  url_video?: string
  show_father?: boolean
}

export interface UsuarioConAcceso {
  id: number
  nombre_completo: string
  email: string
}

export interface MenuExternoListResponse {
  success: boolean
  data: MenuExterno[]
  message?: string
}

export interface UsuariosConAccesoResponse {
  success: boolean
  data: UsuarioConAcceso[]
  message?: string
}

export interface SimpleResponse {
  success: boolean
  message?: string
  data?: any
}

export class MenuExternoCatalogoService extends BaseService {

  static async getMenus(): Promise<MenuExternoListResponse> {
    try {
      return await this.apiCall<MenuExternoListResponse>('/api/panel-acceso/menus-externos')
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async createMenu(data: CreateMenuExternoRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>('/api/panel-acceso/menus-externos', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateMenu(id: number, data: CreateMenuExternoRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/menus-externos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async deleteMenu(id: number): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/menus-externos/${id}`, {
        method: 'DELETE',
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async getUsuariosConAcceso(id: number): Promise<UsuariosConAccesoResponse> {
    try {
      return await this.apiCall<UsuariosConAccesoResponse>(`/api/panel-acceso/menus-externos/${id}/usuarios`)
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }
}

export default MenuExternoCatalogoService
