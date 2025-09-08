import type { GeneralResponse } from "../../../types/cargaconsolidada/factura-guia/general"
import type { HeaderResponse } from "~/types/data-table"
import { BaseService } from "~/services/base/BaseService"

export class GeneralService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor/factura-guia/general'

    static async getGeneral(id: number, params: any): Promise<GeneralResponse> {
        try {
            const queryParams = new URLSearchParams()
            if (params.page) queryParams.append('page', params.page.toString())
            if (params.per_page) queryParams.append('per_page', params.per_page.toString())
            if (params.search) queryParams.append('search', params.search)
            if (params.filters) {
                queryParams.append('filters', JSON.stringify(params.filters))
            }
            const response = await this.apiCall<GeneralResponse>(`${this.baseUrl}/${id}?${queryParams.toString()}`)
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