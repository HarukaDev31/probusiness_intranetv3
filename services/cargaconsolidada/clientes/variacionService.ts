import { BaseService } from "~/services/base/BaseService"
import type {
    VariacionCliente,
    VariacionClienteResponse,
    VariacionClienteUpdateRequest,
    ProveedorVariacion,
    ArchivoVariacion
} from '../../../types/cargaconsolidada/variacion'

export class VariacionService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor/clientes/variacion'

    /**
     * Obtiene la lista de clientes de un consolidado
     */
    static async getClientes(idConsolidado: number, filters: any = {}, search: string = '', itemsPerPage: number = 100, currentPage: number = 1) {
        const response = await this.apiCall<any>(`${this.baseUrl}/${idConsolidado}`, {
            method: 'GET',
            params: {
                search,
                itemsPerPage,
                currentPage
            }
        })
        return response
    }

    /**
     * Obtiene la documentación completa de un cliente específico
     */
    static async getClienteDocumentacion(idCotizacion: number): Promise<VariacionClienteResponse> {
        try {
            const response = await this.apiCall<VariacionClienteResponse>(`${this.baseUrl}/documentacion/${idCotizacion}`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener la documentación del cliente:', error)
            throw error
        }
    }

    /**
     * Actualiza la documentación de un cliente
     */
    static async updateClienteDocumentacion(
        idCliente: number,
        data: VariacionClienteUpdateRequest
    ): Promise<VariacionClienteResponse> {
        try {
            const response = await this.apiCall<VariacionClienteResponse>(`${this.baseUrl}/documentacion/${idCliente}`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al actualizar la documentación del cliente:', error)
            throw error
        }
    }

    /**
     * Actualiza la documentación de un proveedor específico
     */
    static async updateProveedorDocumentacion(
        idProveedor: number,
        data: any
    ): Promise<VariacionClienteResponse> {
        try {
            const response = await this.apiCall<VariacionClienteResponse>(`${this.baseUrl}/documentacion/proveedor/${idProveedor}`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al actualizar la documentación del proveedor:', error)
            throw error
        }
    }

    /**
     * Sube un archivo para un cliente específico
     */
    static async uploadArchivo(
        idCliente: number,
        tipoArchivo: string,
        archivo: File,
        idProveedor?: number,
        observaciones?: string
    ): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const formData = new FormData()
            formData.append('archivo', archivo)
            formData.append('tipo', tipoArchivo)

            if (idProveedor) {
                formData.append('id_proveedor', idProveedor.toString())
            }

            if (observaciones) {
                formData.append('observaciones', observaciones)
            }

            const response = await this.apiCall(`${this.baseUrl}/documentacion/${idCliente}/upload`, {
                method: 'POST',
                body: formData
            })

            return { success: true, message: 'Archivo subido correctamente' }
        } catch (error: any) {
            console.error('Error al subir archivo:', error)
            return {
                success: false,
                error: error.message || 'Error al subir el archivo'
            }
        }
    }

    /**
     * Elimina un archivo específico
     */
    static async deleteArchivo(
        idCliente: number,
        idArchivo: number
    ): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            await this.apiCall(`${this.baseUrl}/documentacion/${idCliente}/archivo/${idArchivo}`, {
                method: 'DELETE'
            })

            return { success: true, message: 'Archivo eliminado correctamente' }
        } catch (error: any) {
            console.error('Error al eliminar archivo:', error)
            return {
                success: false,
                error: error.message || 'Error al eliminar el archivo'
            }
        }
    }

    /**
     * Obtiene los archivos de un proveedor específico
     */
    static async getProveedorArchivos(
        idCliente: number,
        idProveedor: number
    ): Promise<{
        documentacion: ArchivoVariacion[],
        inspeccion: ArchivoVariacion[]
    }> {
        try {
            const response = await this.apiCall<{
                documentacion: ArchivoVariacion[],
                inspeccion: ArchivoVariacion[]
            }>(`${this.baseUrl}/documentacion/${idCliente}/proveedor/${idProveedor}/archivos`, {
                method: 'GET'
            })

            return {
                documentacion: response.documentacion || [],
                inspeccion: response.inspeccion || []
            }
        } catch (error) {
            console.error('Error al obtener archivos del proveedor:', error)
            throw error
        }
    }
    static async updateVolSelected(data: any) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/vol-selected`, {
                method: 'POST',
                body: data
            })
            return response
        } catch (error) {
            console.error('Error al actualizar el volumen seleccionado:', error)
            throw error
        }

    }
    static async deleteFacturaComercial(idProveedor: number) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/documentacion/proveedor/${idProveedor}/factura-comercial`, {
                method: 'DELETE'
            })
            return response
        } catch (error) {
            console.error('Error al eliminar la factura comercial:', error)
            throw error
        }
    }
    static async deletePackingList(idProveedor: number) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/documentacion/proveedor/${idProveedor}/packing-list`, {
                method: 'DELETE'
            })
            return response
        } catch (error) {
            console.error('Error al eliminar el packing list:', error)
            throw error
        }
    }
    static async deleteExcelConfirmacion(idProveedor: number) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/documentacion/proveedor/${idProveedor}/excel-confirmacion`, {
                method: 'DELETE'
            })
            return response
        } catch (error) {
            console.error('Error al eliminar la excel de confirmación:', error)
            throw error
        }
    }
    static async createProveedorDocumentacion(data: FormData) {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/documentacion/proveedor/${data.get('id_proveedor')}/create`, {
                method: 'POST',
                body: data
            })
            return response
        }
        catch (error) {
            console.error('Error al crear documento:', error)
            throw error
        }
    }
    
    static async exportClientes(id: number): Promise<Blob> {
        try {
            const url = `${this.baseUrl}/${id}/export`
            const response = await this.apiCall<Blob>(url, {
                method: 'GET',
                responseType: 'blob',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            })
            return response
        } catch (error) {
            console.error('Error al exportar los clientes de variación:', error)
            throw new Error(error?.data?.message || 'Error al exportar clientes de variación')
        }
    }
}
