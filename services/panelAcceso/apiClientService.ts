import { BaseService } from '~/services/base/BaseService'

export interface ApiClientScopeOption {
  key: string
  label: string
}

export interface ApiClientCatalogo {
  scopes: ApiClientScopeOption[]
  default_rate_limit_per_minute: number
  default_daily_quota: number
  max_rate_limit_per_minute: number
  max_daily_quota: number
  base_path: string
}

export interface ApiClient {
  id: number
  nombre: string
  organizacion_id: number
  organizacion: string | null
  token_prefix: string
  scopes: string[]
  id_usuario_bot: number | null
  rate_limit_per_minute: number
  daily_quota: number
  activo: boolean
  revocado: boolean
  last_used_at: string | null
  last_used_ip: string | null
  requests_hoy: number
  created_at: string | null
}

export interface CrearApiClientRequest {
  organizacion_id: number
  nombre: string
  scopes: string[]
  rate_limit_per_minute?: number
  daily_quota?: number
}

export interface ActualizarApiClientRequest {
  nombre?: string
  scopes?: string[]
  rate_limit_per_minute?: number
  daily_quota?: number
  activo?: boolean
}

export interface ApiClientAuditLog {
  id: number
  method: string
  path: string
  scope: string | null
  status_code: number
  ip: string | null
  user_agent: string | null
  duration_ms: number | null
  error: string | null
  meta: Record<string, unknown> | null
  created_at: string
}

export interface ApiClientAuditoria {
  cliente: ApiClient
  resumen: {
    total: number | string | null
    ok: number | string | null
    errores_cliente: number | string | null
    errores_servidor: number | string | null
    limitados: number | string | null
    ms_promedio: number | string | null
  } | null
  por_dia: { dia: string; total: number }[]
  por_ruta: { method: string; path: string; total: number }[]
  por_ip: { ip: string | null; total: number }[]
  logs: ApiClientAuditLog[]
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string | Record<string, string[]>
  token?: string
  pagination?: { current_page: number; per_page: number; total: number; last_page: number }
}

/**
 * Mantenedor de credenciales de la API de integración.
 * Solo org 1 con rol GERENCIA / GERENTE GENERAL (el backend responde 403 al resto).
 * El token en claro solo llega al crear o rotar: nunca se guarda ni se loguea.
 */
export class ApiClientService extends BaseService {
  private static base = '/api/panel-acceso/api-clients'

  private static async llamar<T>(url: string, options?: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      return await this.apiCall<ApiResponse<T>>(url, options)
    } catch (e: any) {
      const detalle = e?.data?.message ?? e?.message
      return { success: false, message: detalle }
    }
  }

  static getCatalogo() {
    return this.llamar<ApiClientCatalogo>(`${this.base}/catalogo`)
  }

  static listar() {
    return this.llamar<ApiClient[]>(this.base)
  }

  static crear(payload: CrearApiClientRequest) {
    return this.llamar<ApiClient>(this.base, { method: 'POST', body: payload })
  }

  static actualizar(id: number, payload: ActualizarApiClientRequest) {
    return this.llamar<ApiClient>(`${this.base}/${id}`, { method: 'PUT', body: payload })
  }

  static rotarToken(id: number) {
    return this.llamar<ApiClient>(`${this.base}/${id}/rotar-token`, { method: 'POST' })
  }

  static revocar(id: number) {
    return this.llamar<unknown>(`${this.base}/${id}/revocar`, { method: 'POST' })
  }

  static auditoria(id: number, params: { desde?: string; hasta?: string; status?: number; page?: number } = {}) {
    const qs = new URLSearchParams()
    if (params.desde) qs.append('desde', params.desde)
    if (params.hasta) qs.append('hasta', params.hasta)
    if (params.status) qs.append('status', String(params.status))
    if (params.page) qs.append('page', String(params.page))
    return this.llamar<ApiClientAuditoria>(`${this.base}/${id}/auditoria${qs.toString() ? `?${qs}` : ''}`)
  }
}

export default ApiClientService
