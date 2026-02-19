import { BaseService } from '~/services/base/BaseService'
import type {
  TramiteDocumento,
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

  /**
   * Sube múltiples documentos en una sola petición.
   * FormData: id_tipo_permiso[], archivo[], seccion[], id_categoria[], categoria[]
   */
  static async uploadBatch(
    idTramite: number,
    formData: FormData
  ): Promise<{ success: boolean; data: TramiteDocumento[]; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data: TramiteDocumento[]; error?: string }>(
        `${BASE}/${idTramite}/documentos/batch`,
        { method: 'POST', body: formData }
      )
      return response
    } catch (error) {
      console.error('Error uploading batch documentos:', error)
      return { success: false, data: [], error: 'Error al subir los documentos' }
    }
  }

  /**
   * Una sola petición: sube documentos + guarda tipos permiso (f_caducidad por tipo en cada item).
   * FormData: id_tipo_permiso[], archivo[], seccion[], id_categoria[], categoria[] (opcional),
   *           guardar_tipos (JSON: array de { id_tipo_permiso, documentos_tramite_ids, fotos_ids, seguimiento_ids, f_caducidad? }).
   */
  static async guardarTodo(
    idTramite: number,
    formData: FormData
  ): Promise<{ success: boolean; data: TramiteDocumento[]; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data: TramiteDocumento[]; error?: string }>(
        `${BASE}/${idTramite}/guardar-todo`,
        { method: 'POST', body: formData }
      )
      return response
    } catch (error) {
      console.error('Error en guardar todo:', error)
      return { success: false, data: [], error: 'Error al guardar' }
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

  /**
   * Guarda la información de un tipo de permiso (tab): envía los ids de documentos por sección.
   * El backend puede persistir o sincronizar el estado de ese tab.
   */
  static async guardarTipoPermiso(
    idTramite: number,
    idTipoPermiso: number,
    payload: { documentos_tramite_ids: number[]; fotos_ids: number[]; seguimiento_ids: number[] }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(
        `${BASE}/${idTramite}/tipos-permiso/${idTipoPermiso}/guardar`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        }
      )
      return response
    } catch (error) {
      console.error('Error guardando tipo permiso:', error)
      return { success: false, error: 'Error al guardar' }
    }
  }

  /**
   * Registra un pago del servicio en la tabla relacionada al trámite (ej. tramite_aduana_pago).
   * formData: monto, banco, fecha_cierre (YYYY-MM-DD), voucher (File).
   */
  static async registrarPago(idTramite: number, formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data?: any; error?: string }>(
        `${BASE}/${idTramite}/pagos`,
        { method: 'POST', body: formData }
      )
      return response
    } catch (error) {
      console.error('Error registrando pago:', error)
      return { success: false, error: 'Error al registrar el pago' }
    }
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
