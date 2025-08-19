import { BaseService } from "~/services/base/BaseService"

export class GeneralService extends BaseService {
    static baseUrl = 'api/carga-consolidada/contenedor/clientes/general'
    static async getClientes(idConsolidado: number) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${idConsolidado}`)
            return response
        } catch (error) {
            console.error('Error al obtener el cliente:', error)
            throw error
        }
    }
    static async updateEstadoCliente(data: any) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/estado-cliente`, {
                method: 'POST',
                body: data
            })
            return response
        }
        catch (error) {
            console.error('Error al actualizar el estado del cliente:', error)
            throw error
        }
    }
}
