import { BaseService } from "~/services/base/BaseService"
import type { HeaderResponse } from "~/types/data-table"

export class EmbarcadosService extends BaseService {
    static baseUrl = 'api/carga-consolidada/contenedor/clientes/embarcados'

    static async getHeaders(id: number): Promise<HeaderResponse[]> {
        try {
            const response = await this.apiCall<HeaderResponse[]>(`${this.baseUrl}/${id}/headers`)
            return response
        } catch (error) {
            console.error('Error al obtener los headers:', error)
            throw error
        }
    }

    static async getEmbarcados(id: number, filters: any, search: string, itemsPerPage: number, currentPage: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${id}`, {
                method: 'GET',
                params: {
                    search,
                    itemsPerPage,
                    currentPage
                }
            })
            return response
        } catch (error) {
            console.error('Error fetching embarcados:', error)
            throw error
        }
    }
}