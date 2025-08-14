import { apiCall } from "~/utils/api"
import type { PagosResponse } from "~/types/cargaconsolidada/cotizacion-final/pagos"

    
export class PagosService {
    private static baseUrl = 'api/carga-consolidada/contenedor/cotizacion-final/pagos'

    static async getPagos(id: number): Promise<PagosResponse> {
        try {
            const response = await apiCall<PagosResponse>(`${this.baseUrl}/${id}`)
            return response
        } catch (error) {
            console.error('Error al obtener los pagos:', error)
            throw error
        }
    }
}


