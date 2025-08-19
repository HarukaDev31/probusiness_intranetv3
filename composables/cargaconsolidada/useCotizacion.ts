import { CotizacionService } from "../../services/cargaconsolidada/cotizacionService"
import type { Header, PaginationInfo } from "../../types/data-table"
import type { Cotizacion, CotizacionFilters } from "../../types/cargaconsolidada/cotizaciones"

export const useCotizacion = () => {
    const cotizaciones = ref<Cotizacion[]>([])
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
    const headersCotizaciones = ref<Header[]>([])

    const search = ref('')
    const itemsPerPage = ref(10)
    const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
    const totalRecords = computed(() => pagination.value.total)
    const currentPage = computed(() => pagination.value.current_page)
    const filters = ref<CotizacionFilters>({
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'todos', // Inicializar con 'todos' para consistencia
        completado: false
    })
    
    const getCotizaciones = async (id: number) => {
        try {
            const params: any = {
                page: pagination.value.current_page,
                limit: itemsPerPage.value
            }
            if (search.value.trim()) {
                params.search = search.value.trim()
            }
            if (filters.value.fecha_inicio) {
                params.fecha_inicio = filters.value.fecha_inicio
            }
            if (filters.value.fecha_fin) {
                params.fecha_fin = filters.value.fecha_fin
            }
            if (filters.value.estado && filters.value.estado !== 'todos') {
                params.estado = filters.value.estado
            }
            if (filters.value.completado) {
                params.completado = filters.value.completado
            }
            const response = await CotizacionService.getCotizaciones(id,params)
            cotizaciones.value = response.data
            pagination.value = response.pagination
            headersCotizaciones.value = response.headers
        } catch (err) {
            error.value = err as string
        } finally {
            loading.value = false
        }
    }
    const refreshCotizacionFile = async (id: number) => {
        try {
            const response = await CotizacionService.refreshCotizacionFile(id)
            return response
        } catch (err) {
            error.value = err as string
        } finally {
            loading.value = false
        }
    }
    const deleteCotizacion = async (id: number) => {
        try {
            const response = await CotizacionService.deleteCotizacion(id)
            console.log(response)
            return response
        } catch (error) {
            console.error('Error en deleteCotizacion:', error)
        }
    }
    const deleteCotizacionFile = async (id: number) => {
        try {
            const response = await CotizacionService.deleteCotizacionFile(id)
            return response
        } catch (error) {
            console.error('Error en deleteCotizacionFile:', error)
        }
    }
    const createProspecto = async (data: any) => {
        try {
            const formData = new FormData()
            formData.append('cotizacion', data.file)
            formData.append('id_contenedor', data.id_contenedor)
            const response = await CotizacionService.createProspecto(formData)
            return response
        } catch (error) {
            console.error('Error en createProspecto:', error)
        }
    }
    const updateCotizacion = async (id: number, data: any) => {
        try {
            const formData = new FormData()
            formData.append('cotizacion', data.file)
            const response = await CotizacionService.updateCotizacion(id, formData)
            return response
        } catch (error) {
            console.error('Error en updateCotizacion:', error)
        }
    }
    const updateEstadoCotizacionCotizador = async (id: number, data: any) => {
        try {
            const response = await CotizacionService.updateEstadoCotizacionCotizador(id, data)
            return response
        } catch (error) {
            console.log(error)
            throw error
        }
    }
    return {
        cotizaciones,
        loading,
        error,
        pagination,
        search,
        itemsPerPage,
        totalPages,
        totalRecords,
        currentPage,
        filters,
        headersCotizaciones,
        getCotizaciones,
        refreshCotizacionFile,
        deleteCotizacion,
        deleteCotizacionFile,
        createProspecto,
        updateCotizacion,
        updateEstadoCotizacionCotizador
    }
}