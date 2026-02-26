import { BaseService } from '../base/BaseService'

export class InspeccionadosService extends BaseService {
    private static readonly baseUrl = 'api/carga-consolidada/inspeccionados'

    static async getInspeccionados(params?: {
        search?: string
        page?: number
        limit?: number
        filters?: Record<string, string>
    }): Promise<any> {
        try {
            const queryParams = new URLSearchParams()
            if (params?.page)    queryParams.append('page',   params.page.toString())
            if (params?.limit)   queryParams.append('limit',  params.limit.toString())
            if (params?.search)  queryParams.append('search', params.search)
            if (params?.filters && Object.keys(params.filters).length) {
                queryParams.append('filters', JSON.stringify(params.filters))
            }
            const qs = queryParams.toString()
            const response = await this.apiCall<any>(`${this.baseUrl}${qs ? `?${qs}` : ''}`, { method: 'GET' })
            return response
        } catch (error) {
            console.error('Error al obtener inspeccionados:', error)
            throw error
        }
    }
}
