import type { GeneralResponse } from "../../../types/cargaconsolidada/factura-guia/general"
import { BaseService } from "~/services/base/BaseService"

export class GeneralService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor/factura-guia/general'

    static async getGeneral(id: number): Promise<GeneralResponse> {
        try {
            const response = await this.apiCall<GeneralResponse>(`${this.baseUrl}/${id}`)
            return response
        } catch (error) {
            console.error('Error al obtener la factura y guía:', error)
            throw error
        }
    }
    static async uploadFacturaComercial(data: any): Promise<GeneralResponse> {
        try {
            const response = await this.apiCall<GeneralResponse>(`${this.baseUrl}/upload-factura-comercial`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al subir la factura comercial:', error)
            throw error
        }
    }
    static async uploadGuiaRemision(data: any): Promise<GeneralResponse> {
        try {
            const response = await this.apiCall<GeneralResponse>(`${this.baseUrl}/upload-guia-remision`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al subir la guía remisión:', error)
            throw error
        }
    }
}