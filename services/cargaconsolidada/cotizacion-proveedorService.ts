
import type {
    ProveedoresResponse,
    DocumentosChinaResponse,
    InspeccionChinaResponse,
    NotasChinaResponse,
    CotizacionProveedorFilters,
    CotizacionProveedorResponse,
    Proveedor,
    SaveDocumentosChina
} from '../../types/cargaconsolidada/proveedores'
import { BaseService } from '../base/BaseService'

export class CotizacionProveedorService extends BaseService {
    private static readonly baseUrl = 'api/carga-consolidada/cotizaciones-proveedores'

    /**
     * Obtiene las cotizaciones de proveedores con filtros y paginación
     */
    static async getCotizacionesProveedores(
        id: number,
        filters: CotizacionProveedorFilters,
        search: string,
        itemsPerPage: number,
        currentPage: number
    ): Promise<ProveedoresResponse> {
        try {
            const response = await this.apiCall<ProveedoresResponse>(
                `${this.baseUrl}/contenedor/${id}`,
                {
                    method: 'GET',
                    params: {
                        ...filters,
                        search,
                        itemsPerPage,
                        currentPage
                    }
                }
            )
            return response
        } catch (error) {
            console.error('Error al obtener cotizaciones de proveedores:', error)
            throw new Error('No se pudieron obtener las cotizaciones de proveedores')
        }
    }

    /**
     * Obtiene los documentos de China para un proveedor específico
     */
    static async getDocumentosChina(id: number): Promise<DocumentosChinaResponse> {
        try {
            const response = await this.apiCall<DocumentosChinaResponse>(
                `${this.baseUrl}/proveedor/documentos/${id}`,
                { method: 'GET' }
            )
            return response
        } catch (error) {
            console.error('Error al obtener los documentos de China:', error)
            throw new Error('No se pudieron obtener los documentos de China')
        }
    }

    /**
     * Obtiene la información de inspección de China para un proveedor
     */
    static async getInspeccionChina(id: number): Promise<InspeccionChinaResponse> {
        try {
            const response = await this.apiCall<InspeccionChinaResponse>(
                `${this.baseUrl}/proveedor/inspeccion/${id}`,
                { method: 'GET' }
            )
            return response
        } catch (error) {
            console.error('Error al obtener la inspección de China:', error)
            throw new Error('No se pudo obtener la información de inspección de China')
        }
    }

    /**
     * Obtiene las notas de China para un proveedor
     */
    static async getNotasChina(id: number): Promise<NotasChinaResponse> {
        try {
            const response = await this.apiCall<NotasChinaResponse>(
                `${this.baseUrl}/proveedor/notas/${id}`,
                { method: 'GET' }
            )
            return response
        } catch (error) {
            console.error('Error al obtener las notas de China:', error)
            throw new Error('No se pudieron obtener las notas de China')
        }
    }
    static async getProveedor(id: number): Promise<CotizacionProveedorResponse> {
        try {
            const response = await this.apiCall<CotizacionProveedorResponse>(
                `${this.baseUrl}/proveedor/${id}`,
                { method: 'GET' }
            )
            return response
        } catch (error) {
            console.error('Error al obtener la cotización de proveedor:', error)
            throw new Error('No se pudo obtener la cotización de proveedor')
        }
    }
    static async saveDocumentosChina(data: SaveDocumentosChina): Promise<CotizacionProveedorResponse> {
        try {
            const formData = new FormData()
            formData.append('idProveedor', data.id_proveedor.toString())
            formData.append('idCotizacion', data.id_cotizacion.toString())
            data.files.forEach((file:any, index:number) => {
                formData.append(`files[${index}]`, file)
            })
            const response = await this.apiCall<CotizacionProveedorResponse>(
                `${this.baseUrl}/proveedor/documento`,
                { method: 'POST', body: formData }
            )
            return response
        } catch (error) {
            console.error('Error al enviar los documentos de China:', error)
            throw new Error('No se pudieron enviar los documentos de China')
        }
    }
    static async deleteDocumentosChina(id: number): Promise<CotizacionProveedorResponse> {
        try {
            const response = await this.apiCall<CotizacionProveedorResponse>(
                `${this.baseUrl}/proveedor/documento/${id}`,
                { method: 'DELETE' }
            )
            return response
        } catch (error) {
            console.error('Error al eliminar el documento de China:', error)
            throw new Error('No se pudo eliminar el documento de China')
        }
    }
    static async deleteInspeccionChina(id: number): Promise<CotizacionProveedorResponse> {
        try {
            const response = await this.apiCall<CotizacionProveedorResponse>(
                `${this.baseUrl}/proveedor/inspeccion/${id}`,
                { method: 'DELETE' }
            )
            return response
        } catch (error) {
            console.error('Error al eliminar la inspección de China:', error)
            throw new Error('No se pudo eliminar la inspección de China')
        }
    }
    static async saveInspeccionChina(data: any): Promise<CotizacionProveedorResponse> {
        try {
            const formData = new FormData()
            formData.append('idProveedor', data.id_proveedor.toString())
            formData.append('idCotizacion', data.id_cotizacion.toString())
            data.files.forEach((file:any, index:number) => {
                formData.append(`files[${index}]`, file)
            })
            const response = await this.apiCall<CotizacionProveedorResponse>(
                `${this.baseUrl}/proveedor/inspeccion`,
                { method: 'POST', body: formData }
            )
            return response
        } catch (error) {
            console.error('Error al enviar la inspección de China:', error)
            throw new Error('No se pudo enviar la inspección de China')
        }
    }
    static async saveNotasChina(data: any): Promise<CotizacionProveedorResponse> {
        try {
            const response = await this.apiCall<CotizacionProveedorResponse>(
                `${this.baseUrl}/proveedor/notas`,
                { method: 'POST', body: data }
            )
            return response
        } catch (error) {
            console.error('Error al enviar las notas de China:', error)
            throw new Error('No se pudo enviar las notas de China')
        }
    }
    static async deleteCotizacion(id: number): Promise<{success: boolean}> {
        try {
            const response = await this.apiCall<{success: boolean}>(
                `${this.baseUrl}/proveedor/cotizacion/${id}`,
                { method: 'DELETE' }
            )
            return response
        } catch (error) {
            console.error('Error al eliminar la cotización:', error)
            throw new Error('No se pudo eliminar la cotización')
        }
    }
    static async updateProveedor(data: any): Promise<any> {
        try {
            const response = await this.apiCall<any>(
                `${this.baseUrl}/proveedor`,
                { method: 'POST', body: data }
            )
            return response
        } catch (error) {
            console.error('Error al actualizar el proveedor:', error)
            throw new Error('No se pudo actualizar el proveedor')
        }
    }
    static async updateProveedorEstado(data: any): Promise<any> {
        try {
            const response = await this.apiCall<any>(
                `${this.baseUrl}/proveedor/estado`,
                { method: 'POST', body: data }
            )
            return response
        } catch (error) {
            console.error('Error al actualizar el proveedor:', error)
            throw new Error('No se pudo actualizar el proveedor')
        }
    }
}