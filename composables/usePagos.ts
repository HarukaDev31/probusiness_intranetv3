import { ref, computed } from 'vue'
import { PagosService } from '~/services/pagosService'
import type { CursoItem, CursosFilters, PaginationInfo, CursosDetalleResponse } from '~/types/cursos-pagos'

export const usePagos = () => {
  // State
  const cursosData = ref<CursoItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<CursosFilters>({})
  const pagination = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0
  })

  // Computed
  const totalAmount = computed(() => {
    return cursosData.value.reduce((sum, item) => sum + item.monto_a_pagar, 0)
  })

  const totalPaid = computed(() => {
    return cursosData.value.reduce((sum, item) => sum + item.total_pagado, 0)
  })

  const filteredData = computed(() => {
    if (!filters.value.search) return cursosData.value
    
    const searchTerm = filters.value.search.toLowerCase()
    return cursosData.value.filter(item =>
      item.nombre.toLowerCase().includes(searchTerm) ||
      item.telefono.includes(searchTerm) ||
      item.campana.toLowerCase().includes(searchTerm)
    )
  })

  // Methods
  const fetchCursosData = async (customFilters?: CursosFilters, page: number = 1, perPage: number = 10) => {
    loading.value = true
    error.value = null
    
    try {
      const mergedFilters = { ...filters.value, ...customFilters, page, limit: perPage }
      const response = await PagosService.getCursosPagos(mergedFilters)
      
      cursosData.value = response.data
      pagination.value = response.pagination
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al obtener datos de cursos'
      console.error('Error fetching cursos data:', err)
    } finally {
      loading.value = false
    }
  }

  const getCursoDetalle = async (id: number): Promise<CursosDetalleResponse> => {
    loading.value = true
    error.value = null
    try {
      const response = await PagosService.getCursoDetalle(id)
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al obtener detalle'
      console.error('Error fetching curso detail:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateEstadoPago = async (id: number, estado: string) => {
    try {
      await PagosService.updateEstadoPago(id, estado)
      // Actualizar el estado local
      const curso = cursosData.value.find(c => c.id === id)
      if (curso) {
        curso.estado_pago = estado
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar estado'
      console.error('Error updating estado:', err)
      throw err
    }
  }

  const exportData = async () => {
    try {
      const blob = await PagosService.exportCursos(filters.value)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cursos_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al exportar datos'
      console.error('Error exporting data:', err)
    }
  }

  const updateFilters = (newFilters: Partial<CursosFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {}
  }

  return {
    // State
    cursosData,
    loading,
    error,
    pagination,
    filters,

    // Computed
    totalAmount,
    totalPaid,
    filteredData,

    // Methods
    fetchCursosData,
    getCursoDetalle,
    updateEstadoPago,
    exportData,
    updateFilters,
    clearFilters
  }
} 