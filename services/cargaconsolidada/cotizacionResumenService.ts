import { BaseService } from '~/services/base/BaseService'
import type {
  CotizacionResumenArchivo,
  CotizacionResumenClienteOption,
  CotizacionResumenDetalle,
  CotizacionResumenFilters,
  CotizacionResumenListResponse,
  CotizacionResumenSimpleResponse,
  CrearCotizacionResumenRequest,
  ExtraerDocumentoResponse
} from '~/types/cargaconsolidada/cotizacion-resumen'

export type {
  CotizacionResumenArchivo,
  CotizacionResumenClienteExtraido,
  CotizacionResumenClienteOption,
  CotizacionResumenDetalle,
  CotizacionResumenCosto,
  CotizacionResumenFilters,
  CotizacionResumenListResponse,
  CotizacionResumenProveedorExtraido,
  CotizacionResumenProveedorRow,
  CotizacionResumenRow,
  CotizacionResumenSimpleResponse as SimpleResponse,
  CrearCotizacionResumenRequest,
  ExtraerDocumentoResponse
} from '~/types/cargaconsolidada/cotizacion-resumen'

export class CotizacionResumenService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/cotizacion-resumen'

  static async searchClientes(q = ''): Promise<{ success: boolean; data: CotizacionResumenClienteOption[]; message?: string }> {
    try {
      const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
      return await this.apiCall(`${this.baseUrl}/clientes${qs}`)
    } catch (e: any) {
      return { success: false, data: [], message: e?.message }
    }
  }

  static async extraerDocumento(file: File): Promise<ExtraerDocumentoResponse> {
    const fd = new FormData()
    fd.append('file', file)
    return await this.apiCall<ExtraerDocumentoResponse>(`${this.baseUrl}/extraer-documento`, {
      method: 'POST',
      body: fd
    })
  }

  static async getCotizaciones(filters: CotizacionResumenFilters = {}): Promise<CotizacionResumenListResponse> {
    try {
      const qs = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') qs.append(key, String(value))
      })
      const url = `${this.baseUrl}${qs.toString() ? `?${qs}` : ''}`
      return await this.apiCall<CotizacionResumenListResponse>(url)
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async getCotizacion(id: number): Promise<{ success: boolean; data?: CotizacionResumenDetalle; message?: string }> {
    try {
      return await this.apiCall(`${this.baseUrl}/${id}`)
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async crearCotizacion(payload: CrearCotizacionResumenRequest): Promise<CotizacionResumenSimpleResponse> {
    try {
      return await this.apiCall<CotizacionResumenSimpleResponse>(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async actualizarCotizacion(id: number, payload: CrearCotizacionResumenRequest): Promise<CotizacionResumenSimpleResponse> {
    try {
      return await this.apiCall<CotizacionResumenSimpleResponse>(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async duplicarCotizacion(id: number): Promise<CotizacionResumenSimpleResponse> {
    try {
      return await this.apiCall<CotizacionResumenSimpleResponse>(`${this.baseUrl}/${id}/duplicar`, {
        method: 'POST'
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateEstado(id: number, estado: 'COTIZADO' | 'CONFIRMADO'): Promise<CotizacionResumenSimpleResponse> {
    try {
      return await this.apiCall<CotizacionResumenSimpleResponse>(`${this.baseUrl}/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado })
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async deleteCotizacion(id: number): Promise<CotizacionResumenSimpleResponse> {
    try {
      return await this.apiCall<CotizacionResumenSimpleResponse>(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default CotizacionResumenService
