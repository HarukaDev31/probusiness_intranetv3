import type { PagosResponse } from "../../../types/cargaconsolidada/cotizacion-final/pagos"
import { BaseService } from "~/services/base/BaseService"

    
export class PagosService  extends BaseService  {
    private static baseUrl = 'api/carga-consolidada/contenedor/cotizacion-final/pagos'

    static async getPagos(id: number,params: any): Promise<PagosResponse> {
        try {
            const queryParams = new URLSearchParams()
            if (params.page) queryParams.append('page', params.page.toString())
            if (params.per_page) queryParams.append('per_page', params.per_page.toString())
            if (params.search) queryParams.append('search', params.search)
            if (params.filters) {
                Object.entries(params.filters).forEach(([key, value]) => {
                    queryParams.append(key, value.toString())       
                })
            }
            const response = await this.apiCall<PagosResponse>(`${this.baseUrl}/${id}?${queryParams.toString()}`)
            return response
        } catch (error) {
            console.error('Error al obtener los pagos:', error)
            throw error
        }
    }
    static async registrarPago(formData: FormData): Promise<PagosResponse> {
        try {
            const response = await this.apiCall<PagosResponse>(`${this.baseUrl}`, {
                method: 'POST',
                body: formData
            })
            return response
        } catch (error) {
            console.error('Error al registrar el pago:', error)
            throw error
        }
    }

    static async exportContabilidadExcel(
        idContenedor: number,
        params?: { search?: string; filters?: Record<string, string> }
    ): Promise<Blob> {
        try {
            const queryParams = new URLSearchParams()
            if (params?.search) queryParams.append('search', params.search)
            if (params?.filters) {
                Object.entries(params.filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '' && value !== 'todos') {
                        queryParams.append(key, String(value))
                    }
                })
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
            console.error('Error al exportar pagos de cotización final:', error)
            throw error
        }
    }
}
