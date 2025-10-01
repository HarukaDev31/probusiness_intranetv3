import { ref } from 'vue'
import { DocumentacionService } from '~/services/cargaconsolidada/documentacionService'

export const useDocumentacion = () => {
  const folders = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref({})
  const hasData = ref(false)
  const foldersByCategoria = ref<any[]>([])

  const getFolders = async (idContenedor: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await DocumentacionService.getFolders(idContenedor)
      if (response.success) {
        folders.value = response.data
        hasData.value = response.data.length > 0
        foldersByCategoria.value = response.data
      } else {
        error.value = response.error || 'Error al obtener los folders'
      }
    } catch (err) {
      error.value = 'Error al cargar los folders'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const uploadFileDocumentation = async (data: FormData) => {
    try {
      const response = await DocumentacionService.uploadFileDocumentation(data)
      if (response.success) {
        await getFolders(data.get('idContenedor') as string)
      }
      return response
    } catch (error) {
      console.error('Error al subir archivo:', error)
      throw error
    }
  }

  const deleteFile = async (idFile: number, idFolder: string) => {
    try {
      const response = await DocumentacionService.deleteFile(idFile, idFolder)
      if (response.success) {
        // Actualizar la lista de folders después de eliminar
        await getFolders(idFolder)
      }
      return response
    } catch (error) {
      console.error('Error al eliminar archivo:', error)
      throw error
    }
  }
  const downloadAllFiles = async (idContenedor: string) => {
    try {
      const response = await DocumentacionService.downloadAllFiles(idContenedor)
      const blob = new Blob([response], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `documentacion_${idContenedor}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      return { success: true }
    }
    catch (error) {
      console.error('Error al descargar todos los archivos:', error)
      throw error
    }
  }
  const downloadFacturaComercial = async (idContenedor: string) => {
    try {
      const response = await DocumentacionService.downloadFacturaComercial(idContenedor)
      // Crear un blob URL y descargar el archivo
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura_procesada_${idContenedor}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      return { success: true }
    } catch (error) {
      console.error('Error al descargar factura comercial:', error)
      throw error
    }
  }
  const deleteFileDocumentation = async (idFile: number) => {
    try {
      const response = await DocumentacionService.deleteFileDocumentation(idFile)
      return response
    }
    catch (error) {
      console.error('Error al eliminar archivo de documentación:', error)
      throw error
    }
  }

  // Funciones auxiliares para el manejo de archivos en folders
  const getFolderFiles = (folderId: string) => {
    const folder = folders.value.find(f => f.id === folderId)
    return folder?.files || []
  }

  const isFolderLoading = (folderId: string) => {
    // Implementar lógica de loading por folder si es necesario
    return false
  }
  const createNewFolder = async (data: FormData) => {
    try {
      const response = await DocumentacionService.createNewFolder(data)
      return response
    }
    catch (error) {
      console.error('Error al crear el folder:', error)
      throw error
    }
  }
  const downloadAllFilesAdministracion = async (idContenedor: string) => {
    try {
      const response = await DocumentacionService.downloadAllFilesAdministracion(idContenedor)
      return response
    }
    catch (error) {
      console.error('Error al descargar todos los archivos:', error)
      throw error
    }
  }
  return {
    folders,
    loading,
    error,
    filters,
    hasData,
    foldersByCategoria,
    getFolders,
    uploadFileDocumentation,
    deleteFile,
    getFolderFiles,
    isFolderLoading,
    downloadFacturaComercial,
    deleteFileDocumentation,
    downloadAllFiles,
    createNewFolder,
    downloadAllFilesAdministracion
  }
}