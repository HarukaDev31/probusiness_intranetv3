import { BaseService } from '~/services/base/BaseService'
import type {
  TramiteDocumentoListResponse,
  TramiteDocumentoResponse,
  TramiteCategoriaListResponse,
  TramiteCategoria,
} from '~/types/basedatos/tramiteAduana'

const BASE = '/api/base-datos/consolidado-cotizacion-aduana/tramites'

export class TramiteAduanaDocumentoService extends BaseService {
  static async list(idTramite: number): Promise<TramiteDocumentoListResponse> {
    try {
      const response = await this.apiCall<TramiteDocumentoListResponse>(
        `${BASE}/${idTramite}/documentos`,
        { method: 'GET' }
      )
      return response
    } catch (error) {
      console.error('Error listing documentos:', error)
      return { success: false, data: [], error: 'Error al obtener los documentos' }
    }
  }

  /**
   * Sube un documento. formData debe incluir: categoria (string, nombre de la carpeta),
   * nombre_documento, archivo. El backend debe aceptar cualquier string en categoria.
   */
  static async upload(
    idTramite: number,
    formData: FormData
  ): Promise<TramiteDocumentoResponse> {
    try {
      const response = await this.apiCall<TramiteDocumentoResponse>(
        `${BASE}/${idTramite}/documentos`,
        {
          method: 'POST',
          body: formData,
        }
      )
      return response
    } catch (error) {
      console.error('Error uploading documento:', error)
      return { success: false, data: {} as any, error: 'Error al subir el documento' }
    }
  }

  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(
        `${BASE}/documentos/${id}`,
        { method: 'DELETE' }
      )
      return response
    } catch (error) {
      console.error('Error deleting documento:', error)
      return { success: false, error: 'Error al eliminar el documento' }
    }
  }

  static getDownloadUrl(id: number): string {
    return `${BASE}/documentos/${id}/download`
  }

  static async listCategorias(idTramite: number): Promise<TramiteCategoriaListResponse> {
    try {
      const response = await this.apiCall<TramiteCategoriaListResponse>(
        `${BASE}/${idTramite}/categorias`,
        { method: 'GET' }
      )
      return response
    } catch (error) {
      console.error('Error listing categorias:', error)
      return { success: false, data: [], error: 'Error al obtener las categorías' }
    }
  }

  static async createCategoria(
    idTramite: number,
    nombre: string
  ): Promise<{ success: boolean; data?: TramiteCategoria; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data?: TramiteCategoria; error?: string }>(
        `${BASE}/${idTramite}/categorias`,
        {
          method: 'POST',
          body: JSON.stringify({ nombre }),
          headers: { 'Content-Type': 'application/json' },
        }
      )
      return response
    } catch (error) {
      console.error('Error creating categoria:', error)
      return { success: false, error: 'Error al crear la categoría' }
    }
  }
}
