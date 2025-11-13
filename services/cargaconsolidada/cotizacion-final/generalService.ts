import type { GeneralResponse } from "../../../types/cargaconsolidada/cotizacion-final/general"
import type { HeaderResponse } from "~/types/data-table"
import { BaseService } from "~/services/base/BaseService"

export class GeneralService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor/cotizacion-final/general'

    static async getGeneral(id: number, params: any): Promise<GeneralResponse> {
        try {
            const queryParams = new URLSearchParams()
            if (params.page) queryParams.append('page', params.page.toString())
            if (params.per_page) queryParams.append('per_page', params.per_page.toString())
            if (params.search) queryParams.append('search', params.search)
            if (params.filters) {
                Object.entries(params.filters).forEach(([key, value]) => {
                    if (value) queryParams.append(key, value.toString())
                })
            }
            const response = await this.apiCall<GeneralResponse>(`${this.baseUrl}/${id}?${queryParams.toString()}`)
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
    static async uploadPlantillaFinal(data: any): Promise<GeneralResponse> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/upload-plantilla-final`, {
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
    static async uploadCotizacionFinalFile(data: any, idCotizacion: number): Promise<GeneralResponse> {
        try {
            const response = await this.apiCall<GeneralResponse>(`${this.baseUrl}/upload-cotizacion-final/${idCotizacion}`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al subir la cotización final:', error)
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
    static async downloadCotizacionFinalPDF(id: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/download-cotizacion-final-pdf/${id}`, {
                method: 'GET',
                responseType: 'blob'

            })
            return response
        } catch (error) {
            console.error('Error al descargar la cotización final:', error)
            throw error
        }
    }
    static async deleteCotizacionFinalFile(id: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/delete-cotizacion-final-file/${id}`, {
                method: 'DELETE',
            })
            return response
        } catch (error) {
            console.error('Error al eliminar la cotización final:', error)
            throw error
        }
    }
    static async getHeaders(id: number): Promise<HeaderResponse> {
        try {
            const response = await this.apiCall<HeaderResponse>(`${this.baseUrl}/${id}/headers`)
            return response
        } catch (error) {
            console.error('Error al obtener los headers:', error)
            throw error
        }
    }

}




