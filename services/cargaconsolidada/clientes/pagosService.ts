import { BaseService } from "~/services/base/BaseService"


export class PagosService extends BaseService {
    static baseUrl = 'api/carga-consolidada/contenedor/clientes/pagos'
    static async getClientes(idConsolidado: number, filters: any, search: string, itemsPerPage: number, currentPage: number) {
        const response = await this.apiCall<any>(`${this.baseUrl}/${idConsolidado}`, {
            method: 'GET',
            params: {
                search,
                itemsPerPage,
                currentPage
            }
        })
        return response
    }
}
