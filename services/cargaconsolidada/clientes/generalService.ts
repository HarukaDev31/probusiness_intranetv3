import { BaseService } from "~/services/base/BaseService"
import type { HeaderResponse } from "~/types/data-table"

export interface ProveedorItem {
    id: number
    code_supplier: string
    items: {
        id: number
        initial_name: string
        tipo_producto: string
    }[]
}

export interface GetProveedoresItemsResponse {
    success: boolean
    data: ProveedorItem[]
    message?: string
}

export interface SolicitarDocumentosRequest {
    proveedores: {
        id: number
        items: {
            initial_name: string
            tipo_producto: string
        }[]
    }[]
}

export interface SolicitarDocumentosResponse {
    success: boolean
    data?: any
    message?: string
}

export interface GetProveedoresPendingDocumentsResponse {
    success: boolean
    data: {
        packing_list: string
        factura_comercial: string
        excel_confirmacion: string
        id: number
        code_supplier: string
    }[]
    message?: string
}

export interface EnviarRecordatoriosRequest {
    id_cotizacion: number
    proveedores: { id: number; documentos: string[] }[]
}

export interface EnviarRecordatoriosResponse {
    success: boolean
    message?: string
}

export class GeneralService extends BaseService {
    static baseUrl = 'api/carga-consolidada/contenedor/clientes/general'
    static async getClientes(idConsolidado: number, filters: any, search: string, itemsPerPage: number, currentPage: number ) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/${idConsolidado}`, {
                method: 'GET',
                params: {
                    search,
                    itemsPerPage,
                    currentPage
                }
            })
            return response
        } catch (error) {
            console.error('Error al obtener el cliente:', error)
            throw error
        }
    }
    static async updateEstadoCliente(data: any) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/estado-cliente`, {
                method: 'POST',
                body: data
            })
            return response
        }
        catch (error) {
            console.error('Error al actualizar el estado del cliente:', error)
            throw error
        }
    }
    static async getHeaders(id: number) {
        try {
            const response = await this.apiCall<HeaderResponse>(`${this.baseUrl}/${id}/headers`)
            return response
        } catch (error) {
            console.error('Error al obtener los headers:', error)
            throw error
        }
    }
    static async updateStatusClienteDoc(data: any) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/status-cliente-doc`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al actualizar el estado de la documentación del cliente:', error)
            throw error
        }
    }
    static async exportClientes(id: number): Promise<Blob> {
        try {
            // Construir la URL base con los parámetros normales
            let url = `${this.baseUrl}/${id}/export`
            const response = await this.apiCall<Blob>(url, {
                method: 'GET',
                responseType: 'blob', // Asegura que la respuesta sea tratada como un Blob
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            })
            return response
        } catch (error) {
            console.error('Error al exportar los clientes:', error)
            throw new Error(error?.data?.message || 'Error al exportar clientes')
        }
    }

    /**
     * Obtener proveedores y sus items para categorización
     */
    static async getProveedoresItems(idCotizacion: number): Promise<GetProveedoresItemsResponse> {
        try {
            const response = await this.apiCall<GetProveedoresItemsResponse>(`${this.baseUrl}/${idCotizacion}/proveedores-items`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener proveedores e items:', error)
            throw error
        }
    }

    /**
     * Solicitar documentos/categorización con selección de tipo de producto
     */
    static async solicitarDocumentos(idCotizacion: number, data: SolicitarDocumentosRequest): Promise<SolicitarDocumentosResponse> {
        try {
            const response = await this.apiCall<SolicitarDocumentosResponse>(`${this.baseUrl}/solicitar-documentos`, {
                method: 'POST',
                body: {
                    id_cotizacion: idCotizacion,
                    proveedores: data.proveedores
                }
            })
            return response
        } catch (error) {
            console.error('Error al solicitar documentos:', error)
            throw error
        }
    }
    //proveedores-pending-documents
    static async getProveedoresPendingDocuments(idCotizacion: number): Promise<GetProveedoresPendingDocumentsResponse> {
        try {
            const response = await this.apiCall<GetProveedoresPendingDocumentsResponse>(`${this.baseUrl}/${idCotizacion}/proveedores-pending-documents`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener proveedores pendientes de documentos:', error)
            throw error
        }
    }   

    /**
     * Enviar recordatorios de documentos por proveedor
     * Body: { id_cotizacion, proveedores: [{ id, documentos: [] }] }
     */
    static async enviarRecordatorios(data: EnviarRecordatoriosRequest): Promise<EnviarRecordatoriosResponse> {
        try {
            const response = await this.apiCall<EnviarRecordatoriosResponse>(`${this.baseUrl}/recordatorios-documentos`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al enviar recordatorios de documentos:', error)
            throw error
        }
    }
}
