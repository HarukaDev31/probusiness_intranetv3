import { BaseService } from '~/services/base/BaseService'

export interface UsuarioExterno {
  id: number
  name: string
  lastname: string | null
  nombre_completo: string
  email: string
  whatsapp: string | null
  dni: string | null
  created_at: string | null
}

export interface CreateUsuarioExternoRequest {
  name: string
  lastname?: string
  email: string
  password: string
  whatsapp?: string
  dni?: string
}

export interface UpdateUsuarioExternoRequest {
  name: string
  lastname?: string
  email: string
  password?: string
  whatsapp?: string
  dni?: string
}

export interface UsuarioExternoListResponse {
  success: boolean
  data: UsuarioExterno[]
  message?: string
}

export interface UsuarioExternoResponse {
  success: boolean
  data: UsuarioExterno
  message?: string
}

export interface SimpleResponse {
  success: boolean
  message?: string
}

export class UsuarioExternoService extends BaseService {

  static async getUsuarios(params: { search?: string } = {}): Promise<UsuarioExternoListResponse> {
    try {
      const qs = new URLSearchParams()
      if (params.search) qs.append('search', params.search)
      const url = `/api/panel-acceso/usuarios-externos${qs.toString() ? `?${qs}` : ''}`
      return await this.apiCall<UsuarioExternoListResponse>(url)
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async getUsuarioById(id: number): Promise<UsuarioExternoResponse> {
    try {
      return await this.apiCall<UsuarioExternoResponse>(`/api/panel-acceso/usuarios-externos/${id}`)
    } catch (e: any) {
      return { success: false, data: {} as UsuarioExterno, message: e.message }
    }
  }

  static async createUsuario(data: CreateUsuarioExternoRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>('/api/panel-acceso/usuarios-externos', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateUsuario(id: number, data: UpdateUsuarioExternoRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/usuarios-externos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async deleteUsuario(id: number): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/usuarios-externos/${id}`, {
        method: 'DELETE',
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default UsuarioExternoService
