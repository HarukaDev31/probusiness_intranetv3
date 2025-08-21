import { BaseService } from "~/services/base/BaseService"


export class PagosService extends BaseService {
    static baseUrl = '/cargaconsolidada/clientes/pagos'
    static async getCliente(id: number) {
        const response = await this.apiCall<any>(`${this.baseUrl}/${id}`)
        return response
    }
}
