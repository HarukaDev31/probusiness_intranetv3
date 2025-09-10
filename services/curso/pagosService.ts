
import { BaseService } from "~/services/base/BaseService"
import type { CursoPagosResponse, CursoPagosFilters } from "~/types/cursos/pagos"

export class PagosService extends BaseService {
    private static baseUrl = 'api/cursos/pagos'
    constructor() {
        super()
    }
    static async getCursosPagos(filters: CursoPagosFilters): Promise<CursoPagosResponse> {
        try {
            const response = await this.apiCall<CursoPagosResponse>(`${this.baseUrl}`, {
                method: 'GET',
                params: filters
            })
            return response
        } catch (error) {
            console.error('Error al obtener los pagos de cursos:', error)
            throw new Error('No se pudieron obtener los pagos de cursos')
        }
    }
    static async registrarPago(formData: FormData): Promise<CursoPagosResponse> {
        try {
            const response = await this.apiCall<CursoPagosResponse>(`${this.baseUrl}`, {
                method: 'POST',
                body: formData
            })
            return response
        } catch (error) {
            console.error('Error al registrar el pago:', error)
            throw new Error('No se pudo registrar el pago')
        }
    }
    static async deletePago(id: number): Promise<CursoPagosResponse> {
        try {
            const response = await this.apiCall<CursoPagosResponse>(`${this.baseUrl}/${id}`, {
                method: 'DELETE'
            })
            return response
        } catch (error) {
            console.error('Error al eliminar el pago:', error)
            throw new Error('No se pudo eliminar el pago')
        }
    }
   
}
