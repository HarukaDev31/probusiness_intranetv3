import { ref, computed } from 'vue'
import { ConsolidadoService } from '~/services/cargaconsolidada/consolidadoService'
import type { PaginationInfo } from '~/types/data-table'
import type { Contenedor, ContenedorFilters } from '~/types/cargaconsolidada/contenedor'

export const useConsolidado = () => {
    const consolidadoData = ref<Contenedor[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const pagination = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    })
    const search = ref('')
    const itemsPerPage = ref(10)
    const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
    const totalRecords = computed(() => pagination.value.total)
    const currentPage = computed(() => pagination.value.current_page)
    const filters = ref<ContenedorFilters>({
        fecha_inicio: '',
        fecha_fin: '',
        estado_china: 'todos' // Inicializar con 'todos' para consistencia
    })

    const getConsolidadoData = async () => {
        try {
            loading.value = true
            error.value = null

            // Preparar los parámetros para la API
            const params: any = {
                page: pagination.value.current_page,
                limit: itemsPerPage.value
            }

            // Agregar búsqueda si existe
            if (search.value.trim()) {
                params.search = search.value.trim()
            }

            // Agregar filtros si existen
            if (filters.value.fecha_inicio) {
                params.fecha_inicio = filters.value.fecha_inicio
            }
            if (filters.value.fecha_fin) {
                params.fecha_fin = filters.value.fecha_fin
            }
            if (filters.value.estado_china) {
                params.estado_china = filters.value.estado_china
            }

            const response = await ConsolidadoService.getConsolidadoData(params)
            consolidadoData.value = response.data
            pagination.value = response.pagination
        } catch (err: any) {
            error.value = err?.message || 'Error al cargar los datos'
            console.error('Error en getConsolidadoData:', err)
        } finally {
            loading.value = false
        }
    }

    const handleSearch = (value: string) => {
        search.value = value
        pagination.value.current_page = 1 // Reset a la primera página
        getConsolidadoData()
    }

    const handlePageChange = (value: number) => {
        pagination.value.current_page = value
        getConsolidadoData()
    }

    const handleItemsPerPageChange = (value: number) => {
        itemsPerPage.value = value
        pagination.value.current_page = 1 // Reset a la primera página
        getConsolidadoData()
    }

    const handleFilterChange = (filterType: string, value: string) => {
        // Mapear los tipos de filtro a las propiedades correctas
        const filterKey = filterType as keyof ContenedorFilters
        
        console.log('handleFilterChange:', { filterType, filterKey, value, currentFilters: filters.value })
        
        if (value === 'todos') {
            // Si se selecciona "Todos", establecer el valor por defecto
            if (filterKey === 'estado_china') {
                filters.value[filterKey] = 'todos'
            } else {
                // Para otros filtros (fechas), eliminar si está vacío
                delete filters.value[filterKey]
            }
        } else {
            // Si se selecciona un valor específico, aplicar el filtro
            filters.value[filterKey] = value
        }
        
   
        
        // Reset a la primera página cuando cambian los filtros
        pagination.value.current_page = 1
        // Aplicar filtros inmediatamente
        getConsolidadoData()
    }

    const clearFilters = () => {
        filters.value = {
            fecha_inicio: '',
            fecha_fin: '',
            estado_china: 'todos'
        }
        pagination.value.current_page = 1
        getConsolidadoData()
    }

    const resetSearch = () => {
        search.value = ''
        pagination.value.current_page = 1
        getConsolidadoData()
    }

    return {
        consolidadoData,
        loading,
        error,
        pagination,
        search,
        itemsPerPage,
        totalPages,
        totalRecords,
        currentPage,
        filters,
        getConsolidadoData,
        handleSearch,
        handlePageChange,
        handleItemsPerPageChange,
        handleFilterChange,
        clearFilters,
        resetSearch
    }
}