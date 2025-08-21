import { ref, computed } from 'vue'
import { ClienteDocumentacionService, type ClienteDocumentacion, type DocumentoFile } from '../services/clienteDocumentacionService'

export const useClienteDocumentacion = () => {
  const documentacion = ref<ClienteDocumentacion | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Archivos seleccionados para subir
  const archivosSeleccionados = ref({
    factura: null as File | null,
    packing: null as File | null,
    confirmacion: null as File | null
  })

  // Datos del documento por proveedor
  const documentosPorProveedor = ref<Record<number, { volumen: number; valor: number }>>({})

  // Cargar documentación del cliente
  const cargarDocumentacion = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await ClienteDocumentacionService.getClienteDocumentacion(id)
      
      if (response.success) {
        documentacion.value = response.data
        
        // Inicializar datos de documentos por proveedor
        if (response.data.providers) {
          response.data.providers.forEach(provider => {
            documentosPorProveedor.value[provider.id] = {
              volumen: provider.volumen_doc || 0,
              valor: provider.valor_doc || 0
            }
          })
        }
        
        return response.data
      } else {
        error.value = response.error || 'Error al cargar la documentación'
        throw new Error(response.error || 'Error al cargar la documentación')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar la documentación'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Subir documento
  const subirDocumento = async (id: string, tipo: string, archivo: File, observaciones?: string) => {
    try {
      const response = await ClienteDocumentacionService.subirDocumento(id, tipo, archivo, observaciones)
      
      if (response.success) {
        // Recargar la documentación para obtener los archivos actualizados
        await cargarDocumentacion(id)
        return response
      } else {
        error.value = response.error || 'Error al subir el documento'
        throw new Error(response.error || 'Error al subir el documento')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al subir el documento'
      throw err
    }
  }

  // Eliminar documento
  const eliminarDocumento = async (id: string, fileId: number) => {
    try {
      const response = await ClienteDocumentacionService.eliminarDocumento(id, fileId)
      
      if (response.success) {
        // Recargar la documentación para obtener los archivos actualizados
        await cargarDocumentacion(id)
        return response
      } else {
        error.value = response.error || 'Error al eliminar el documento'
        throw new Error(response.error || 'Error al eliminar el documento')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar el documento'
      throw err
    }
  }

  // Actualizar documentación por proveedor
  const actualizarDocumentacionProveedor = async (id: string, proveedorId: number, datos: { volumen: number; valor: number }) => {
    try {
      const response = await ClienteDocumentacionService.actualizarDocumentacionProveedor(id, proveedorId, datos)
      
      if (response.success) {
        // Actualizar datos locales
        documentosPorProveedor.value[proveedorId] = datos
        return response
      } else {
        error.value = response.error || 'Error al actualizar la documentación'
        throw new Error(response.error || 'Error al actualizar la documentación')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar la documentación'
      throw err
    }
  }

  // Actualizar documentación (método general)
  const actualizarDocumentacion = async (id: string, datos: Partial<ClienteDocumentacion>) => {
    try {
      const response = await ClienteDocumentacionService.actualizarDocumentacion(id, datos)
      
      if (response.success) {
        // Recargar la documentación para obtener los datos actualizados
        await cargarDocumentacion(id)
        return response
      } else {
        error.value = response.error || 'Error al actualizar la documentación'
        throw new Error(response.error || 'Error al actualizar la documentación')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar la documentación'
      throw err
    }
  }

  // Computed properties
  const archivosPorTipo = computed(() => {
    if (!documentacion.value) return {}
    
    const archivos = documentacion.value.files || []
    const archivosAlmacen = documentacion.value.files_almacen_documentacion || []
    
    return {
      factura: archivos.filter(f => f.tipo === 'factura_comercial'),
      packing: archivos.filter(f => f.tipo === 'packing_list'),
      confirmacion: archivos.filter(f => f.tipo === 'excel_confirmacion'),
      almacen: archivosAlmacen
    }
  })

  const tieneArchivos = computed(() => {
    if (!documentacion.value) return false
    return (documentacion.value.files && documentacion.value.files.length > 0) ||
           (documentacion.value.files_almacen_documentacion && documentacion.value.files_almacen_documentacion.length > 0)
  })

  const proveedores = computed(() => {
    return documentacion.value?.providers || []
  })

  // Obtener datos de documento por proveedor
  const getDocumentoProveedor = (proveedorId: number) => {
    return documentosPorProveedor.value[proveedorId] || { volumen: 0, valor: 0 }
  }

  // Actualizar datos de documento por proveedor
  const updateDocumentoProveedor = (proveedorId: number, datos: { volumen?: number; valor?: number }) => {
    if (!documentosPorProveedor.value[proveedorId]) {
      documentosPorProveedor.value[proveedorId] = { volumen: 0, valor: 0 }
    }
    
    if (datos.volumen !== undefined) {
      documentosPorProveedor.value[proveedorId].volumen = datos.volumen
    }
    if (datos.valor !== undefined) {
      documentosPorProveedor.value[proveedorId].valor = datos.valor
    }
  }

  // Limpiar archivos seleccionados
  const limpiarArchivosSeleccionados = () => {
    archivosSeleccionados.value = {
      factura: null,
      packing: null,
      confirmacion: null
    }
  }

  // Validaciones
  const validarVolumen = (proveedorId: number, valor: number) => {
    if (valor < 0) {
      updateDocumentoProveedor(proveedorId, { volumen: 0 })
    }
  }

  const validarValor = (proveedorId: number, valor: number) => {
    if (valor < 0) {
      updateDocumentoProveedor(proveedorId, { valor: 0 })
    }
  }

  return {
    // State
    documentacion: readonly(documentacion),
    loading: readonly(loading),
    error: readonly(error),
    archivosSeleccionados,
    documentosPorProveedor: readonly(documentosPorProveedor),
    
    // Computed
    archivosPorTipo,
    tieneArchivos,
    proveedores,
    
    // Methods
    cargarDocumentacion,
    subirDocumento,
    eliminarDocumento,
    actualizarDocumentacion,
    actualizarDocumentacionProveedor,
    limpiarArchivosSeleccionados,
    getDocumentoProveedor,
    updateDocumentoProveedor,
    validarVolumen,
    validarValor
  }
} 