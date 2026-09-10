import { BaseService } from '~/services/base/BaseService'

export interface CotizacionResumenClienteExtraido {
  nombre: string | null
  tipo_documento: 'ID' | 'RUC' | null
  documento: string | null
  whatsapp: string | null
  correo: string | null
}

export interface CotizacionResumenProveedorExtraido {
  cbm_total: number | null
  peso_total: number | null
  qty_cajas: number | null
  productos: string | null
}

export interface CotizacionResumenArchivo {
  path: string
  nombre_original: string
  mime_type: string
  size: number
}

export interface ExtraerDocumentoResponse {
  success: boolean
  extracted_by_ai: boolean
  message: string | null
  data: {
    cliente: CotizacionResumenClienteExtraido
    proveedores: CotizacionResumenProveedorExtraido[]
  } | null
  archivo: CotizacionResumenArchivo | null
}

export interface CrearCotizacionResumenRequest {
  id_contenedor: number
  id_usuario: number
  cliente: {
    nombre: string
    tipo_documento?: 'ID' | 'RUC'
    documento?: string
    whatsapp?: string
    correo?: string
  }
  proveedores: {
    cbm_total: number
    peso_total?: number
    qty_cajas?: number
    productos: string
  }[]
  descuento?: number
  archivo?: CotizacionResumenArchivo | null
}

export interface CotizacionResumenProveedorRow {
  id: number
  estado_china: string | null
  producto: string | null
  volumen_cbm: number | string | null
  peso_total: number | string | null
  qty_cajas: number | null
  costo_unitario_estimado: number | string | null
  inversion_total: number | string | null
}

export interface CotizacionResumenRow {
  id: number
  fecha: string | null
  nombre: string | null
  documento: string | null
  telefono: string | null
  correo: string | null
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'DECLINADO'
  id_contenedor: number
  contenedor: string | null
  id_usuario: number | null
  vendedor: string | null
  total_cbm: number
  total_cajas: number
  proveedores: CotizacionResumenProveedorRow[]
}

export interface CotizacionResumenListResponse {
  success: boolean
  data: CotizacionResumenRow[]
  message?: string
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface SimpleResponse {
  success: boolean
  message?: string
  data?: any
}

export interface CotizacionResumenFilters {
  fecha_inicio?: string
  fecha_fin?: string
  estado?: string
  id_contenedor?: number
  id_usuario?: number
  search?: string
  page?: number
  per_page?: number
}

export class CotizacionResumenService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/cotizacion-resumen'

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

  static async crearCotizacion(payload: CrearCotizacionResumenRequest): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateEstado(id: number, estado: 'PENDIENTE' | 'CONFIRMADO' | 'DECLINADO'): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`${this.baseUrl}/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado })
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default CotizacionResumenService
