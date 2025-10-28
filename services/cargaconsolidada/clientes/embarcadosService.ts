import { BaseService } from "~/services/base/BaseService"
import type { HeaderResponse } from "~/types/data-table"

export class EmbarcadosService extends BaseService {
    static baseUrl = 'api/carga-consolidada/contenedor/clientes/embarcados'

    static async getHeaders(id: number): Promise<HeaderResponse[]> {
        try {
            const response = await this.apiCall<HeaderResponse[]>(`${this.baseUrl}/${id}/headers`)
            return response
        } catch (error) {
            console.error('Error al obtener los headers:', error)
            throw error
        }
    }

    static async getEmbarcados(id: number, filters: any, search: string, itemsPerPage: number, currentPage: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${id}`, {
                method: 'GET',
                params: {
                    search,
                    itemsPerPage,
                    currentPage
                }
            })
            return response
        } catch (error) {
            console.error('Error fetching embarcados:', error)
            throw error
        }
    }

    // Uploads and deletes for provider documents
    static async uploadFacturaComercial(idProveedor: number, data: any): Promise<any> {
        try {
            let body = data
            // If caller passed a File, wrap into FormData
            if (typeof File !== 'undefined' && data instanceof File) {
                const fd = new FormData()
                fd.append('file', data)
                body = fd
            }

            const response = await this.apiCall<any>(`${this.baseUrl}/${idProveedor}/factura-comercial`, {
                method: 'POST',
                body
            })
            return response
        } catch (error) {
            console.error('Error al subir la factura comercial:', error)
            throw error
        }
    }

    static async uploadPackingList(idProveedor: number, data: any): Promise<any> {
        try {
            let body = data
            if (typeof File !== 'undefined' && data instanceof File) {
                const fd = new FormData()
                fd.append('file', data)
                body = fd
            }

            const response = await this.apiCall<any>(`${this.baseUrl}/${idProveedor}/packing-list`, {
                method: 'POST',
                body
            })
            return response
        } catch (error) {
            console.error('Error en ConsolidadoService.uploadPackingList:', error)
            throw error
        }
    }

    static async uploadExcelConfirmacion(idProveedor: number, file: File): Promise<any> {
        try {
            const fd = new FormData()
            fd.append('file', file)
            const response = await this.apiCall<any>(`${this.baseUrl}/${idProveedor}/excel-confirmacion`, {
                method: 'POST',
                body: fd
            })
            return response
        } catch (error) {
            console.error('Error uploading excel confirmacion:', error)
            throw error
        }
    }

    static async deleteFacturaComercial(idProveedor: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${idProveedor}/factura-comercial`, { method: 'DELETE' })
            return response
        } catch (error) {
            console.error('Error deleting factura comercial:', error)
            throw error
        }
    }

    static async deletePackingList(idProveedor: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${idProveedor}/packing-list`, { method: 'DELETE' })
            return response
        } catch (error) {
            console.error('Error deleting packing list:', error)
            throw error
        }
    }

    static async deleteExcelConfirmacion(idProveedor: number): Promise<any> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${idProveedor}/excel-confirmacion`, { method: 'DELETE' })
            return response
        } catch (error) {
            console.error('Error deleting excel confirmacion:', error)
            throw error
        }
    }
}