import { ref } from 'vue'
import { UsuarioDatosFacturacionImportService, type UsuarioDatosFacturacionImportItem } from '~/services/basedatos/usuarioDatosFacturacionImportService'

export const useUsuarioDatosFacturacionImport = () => {
  const loading = ref(false)
  const imports = ref<UsuarioDatosFacturacionImportItem[]>([])
  const error = ref<string | null>(null)

  const loadImports = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await UsuarioDatosFacturacionImportService.getImports()
      imports.value = response?.data || []
      return { success: true }
    } catch (err: any) {
      error.value = err?.message || 'No se pudo cargar la lista de importaciones.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const uploadExcel = async (file: File) => {
    loading.value = true
    error.value = null
    try {
      const response = await UsuarioDatosFacturacionImportService.importExcel(file)
      await loadImports()
      return { success: true, message: response?.message || 'Importaci?n ejecutada correctamente.' }
    } catch (err: any) {
      error.value = err?.message || 'No se pudo importar el archivo.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const rollbackImport = async (idImport: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await UsuarioDatosFacturacionImportService.rollbackImport(idImport)
      await loadImports()
      return { success: true, message: response?.message || 'Rollback ejecutado correctamente.' }
    } catch (err: any) {
      error.value = err?.message || 'No se pudo revertir la importaci?n.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    imports,
    error,
    loadImports,
    uploadExcel,
    rollbackImport,
  }
}
