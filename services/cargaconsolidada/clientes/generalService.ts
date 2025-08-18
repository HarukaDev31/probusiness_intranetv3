

export class GeneralService {
    static baseUrl = 'api/carga-consolidada/contenedor/clientes/general'
    static async getClientes(idConsolidado: number) {
        try{
            const response = await this.apiCall<any>(`${this.baseUrl}/${idConsolidado}`)
            return response
        } catch (error) {
            console.error('Error al obtener el cliente:', error)
            throw error
        }
    }
}
