import { ref, computed } from 'vue'
import { PagosService } from '../services/pagosService'
import type { CursoItem, CursosFilters, PaginationInfo, CursosDetalleResponse } from '../types/cursos-pagos'

export const usePagos = () => {
  // State
  const campanasDisponibles = ref<{ value: string; label: string }[]>([])
  const cursosData = ref<CursoItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<CursosFilters>({})
  const pagination = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 100,
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
  const totalPagesCursos = computed(() => Math.ceil(pagination.value.total / itemsPerPageCursos.value))
  const totalRecordsCursos = computed(() => pagination.value.total)
  const currentPageCursos = computed(() => pagination.value.current_page)
  const itemsPerPageCursos = ref(100)
  const searchCursos = ref('')
  // Methods
  const fetchCursosData = async (customFilters?: CursosFilters, page: number = 1, perPage: number = 10) => {
    loading.value = true
    error.value = null
    
    try {
      // Merge filters and ensure pagination params are present
      const mergedFilters: any = { ...filters.value, ...customFilters, page, limit: perPage }

      // If the UI uses the 'campanas' key (select options), normalize to 'campana'
      if (mergedFilters.campanas !== undefined) {
        const val = mergedFilters.campanas
        if (val === 'todos' || val === '' || val == null) {
          delete mergedFilters.campana
        } else {
          mergedFilters.campana = val
        }
        delete mergedFilters.campanas
      }

      // If campana is the sentinel 'todos' or empty, remove it so backend doesn't receive it
      if (mergedFilters.campana === 'todos' || mergedFilters.campana === '' || mergedFilters.campana == null) {
        delete mergedFilters.campana
      }

      const response = await PagosService.getCursosPagos(mergedFilters)
      
      cursosData.value = response.data
      pagination.value = response.pagination
      const apiCampanas = (response as any)?.campanas_disponibles ?? (response as any)?.filters?.campanas ?? []
      campanasDisponibles.value = [
        { value: '0', label: 'Todas las campañas' },
        ...apiCampanas.map((c: any) => ({ value: String(c.id ?? c.value ?? c.ID), label: String(c.nombre ?? c.label ?? c.nombre_campana ?? c.value) }))
      ]
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
      // Actualizar el estado local
      const curso = cursosData.value.find(c => c.id === id)
      if (curso) {
        curso.estado_pago = estado
      }
      await PagosService.updateEstadoPago(id, estado)

      return {success: true}
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar estado'
      console.error('Error updating estado:', err)
      throw err
    }
  }
  const updateNota = async (id: number, nota: string) => {
    try {
      await PagosService.updateNota(id, nota)
      // Actualizar la nota local
      const curso = cursosData.value.find(c => c.id === id)
      if (curso) {
        curso.note_administracion = nota
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar nota'
      console.error('Error updating nota:', err)
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
    // Normalize incoming filter keys from the UI to what's expected by the API
    const nf: any = { ...newFilters }
    if (nf.campanas !== undefined) {
      const val = nf.campanas
      if (val === 'todos' || val === '' || val == null) {
        // remove campana filter
        delete nf.campana
      } else {
        nf.campana = val
      }
      delete nf.campanas
    }

    // Assign normalized filters
    filters.value = { ...filters.value, ...nf }
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
    campanasDisponibles,
    totalPagesCursos,
    totalRecordsCursos,
    currentPageCursos,
    itemsPerPageCursos,
    // Computed
    totalAmount,
    totalPaid,
    filteredData,
    searchCursos,
    // Methods
    fetchCursosData,
    getCursoDetalle,
    updateEstadoPago,
    updateNota,
    exportData,
    updateFilters,
    clearFilters
  }
} 