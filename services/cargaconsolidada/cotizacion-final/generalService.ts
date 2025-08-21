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
    static async updateEstadoCotizacionFinal(idCotizacion: number, estado: string): Promise<GeneralResponse> {
        try {
            const response = await this.apiCall<GeneralResponse>(`${this.baseUrl}/update-estado`, {
                method: 'PUT',
                body: { idCotizacion, estado }
            })
            return response
        } catch (error) {
            console.error('Error al actualizar el estado de la cotización final:', error)
            throw error
        }
    }
    static async uploadPlantillaFinal( data: any): Promise<GeneralResponse> {
        try {
            const response = await this.apiCall<GeneralResponse>(`${this.baseUrl}/upload-plantilla-final`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al subir la plantilla final:', error)
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
    static async downloadPlantillaGeneral(id: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/download-plantilla-general/${id}  `, {
                method: 'GET',
            })
            return response
        } catch (error) {
            console.error('Error al descargar la plantilla general:', error)
            throw error
        }
    }

}




