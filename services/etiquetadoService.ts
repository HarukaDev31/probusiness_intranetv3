import { apiCall } from '~/utils/api'

// Interfaces
export interface Etiquetado {
  id: number
  id_rubro: number
  observaciones?: string
  imagenes?: string[]
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CreateEtiquetadoRequest {
  id_rubro: number
  observaciones?: string
  imagenes?: File[]
}

export interface EtiquetadoResponse {
  success: boolean
  data: Etiquetado
  error?: string
}

export interface EtiquetadoListResponse {
  success: boolean
  data: Etiquetado[]
  error?: string
}

// Service class
class EtiquetadoService {
  private static instance: EtiquetadoService

  private constructor() {}

  public static getInstance(): EtiquetadoService {
    if (!EtiquetadoService.instance) {
      EtiquetadoService.instance = new EtiquetadoService()
    }
    return EtiquetadoService.instance
  }

  /**
   * Crear una nueva regulación de etiquetado
   */
  async createEtiquetado(etiquetadoData: CreateEtiquetadoRequest): Promise<EtiquetadoResponse> {
    try {
      // Crear FormData para manejar archivos
      const formData = new FormData()
      
      // Agregar campos de texto
      formData.append('id_rubro', etiquetadoData.id_rubro.toString())
      
      if (etiquetadoData.observaciones) {
        formData.append('observaciones', etiquetadoData.observaciones)
      }
      
      // Agregar imágenes si existen
      if (etiquetadoData.imagenes && etiquetadoData.imagenes.length > 0) {
        etiquetadoData.imagenes.forEach((imagen, index) => {
          formData.append(`imagenes[${index}]`, imagen)
        })
      }

      const response = await apiCall<EtiquetadoResponse>('/api/base-datos/regulaciones/etiquetado', {
        method: 'POST',
        body: formData
      })
      return response
    } catch (error) {
      console.error('Error creating etiquetado:', error)
      return {
        success: false,
        data: {} as Etiquetado,
        error: 'Error al crear la regulación de etiquetado'
      }
    }
  }

  /**
   * Obtener lista de regulaciones de etiquetado
   */
  async getEtiquetados(params: {
    page?: number
    limit?: number
    search?: string
    id_rubro?: number
  } = {}): Promise<EtiquetadoListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.search) queryParams.append('search', params.search)
      if (params.id_rubro) queryParams.append('id_rubro', params.id_rubro.toString())

      const response = await apiCall<EtiquetadoListResponse>(
        `/api/base-datos/regulaciones/etiquetado${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      return response
    } catch (error) {
      console.error('Error fetching etiquetados list:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener las regulaciones de etiquetado'
      }
    }
  }

  /**
   * Obtener una regulación de etiquetado por ID
   */
  async getEtiquetadoById(id: number): Promise<EtiquetadoResponse> {
    try {
      const response = await apiCall<EtiquetadoResponse>(`/api/base-datos/regulaciones/etiquetado/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching etiquetado:', error)
      return {
        success: false,
        data: {} as Etiquetado,
        error: 'Error al obtener la regulación de etiquetado'
      }
    }
  }

  /**
   * Actualizar una regulación de etiquetado
   */
  async updateEtiquetado(id: number, etiquetadoData: Partial<CreateEtiquetadoRequest>): Promise<EtiquetadoResponse> {
    try {
      const formData = new FormData()
      
      // Agregar solo los campos que se van a actualizar
      Object.entries(etiquetadoData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'imagenes' && Array.isArray(value)) {
            value.forEach((imagen, index) => {
              formData.append(`imagenes[${index}]`, imagen)
            })
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      const response = await apiCall<EtiquetadoResponse>(`/api/base-datos/regulaciones/etiquetado/${id}`, {
        method: 'PUT',
        body: formData
      })
      return response
    } catch (error) {
      console.error('Error updating etiquetado:', error)
      return {
        success: false,
        data: {} as Etiquetado,
        error: 'Error al actualizar la regulación de etiquetado'
      }
    }
  }

  /**
   * Eliminar una regulación de etiquetado
   */
  async deleteEtiquetado(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; error?: string }>(
        `/api/base-datos/regulaciones/etiquetado/${id}`,
        {
          method: 'DELETE'
        }
      )
      return response
    } catch (error) {
      console.error('Error deleting etiquetado:', error)
      return {
        success: false,
        error: 'Error al eliminar la regulación de etiquetado'
      }
    }
  }

  /**
   * Cambiar estado de la regulación de etiquetado
   */
  async toggleEtiquetadoStatus(id: number, status: 'active' | 'inactive'): Promise<EtiquetadoResponse> {
    try {
      const response = await apiCall<EtiquetadoResponse>(`/api/base-datos/regulaciones/etiquetado/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      return response
    } catch (error) {
      console.error('Error toggling etiquetado status:', error)
      return {
        success: false,
        data: {} as Etiquetado,
        error: 'Error al cambiar el estado de la regulación de etiquetado'
      }
    }
  }

  /**
   * Obtener regulaciones de etiquetado activas
   */
  async getActiveEtiquetados(): Promise<EtiquetadoListResponse> {
    try {
      const response = await apiCall<EtiquetadoListResponse>('/api/base-datos/regulaciones/etiquetado/active')
      return response
    } catch (error) {
      console.error('Error fetching active etiquetados:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener las regulaciones de etiquetado activas'
      }
    }
  }

  /**
   * Exportar regulaciones de etiquetado
   */
  async exportEtiquetados(format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; data: Blob; error?: string }>(`/api/base-datos/regulaciones/etiquetado/export?format=${format}`, {
        method: 'GET'
      })
      
      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error || 'Error al exportar' }
      }
    } catch (error) {
      console.error('Error exporting etiquetados:', error)
      return {
        success: false,
        error: 'Error al exportar las regulaciones de etiquetado'
      }
    }
  }
}

export default EtiquetadoService 