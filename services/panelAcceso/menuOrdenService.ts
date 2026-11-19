import { BaseService } from '~/services/base/BaseService'
import type {
  ApiResult,
  MenuOrdenItem,
  MenuOrdenOpciones,
  MenuOrdenPayload,
} from '~/types/panel-acceso/menuOrden'

export class MenuOrdenApiService extends BaseService {
  static async opciones(orgId?: number): Promise<ApiResult<MenuOrdenOpciones>> {
    try {
      const qs = orgId ? `?org_id=${orgId}` : ''
      return await this.apiCall<ApiResult<MenuOrdenOpciones>>(`/api/panel-acceso/menu-orden/opciones${qs}`)
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Error' }
    }
  }

  static async porGrupo(grupoId: number, orgId?: number): Promise<ApiResult<MenuOrdenPayload>> {
    try {
      const qs = orgId ? `?org_id=${orgId}` : ''
      return await this.apiCall<ApiResult<MenuOrdenPayload>>(
        `/api/panel-acceso/menu-orden/grupo/${grupoId}${qs}`,
      )
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Error' }
    }
  }

  static async porUsuario(usuarioId: number): Promise<ApiResult<MenuOrdenPayload>> {
    try {
      return await this.apiCall<ApiResult<MenuOrdenPayload>>(
        `/api/panel-acceso/menu-orden/usuario/${usuarioId}`,
      )
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Error' }
    }
  }

  /** Envía el árbol tal cual; el back asigna orden. */
  static async guardarGrupo(
    grupoId: number,
    items: MenuOrdenItem[],
    orgId?: number,
  ): Promise<ApiResult<null>> {
    try {
      return await this.apiCall<ApiResult<null>>(`/api/panel-acceso/menu-orden/grupo/${grupoId}`, {
        method: 'PUT',
        body: { items, ...(orgId ? { org_id: orgId } : {}) },
      })
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Error' }
    }
  }

  static async guardarUsuario(usuarioId: number, items: MenuOrdenItem[]): Promise<ApiResult<null>> {
    try {
      return await this.apiCall<ApiResult<null>>(`/api/panel-acceso/menu-orden/usuario/${usuarioId}`, {
        method: 'PUT',
        body: { items },
      })
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Error' }
    }
  }

  static async limpiarUsuario(usuarioId: number): Promise<ApiResult<null>> {
    try {
      return await this.apiCall<ApiResult<null>>(`/api/panel-acceso/menu-orden/usuario/${usuarioId}`, {
        method: 'DELETE',
      })
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Error' }
    }
  }
}
