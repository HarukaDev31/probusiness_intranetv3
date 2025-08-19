import type { GeneralResponse } from "../../../types/cargaconsolidada/cotizacion-final/general"
import { BaseService } from "~/services/base/BaseService"

export class GeneralService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor/cotizacion-final/general'

    static async getGeneral(id: number): Promise<GeneralResponse> {
        try {
            const response = await this.apiCall<GeneralResponse>(`${this.baseUrl}/${id}`)
            return response
        } catch (error) {
            console.error('Error al obtener la cotización final:', error)
            throw error
        }
    }
}




