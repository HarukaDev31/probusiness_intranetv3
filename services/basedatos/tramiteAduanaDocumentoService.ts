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
   * Actualiza el estado de verificación de un pago de servicio (Conforme / Pendiente / Observado).
   * Solo perfil ADMINISTRACIÓN. Backend: PATCH o PUT al recurso del documento/voucher de pago_servicio.
   */
  static async updateEstadoPagoServicio(
    idTramite: number,
    idDocumento: number,
    estado: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(
        `${BASE}/${idTramite}/pagos-servicio/${idDocumento}/estado`,
        {
          method: 'PATCH',
          body: JSON.stringify({ estado }),
          headers: { 'Content-Type': 'application/json' },
        }
      )
      return response
    } catch (error) {
      console.error('Error actualizando estado pago servicio:', error)
      return { success: false, error: 'Error al actualizar el estado' }
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

  /**
   * Guardar verificación: estados de pagos de servicio + comprobantes nuevos + actualizaciones de comprobantes existentes.
   * Una sola petición POST .../guardar-verificacion. No se usan otros endpoints para actualizar.
   */
  static async guardarVerificacion(
    idTramite: number,
    payload: {
      estadosPagoServicio: Array<{ id_documento: number; estado: string }>
      comprobantesDerecho?: Array<{
        idTipoPermiso: number
        file: File
        monto?: string
        banco?: string
        fecha_cierre?: string
      }>
      /** Uno o más comprobantes tramitador (múltiples archivos). */
      pagoTramitador?: Array<{
        file: File
        monto?: string
        banco?: string
        fecha_cierre?: string
      }> | null
      /** Actualizaciones de comprobantes derecho ya guardados (monto, banco, fecha_cierre). Se envían en el mismo POST. */
      comprobantesDerechoActualizar?: Array<{ id: number; monto?: string; banco?: string; fecha_cierre?: string }>
      /** Actualizaciones de comprobantes tramitador ya guardados. Se envían en el mismo POST. */
      comprobantesTramitadorActualizar?: Array<{ id: number; monto?: string; banco?: string; fecha_cierre?: string }>
      /** Reemplazar archivo de comprobantes derecho por id. */
      comprobantesDerechoReemplazar?: Array<{ id: number; file: File }>
      /** Reemplazar archivo de comprobantes tramitador por id. */
      comprobantesTramitadorReemplazar?: Array<{ id: number; file: File }>
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const formData = new FormData()
      formData.append('estados_pago_servicio', JSON.stringify(payload.estadosPagoServicio))
      if (payload.comprobantesDerecho?.length) {
        const idxByTipo: Record<number, number> = {}
        for (const { idTipoPermiso, file, monto, banco, fecha_cierre } of payload.comprobantesDerecho) {
          const idx = idxByTipo[idTipoPermiso] ?? 0
          idxByTipo[idTipoPermiso] = idx + 1
          formData.append(`comprobante_derecho_${idTipoPermiso}_${idx}`, file)
          if (monto != null) formData.append(`pago_derecho_${idTipoPermiso}_${idx}_monto`, monto)
          if (banco != null) formData.append(`pago_derecho_${idTipoPermiso}_${idx}_banco`, banco)
          if (fecha_cierre != null) formData.append(`pago_derecho_${idTipoPermiso}_${idx}_fecha_cierre`, fecha_cierre)
        }
      }
      if (payload.pagoTramitador?.length) {
        payload.pagoTramitador.forEach((item, idx) => {
          const { file, monto, banco, fecha_cierre } = item
          formData.append(idx === 0 ? 'comprobante_tramitador' : `comprobante_tramitador_${idx}`, file)
          const pre = idx === 0 ? 'pago_tramitador_' : `pago_tramitador_${idx}_`
          if (monto != null) formData.append(`${pre}monto`, monto)
          if (banco != null) formData.append(`${pre}banco`, banco)
          if (fecha_cierre != null) formData.append(`${pre}fecha_cierre`, fecha_cierre)
        })
      }
      if (payload.comprobantesDerechoActualizar?.length) {
        formData.append('comprobante_derecho_actualizar', JSON.stringify(payload.comprobantesDerechoActualizar))
      }
      if (payload.comprobantesTramitadorActualizar?.length) {
        formData.append('comprobante_tramitador_actualizar', JSON.stringify(payload.comprobantesTramitadorActualizar))
      }
      if (payload.comprobantesDerechoReemplazar?.length) {
        for (const { id, file } of payload.comprobantesDerechoReemplazar) {
          formData.append(`comprobante_derecho_reemplazar_${id}`, file)
        }
      }
      if (payload.comprobantesTramitadorReemplazar?.length) {
        for (const { id, file } of payload.comprobantesTramitadorReemplazar) {
          formData.append(`comprobante_tramitador_reemplazar_${id}`, file)
        }
      }
      const response = await this.apiCall<{ success: boolean; error?: string }>(
        `${BASE}/${idTramite}/guardar-verificacion`,
        { method: 'POST', body: formData }
      )
      return response
    } catch (error) {
      console.error('Error guardar verificacion:', error)
      return { success: false, error: 'Error al guardar la verificación' }
    }
  }

  /** Elimina un comprobante de derecho de trámite (solo administración). */
  static async eliminarComprobanteDerecho(idTramite: number, idComprobante: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(
        `${BASE}/${idTramite}/comprobantes-derecho/${idComprobante}`,
        { method: 'DELETE' }
      )
      return response
    } catch (error) {
      console.error('Error eliminar comprobante derecho:', error)
      return { success: false, error: 'Error al eliminar el comprobante' }
    }
  }

  /** Elimina un comprobante del tramitador (solo administración). */
  static async eliminarComprobanteTramitador(idTramite: number, idComprobante: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(
        `${BASE}/${idTramite}/comprobantes-tramitador/${idComprobante}`,
        { method: 'DELETE' }
      )
      return response
    } catch (error) {
      console.error('Error eliminar comprobante tramitador:', error)
      return { success: false, error: 'Error al eliminar el comprobante' }
    }
  }
}
