import { ref, computed } from 'vue'
import { VariacionService } from '../services/cargaconsolidada/clientes/variacionService'
import type { 
  VariacionCliente, 
  ProveedorVariacion, 
  ArchivoVariacion,
  VariacionClienteUpdateRequest,
  ProveedorUpdateRequest
} from '../types/cargaconsolidada/variacion'

export const useVariacionCliente = () => {
  // Estado principal
  const cliente = ref<VariacionCliente | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Estado de tabs
  const activeTab = ref<string>('')
  const tabs = ref<{ id: string; label: string; code: string }[]>([])
  
  // Estado de proveedores
  const proveedores = ref<ProveedorVariacion[]>([])
  const proveedorActivo = ref<ProveedorVariacion | null>(null)
  
  // Estado de archivos
  const archivosDocumentacion = ref<ArchivoVariacion[]>([])
  const archivosInspeccion = ref<ArchivoVariacion[]>([])
  
  // Computed properties
  const hasData = computed(() => cliente.value !== null)
  const hasProveedores = computed(() => proveedores.value.length > 0)
  const proveedorActivoData = computed(() => {
    if (!proveedorActivo.value) return null
    return proveedores.value.find(p => p.id === proveedorActivo.value?.id)
  })

  /**
   * Obtiene la documentación del cliente
   */
  const getClienteDocumentacion = async (idCliente: number) => {
    if (!idCliente) return

    loading.value = true
    error.value = null

    try {
      const response = await VariacionService.getClienteDocumentacion(idCliente)
      
      if (response.success) {
        cliente.value = response.data
        
        // Procesar proveedores y crear tabs
        await procesarProveedores(response.data)
        
        // Establecer el primer tab como activo
        if (tabs.value.length > 0) {
          activeTab.value = tabs.value[0].id
          await cambiarProveedor(tabs.value[0].id)
        }
      } else {
        error.value = 'Error al obtener la documentación'
      }
    } catch (err: any) {
      error.value = err.message || 'Error al obtener la documentación del cliente'
      console.error('Error en getClienteDocumentacion:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Procesa los proveedores y crea los tabs
   */
  const procesarProveedores = async (data: VariacionCliente) => {
    try {
      // Parsear proveedores si vienen como string JSON
      let providersData: ProveedorVariacion[] = []
      
      if (typeof data.providers === 'string') {
        providersData = JSON.parse(data.providers)
      } else if (Array.isArray(data.providers)) {
        providersData = data.providers
      }

      proveedores.value = providersData

      // Crear tabs basados en los proveedores
      tabs.value = providersData.map(provider => ({
        id: provider.id.toString(),
        label: `${provider.code_supplier}`,
        code: provider.code_supplier
      }))

      // Establecer el primer proveedor como activo
      if (providersData.length > 0) {
        proveedorActivo.value = providersData[0]
      }
    } catch (err) {
      console.error('Error al procesar proveedores:', err)
      error.value = 'Error al procesar la información de proveedores'
    }
  }

  /**
   * Cambia el proveedor activo
   */
  const cambiarProveedor = async (tabId: string) => {
    try {
      activeTab.value = tabId
      const proveedor = proveedores.value.find(p => p.id.toString() === tabId)
      
      if (proveedor) {
        proveedorActivo.value = proveedor
        await cargarArchivosProveedor(proveedor.id)
      }
    } catch (err) {
      console.error('Error al cambiar proveedor:', err)
      error.value = 'Error al cambiar el proveedor'
    }
  }

  /**
   * Carga los archivos del proveedor específico
   */
  const cargarArchivosProveedor = async (proveedorId: number) => {
    try {
      if (!cliente.value) return

      // Procesar archivos de documentación
      if (cliente.value.files_almacen_documentacion) {
        let archivosData: ArchivoVariacion[] = []
        
        if (typeof cliente.value.files_almacen_documentacion === 'string') {
          archivosData = JSON.parse(cliente.value.files_almacen_documentacion)
        } else if (Array.isArray(cliente.value.files_almacen_documentacion)) {
          archivosData = cliente.value.files_almacen_documentacion
        }

        archivosDocumentacion.value = archivosData.filter(archivo => 
          archivo.id_proveedor === proveedorId
        )
      }

      // Procesar archivos de inspección
      if (cliente.value.files_almacen_inspection) {
        let archivosData: ArchivoVariacion[] = []
        
        if (typeof cliente.value.files_almacen_inspection === 'string') {
          archivosData = JSON.parse(cliente.value.files_almacen_inspection)
        } else if (Array.isArray(cliente.value.files_almacen_inspection)) {
          archivosData = cliente.value.files_almacen_inspection
        }

        archivosInspeccion.value = archivosData.filter(archivo => 
          archivo.id_proveedor === proveedorId
        )
      }
    } catch (err) {
      console.error('Error al cargar archivos del proveedor:', err)
      error.value = 'Error al cargar los archivos del proveedor'
    }
  }

  /**
   * Actualiza la documentación del cliente
   */
  const updateClienteDocumentacion = async (idCliente: number, data: VariacionClienteUpdateRequest) => {
    try {
      const response = await VariacionService.updateClienteDocumentacion(idCliente, data)
      
      if (response.success) {
        // Recargar datos
        await getClienteDocumentacion(idCliente)
        return { success: true }
      } else {
        return { success: false, error: 'Error al actualizar la documentación' }
      }
    } catch (err: any) {
      console.error('Error al actualizar documentación:', err)
      return { success: false, error: err.message || 'Error al actualizar la documentación' }
    }
  }

  /**
   * Actualiza la documentación de un proveedor específico
   */
  const updateProveedorDocumentacion = async (
    idCliente: number, 
    idProveedor: number, 
    data: ProveedorUpdateRequest
  ) => {
    try {
      if (!cliente.value) return { success: false, error: 'No hay documentación cargada' }

      // Encontrar y actualizar el proveedor
      const proveedorIndex = proveedores.value.findIndex(p => p.id === idProveedor)
      if (proveedorIndex === -1) {
        return { success: false, error: 'Proveedor no encontrado' }
      }

      // Actualizar el proveedor localmente
      proveedores.value[proveedorIndex] = { ...proveedores.value[proveedorIndex], ...data }

      // Actualizar en el servidor
      const updateData = {
        ...cliente.value,
        providers: JSON.stringify(proveedores.value)
      }

      const response = await updateClienteDocumentacion(idCliente, updateData)
      return response
    } catch (err: any) {
      console.error('Error al actualizar proveedor:', err)
      return { success: false, error: err.message || 'Error al actualizar el proveedor' }
    }
  }

  /**
   * Sube un archivo
   */
  const uploadArchivo = async (
    idCliente: number,
    tipoArchivo: string,
    archivo: File,
    idProveedor?: number,
    observaciones?: string
  ) => {
    try {
      const result = await VariacionService.uploadArchivo(
        idCliente,
        tipoArchivo,
        archivo,
        idProveedor,
        observaciones
      )

      if (result.success) {
        // Recargar archivos del proveedor si se especificó
        if (idProveedor) {
          await cargarArchivosProveedor(idProveedor)
        }
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
   * Elimina un archivo
   */
  const deleteArchivo = async (idCliente: number, idArchivo: number) => {
    try {
      const result = await VariacionService.deleteArchivo(idCliente, idArchivo)
      
      if (result.success && proveedorActivo.value) {
        // Recargar archivos del proveedor activo
        await cargarArchivosProveedor(proveedorActivo.value.id)
      }
      
      return result
    } catch (err: any) {
      console.error('Error al eliminar archivo:', err)
      return { success: false, error: err.message || 'Error al eliminar el archivo' }
    }
  }

  /**
   * Limpia el estado
   */
  const clearState = () => {
    cliente.value = null
    loading.value = false
    error.value = null
    activeTab.value = ''
    tabs.value = []
    proveedores.value = []
    proveedorActivo.value = null
    archivosDocumentacion.value = []
    archivosInspeccion.value = []
  }

  return {
    // Estado
    cliente,
    loading,
    error,
    activeTab,
    tabs,
    proveedores,
    proveedorActivo,
    archivosDocumentacion,
    archivosInspeccion,
    
    // Computed
    hasData,
    hasProveedores,
    proveedorActivoData,
    
    // Métodos
    getClienteDocumentacion,
    cambiarProveedor,
    updateClienteDocumentacion,
    updateProveedorDocumentacion,
    uploadArchivo,
    deleteArchivo,
    clearState
  }
}
