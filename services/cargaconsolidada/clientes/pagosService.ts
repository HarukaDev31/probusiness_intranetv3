

export class PagosService {
    static baseUrl = '/cargaconsolidada/clientes/pagos'
    static async getCliente(id: number) {
        const response = await this.apiCall<any>(`${this.baseUrl}/${id}`)
        return response
    }
}
