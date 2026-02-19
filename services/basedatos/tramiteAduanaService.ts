import { BaseService } from '~/services/base/BaseService'
import type {
  TramiteAduana,
  TramiteAduanaListResponse,
  TramiteAduanaResponse,
  CreateTramiteAduanaRequest,
} from '~/types/basedatos/tramiteAduana'

const BASE = '/api/base-datos/consolidado-cotizacion-aduana/tramites'

export class TramiteAduanaService extends BaseService {
  static async list(params: {
    page?: number
    limit?: number
    search?: string
    id_consolidado?: number
    id_entidad?: number
    estado?: string
  } = {}): Promise<TramiteAduanaListResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params.page != null) queryParams.append('page', String(params.page))
      if (params.limit != null) queryParams.append('limit', String(params.limit))
      if (params.search) queryParams.append('search', params.search)
      if (params.id_consolidado != null) queryParams.append('id_consolidado', String(params.id_consolidado))
      if (params.id_entidad != null) queryParams.append('id_entidad', String(params.id_entidad))
      if (params.estado) queryParams.append('estado', params.estado)
      const url = queryParams.toString() ? `${BASE}?${queryParams.toString()}` : BASE
      const response = await this.apiCall<TramiteAduanaListResponse>(url, { method: 'GET' })
      return response
    } catch (error) {
      console.error('Error listing tramites:', error)
      return { success: false, data: [], error: 'Error al obtener los trámites' }
    }
  }

  static async getById(id: number): Promise<TramiteAduanaResponse> {
    try {
      const response = await this.apiCall<TramiteAduanaResponse>(`${BASE}/${id}`, { method: 'GET' })
      return response
    } catch (error) {
      console.error('Error fetching tramite:', error)
      return { success: false, data: {} as TramiteAduana, error: 'Error al obtener el trámite' }
    }
  }

  static async create(payload: CreateTramiteAduanaRequest): Promise<TramiteAduanaResponse> {
    try {
      const response = await this.apiCall<TramiteAduanaResponse>(BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return response
    } catch (error) {
      console.error('Error creating tramite:', error)
      return { success: false, data: {} as TramiteAduana, error: 'Error al crear el trámite' }
    }
  }

  static async update(id: number, payload: Partial<CreateTramiteAduanaRequest>): Promise<TramiteAduanaResponse> {
    try {
      const response = await this.apiCall<TramiteAduanaResponse>(`${BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return response
    } catch (error) {
      console.error('Error updating tramite:', error)
      return { success: false, data: {} as TramiteAduana, error: 'Error al actualizar el trámite' }
    }
  }

  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(`${BASE}/${id}`, {
        method: 'DELETE',
      })
      return response
    } catch (error) {
      console.error('Error deleting tramite:', error)
      return { success: false, error: 'Error al eliminar el trámite' }
    }
  }

  static async updateTipoPermisoEstado(
    tramiteId: number,
    tipoPermisoId: number,
    estado: string
  ): Promise<{ success: boolean; data?: { estado: string }; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data?: { estado: string }; error?: string }>(
        `${BASE}/${tramiteId}/tipo-permiso/${tipoPermisoId}/estado`,
        { method: 'PATCH', body: JSON.stringify({ estado }) }
      )
      return response
    } catch (error) {
      console.error('Error updating tipo permiso estado:', error)
      return { success: false, error: 'Error al actualizar el estado' }
    }
  }
}
