import { BaseService } from '~/services/base/BaseService'

export interface CotizadorDocumentacionResponse {
  success: boolean
  data?: {
    id: number
    id_contenedor?: number
    nombre?: string
    files?: { id: number; tipo_documento: string; folder_name?: string; file_url: string }[]
    providers?: { id: number; code_supplier: string; products?: string }[]
    proveedor_documentos?: { id: number; id_proveedor: number; file_url: string; orden: number }[]
  }
  message?: string
}

export class CotizadorDocumentacionService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/contenedor/cotizador-documentacion'

  static async getDocumentacion(idCotizacion: number): Promise<CotizadorDocumentacionResponse> {
    const response = await this.apiCall<CotizadorDocumentacionResponse>(
      `${this.baseUrl}/${idCotizacion}`,
      { method: 'GET' }
    )
    return response
  }

  static async uploadDocumento(formData: FormData): Promise<{ success: boolean; data?: any; message?: string }> {
    const response = await this.apiCall<{ success: boolean; data?: any; message?: string }>(
      `${this.baseUrl}/upload`,
      { method: 'POST', body: formData }
    )
    return response
  }

  static async deleteDocumento(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await this.apiCall<{ success: boolean; message?: string }>(
      `${this.baseUrl}/documento/${id}`,
      { method: 'DELETE' }
    )
    return response
  }

  static async batchDelete(payload: { document_ids?: number[]; proveedor_document_ids?: number[] }): Promise<{ success: boolean; message?: string }> {
    const response = await this.apiCall<{ success: boolean; message?: string }>(
      `${this.baseUrl}/batch-delete`,
      { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } }
    )
    return response
  }

  /**
   * Una sola petición: elimina IDs de BD indicados y sube nuevos archivos.
   * formData debe incluir: id_cotizacion, document_ids_to_delete, proveedor_document_ids_to_delete (JSON),
   * document_meta (JSON), document_file_0..N, proveedor_meta (JSON), proveedor_file_0..N
   */
  static async sync(formData: FormData): Promise<{ success: boolean; message?: string }> {
    const response = await this.apiCall<{ success: boolean; message?: string }>(
      `${this.baseUrl}/sync`,
      { method: 'POST', body: formData }
    )
    return response
  }

  static async uploadProveedorDocumento(formData: FormData): Promise<{ success: boolean; data?: any; message?: string }> {
    const response = await this.apiCall<{ success: boolean; data?: any; message?: string }>(
      `${this.baseUrl}/proveedor/upload`,
      { method: 'POST', body: formData }
    )
    return response
  }

  static async deleteProveedorDocumento(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await this.apiCall<{ success: boolean; message?: string }>(
      `${this.baseUrl}/proveedor-documento/${id}`,
      { method: 'DELETE' }
    )
    return response
  }
}
