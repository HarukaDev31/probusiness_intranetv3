import { BaseService } from '../base/BaseService'

/** Un ítem de boletín dentro de una fila agrupada por cotización */
export interface BoletinQuimicoItem {
  id: number
  item_nombre: string
  monto_boletin: number
  estado: string
  total_pagado: number
  pagos_count: number
  pagos_details: PagoBoletinDetail[]
}

/** Fila de la tabla: una cotización con todos sus ítems de boletín */
export interface BoletinQuimicoRow {
  id_cotizacion: number
  id_contenedor: number
  cliente: string
  consolidado: string
  items: BoletinQuimicoItem[]
}

export interface PagoBoletinDetail {
  id_pago: number
  monto: number
  concepto: { name: string }
  status: string
  payment_date: string | null
  banco: string | null
  voucher_url: string | null
}

export interface BoletinQuimicoListResponse {
  success: boolean
  data: BoletinQuimicoRow[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

export interface StoreBoletinBody {
  id_contenedor: number
  items: Array<{
    id_cotizacion: number
    id_cotizacion_proveedor_item: number | null
    monto_boletin: number
  }>
}

export class BoletinQuimicoService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/boletin-quimico'

  static async getList (params: { page?: number; per_page?: number; search?: string }): Promise<BoletinQuimicoListResponse> {
    const query = new URLSearchParams()
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    if (params.search) query.append('search', params.search)
    return this.apiCall<BoletinQuimicoListResponse>(`${this.baseUrl}?${query.toString()}`)
  }

  static async getContenedores (): Promise<{ success: boolean; data: Array<{ id: number; carga: string; label: string }> }> {
    return this.apiCall(`${this.baseUrl}/contenedores`)
  }

  static async getClientesByContenedor (idContenedor: number): Promise<{ success: boolean; data: Array<{ id: number; nombre: string; documento?: string; telefono?: string }> }> {
    return this.apiCall(`${this.baseUrl}/contenedor/${idContenedor}/clientes`)
  }

  static async getItemsByContenedor (idContenedor: number): Promise<{ success: boolean; data: Array<{ id: number; id_cotizacion: number; nombre: string }> }> {
    return this.apiCall(`${this.baseUrl}/contenedor/${idContenedor}/items`)
  }

  /** Items de la cotización (cliente) seleccionada. GET cotizacion/{idCotizacion}/items */
  static async getItemsByCotizacion (idCotizacion: number): Promise<{ success: boolean; data: Array<{ id: number; id_cotizacion: number; nombre: string }> }> {
    return this.apiCall(`${this.baseUrl}/cotizacion/${Number(idCotizacion)}/items`)
  }

  static async store (body: StoreBoletinBody): Promise<{ success: boolean; message: string }> {
    return this.apiCall(`${this.baseUrl}`, { method: 'POST', body })
  }

  static async getPagosByItem (idItem: number): Promise<{ success: boolean; data: PagoBoletinDetail[] }> {
    return this.apiCall(`${this.baseUrl}/item/${idItem}/pagos`)
  }

  static async getItemDetalle (idItem: number): Promise<{ success: boolean; data: any }> {
    return this.apiCall(`${this.baseUrl}/item/${idItem}`)
  }

  static async storePago (formData: FormData): Promise<{ success: boolean; data?: any; estado_item?: string }> {
    return this.apiCall(`${this.baseUrl}/pago`, { method: 'POST', body: formData })
  }

  static async updateEstadoPago (idPago: number, status: string): Promise<{ success: boolean; data?: any; estado_item?: string }> {
    return this.apiCall(`${this.baseUrl}/pago/${idPago}`, { method: 'PUT', body: { status } })
  }
}
