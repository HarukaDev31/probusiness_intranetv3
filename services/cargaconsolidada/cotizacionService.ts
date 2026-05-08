import type { HeaderResponse } from "~/types/data-table"
import { BaseService } from "../base/BaseService"
import type { CotizacionFilters , Cotizacion, CotizacionResponse } from "~/types/cargaconsolidada/cotizaciones"
export class CotizacionService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor'
    static async getDeleteReasons(): Promise<{ success: boolean; data: Array<{ id: number; name: string }> }> {
        return await this.apiCall<{ success: boolean; data: Array<{ id: number; name: string }> }>(`${this.baseUrl}/cotizaciones/delete-reasons`, {
            method: 'GET'
        })
    }
    static async createDeleteReason(name: string): Promise<{ success: boolean; data: { id: number; name: string } }> {
        return await this.apiCall<{ success: boolean; data: { id: number; name: string } }>(`${this.baseUrl}/cotizaciones/delete-reasons`, {
            method: 'POST',
            body: { name }
        })
    }
    static async updateDeleteReason(id: number, name: string): Promise<{ success: boolean; data: { id: number; name: string } }> {
        return await this.apiCall<{ success: boolean; data: { id: number; name: string } }>(`${this.baseUrl}/cotizaciones/delete-reasons/${id}`, {
            method: 'PUT',
            body: { name }
        })
    }
    static async deleteDeleteReason(id: number): Promise<{ success: boolean }> {
        return await this.apiCall<{ success: boolean }>(`${this.baseUrl}/cotizaciones/delete-reasons/${id}`, {
            method: 'DELETE'
        })
    }
            // Obtener cargas disponibles para dropdown
        static async getCargasDisponiblesDropdown(): Promise<any> {
            try {
                const response = await this.apiCall<any>(`${this.baseUrl}/cargas-disponibles-dropdown`, {
                    method: 'GET'
                })
                return response
            } catch (error) {
                console.error('Error en getCargasDisponiblesDropdown:', error)
                throw error
            }
        }
    
        // Obtener vendedores para dropdown
        static async getVendedoresDropdown(): Promise<any> {
            try {
                const response = await this.apiCall<any>(`${this.baseUrl}/vendedores-dropdown`, {
                    method: 'GET'
                })
                return response
            } catch (error) {
                console.error('Error en getVendedoresDropdown:', error)
                throw error
            }
        }
    static async getCotizaciones(id: number, filters: CotizacionFilters, signal?: AbortSignal) {
        try {
            const response = await this.apiCall<CotizacionResponse>(`${this.baseUrl}/cotizaciones/${id}`, {
                method: 'GET',
                params: filters,
                ...(signal ? { signal } : {})
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
    static async deleteCotizacion(id: number, deletedReasonId?: number | null): Promise<{ success: boolean }> {
        try {
            const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/cotizaciones/${id}`, {
                method: 'DELETE',
                body: { deleted_reason_id: deletedReasonId ?? null }
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
    static async exportCotizaciones(id: number): Promise<Blob> {
        try {
            // Construir la URL base con los parámetros normales
            let url = `${this.baseUrl}/cotizaciones/${id}/exportar`
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
    static async sendRecordatorioFirmaContrato(cotizacion_id: number): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const response = await this.apiCall<{ success: boolean; message?: string; error?: string }>(`${this.baseUrl}/cotizaciones/${cotizacion_id}/send-recordatorio-firma`, {
                method: 'POST'
            })
            return response
        } catch (error) {
            console.error('Error al enviar recordatorio de firma:', error)
            throw new Error('No se pudo enviar el recordatorio de firma')
        }
    }
}