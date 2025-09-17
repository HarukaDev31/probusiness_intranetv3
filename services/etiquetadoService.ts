

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

// Interfaces para respuesta jerárquica
export interface EtiquetadoHierarchicalResponse {
  success: boolean
  data: EtiquetadoEntidad[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  error?: string
}

export interface EtiquetadoEntidad {
  id: number
  nombre: string
  descripcion: string
  regulaciones: EtiquetadoRegulation[]
}

export interface EtiquetadoRegulation {
  id: number
  tipo: string
  observaciones: string
  imagenes: string[]
  estado: string
  created_at: string
  updated_at: string
}
import { BaseService } from "~/services/base/BaseService"

// Service class
export class EtiquetadoService extends BaseService {
  private static instance: EtiquetadoService

  private constructor() {
    super()
  }

  
  /**
   * Crear una nueva regulación de etiquetado
   */
  static async createEtiquetado(etiquetadoData: CreateEtiquetadoRequest): Promise<EtiquetadoResponse> {
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

      const response = await this.apiCall<EtiquetadoResponse>('/api/base-datos/regulaciones/etiquetado', {
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
  static async getEtiquetados(params: {
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

      const response = await this.apiCall<EtiquetadoListResponse>(
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
   * const response = await this.apiCall<any>('/api/base-datos/regulaciones/etiquetado', {
        method: 'POST',
        body: formDataToSend
      })

   */
  /**
   * Obtener lista jerárquica de regulaciones de etiquetado
   */
  static async getEtiquetadosHierarchical(params: {
    page?: number
    limit?: number
    search?: string
  } = {}): Promise<EtiquetadoHierarchicalResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.search) queryParams.append('search', params.search)

      const response = await this.apiCall<EtiquetadoHierarchicalResponse>(
        `/api/base-datos/regulaciones/etiquetado${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      return response
    } catch (error) {
      console.error('Error fetching etiquetados hierarchical list:', error)
      return {
        success: false,
        data: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0
        },
        error: 'Error al obtener las regulaciones de etiquetado'
      }
    }
  }

  /**
   * Obtener una regulación de etiquetado por ID
   */
  static async getEtiquetadoById(id: number): Promise<EtiquetadoResponse> {
    try {
      const response = await this.apiCall<EtiquetadoResponse>(`/api/base-datos/regulaciones/etiquetado/${id}`)
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
  static async updateEtiquetado(id: number, etiquetadoData: Partial<CreateEtiquetadoRequest> & { imagenes_eliminar?: number[] }): Promise<EtiquetadoResponse> {
    try {
      const formData = new FormData()
      // Backend espera POST al mismo endpoint con id_regulacion para actualizar
      formData.append('id_regulacion', id.toString())

      Object.entries(etiquetadoData).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (key === 'imagenes' && Array.isArray(value)) {
          (value as File[]).forEach((img, index) => formData.append(`imagenes[${index}]`, img))
          return
        }
        if (key === 'imagenes_eliminar' && Array.isArray(value)) {
          (value as number[]).forEach(imgId => formData.append('imagenes_eliminar[]', imgId.toString()))
          return
        }
        formData.append(key, value.toString())
      })

      const response = await this.apiCall<EtiquetadoResponse>('/api/base-datos/regulaciones/etiquetado', {
        method: 'POST',
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
  static async deleteEtiquetado(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(
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
  static async toggleEtiquetadoStatus(id: number, status: 'active' | 'inactive'): Promise<EtiquetadoResponse> {
    try {
      const response = await this.apiCall<EtiquetadoResponse>(`/api/base-datos/regulaciones/etiquetado/${id}/status`, {
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
  static async getActiveEtiquetados(): Promise<EtiquetadoListResponse> {
    try {
      const response = await this.apiCall<EtiquetadoListResponse>('/api/base-datos/regulaciones/etiquetado/active')
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
  static async exportEtiquetados(format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data: Blob; error?: string }>(`/api/base-datos/regulaciones/etiquetado/export?format=${format}`, {
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