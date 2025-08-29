import type { HeaderResponse } from "~/types/data-table"
import { BaseService } from "../base/BaseService"
export class CotizacionService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor'
    static async getCotizaciones(id: number, filters: any) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/cotizaciones/${id}`, {
                method: 'GET',
                params: filters
            })
            return response
        } catch (error) {
            console.error('Error al obtener las cotizaciones:', error)
            throw error
        }
    }
    static async refreshCotizacionFile(id: number) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/cotizaciones/${id}/refresh`, {
                method: 'POST'
            })
            return response
        } catch (error) {
            console.error('Error al actualizar la cotización:', error)
            throw error
        }
    }
    static async deleteCotizacion(id: number): Promise<{ success: boolean }> {
        try {
            const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/cotizaciones/${id}`, {
                method: 'DELETE'
            })
            return response
        } catch (error) {
            console.error('Error al eliminar la cotización:', error)
            throw new Error('No se pudo eliminar la cotización')
        }
    }
    static async deleteCotizacionFile(id: number): Promise<{ success: boolean }> {
        try {
            const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/cotizaciones/${id}/file`, {
                method: 'DELETE'
            })
            return response
        }
        catch (error) {
            console.error('Error al eliminar el archivo de la cotización:', error)
            throw new Error('No se pudo eliminar el archivo de la cotización')
        }
    }
    static async createProspecto(data: any) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/cotizaciones`, {
                method: 'POST',
                body: data
            })
            return response
        }
        catch (error) {
            console.error('Error al crear el prospecto:', error)
            throw new Error('No se pudo crear el prospecto')
        }
    }
    static async updateCotizacion(id: number, data: any) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/cotizaciones/${id}/file`, {
                method: 'POST',
                body: data
            })
            return response
        }
        catch (error) {
            console.error('Error al actualizar la cotización:', error)
            throw new Error('No se pudo actualizar la cotización')
        }
    }
    static async updateEstadoCotizacionCotizador(id: number, data: any) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/cotizaciones/${id}/estado-cotizador`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al actualizar el estado de la cotización:', error)
            throw new Error(error.data.message)
        }
    }
    static async getHeaders(id: number): Promise<HeaderResponse> {
        try {
            const response = await this.apiCall<HeaderResponse>(`${this.baseUrl}/cotizaciones/${id}/headers`, {
                method: 'GET'
            })
            return response
        }
        catch (error) {
            console.error('Error al obtener los headers:', error)
            throw new Error('No se pudo obtener los headers')
        }
    }
}