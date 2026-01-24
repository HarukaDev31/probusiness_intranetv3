import { ref, computed } from 'vue'
import { ViaticoService } from '~/services/viaticoService'
import type {
  Viatico,
  CreateViaticoRequest,
  UpdateViaticoRequest,
  ViaticoFilters
} from '~/types/viatico'

export const useViaticos = () => {
  const viaticos = ref<Viatico[]>([])
  const currentViatico = ref<Viatico | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  })

  /**
   * Cargar viáticos
   */
  const loadViaticos = async (filters?: ViaticoFilters) => {
    try {
      loading.value = true
      error.value = null

      const response = await ViaticoService.getViaticos(filters)
      
      if (response.success) {
        viaticos.value = response.data
        pagination.value = response.pagination
      } else {
        throw new Error('Error al cargar viáticos')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar viáticos'
      console.error('Error en loadViaticos:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar viáticos pendientes (para administración)
   */
  const loadPendientes = async (filters?: Omit<ViaticoFilters, 'status'>) => {
    try {
      loading.value = true
      error.value = null

      const response = await ViaticoService.getPendientes(filters)
      
      if (response.success) {
        viaticos.value = response.data
        pagination.value = response.pagination
      } else {
        throw new Error('Error al cargar viáticos pendientes')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar viáticos pendientes'
      console.error('Error en loadPendientes:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar viáticos completados (para administración)
   */
  const loadCompletados = async (filters?: Omit<ViaticoFilters, 'status'>) => {
    try {
      loading.value = true
      error.value = null

      const response = await ViaticoService.getCompletados(filters)
      
      if (response.success) {
        viaticos.value = response.data
        pagination.value = response.pagination
      } else {
        throw new Error('Error al cargar viáticos completados')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar viáticos completados'
      console.error('Error en loadCompletados:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar un viático por ID
   */
  const loadViaticoById = async (id: number) => {
    try {
      loading.value = true
      error.value = null

      const response = await ViaticoService.getViaticoById(id)
      
      if (response.success) {
        currentViatico.value = response.data
      } else {
        throw new Error('Error al cargar viático')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar viático'
      console.error('Error en loadViaticoById:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear un nuevo viático
   */
  const createViatico = async (data: CreateViaticoRequest) => {
    try {
      loading.value = true
      error.value = null

      const response = await ViaticoService.createViatico(data)
      
      if (response.success) {
        // Recargar la lista después de crear
        await loadViaticos()
        return response.data
      } else {
        throw new Error(response.message || 'Error al crear viático')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al crear viático'
      console.error('Error en createViatico:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar un viático
   */
  const updateViatico = async (id: number, data: UpdateViaticoRequest) => {
    try {
      loading.value = true
      error.value = null

      const response = await ViaticoService.updateViatico(id, data)
      
      if (response.success) {
        // Actualizar el viático actual si es el mismo
        if (currentViatico.value?.id === id) {
          currentViatico.value = response.data
        }
        // Recargar la lista
        await loadViaticos()
        return response.data
      } else {
        throw new Error(response.message || 'Error al actualizar viático')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar viático'
      console.error('Error en updateViatico:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar un viático
   */
  const deleteViatico = async (id: number) => {
    try {
      loading.value = true
      error.value = null

      const response = await ViaticoService.deleteViatico(id)
      
      if (response.success) {
        // Recargar la lista después de eliminar
        await loadViaticos()
        return true
      } else {
        throw new Error(response.message || 'Error al eliminar viático')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar viático'
      console.error('Error en deleteViatico:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener el color según el estado
   */
  const getStatusColor = (status: Viatico['status']) => {
    const colors = {
      PENDING: 'warning',
      CONFIRMED: 'success',
      REJECTED: 'error'
    }
    return colors[status] || 'gray'
  }

  /**
   * Obtener el label del estado
   */
  const getStatusLabel = (status: Viatico['status']) => {
    const labels = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      REJECTED: 'Rechazado'
    }
    return labels[status] || status
  }

  /**
   * Formatear fecha
   */
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Sin fecha'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Formatear monto
   */
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  return {
    // State
    viaticos,
    currentViatico,
    loading,
    error,
    pagination,
    
    // Methods
    loadViaticos,
    loadPendientes,
    loadCompletados,
    loadViaticoById,
    createViatico,
    updateViatico,
    deleteViatico,
    
    // Helpers
    getStatusColor,
    getStatusLabel,
    formatDate,
    formatAmount
  }
}
