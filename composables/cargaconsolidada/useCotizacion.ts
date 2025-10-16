import { CotizacionService } from "../../services/cargaconsolidada/cotizacionService"
import type { Header, PaginationInfo } from "../../types/data-table"
import type { Cotizacion, CotizacionFilters } from "../../types/cargaconsolidada/cotizaciones"
import { ref, computed } from 'vue'
import { useRoute } from '#app'
import { useSpinner } from '../composables/commons/useSpinner'
import { fi } from "@nuxt/ui/runtime/locale/index.js"
const { withSpinner } = useSpinner()


export const useCotizacion = () => {
    const carga = ref<string | null>(null)
    const cotizaciones = ref<Cotizacion[]>([])
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
    const packingList = ref<any>(null)
    const headersCotizaciones = ref<Header[]>([])
    const loadingHeaders = ref(false)
    const search = ref('')
    const itemsPerPage = ref(100)
    const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
    const totalRecords = computed(() => pagination.value.total)
    const currentPage = computed(() => pagination.value.current_page)
    const filters = ref<CotizacionFilters>({
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'todos', // Inicializar con 'todos' para consistencia
        estado_coordinacion: 'todos',
        estado_china: 'todos',
    
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
            if (filters.value.estado_coordinacion && filters.value.estado_coordinacion !== 'todos') {
                params.estado_coordinacion = filters.value.estado_coordinacion
            }
            if (filters.value.estado_china && filters.value.estado_china !== 'todos') {
                params.estado_china = filters.value.estado_china
            }
          
            const response = await CotizacionService.getCotizaciones(id,params)
            cotizaciones.value = response.data
            pagination.value = response.pagination
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
            
            throw error
        }
    }
    const getHeaders = async (id: number) => {
        loadingHeaders.value = true
        try {
            const response = await CotizacionService.getHeaders(id)
            headersCotizaciones.value = response.data
            carga.value = response.carga
            loadingHeaders.value = false
            packingList.value = response.lista_embarque_url
            return response
        } catch (error) {
            console.error('Error en getHeaders:', error)
            throw error
        }
    }
    const resetFiltersCotizacion = () => {
        filters.value = {
            fecha_inicio: '',
            fecha_fin: '',
            estado: 'todos',
            estado_coordinacion: 'todos',
            estado_china: 'todos'
        }
    }
    const route = useRoute()

    const exportData = async (id?: number) => {
        loading.value = true
        error.value = null
        try {
            await withSpinner(async () => {
                const containerId = id ?? Number(route.params.id)
                if (!containerId) throw new Error('ID de contenedor inválido para exportar')
                const blob = await CotizacionService.exportCotizaciones(containerId)
                const cargaid = await CotizacionService.getHeaders(containerId)
                carga.value = cargaid.carga // Asignar el valor correcto de tipo string
                //crear archivo y descargarlo
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `cotizaciones_#${carga.value}_${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 'Exportando cotizaciones...')
            return { success: true }
        } catch (error: any) {
            error.value = error.message || 'Error al exportar cotizaciones'
            return { success: false, error: error.message }
        } finally {
            loading.value = false
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
        updateEstadoCotizacionCotizador,
        getHeaders,
        carga,
        loadingHeaders,
        resetFiltersCotizacion,
        packingList,
        exportData
    }
}