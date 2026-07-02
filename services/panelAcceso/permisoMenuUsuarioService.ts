import { BaseService } from '~/services/base/BaseService'

export interface MenuUsuario {
  ID_Menu: number
  ID_Padre: number
  Nu_Orden: number
  No_Menu: string
  No_Menu_Url: string
  Txt_Url_Video: string | null
  nombre_padre: string | null
  tiene_acceso: boolean
}

export interface MenuUsuarioResponse {
  success: boolean
  data: MenuUsuario[]
  usuario: {
    id: number
    email: string
    nombre_completo: string
  }
  message?: string
}

export interface GuardarPermisosUsuarioRequest {
  user_id: number
  menu_ids: number[]
}

export interface SimpleResponse {
  success: boolean
  message?: string
}

export class PermisoMenuUsuarioService extends BaseService {

  static async getMenuPorUsuario(userId: number): Promise<MenuUsuarioResponse> {
    try {
      return await this.apiCall<MenuUsuarioResponse>(`/api/panel-acceso/menu-usuario/${userId}`)
    } catch (e: any) {
      return { success: false, data: [], usuario: { id: 0, email: '', nombre_completo: '' }, message: e.message }
    }
  }

  static async guardarPermisos(data: GuardarPermisosUsuarioRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>('/api/panel-acceso/menu-usuario', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default PermisoMenuUsuarioService
