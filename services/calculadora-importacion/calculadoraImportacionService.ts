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
    static async getCotizaciones(): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}`)
            return response
        } catch (error) {
            console.error('Error al obtener cotizaciones:', error)
            throw new Error('No se pudieron obtener las cotizaciones')
        }
    }

}