import { BaseService } from '../base/BaseService'

export class CotizacionPagosService extends BaseService {
    private static readonly baseUrl = 'api/carga-consolidada/cotizaciones-pagos'

    static async getCotizacionesPagos(id: number, params?: any, signal?: AbortSignal): Promise<any> {
        try {
            const queryParams = new URLSearchParams()
            if (params?.page) queryParams.append('page', params.page.toString())
            if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
            if (params?.search) queryParams.append('search', params.search)
            if (params?.filters) queryParams.append('filters', JSON.stringify(params.filters))
            if (params?.id_cotizacion != null && params?.id_cotizacion !== '') queryParams.append('id_cotizacion', String(params.id_cotizacion))
            const qs = queryParams.toString()
            const response = await this.apiCall<any>(`${this.baseUrl}/${id}${qs ? `?${qs}` : ''}`, { method: 'GET', signal })
            return response
        } catch (error) {
            console.error('Error al obtener cotizaciones pagos:', error)
            throw error
        }
    }

    static async exportContabilidadExcel(
        idContenedor: number,
        params?: { search?: string; filters?: Record<string, string>; id_cotizacion?: string | number }
    ): Promise<Blob> {
        try {
            const queryParams = new URLSearchParams()
            if (params?.search) queryParams.append('search', params.search)
            if (params?.filters && Object.keys(params.filters).length) {
                queryParams.append('filters', JSON.stringify(params.filters))
            }
            if (params?.id_cotizacion != null && params.id_cotizacion !== '') {
                queryParams.append('id_cotizacion', String(params.id_cotizacion))
            }
            const qs = queryParams.toString()
            return await this.apiCall<Blob>(
                `${this.baseUrl}/${idContenedor}/export-excel${qs ? `?${qs}` : ''}`,
                {
                    method: 'GET',
                    responseType: 'blob',
                    headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                }
            )
        } catch (error) {
            console.error('Error al exportar pagos de cotización inicial:', error)
            throw error
        }
    }
}