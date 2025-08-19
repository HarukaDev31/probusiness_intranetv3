import { BaseService } from '../base/BaseService'

export class CotizacionPagosService extends BaseService {
    private static readonly baseUrl = 'api/carga-consolidada/cotizaciones-pagos'

    static async getCotizacionesPagos(id: number): Promise<any> {
        const response = await this.apiCall<any>(`${this.baseUrl}/${id}`, { method: 'GET' })
        return response
    }
}