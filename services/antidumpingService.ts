import { apiCall } from '~/utils/api'

// Interfaces
export interface AntidumpingMedia {
  id: number
  id_regulacion: number
  extension: string
  peso: number
  nombre_original: string
  ruta: string
  created_at: string
  updated_at: string
}

export interface ProductRubro {
  id: number
  nombre: string
  created_at: string
  updated_at: string
}

export interface Antidumping {
  id: number
  id_rubro: number
  descripcion_producto: string
  partida: string
  antidumping: string
  observaciones?: string
  created_at: string
  updated_at: string
  rubro: ProductRubro
  media: AntidumpingMedia[]
}

export interface CreateAntidumpingRequest {
  producto_id: number
  descripcion: string
  partida: string
  precio_declarado: number
  antidumping: number
  observaciones?: string
  imagenes?: File[]
}

export interface AntidumpingResponse {
  success: boolean
  data: Antidumping
  error?: string
}

export interface AntidumpingListResponse {
  success: boolean
  data: Antidumping[]
  error?: string
}

// Service class
class AntidumpingService {
  private static instance: AntidumpingService

  private constructor() {}

  public static getInstance(): AntidumpingService {
    if (!AntidumpingService.instance) {
      AntidumpingService.instance = new AntidumpingService()
    }
    return AntidumpingService.instance
  }

  /**
   * Crear una nueva regulación antidumping
   */
  async createAntidumping(antidumpingData: CreateAntidumpingRequest): Promise<AntidumpingResponse> {
    try {
      // Crear FormData para manejar archivos
      const formData = new FormData()
      
      // Agregar campos de texto
      formData.append('id_rubro', antidumpingData.producto_id.toString())
      formData.append('descripcion', antidumpingData.descripcion)
      formData.append('partida', antidumpingData.partida)
      formData.append('precio_declarado', antidumpingData.precio_declarado.toString())
      formData.append('antidumping', antidumpingData.antidumping.toString())
      
      if (antidumpingData.observaciones) {
        formData.append('observaciones', antidumpingData.observaciones)
      }
      
      // Agregar imágenes si existen
      if (antidumpingData.imagenes && antidumpingData.imagenes.length > 0) {
        antidumpingData.imagenes.forEach((imagen, index) => {
          formData.append(`imagenes[${index}]`, imagen)
        })
      }

      const response = await apiCall<AntidumpingResponse>('/api/base-datos/regulaciones/antidumping', {
        method: 'POST',
        body: formData
      })
      return response
    } catch (error) {
      console.error('Error creating antidumping:', error)
      return {
        success: false,
        data: {} as Antidumping,
        error: 'Error al crear la regulación antidumping'
      }
    }
  }

  /**
   * Obtener lista de regulaciones antidumping
   */
  async getAntidumpingList(params: {
    page?: number
    limit?: number
    search?: string
  } = {}): Promise<AntidumpingListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.search) queryParams.append('search', params.search)

      const response = await apiCall<AntidumpingListResponse>(
        `/api/base-datos/regulaciones/antidumping${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      return response
    } catch (error) {
      console.error('Error fetching antidumping list:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener las regulaciones antidumping'
      }
    }
  }

  /**
   * Obtener una regulación antidumping por ID
   */
  async getAntidumpingById(id: number): Promise<AntidumpingResponse> {
    try {
      const response = await apiCall<AntidumpingResponse>(`/api/base-datos/regulaciones/antidumping/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching antidumping:', error)
      return {
        success: false,
        data: {} as Antidumping,
        error: 'Error al obtener la regulación antidumping'
      }
    }
  }

  /**
   * Actualizar una regulación antidumping
   */
  async updateAntidumping(
    id: number, 
    antidumpingData: Partial<CreateAntidumpingRequest>,
    imagenesEliminar: number[] = []
  ): Promise<AntidumpingResponse> {
    try {
      const formData = new FormData()
      
      // Agregar el ID de la regulación para indicar que es una actualización
      formData.append('id_regulacion', id.toString())
      
      // Agregar campos de texto
      formData.append('id_rubro', antidumpingData.producto_id?.toString() || '')
      formData.append('descripcion', antidumpingData.descripcion || '')
      formData.append('partida', antidumpingData.partida || '')
      formData.append('precio_declarado', antidumpingData.precio_declarado?.toString() || '')
      formData.append('antidumping', antidumpingData.antidumping?.toString() || '')
      
      if (antidumpingData.observaciones) {
        formData.append('observaciones', antidumpingData.observaciones)
      }
      
      // Agregar IDs de imágenes a eliminar
      if (imagenesEliminar.length > 0) {
        imagenesEliminar.forEach(imageId => {
          formData.append('imagenes_eliminar[]', imageId.toString())
        })
      }
      
      // Agregar nuevas imágenes si existen
      if (antidumpingData.imagenes && antidumpingData.imagenes.length > 0) {
        antidumpingData.imagenes.forEach((imagen, index) => {
          formData.append(`imagenes[${index}]`, imagen)
        })
      }

      console.log('FormData contents for update:')
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value)
      }

      // Usar el mismo endpoint que crear pero con id_regulacion
      const response = await apiCall<AntidumpingResponse>('/api/base-datos/regulaciones/antidumping', {
        method: 'POST',
        body: formData
      })
      return response
    } catch (error) {
      console.error('Error updating antidumping:', error)
      return {
        success: false,
        data: {} as Antidumping,
        error: 'Error al actualizar la regulación antidumping'
      }
    }
  }

  /**
   * Eliminar una regulación antidumping
   */
  async deleteAntidumping(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; error?: string }>(
        `/api/base-datos/regulaciones/antidumping/${id}`,
        {
          method: 'DELETE'
        }
      )
      return response
    } catch (error) {
      console.error('Error deleting antidumping:', error)
      return {
        success: false,
        error: 'Error al eliminar la regulación antidumping'
      }
    }
  }

  /**
   * Exportar regulaciones antidumping
   */
  async exportAntidumping(format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; data: Blob; error?: string }>(`/api/base-datos/regulaciones/antidumping/export?format=${format}`, {
        method: 'GET'
      })
      
      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error || 'Error al exportar' }
      }
    } catch (error) {
      console.error('Error exporting antidumping:', error)
      return {
        success: false,
        error: 'Error al exportar las regulaciones antidumping'
      }
    }
  }
}

export default AntidumpingService 