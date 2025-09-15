import type { HeaderResponse } from "~/types/data-table"
import { BaseService } from "../base/BaseService"
import type { CotizacionFilters , Cotizacion, CotizacionResponse } from "~/types/cargaconsolidada/cotizaciones"
export class CotizacionService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor'
    static async getCotizaciones(id: number, filters: CotizacionFilters) {
        try {
            const response = await this.apiCall<CotizacionResponse>(`${this.baseUrl}/cotizaciones/${id}`, {
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

            throw new Error(error)
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
    static async exportCotizaciones(): Promise<Blob> {
        try {
            // Construir la URL base con los parámetros normales
            let url = `${this.baseUrl}/cotizaciones/exportar`
            // Realizar la llamada a la API para obtener el archivo
            const response = await this.apiCall<Blob>(url, {
                method: 'GET',
                responseType: 'blob',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                }
            })
            return response
        } catch (error) {
            console.error('Error al exportar las cotizaciones:', error)
            throw new Error(error?.data?.message || 'Error al exportar clientes')
        }
    }
}