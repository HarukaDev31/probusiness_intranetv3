import { BaseService } from '~/services/base/BaseService'

/**
 * Catálogos propios del módulo de trámites aduana (entidades y tipos de permiso),
 * independientes de regulaciones.
 */

export interface TramiteAduanaEntidad {
  id: number
  nombre: string
}

export interface TramiteAduanaTipoPermiso {
  id: number
  nombre_permiso: string
}

export interface TramiteAduanaEntidadListResponse {
  success: boolean
  data: TramiteAduanaEntidad[]
  error?: string
}

export interface TramiteAduanaTipoPermisoListResponse {
  success: boolean
  data: TramiteAduanaTipoPermiso[]
  error?: string
}

export interface TramiteAduanaEntidadCreateResponse {
  success: boolean
  data: TramiteAduanaEntidad | null
  error?: string
}

export interface TramiteAduanaTipoPermisoCreateResponse {
  success: boolean
  data: TramiteAduanaTipoPermiso | null
  error?: string
}

/** Base URL del controlador de catálogos (nuevas tablas tramite_aduana_entidades y tramite_aduana_tipos_permiso). */
const BASE = '/api/base-datos/tramite-aduana-catalogos'

export class TramiteAduanaCatalogoService extends BaseService {
  static async getEntidades(): Promise<TramiteAduanaEntidadListResponse> {
    try {
      const response = await this.apiCall<TramiteAduanaEntidadListResponse>(`${BASE}/entidades`, { method: 'GET' })
      return response
    } catch (error) {
      console.error('Error fetching tramite aduana entidades:', error)
      return { success: false, data: [], error: 'Error al obtener las entidades' }
    }
  }

  static async getTiposPermiso(): Promise<TramiteAduanaTipoPermisoListResponse> {
    try {
      const response = await this.apiCall<TramiteAduanaTipoPermisoListResponse>(`${BASE}/tipos-permiso`, { method: 'GET' })
      return response
    } catch (error) {
      console.error('Error fetching tramite aduana tipos permiso:', error)
      return { success: false, data: [], error: 'Error al obtener los tipos de permiso' }
    }
  }

  static async createEntidad(payload: { nombre: string }): Promise<TramiteAduanaEntidadCreateResponse> {
    try {
      const response = await this.apiCall<TramiteAduanaEntidadCreateResponse>(`${BASE}/entidades`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return response
    } catch (error) {
      console.error('Error creating tramite aduana entidad:', error)
      return { success: false, data: null, error: 'Error al crear la entidad' }
    }
  }

  static async createTipoPermiso(payload: { nombre_permiso: string }): Promise<TramiteAduanaTipoPermisoCreateResponse> {
    try {
      const response = await this.apiCall<TramiteAduanaTipoPermisoCreateResponse>(`${BASE}/tipos-permiso`, {
        method: 'POST',
        body: JSON.stringify({ nombre_permiso: payload.nombre_permiso }),
      })
      return response
    } catch (error) {
      console.error('Error creating tramite aduana tipo permiso:', error)
      return { success: false, data: null, error: 'Error al crear el tipo de permiso' }
    }
  }

  static async updateEntidad(id: number, payload: { nombre: string }): Promise<TramiteAduanaEntidadCreateResponse> {
    try {
      const response = await this.apiCall<TramiteAduanaEntidadCreateResponse>(`${BASE}/entidades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return response
    } catch (error) {
      console.error('Error updating tramite aduana entidad:', error)
      return { success: false, data: null, error: 'Error al actualizar la entidad' }
    }
  }

  static async deleteEntidad(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(`${BASE}/entidades/${id}`, {
        method: 'DELETE',
      })
      return response
    } catch (error) {
      console.error('Error deleting tramite aduana entidad:', error)
      return { success: false, error: 'Error al eliminar la entidad' }
    }
  }

  static async updateTipoPermiso(
    id: number,
    payload: { nombre_permiso: string }
  ): Promise<TramiteAduanaTipoPermisoCreateResponse> {
    try {
      const response = await this.apiCall<TramiteAduanaTipoPermisoCreateResponse>(`${BASE}/tipos-permiso/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return response
    } catch (error) {
      console.error('Error updating tramite aduana tipo permiso:', error)
      return { success: false, data: null, error: 'Error al actualizar el tipo de permiso' }
    }
  }

  static async deleteTipoPermiso(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(`${BASE}/tipos-permiso/${id}`, {
        method: 'DELETE',
      })
      return response
    } catch (error) {
      console.error('Error deleting tramite aduana tipo permiso:', error)
      return { success: false, error: 'Error al eliminar el tipo de permiso' }
    }
  }
}
