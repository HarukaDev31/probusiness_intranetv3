import { BaseService } from '~/services/base/BaseService'

export interface UsuarioAdmin {
  id: number
  id_empresa: number
  id_org: number
  id_grupo: number
  empresa: string
  organizacion: string
  cargo: string
  usuario: string
  password_sin_encriptar?: string | null
  nombres_apellidos: string | null
  email: string
  celular: string | null
  estado: number
}

export interface CreateUsuarioRequest {
  id_empresa: number
  id_org: number
  id_grupo: number
  usuario: string
  nombres_apellidos?: string
  password: string
  password_sin_encriptar?: string
  celular?: string
  estado: number
}

export interface UpdateUsuarioRequest {
  id_empresa: number
  id_org: number
  id_grupo: number
  usuario: string
  nombres_apellidos?: string
  password?: string
  password_sin_encriptar?: string
  celular?: string
  estado: number
}

export interface UsuarioListResponse {
  success: boolean
  data: UsuarioAdmin[]
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  message?: string
}

export interface UsuarioResponse {
  success: boolean
  data: UsuarioAdmin
  message?: string
}

export interface SimpleResponse {
  success: boolean
  message?: string
}

export class UsuarioAdminService extends BaseService {

  static async getUsuarios(params: {
    empresa_id?: number
    org_id?: number
    search?: string
    page?: number
    per_page?: number
  } = {}): Promise<UsuarioListResponse> {
    try {
      const qs = new URLSearchParams()
      if (params.empresa_id) qs.append('empresa_id', String(params.empresa_id))
      if (params.org_id)     qs.append('org_id', String(params.org_id))
      if (params.search)     qs.append('search', params.search)
      if (params.page)       qs.append('page', String(params.page))
      if (params.per_page)   qs.append('per_page', String(params.per_page))

      const url = `/api/panel-acceso/usuarios${qs.toString() ? `?${qs}` : ''}`
      return await this.apiCall<UsuarioListResponse>(url)
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async getUsuarioById(id: number): Promise<UsuarioResponse> {
    try {
      return await this.apiCall<UsuarioResponse>(`/api/panel-acceso/usuarios/${id}`)
    } catch (e: any) {
      return { success: false, data: {} as UsuarioAdmin, message: e.message }
    }
  }

  static async createUsuario(data: CreateUsuarioRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>('/api/panel-acceso/usuarios', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateUsuario(id: number, data: UpdateUsuarioRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async deleteUsuario(id: number): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/usuarios/${id}`, {
        method: 'DELETE',
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default UsuarioAdminService
