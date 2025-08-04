import { ref, computed } from 'vue'
import { ConsolidadoService } from '~/services/consolidadoService'
import type { ConsolidadoItem, ConsolidadoFilters, PaginationInfo, PagoDetalleResponse } from '~/types/consolidado'

export const useConsolidado = () => {
  // State
  const consolidadoData = ref<ConsolidadoItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 1,
    to: 10
  })
  const filters = ref<ConsolidadoFilters>({
    fecha_inicio: '',
    fecha_fin: '',
    estado: '',
    carga: '',
    search: ''
  })

  // Computed
  const totalAmount = computed(() => {
    if (!consolidadoData.value || consolidadoData.value.length === 0) {
      return 0
    }
    return consolidadoData.value.reduce((sum, item) => {
      const monto = item?.monto_a_pagar || 0
      return sum + monto
    }, 0)
  })

  const totalPaid = computed(() => {
    return consolidadoData.value.reduce((sum, item) => sum + item.total_pagado, 0)
  })

  const filteredData = computed(() => {
    let data = consolidadoData.value

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      data = data.filter(item => 
        item.nombre.toLowerCase().includes(search) ||
        item.documento.includes(search) ||
        item.telefono.includes(search) ||
        item.carga.toLowerCase().includes(search)
      )
    }

    if (filters.value.estado && filters.value.estado !== 'todos') {
      data = data.filter(item => item.estado_pago === filters.value.estado)
    }

    if (filters.value.carga && filters.value.carga !== 'todos') {
      data = data.filter(item => item.carga === filters.value.carga)
    }

    return data
  })

  // Methods
  const fetchConsolidadoData = async (customFilters?: ConsolidadoFilters, page: number = 1, perPage: number = 10) => {
    loading.value = true
    error.value = null

    try {
      const filtersWithPagination = {
        ...(customFilters || filters.value),
        page,
        per_page: perPage
      }
      
      const response = await ConsolidadoService.getConsolidadoPagos(filtersWithPagination)
      consolidadoData.value = response.data
      pagination.value = response.pagination
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching consolidado data:', err)
    } finally {
      loading.value = false
    }
  }

  const updateEstadoPago = async (id: number, estado: string) => {
    try {
      await ConsolidadoService.updateEstadoPago(id, estado)
      
      // Actualizar el estado local
      const item = consolidadoData.value.find(item => item.id === id)
      if (item) {
        item.estado_pago = estado
      }
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar estado'
      return { success: false, error: error.value }
    }
  }

  const getPagoDetalle = async (id: number) => {
    try {
      const response = await ConsolidadoService.getPagoDetalle(id)
      return response // Retorna toda la respuesta que incluye data, nota y URLs
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al obtener detalle'
      throw err
    }
  }

  const exportData = async () => {
    try {
      const blob = await ConsolidadoService.exportConsolidado(filters.value)
      
      // Crear y descargar el archivo
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `consolidado_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al exportar datos'
      return { success: false, error: error.value }
    }
  }

  const updateFilters = (newFilters: Partial<ConsolidadoFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      fecha_inicio: '',
      fecha_fin: '',
      estado: '',
      carga: '',
      search: ''
    }
  }

  return {
    // State
    consolidadoData,
    loading,
    error,
    pagination,
    filters,
    
    // Computed
    totalAmount,
    totalPaid,
    filteredData,
    
    // Methods
    fetchConsolidadoData,
    updateEstadoPago,
    getPagoDetalle,
    exportData,
    updateFilters,
    clearFilters
  }
} 