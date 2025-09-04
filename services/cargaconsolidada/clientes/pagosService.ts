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
    } static async registrarPago(formData: FormData) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}`, {
                method: 'POST',
                body: formData
            })
            return response
        } catch (err) {
            console.error('Error al registrar el pago:', err)
            throw err
        }
    }
    static async deletePago(pagoId: number) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${pagoId}`, {
                method: 'DELETE'
            })
            return response
        } catch (err) {
            console.error('Error al eliminar el pago:', err)
            throw err
        }
    }
}
