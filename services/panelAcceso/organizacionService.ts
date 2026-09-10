import { BaseService } from '~/services/base/BaseService'

export interface Organizacion {
  id: number
  id_empresa: number
  empresa: string | null
  no_organizacion: string
  txt_organizacion: string | null
  estado: number
}

export interface CreateOrganizacionRequest {
  id_empresa: number
  no_organizacion: string
  txt_organizacion?: string
  estado: number
}

export interface UpdateOrganizacionRequest extends CreateOrganizacionRequest {
  // mismos campos
}

export interface OrganizacionListResponse {
  success: boolean
  data: Organizacion[]
  message?: string
}

export interface OrganizacionResponse {
  success: boolean
  data: Organizacion
  message?: string
}

export interface SimpleResponse {
  success: boolean
  message?: string
}

/**
 * Mantenedor de organizaciones. Solo lo puede usar el staff de la
 * organizacion admin (ID_Organizacion == 1) -- el backend responde 403
 * para cualquier otro usuario, independiente de lo que haga el front.
 */
export class OrganizacionService extends BaseService {

  static async getOrganizaciones(params: { empresa_id?: number } = {}): Promise<OrganizacionListResponse> {
    try {
      const qs = new URLSearchParams()
      if (params.empresa_id) qs.append('empresa_id', String(params.empresa_id))

      const url = `/api/panel-acceso/organizaciones${qs.toString() ? `?${qs}` : ''}`
      return await this.apiCall<OrganizacionListResponse>(url)
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async createOrganizacion(data: CreateOrganizacionRequest): Promise<OrganizacionResponse | SimpleResponse> {
    try {
      return await this.apiCall<OrganizacionResponse>('/api/panel-acceso/organizaciones', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateOrganizacion(id: number, data: UpdateOrganizacionRequest): Promise<OrganizacionResponse | SimpleResponse> {
    try {
      return await this.apiCall<OrganizacionResponse>(`/api/panel-acceso/organizaciones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async deleteOrganizacion(id: number): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/organizaciones/${id}`, {
        method: 'DELETE',
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default OrganizacionService
