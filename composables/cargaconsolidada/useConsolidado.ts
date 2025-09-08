import { ref, computed } from 'vue'
import { ConsolidadoService } from '../../services/cargaconsolidada/consolidadoService'
import type { PaginationInfo } from '../../types/data-table'
import type { Contenedor, ContenedorFilters, ContenedorPasos } from '../../types/cargaconsolidada/contenedor'

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
    const itemsPerPage = ref(100)
    const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
    const totalRecords = computed(() => pagination.value.total)
    const currentPage = computed(() => pagination.value.current_page)
    const filters = ref<ContenedorFilters>({
        fecha_inicio: '',
        fecha_fin: '',
        estado_china: 'todos', // Inicializar con 'todos' para consistencia
        completado: false
    })
    const pasos=ref<ContenedorPasos[]>([])
    const validContainers=ref<any[]>([])
    const getConsolidadoData = async () => {
        try {
            loading.value = true
            error.value = null

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
            if (filters.value.completado) {
                params.completado = filters.value.completado
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
        const filterKey = filterType as keyof ContenedorFilters
        
        
        if (value === 'todos') {
            if (filterKey === 'estado_china') {
                filters.value[filterKey] = 'todos'
            } else {
                delete filters.value[filterKey]
            }
        } else {
            filters.value[filterKey] = value
        }
        
   
        
        pagination.value.current_page = 1
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
    const setCompletado = (completado: boolean) => {
        filters.value.completado = completado
    }
    const getConsolidadoPasos = async (id: number) => {
        try {
            loading.value = true
            const response = await ConsolidadoService.getConsolidadoPasos(id)
            pasos.value = response.data
            loading.value = false
        } catch (error) {
            console.error('Error en getConsolidadoPasos:', error)
        }
    }
    const getValidContainers = async () => {
        try {
            const response = await ConsolidadoService.getValidContainers()
            validContainers.value = response.data
        } catch (error) {
            console.error('Error en getValidContainers:', error)
        }
    }
    const createConsolidado = async (payload: any) => {
        try {
            const response = await ConsolidadoService.createConsolidado(payload)
            console.log(response)
        } catch (error) {
            console.error('Error en createConsolidado:', error)
        }
    }
    const getConsolidadoById = async (id: number) => {
        try {
            const response = await ConsolidadoService.getConsolidadoById(id)
            return response
        } catch (error) {
            console.error('Error en getConsolidadoById:', error)
        }
    }
    const deleteConsolidado = async (id: number) => {
        try {
            const response = await ConsolidadoService.deleteConsolidado(id)
            return response
        } catch (error) {
            console.error('Error en deleteConsolidado:', error)
        }
    }
    const updateEstadoDocumentacion = async (data: any) => {
        try {
            const response = await ConsolidadoService.updateEstadoDocumentacion(data)
            return response
        } catch (error) {
            console.error('Error en updateEstadoDocumentacion:', error)
        }
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
        resetSearch,
        setCompletado,
        getConsolidadoPasos,
        pasos,
        getValidContainers,
        validContainers,
        createConsolidado,
        getConsolidadoById,
        deleteConsolidado,
        updateEstadoDocumentacion
    }
}