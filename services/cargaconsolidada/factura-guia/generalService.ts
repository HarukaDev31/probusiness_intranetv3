import type { GeneralResponse } from "~/types/cargaconsolidada/factura-guia/general"
import { apiCall } from "~/utils/api"

export class GeneralService {
    private static baseUrl = 'api/carga-consolidada/contenedor/factura-guia/general'

    static async getGeneral(id: number): Promise<GeneralResponse> {
        try {
            const response = await apiCall<GeneralResponse>(`${this.baseUrl}/${id}`)
            return response
        } catch (error) {
            console.error('Error al obtener la factura y guía:', error)
            throw error
        }
    }
}