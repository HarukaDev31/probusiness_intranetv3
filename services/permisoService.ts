import { apiCall } from '~/utils/api'

// Interfaces
export interface Permiso {
  id: number
  entidad_id: number
  nombre_permiso: string
  codigo_permiso: string
  costo_base: number
  costo_tramitador: number
  observaciones?: string
  documentos?: string[]
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CreatePermisoRequest {
  entidad_id: number
  nombre_permiso: string
  codigo_permiso: string
  costo_base: number
  costo_tramitador: number
  observaciones?: string
  documentos?: File[]
}

export interface PermisoResponse {
  success: boolean
  data: Permiso
  error?: string
}

export interface PermisoListResponse {
  success: boolean
  data: Permiso[]
  error?: string
}

// Service class
class PermisoService {
  private static instance: PermisoService

  private constructor() {}

  public static getInstance(): PermisoService {
    if (!PermisoService.instance) {
      PermisoService.instance = new PermisoService()
    }
    return PermisoService.instance
  }

  /**
   * Crear un nuevo permiso
   */
  async createPermiso(permisoData: CreatePermisoRequest): Promise<PermisoResponse> {
    try {
      // Crear FormData para manejar archivos
      const formData = new FormData()
      
      // Agregar campos de texto
      formData.append('entidad_id', permisoData.entidad_id.toString())
      formData.append('nombre_permiso', permisoData.nombre_permiso)
      formData.append('codigo_permiso', permisoData.codigo_permiso)
      formData.append('costo_base', permisoData.costo_base.toString())
      formData.append('costo_tramitador', permisoData.costo_tramitador.toString())
      
      if (permisoData.observaciones) {
        formData.append('observaciones', permisoData.observaciones)
      }
      
      // Agregar documentos si existen
      if (permisoData.documentos && permisoData.documentos.length > 0) {
        permisoData.documentos.forEach((documento, index) => {
          formData.append(`documentos[${index}]`, documento)
        })
      }

      const response = await apiCall<PermisoResponse>('/api/base-datos/regulaciones/permisos', {
        method: 'POST',
        body: formData
      })
      return response
    } catch (error) {
      console.error('Error creating permiso:', error)
      return {
        success: false,
        data: {} as Permiso,
        error: 'Error al crear el permiso'
      }
    }
  }

  /**
   * Obtener lista de permisos
   */
  async getPermisos(params: {
    page?: number
    limit?: number
    search?: string
    entidad_id?: number
  } = {}): Promise<PermisoListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.search) queryParams.append('search', params.search)
      if (params.entidad_id) queryParams.append('entidad_id', params.entidad_id.toString())

      const response = await apiCall<PermisoListResponse>(
        `/api/base-datos/regulaciones/permisos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      return response
    } catch (error) {
      console.error('Error fetching permisos list:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener los permisos'
      }
    }
  }

  /**
   * Obtener un permiso por ID
   */
  async getPermisoById(id: number): Promise<PermisoResponse> {
    try {
      const response = await apiCall<PermisoResponse>(`/api/base-datos/regulaciones/permisos/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching permiso:', error)
      return {
        success: false,
        data: {} as Permiso,
        error: 'Error al obtener el permiso'
      }
    }
  }

  /**
   * Actualizar un permiso
   */
  async updatePermiso(id: number, permisoData: Partial<CreatePermisoRequest>): Promise<PermisoResponse> {
    try {
      const formData = new FormData()
      
      // Agregar solo los campos que se van a actualizar
      Object.entries(permisoData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'documentos' && Array.isArray(value)) {
            value.forEach((documento, index) => {
              formData.append(`documentos[${index}]`, documento)
            })
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      const response = await apiCall<PermisoResponse>(`/api/base-datos/regulaciones/permisos/${id}`, {
        method: 'PUT',
        body: formData
      })
      return response
    } catch (error) {
      console.error('Error updating permiso:', error)
      return {
        success: false,
        data: {} as Permiso,
        error: 'Error al actualizar el permiso'
      }
    }
  }

  /**
   * Eliminar un permiso
   */
  async deletePermiso(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; error?: string }>(
        `/api/base-datos/regulaciones/permisos/${id}`,
        {
          method: 'DELETE'
        }
      )
      return response
    } catch (error) {
      console.error('Error deleting permiso:', error)
      return {
        success: false,
        error: 'Error al eliminar el permiso'
      }
    }
  }

  /**
   * Cambiar estado del permiso
   */
  async togglePermisoStatus(id: number, status: 'active' | 'inactive'): Promise<PermisoResponse> {
    try {
      const response = await apiCall<PermisoResponse>(`/api/base-datos/regulaciones/permisos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      return response
    } catch (error) {
      console.error('Error toggling permiso status:', error)
      return {
        success: false,
        data: {} as Permiso,
        error: 'Error al cambiar el estado del permiso'
      }
    }
  }

  /**
   * Verificar si existe un código de permiso
   */
  async checkPermisoCodeExists(codigo: string): Promise<{ exists: boolean; error?: string }> {
    try {
      const response = await apiCall<{ exists: boolean; error?: string }>(
        `/api/base-datos/regulaciones/permisos/check-code?codigo=${encodeURIComponent(codigo)}`
      )
      return response
    } catch (error) {
      console.error('Error checking permiso code:', error)
      return {
        exists: false,
        error: 'Error al verificar el código del permiso'
      }
    }
  }

  /**
   * Obtener permisos activos
   */
  async getActivePermisos(): Promise<PermisoListResponse> {
    try {
      const response = await apiCall<PermisoListResponse>('/api/base-datos/regulaciones/permisos/active')
      return response
    } catch (error) {
      console.error('Error fetching active permisos:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener los permisos activos'
      }
    }
  }

  /**
   * Exportar permisos
   */
  async exportPermisos(format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; data: Blob; error?: string }>(`/api/base-datos/regulaciones/permisos/export?format=${format}`, {
        method: 'GET'
      })
      
      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error || 'Error al exportar' }
      }
    } catch (error) {
      console.error('Error exporting permisos:', error)
      return {
        success: false,
        error: 'Error al exportar los permisos'
      }
    }
  }
}

export default PermisoService 