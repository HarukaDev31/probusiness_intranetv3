
import type { 
  DocumentacionFolder, 
  DocumentacionResponse, 
  DocumentacionFilters,
  DocumentacionUpdateRequest,
  DocumentacionUploadRequest
} from '~/types/cargaconsolidada/documentacion'
import { BaseService } from "~/services/base/BaseService"

export class DocumentacionService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/contenedor/documentacion'
    
    /**
     * Obtiene todos los folders de documentación
     */
    static async getFolders(id: string, filters?: DocumentacionFilters): Promise<DocumentacionResponse> {
        try {
            const params = new URLSearchParams()
            
            if (filters?.categoria && filters.categoria !== 'TODAS') {
                params.append('categoria', filters.categoria)
            }
            
            if (filters?.only_doc_profile) {
                params.append('only_doc_profile', filters.only_doc_profile)
            }

            const url = `${this.baseUrl}/${id}`
            
            const response = await this.apiCall<DocumentacionResponse>(url, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener folders de documentación:', error)
            throw error
        }
    }

    /**
     * Obtiene un folder específico por ID
     */
    static async getFolderById(folderId: string): Promise<DocumentacionFolder> {
        try {
            const response = await this.apiCall<DocumentacionFolder>(`${this.baseUrl}/folders/${folderId}`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener folder por ID:', error)
            throw error
        }
    }

    /**
     * Obtiene folders por categoría
     */
    static async getFoldersByCategoria(categoria: 'ENVIO' | 'COMERCIAL' | 'LEGAL'): Promise<DocumentacionResponse> {
        try {
            const response = await this.apiCall<DocumentacionResponse>(`${this.baseUrl}/folders/categoria/${categoria}`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener folders por categoría:', error)
            throw error
        }
    }

    /**
     * Crea un nuevo folder de documentación
     */
    static async createFolder(data: Omit<DocumentacionUpdateRequest, 'id_file' | 'file_url'>): Promise<DocumentacionResponse> {
        try {
            const response = await this.apiCall<DocumentacionResponse>(`${this.baseUrl}/folders`, {
                method: 'POST',
                data
            })
            return response
        } catch (error) {
            console.error('Error al crear folder de documentación:', error)
            throw error
        }
    }

    /**
     * Actualiza un folder existente
     */
    static async updateFolder(folderId: string, data: DocumentacionUpdateRequest): Promise<DocumentacionResponse> {
        try {
            const response = await this.apiCall<DocumentacionResponse>(`${this.baseUrl}/folders/${folderId}`, {
                method: 'PUT',
                data
            })
            return response
        } catch (error) {
            console.error('Error al actualizar folder de documentación:', error)
            throw error
        }
    }

    /**
     * Elimina un folder de documentación
     */
    static async deleteFolder(folderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            await this.apiCall<any>(`${this.baseUrl}/folders/${folderId}`, {
                method: 'DELETE'
            })

            return { success: true, message: 'Folder eliminado correctamente' }
        } catch (error: any) {
            console.error('Error al eliminar folder:', error)
            return { 
                success: false, 
                error: error.message || 'Error al eliminar el folder' 
            }
        }
    }

    /**
     * Sube un archivo a un folder específico
     */
    static async uploadFile(data: DocumentacionUploadRequest): Promise<{ success: boolean; message?: string; error?: string; file_url?: string }> {
        try {
            const formData = new FormData()
            formData.append('file', data.file)
            formData.append('folder_id', data.folder_id)
            
            if (data.observaciones) {
                formData.append('observaciones', data.observaciones)
            }
            
            if (data.id_proveedor) {
                formData.append('id_proveedor', data.id_proveedor.toString())
            }

            const response = await this.apiCall<any>(`${this.baseUrl}/upload`, {
                method: 'POST',
                body: formData
            })

            return { 
                success: true, 
                message: 'Archivo subido correctamente',
                file_url: response.file_url || undefined
            }
        } catch (error: any) {
            console.error('Error al subir archivo:', error)
            return { 
                success: false, 
                error: error.message || 'Error al subir el archivo' 
            }
        }
    }

    /**
     * Obtiene archivos de un folder específico
     */
    static async getFolderFiles(folderId: string): Promise<{ success: boolean; files: any[]; error?: string }> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/folders/${folderId}/files`, {
                method: 'GET'
            })

            return {
                success: true,
                files: response.files || []
            }
        } catch (error: any) {
            console.error('Error al obtener archivos del folder:', error)
            return { 
                success: false, 
                error: error.message || 'Error al obtener archivos del folder',
                files: []
            }
        }
    }

    /**
     * Elimina un archivo específico
     */
    static async deleteFile(fileId: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            await this.apiCall(`${this.baseUrl}/files/${fileId}`, {
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
     * Obtiene folders por contenedor
     */
    static async getFoldersByContenedor(contenedorId: string): Promise<DocumentacionResponse> {
        try {
            const response = await this.apiCall<DocumentacionResponse>(`${this.baseUrl}/folders/contenedor/${contenedorId}`, {
                method: 'GET'
            })
            return response
        } catch (error) {
            console.error('Error al obtener folders por contenedor:', error)
            throw error
        }
    }

    /**
     * Obtiene estadísticas de documentación
     */
    static async getDocumentacionStats(): Promise<{ 
        total_folders: number
        folders_por_categoria: { [key: string]: number }
        folders_con_archivos: number
    }> {
        try {
            const response = await this.apiCall<any>(`${this.baseUrl}/stats`, {
                method: 'GET'
            })

            return {
                total_folders: response.total_folders || 0,
                folders_por_categoria: response.folders_por_categoria || {},
                folders_con_archivos: response.folders_con_archivos || 0
            }
        } catch (error) {
            console.error('Error al obtener estadísticas de documentación:', error)
            throw error
        }
    }
}
