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

    /** Actualiza una sola tarifa por id (monto y tipo PLAIN|STANDARD). */
    static async updateTarifa(
        id: number,
        body: { value: number; type: 'PLAIN' | 'STANDARD' }
    ): Promise<{
        success: boolean
        message?: string
        data?: {
            id: number
            tarifa: number
            type: string
            created_at?: string | null
            updated_at?: string | null
        }
    }> {
        try {
            const response = await this.apiCall<{
                success: boolean
                message?: string
                data?: {
                    id: number
                    tarifa: number
                    type: string
                    created_at?: string | null
                    updated_at?: string | null
                }
            }>(`${this.baseUrl}/tarifas/${id}`, {
                method: 'PUT',
                body
            })
            return response
        } catch (error) {
            console.error('Error al actualizar tarifa:', error)
            throw error
        }
    }
    static async saveCotizacion(saveCotizacionRequest: saveCotizacionRequest): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}`, {
                method: 'POST',
                body: saveCotizacionRequest
            })
            return response
        } catch (error: any) {
            console.error('Error al guardar cotización:', error)
            // Re-lanzar para que el caller pueda usar error.data?.message (ej. límite IMO)
            throw error
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

    /**
     * Vincula/crea la cotización en carga consolidada desde una fila de calculadora.
     * No requiere que el estado del cálculo sea cambiado manualmente a "COTIZADO".
     */
    static async vincularCotizacionDesdeCalculadora(id: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/vincular-cotizacion/${id}`, {
                method: 'POST'
            })
            return response
        } catch (error) {
            console.error('Error al vincular la cotización desde calculadora:', error)
            throw new Error('No se pudo vincular la cotización desde la calculadora')
        }
    }

    /** Documentos asociados a cotización calculadora */
    static async getDocumentosCotizacion(id: number): Promise<{ success: boolean; data: any[]; cotizacion: any }> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${id}/documentos`)
            return response
        } catch (error) {
            console.error('Error al obtener documentos de la cotización:', error)
            throw error
        }
    }

    static async uploadDocumentoCotizacion(id: number, file: File): Promise<{ success: boolean; data?: any; message?: string }> {
        try {
            const formData = new FormData()
            formData.append('file', file)
            const response = await this.apiCall<any>(`${this.baseUrl}/${id}/documentos`, {
                method: 'POST',
                body: formData
            })
            return response
        } catch (error) {
            console.error('Error al subir documento:', error)
            throw error
        }
    }

    static async deleteDocumentoCotizacion(idDocumento: number): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/documentos/${idDocumento}`, {
                method: 'DELETE'
            })
            return response
        } catch (error) {
            console.error('Error al eliminar documento:', error)
            throw error
        }
    }

    /** Exportar listado de cotizaciones a XLSX (backend devuelve el archivo con estilos) */
    static async exportListCotizaciones(params: Record<string, string | number | undefined>): Promise<Blob> {
        try {
            const queryString = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    queryString.append(key, String(value))
                }
            })
            const response = await this.apiCall<Blob>(`${this.baseUrl}/export-list?${queryString.toString()}`, {
                method: 'GET',
                responseType: 'blob',
                headers: {
                    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            })
            return response
        } catch (error) {
            console.error('Error al exportar cotizaciones:', error)
            throw error
        }
    }
}