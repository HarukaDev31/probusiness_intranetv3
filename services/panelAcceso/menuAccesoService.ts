import { BaseService } from '~/services/base/BaseService'

export interface MenuConPermiso {
  ID_Padre: number
  ID_Menu: number
  No_Menu: string
  Txt_Url_Video: string | null
  ID_Grupo: number | null
  Nu_Consultar: number | null
  Nu_Agregar: number | null
  Nu_Editar: number | null
  Nu_Eliminar: number | null
  No_Menu_Padre: string
}

export interface CrudPermiso {
  Nu_Consultar?: boolean
  Nu_Agregar?: boolean
  Nu_Editar?: boolean
  Nu_Eliminar?: boolean
}

export interface GuardarPermisosRequest {
  id_empresa: number
  id_org: number
  id_grupo: number
  menus: Record<number, CrudPermiso>
}

export interface MenuAccesoResponse {
  success: boolean
  data: MenuConPermiso[]
  message?: string
}

export interface SimpleResponse {
  success: boolean
  message?: string
}

export class MenuAccesoService extends BaseService {

  static async getMenuPorGrupo(
    empresaId: number,
    orgId: number,
    grupoId: number
  ): Promise<MenuAccesoResponse> {
    try {
      return await this.apiCall<MenuAccesoResponse>(
        `/api/panel-acceso/menu-acceso/${empresaId}/${orgId}/${grupoId}`
      )
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async guardarPermisos(data: GuardarPermisosRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>('/api/panel-acceso/menu-acceso', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default MenuAccesoService
