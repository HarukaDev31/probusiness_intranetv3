import { apiCall } from '~/utils/api'

// Interfaces
export interface Documento {
  id: number
  id_rubro: number
  observaciones?: string
  documentos?: string[]
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CreateDocumentoRequest {
  id_rubro: number
  observaciones?: string
  documentos?: File[]
}

export interface DocumentoResponse {
  success: boolean
  data: Documento
  error?: string
}

export interface DocumentoListResponse {
  success: boolean
  data: Documento[]
  error?: string
}

// Service class
class DocumentoService {
  private static instance: DocumentoService

  private constructor() {}

  public static getInstance(): DocumentoService {
    if (!DocumentoService.instance) {
      DocumentoService.instance = new DocumentoService()
    }
    return DocumentoService.instance
  }

  /**
   * Crear un nuevo documento especial
   */
  async createDocumento(documentoData: CreateDocumentoRequest): Promise<DocumentoResponse> {
    try {
      // Crear FormData para manejar archivos
      const formData = new FormData()
      
      // Agregar campos de texto
      formData.append('id_rubro', documentoData.id_rubro.toString())
      
      if (documentoData.observaciones) {
        formData.append('observaciones', documentoData.observaciones)
      }
      
      // Agregar documentos si existen
      if (documentoData.documentos && documentoData.documentos.length > 0) {
        documentoData.documentos.forEach((documento, index) => {
          formData.append(`documentos[${index}]`, documento)
        })
      }

      const response = await apiCall<DocumentoResponse>('/api/base-datos/regulaciones/documentos', {
        method: 'POST',
        body: formData
      })
      return response
    } catch (error) {
      console.error('Error creating documento:', error)
      return {
        success: false,
        data: {} as Documento,
        error: 'Error al crear el documento especial'
      }
    }
  }

  /**
   * Obtener lista de documentos especiales
   */
  async getDocumentos(params: {
    page?: number
    limit?: number
    search?: string
    id_rubro?: number
  } = {}): Promise<DocumentoListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.search) queryParams.append('search', params.search)
      if (params.id_rubro) queryParams.append('id_rubro', params.id_rubro.toString())

      const response = await apiCall<DocumentoListResponse>(
        `/api/base-datos/regulaciones/documentos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      )
      return response
    } catch (error) {
      console.error('Error fetching documentos list:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener los documentos especiales'
      }
    }
  }

  /**
   * Obtener un documento especial por ID
   */
  async getDocumentoById(id: number): Promise<DocumentoResponse> {
    try {
      const response = await apiCall<DocumentoResponse>(`/api/base-datos/regulaciones/documentos/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching documento:', error)
      return {
        success: false,
        data: {} as Documento,
        error: 'Error al obtener el documento especial'
      }
    }
  }

  /**
   * Actualizar un documento especial
   */
  async updateDocumento(id: number, documentoData: Partial<CreateDocumentoRequest>): Promise<DocumentoResponse> {
    try {
      const formData = new FormData()
      
      // Agregar solo los campos que se van a actualizar
      Object.entries(documentoData).forEach(([key, value]) => {
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

      const response = await apiCall<DocumentoResponse>(`/api/base-datos/regulaciones/documentos/${id}`, {
        method: 'PUT',
        body: formData
      })
      return response
    } catch (error) {
      console.error('Error updating documento:', error)
      return {
        success: false,
        data: {} as Documento,
        error: 'Error al actualizar el documento especial'
      }
    }
  }

  /**
   * Eliminar un documento especial
   */
  async deleteDocumento(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; error?: string }>(
        `/api/base-datos/regulaciones/documentos/${id}`,
        {
          method: 'DELETE'
        }
      )
      return response
    } catch (error) {
      console.error('Error deleting documento:', error)
      return {
        success: false,
        error: 'Error al eliminar el documento especial'
      }
    }
  }

  /**
   * Cambiar estado del documento especial
   */
  async toggleDocumentoStatus(id: number, status: 'active' | 'inactive'): Promise<DocumentoResponse> {
    try {
      const response = await apiCall<DocumentoResponse>(`/api/base-datos/regulaciones/documentos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      return response
    } catch (error) {
      console.error('Error toggling documento status:', error)
      return {
        success: false,
        data: {} as Documento,
        error: 'Error al cambiar el estado del documento especial'
      }
    }
  }

  /**
   * Obtener documentos especiales activos
   */
  async getActiveDocumentos(): Promise<DocumentoListResponse> {
    try {
      const response = await apiCall<DocumentoListResponse>('/api/base-datos/regulaciones/documentos/active')
      return response
    } catch (error) {
      console.error('Error fetching active documentos:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener los documentos especiales activos'
      }
    }
  }

  /**
   * Exportar documentos especiales
   */
  async exportDocumentos(format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; data: Blob; error?: string }>(`/api/base-datos/regulaciones/documentos/export?format=${format}`, {
        method: 'GET'
      })
      
      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error || 'Error al exportar' }
      }
    } catch (error) {
      console.error('Error exporting documentos:', error)
      return {
        success: false,
        error: 'Error al exportar los documentos especiales'
      }
    }
  }
}

export default DocumentoService 