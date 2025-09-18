import { ref, computed } from 'vue'
import { ConsolidadoService } from '../services/consolidadoService'
import type { ConsolidadoItem, ConsolidadoFilters, PaginationInfo, PagoDetalleResponse } from '../types/pagos/consolidado-pagos'

export const useConsolidado = () => {
  // State
  const cargasDisponibles = ref<{ value: string; label: string }[]>([])
  const consolidadoData = ref<ConsolidadoItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 100,
    total: 0,
    from: 0,
    to: 0
  })
  const search = ref('')
  const itemsPerPage = ref(100)
  const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
  const totalRecords = computed(() => pagination.value.total)
  const currentPage = computed(() => pagination.value.current_page)
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
  const fetchConsolidadoData = async (customFilters?: ConsolidadoFilters, page: number = 1, perPage: number = 10, idCotizacion?: number) => {
    loading.value = true
    error.value = null

    try {
      // Normalize filters: allow UI to send 'cargas' (plural) and map it to 'carga'
      const effectiveFilters: any = { ...(customFilters || filters.value) }

      // If the UI uses 'cargas' key, normalize to 'carga'
      if (effectiveFilters.cargas !== undefined) {
        const val = effectiveFilters.cargas
        if (val === 'todos' || val === '' || val == null) {
          delete effectiveFilters.carga
        } else {
          effectiveFilters.carga = val
        }
        delete effectiveFilters.cargas
      }

      if (effectiveFilters.carga === 'todos' || effectiveFilters.carga === '0') {
        delete effectiveFilters.carga
      }

      if (effectiveFilters.estado === 'todos' || effectiveFilters.estado === '0') {
        delete effectiveFilters.estado
      }

      // attach pagination params expected by service
      const filtersWithPagination = {
        ...effectiveFilters,
        page,
        per_page: perPage
      }

      // Agregar idCotizacion si está presente
      if (idCotizacion) {
        filtersWithPagination.idCotizacion = idCotizacion
      }

      const response = await ConsolidadoService.getConsolidadoPagos(filtersWithPagination)
      consolidadoData.value = response.data
      pagination.value = response.pagination

      // Populate cargasDisponibles from response when available (fallback to response.filters.cargas)
      const apiCargas = (response as any)?.cargas_disponibles ?? (response as any)?.filters?.cargas ?? []
      cargasDisponibles.value = [
        { value: 'todos', label: 'Todas las cargas' },
        ...apiCargas.map((c: any) => ({ value: String(c.carga ?? c.value ?? c.ID), label: `#${String(c.carga ?? c.value ?? c.ID)}` }))
      ]
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

      //Actualizar el estado y mandar a la api
      await ConsolidadoService.updateEstadoPago(id, estado)

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar estado'
      return { success: false, error: error.value }
    }
  }

  const updateNota = async (id: number, nota: string) => {
    try {
      await ConsolidadoService.updateNota(id, nota)
      
      // Actualizar la nota local
      const item = consolidadoData.value.find(item => item.id === id)
      if (item) {
        item.note_administracion = nota
      }

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar nota'
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
    // Normalize incoming filter keys (support UI sending 'cargas')
    const nf: any = { ...newFilters }
    if (nf.cargas !== undefined) {
      const val = nf.cargas
      if (val === 'todos' || val === '' || val == null) {
        delete nf.carga
      } else {
        nf.carga = val
      }
      delete nf.cargas
    }

    filters.value = { ...filters.value, ...nf }
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
    cargasDisponibles,
    totalPages,
    totalRecords,
    currentPage,
    search,
    // Computed
    totalAmount,
    totalPaid,
    filteredData,
    itemsPerPage,
    // Methods
    fetchConsolidadoData,
    updateEstadoPago,
    updateNota,
    getPagoDetalle,
    exportData,
    updateFilters,
    clearFilters
  }
} 