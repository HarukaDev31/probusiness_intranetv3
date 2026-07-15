import { BaseService } from '~/services/base/BaseService'

export interface ExcelConfirmacionItem {
  id: number
  initial_name: string
  tipo_producto: string
  initial_qty: number | null
  initial_price: number | null
  caracteristicas: Record<string, string>
  qty: number | null
  precio_unitario: number | null
  is_new?: boolean
}

export interface ExcelConfirmacionProveedor {
  id: number
  code_supplier: string
  supplier: string | null
  excel_conf_status: string | null
  excel_conf_form_cerrado: boolean
  items: ExcelConfirmacionItem[]
}

export interface ExcelConfirmacionData {
  uuid: string
  id: number
  carga: string
  nombre_cliente: string
  proveedores: ExcelConfirmacionProveedor[]
}

export interface ExcelConfirmacionSavePayload {
  proveedores: Array<{
    id: number
    items: Array<{
      id: number
      is_new?: boolean
      tipo_producto?: string
      caracteristicas: Record<string, string>
      qty: number | null
      precio_unitario: number | null
    }>
  }>
}

export class ExcelConfirmacionCoordinacionService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/contenedor/clientes/excel-confirmacion'

  static async getLabels(): Promise<{ success: boolean; data?: Record<string, string[]>; message?: string }> {
    return this.apiCall(`${this.baseUrl}/labels`)
  }

  static async getByUuid(uuid: string): Promise<{ success: boolean; data?: ExcelConfirmacionData; message?: string }> {
    return this.apiCall(`${this.baseUrl}/${uuid}`)
  }

  static async save(uuid: string, payload: ExcelConfirmacionSavePayload): Promise<{ success: boolean; message?: string }> {
    return this.apiCall(`${this.baseUrl}/${uuid}`, {
      method: 'PUT',
      body: payload
    })
  }

  static async cerrarProveedor(idProveedor: number): Promise<{ success: boolean; message?: string; data?: { excel_conf_form_cerrado: boolean } }> {
    return this.apiCall(
      `${this.baseUrl}/proveedor/${idProveedor}/cerrar`,
      { method: 'POST' }
    )
  }

  static async reabrirProveedor(idProveedor: number): Promise<{ success: boolean; message?: string; data?: { excel_conf_form_cerrado: boolean } }> {
    return this.apiCall(
      `${this.baseUrl}/proveedor/${idProveedor}/reabrir`,
      { method: 'POST' }
    )
  }

  static exportProveedorUrl(idProveedor: number): string {
    const config = useRuntimeConfig()
    const base = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
    return `${base}/${this.baseUrl}/proveedor/${idProveedor}/export`
  }

  static exportGeneralUrl(uuid: string): string {
    const config = useRuntimeConfig()
    const base = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
    return `${base}/${this.baseUrl}/${uuid}/export-general`
  }
}
