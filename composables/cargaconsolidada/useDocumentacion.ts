import { ref, computed } from 'vue'
import { DocumentacionService } from '../services/cargaconsolidada/documentacionService'
import type { 
  DocumentacionFolder, 
  DocumentacionFilters,
  DocumentacionUpdateRequest,
  DocumentacionUploadRequest
} from '../types/cargaconsolidada/documentacion'

export const useDocumentacion = () => {
  // Estado principal
  const folders = ref<DocumentacionFolder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Estado de filtros
  const filters = ref<DocumentacionFilters>({
    categoria: 'TODAS'
  })
  
  // Estado de archivos por folder
  const filesByFolder = ref<{ [folderId: string]: any[] }>({})
  const loadingFiles = ref<{ [folderId: string]: boolean }>({})
  
  // Computed properties
  const hasData = computed(() => folders.value.length > 0)
  const foldersByCategoria = computed(() => {
    if (filters.value.categoria === 'TODAS') {
      return folders.value
    }
    return folders.value.filter(folder => folder.categoria === filters.value.categoria)
  })
  
  const foldersEnvio = computed(() => folders.value.filter(f => f.categoria === 'ENVIO'))
  const foldersComercial = computed(() => folders.value.filter(f => f.categoria === 'COMERCIAL'))
  const foldersLegal = computed(() => folders.value.filter(f => f.categoria === 'LEGAL'))

  /**
   * Obtiene todos los folders de documentación
   */
  const getFolders = async (id: string, customFilters?: DocumentacionFilters) => {
    loading.value = true
    error.value = null

    try {
      const response = await DocumentacionService.getFolders(id, customFilters || filters.value)
      
      if (response.success) {
        folders.value = response.data
        // Cargar archivos para cada folder
       
      } else {
        error.value = 'Error al obtener los folders de documentación'
      }
    } catch (err: any) {
      error.value = err.message || 'Error al obtener los folders de documentación'
      console.error('Error en getFolders:', err)
    } finally {
      loading.value = false
    }
  }


 
  /**
   * Sube un archivo a un folder específico
   */
  const uploadFile = async (data: DocumentacionUploadRequest) => {
    try {
      const result = await DocumentacionService.uploadFile(data)
      
      if (result.success) {
        // Recargar archivos del folder
        await loadFolderFiles(data.folder_id)
        return result
      } else {
        return result
      }
    } catch (err: any) {
      console.error('Error al subir archivo:', err)
      return { success: false, error: err.message || 'Error al subir el archivo' }
    }
  }

  /**
   * Elimina un archivo específico
   */
  const deleteFile = async (fileId: string, folderId: string) => {
    try {
      const result = await DocumentacionService.deleteFile(fileId)
      
      if (result.success) {
        // Recargar archivos del folder
        await loadFolderFiles(folderId)
      }
      
      return result
    } catch (err: any) {
      console.error('Error al eliminar archivo:', err)
      return { success: false, error: err.message || 'Error al eliminar el archivo' }
    }
  }

  /**
   * Carga archivos de un folder específico
   */
  const loadFolderFiles = async (folderId: string) => {
    if (loadingFiles.value[folderId]) return

    loadingFiles.value[folderId] = true

    try {
      const response = await DocumentacionService.getFolderFiles(folderId)
      
      if (response.success) {
        filesByFolder.value[folderId] = response.files
      } else {
        console.error(`Error al cargar archivos del folder ${folderId}:`, response.error)
        filesByFolder.value[folderId] = []
      }
    } catch (err: any) {
      console.error(`Error al cargar archivos del folder ${folderId}:`, err)
      filesByFolder.value[folderId] = []
    } finally {
      loadingFiles.value[folderId] = false
    }
  }

  /**
   * Actualiza un folder existente
   */
 
  /**
   * Crea un nuevo folder
   */

  /**
   * Elimina un folder
   */

  /**
   * Cambia los filtros y recarga los datos
   */
  const changeFilters = async (id: string, newFilters: DocumentacionFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    await getFolders(id)
  }

  /**
   * Obtiene archivos de un folder específico (getter)
   */
  const getFolderFiles = (folderId: string) => {
    return filesByFolder.value[folderId] || []
  }

  /**
   * Verifica si un folder está cargando archivos
   */
  const isFolderLoading = (folderId: string) => {
    return loadingFiles.value[folderId] || false
  }

  /**
   * Limpia el estado
   */
  const clearState = () => {
    folders.value = []
    loading.value = false
    error.value = null
    filesByFolder.value = {}
    loadingFiles.value = {}
    filters.value = { categoria: 'TODAS' }
  }

  return {
    // Estado
    folders,
    loading,
    error,
    filters,
    filesByFolder,
    loadingFiles,
    
    // Computed
    hasData,
    foldersByCategoria,
    foldersEnvio,
    foldersComercial,
    foldersLegal,
    
    // Métodos
    getFolders,
    uploadFile,
    deleteFile,
    loadFolderFiles,
    changeFilters,
    getFolderFiles,
    isFolderLoading,
    clearState
  }
}
