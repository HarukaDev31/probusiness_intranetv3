import { BaseService } from "~/services/base/BaseService"
import type { HeaderResponse } from "~/types/data-table"

export class GeneralService extends BaseService {
    static baseUrl = 'api/carga-consolidada/contenedor/clientes/general'
    static async getClientes(idConsolidado: number, filters: any, search: string, itemsPerPage: number, currentPage: number ) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${idConsolidado}`, {
                method: 'GET',
                params: {
                    search,
                    itemsPerPage,
                    currentPage
                }
            })
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
    static async getHeaders(id: number) {
        try {
            const response = await this.apiCall<HeaderResponse>(`${this.baseUrl}/${id}/headers`)
            return response
        } catch (error) {
            console.error('Error al obtener los headers:', error)
            throw error
        }
    }
    static async updateStatusClienteDoc(data: any) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/status-cliente-doc`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al actualizar el estado de la documentación del cliente:', error)
            throw error
        }
    }
    static async exportClientes(id: number): Promise<Blob> {
        try {
            const response = await this.apiCall<Blob>(`${this.baseUrl}/${id}/export`, {
                method: 'GET',
                responseType: 'blob', // Asegura que la respuesta sea tratada como un Blob
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            })
            return response
        } catch (error) {
            console.error('Error al exportar los clientes:', error)
            throw new Error(error?.data?.message || 'Error al exportar clientes')
        }
    }
}
