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
}

export default CotizacionResumenService
