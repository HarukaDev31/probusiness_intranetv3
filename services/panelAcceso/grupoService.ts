import { BaseService } from '~/services/base/BaseService'

export interface Grupo {
  id: number
  id_empresa: number
  id_org: number
  empresa: string
  organizacion: string
  cargo: string
  descripcion: string | null
  privilegio: number
  privilegio_nombre: string
  notificacion: number
  estado: number
}

export interface CreateGrupoRequest {
  id_empresa: number
  id_org: number
  cargo: string
  descripcion?: string
  privilegio: number
  estado: number
}

export interface UpdateGrupoRequest extends CreateGrupoRequest {
  // mismos campos
}

export interface GrupoListResponse {
  success: boolean
  data: Grupo[]
  message?: string
}

export interface GrupoResponse {
  success: boolean
  data: Grupo
  message?: string
}

export interface SimpleResponse {
  success: boolean
  message?: string
}

export const TIPOS_PRIVILEGIO = [
  { value: 1, label: 'Personal Probusiness' },
  { value: 2, label: 'Personal China' },
  { value: 3, label: 'Proveedor Externo' },
  { value: 4, label: 'Cliente' },
  { value: 5, label: 'Jefe China' },
  { value: 6, label: 'Almacen China' },
]

export class GrupoService extends BaseService {

  static async getGrupos(params: {
    empresa_id?: number
    org_id?: number
    search?: string
  } = {}): Promise<GrupoListResponse> {
    try {
      const qs = new URLSearchParams()
      if (params.empresa_id) qs.append('empresa_id', String(params.empresa_id))
      if (params.org_id)     qs.append('org_id', String(params.org_id))
      if (params.search)     qs.append('search', params.search)

      const url = `/api/panel-acceso/grupos${qs.toString() ? `?${qs}` : ''}`
      return await this.apiCall<GrupoListResponse>(url)
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async getGrupoById(id: number): Promise<GrupoResponse> {
    try {
      return await this.apiCall<GrupoResponse>(`/api/panel-acceso/grupos/${id}`)
    } catch (e: any) {
      return { success: false, data: {} as Grupo, message: e.message }
    }
  }

  static async createGrupo(data: CreateGrupoRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>('/api/panel-acceso/grupos', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateGrupo(id: number, data: UpdateGrupoRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/grupos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async deleteGrupo(id: number): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/grupos/${id}`, {
        method: 'DELETE',
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateNotificacion(id: number, notificacion: 0 | 1): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/grupos/${id}/notificacion`, {
        method: 'PATCH',
        body: JSON.stringify({ notificacion }),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default GrupoService
