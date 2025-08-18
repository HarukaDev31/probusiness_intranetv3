
import type { 
  VariacionCliente, 
  VariacionClienteResponse, 
  VariacionClienteUpdateRequest,
  ProveedorVariacion,
  ArchivoVariacion
} from '../../../types/cargaconsolidada/variacion'

export class VariacionService {
    private static baseUrl = 'api/carga-consolidada/contenedor/clientes/variacion'
    
    /**
     * Obtiene la lista de clientes de un consolidado
     */
    static async getClientes(idConsolidado: number) {
        const response = await this.apiCall<any>(`${this.baseUrl}/${idConsolidado}`)
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
                method: 'PUT',
                data
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
        idCliente: number,
        idProveedor: number,
        data: Partial<ProveedorVariacion>
    ): Promise<VariacionClienteResponse> {
        try {
            const response = await this.apiCall<VariacionClienteResponse>(`${this.baseUrl}/documentacion/${idCliente}/proveedor/${idProveedor}`, {
                method: 'PUT',
                data
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
}
