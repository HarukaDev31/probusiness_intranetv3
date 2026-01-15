import { BaseService } from "~/services/base/BaseService"
import type { saveCotizacionRequest } from "~/types/calculadora-importacion"
export class CalculadoraImportacionService extends BaseService {
    private static baseUrl = 'api/calculadora-importacion'
    //get clientes by whatsapp
    static async getClientesByWhatsapp(whatsapp: string): Promise<any> {
        //use post
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/clientes`, {
                method: 'POST',
                body: { whatsapp }
            })
            return response
        } catch (error) {
            console.error('Error al obtener clientes por whatsapp:', error)
            throw new Error('No se pudieron obtener los clientes')
        }
    }
    //get clientes by dni
    static async getTarifas(): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/tarifas`)
            return response
        } catch (error) {
            console.error('Error al obtener tarifas:', error)
            throw new Error('No se pudieron obtener las tarifas')
        }
    }
    static async saveCotizacion(saveCotizacionRequest: saveCotizacionRequest): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}`, {
                method: 'POST',
                body: saveCotizacionRequest
            })
            return response
        } catch (error) {
            console.error('Error al guardar cotización:', error)
            throw new Error('No se pudo guardar la cotización')
        }   
    }
    static async getCotizaciones(params: any): Promise<any> {
        try {
            const queryString = new URLSearchParams(params).toString()
            const response = await this.apiCall<any>(`${this.baseUrl}?${queryString}`)
            return response
        } catch (error) {
            console.error('Error al obtener cotizaciones:', error)
            throw new Error('No se pudieron obtener las cotizaciones')
        }
    }
    // get cotizacion by id (show)
    static async getCotizacionById(id: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${id}`)
            return response
        } catch (error) {
            console.error('Error al obtener la cotización por id:', error)
            throw new Error('No se pudo obtener la cotización')
        }
    }
    static async deleteCotizacion(id: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${id}`, {
                method: 'DELETE',
                body: { id }
            })
            return response
        } catch (error) {
            console.error('Error al eliminar la cotización:', error)
            throw new Error('No se pudo eliminar la cotización')
        }
    }
    static async duplicateCotizacion(id: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/duplicate/${id}`, {
                method: 'POST',
                body: { id }
            })
            return response
        } catch (error) {
            console.error('Error al duplicar la cotización:', error)
            throw new Error('No se pudo duplicar la cotización')
        }
    }
    static async changeEstadoCotizacion(id: number, estado: string): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/change-estado/${id}`, {
                method: 'POST',
                body: { id, estado }
            })
            return response
        }
        catch (error) {
            console.error('Error al cambiar el estado de la cotización:', error)
            throw new Error('No se pudo cambiar el estado de la cotización')
        }
    }
}