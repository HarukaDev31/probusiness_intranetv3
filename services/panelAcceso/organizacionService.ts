import { BaseService } from '~/services/base/BaseService'

export interface Organizacion {
  id: number
  id_empresa: number
  empresa: string | null
  no_organizacion: string
  txt_organizacion: string | null
  id_pais?: number | null
  pais?: string | null
  paises_habilitados?: number[]
  paises_habilitados_nombres?: string[]
  prefijo?: string | null
  estado: number
  url_clientes?: string | null
  url_excel_confirmacion?: string | null
  url_datos_proveedor?: string | null
  nombre_publico?: string | null
  drive_folder_id?: string | null
  logo_url?: string | null
  public_key?: string | null
  envios_habilitados?: boolean
  rotulado_habilitado?: boolean
  flujos?: Record<string, boolean>
  flujos_catalogo?: FlujoCatalogoItem[]
  flujos_activos?: number
  flujos_total?: number
  img_rotulado_paso1_url?: string | null
  img_rotulado_paso2_url?: string | null
  img_rotulado_direccion_url?: string | null
}

export interface FlujoCatalogoItem {
  key: string
  grupo: string
  label: string
}

export const FLUJOS_CATALOGO_FALLBACK: FlujoCatalogoItem[] = [
  { key: 'rotulado', grupo: 'Coordinación', label: 'Rotulado' },
  { key: 'documentos', grupo: 'Coordinación', label: 'Documentos de aduana' },
  { key: 'datos_proveedor', grupo: 'Coordinación', label: 'Datos de proveedor' },
  { key: 'cbm_alerta', grupo: 'Coordinación', label: 'Alerta diferencia CBM' },
  { key: 'arrive_date', grupo: 'Coordinación', label: 'Aviso de arrive date' },
  { key: 'cambio_consolidado', grupo: 'Coordinación', label: 'Cambio de consolidado' },
  { key: 'inspeccion', grupo: 'Almacén', label: 'Inspección' },
  { key: 'entrega', grupo: 'Entrega', label: 'Formulario y cargo de entrega' },
  { key: 'cobranza', grupo: 'Finanzas', label: 'Cotización final / cobrando' },
  { key: 'reminder_pago', grupo: 'Finanzas', label: 'Recordatorio de pago' },
  { key: 'factura_guia', grupo: 'Finanzas', label: 'Factura y guía' },
  { key: 'contabilidad', grupo: 'Finanzas', label: 'Comprobantes y detracción' },
  { key: 'comprobante_form', grupo: 'Finanzas', label: 'Formulario de comprobante' },
  { key: 'calculadora', grupo: 'Comercial', label: 'Cotización calculadora' },
  { key: 'cotizacion_pdf', grupo: 'Comercial', label: 'PDF / contrato (ventas)' },
]

export interface CreateOrganizacionRequest {
  id_empresa: number
  no_organizacion: string
  txt_organizacion?: string
  id_pais?: number | null
  paises_habilitados?: number[]
  estado: number
  envios_habilitados?: boolean
  rotulado_habilitado?: boolean
  flujos?: Record<string, boolean>
  url_clientes?: string
  url_excel_confirmacion?: string
  url_datos_proveedor?: string
  nombre_publico?: string
  drive_folder_id?: string
  logo_url?: string
  regenerar_public_key?: boolean
}

export interface UpdateOrganizacionRequest extends CreateOrganizacionRequest {
  // mismos campos
}

export interface OrganizacionListResponse {
  success: boolean
  data: Organizacion[]
  message?: string
}

export interface OrganizacionResponse {
  success: boolean
  data: Organizacion
  message?: string
}

export interface SimpleResponse {
  success: boolean
  message?: string
}

/**
 * Mantenedor de organizaciones. Solo lo puede usar el staff de la
 * organizacion admin (ID_Organizacion == 1) -- el backend responde 403
 * para cualquier otro usuario, independiente de lo que haga el front.
 */
export interface PaisOption {
  value: number
  label: string
  iso2: string | null
  phone_code: string | null
}

export class OrganizacionService extends BaseService {

  static async getPaises(): Promise<{ success: boolean; data: PaisOption[] }> {
    try {
      return await this.apiCall<{ success: boolean; data: PaisOption[] }>('/api/panel-acceso/paises')
    } catch {
      return { success: false, data: [] }
    }
  }

  static async getOrganizaciones(params: { empresa_id?: number } = {}): Promise<OrganizacionListResponse> {
    try {
      const qs = new URLSearchParams()
      if (params.empresa_id) qs.append('empresa_id', String(params.empresa_id))

      const url = `/api/panel-acceso/organizaciones${qs.toString() ? `?${qs}` : ''}`
      return await this.apiCall<OrganizacionListResponse>(url)
    } catch (e: any) {
      return { success: false, data: [], message: e.message }
    }
  }

  static async createOrganizacion(data: CreateOrganizacionRequest): Promise<OrganizacionResponse | SimpleResponse> {
    try {
      return await this.apiCall<OrganizacionResponse>('/api/panel-acceso/organizaciones', {
        method: 'POST',
        body: data,
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async updateOrganizacion(id: number, data: UpdateOrganizacionRequest): Promise<OrganizacionResponse | SimpleResponse> {
    try {
      return await this.apiCall<OrganizacionResponse>(`/api/panel-acceso/organizaciones/${id}`, {
        method: 'POST',
        body: data,
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async deleteOrganizacion(id: number): Promise<SimpleResponse> {
    try {
      return await this.apiCall<SimpleResponse>(`/api/panel-acceso/organizaciones/${id}`, {
        method: 'DELETE',
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }

  static async uploadRotuladoImagen(
    id: number,
    slot: 'paso1' | 'paso2' | 'direccion',
    file: File,
  ): Promise<OrganizacionResponse | SimpleResponse> {
    try {
      const formData = new FormData()
      formData.append('slot', slot)
      formData.append('file', file)
      return await this.apiCall<OrganizacionResponse>(`/api/panel-acceso/organizaciones/${id}/rotulado-imagen`, {
        method: 'POST',
        body: formData,
      })
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
}

export default OrganizacionService
