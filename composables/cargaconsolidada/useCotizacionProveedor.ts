import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { CotizacionProveedorService } from '../../services/cargaconsolidada/cotizacion-proveedorService'
import type {
    CotizacionProveedor,
    CotizacionProveedorFilters,
    Proveedor,
    ProveedoresResponse
} from '../../types/cargaconsolidada/proveedores'
import type { FileItem } from '../../types/commons/file'
import type { FilterConfig, PaginationInfo } from '../../types/data-table'

export const    useCotizacionProveedor = () => {
    // Estado principal
    const cotizacionProveedor = ref<CotizacionProveedor[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Estados de carga específicos
    const loadingInspeccion = ref(false)
    const loadingNotas = ref(false)
    const loadingDocumentos = ref(false)

    // Configuración de filtros
    const filterConfig = ref<FilterConfig[]>([
        {
            key: 'estado_china',
            label: 'Status',
            placeholder: 'Seleccionar estado',
            options: [
                { label: 'Todos', value: 'todos' },
                { label: 'WAIT', value: 'WAIT' },
                { label: 'NC', value: 'NC' },
                { label: 'NP', value: 'NP' },
                { label: 'C', value: 'C' },
                { label: 'R', value: 'R' },
                { label: 'INSPECTION', value: 'INSPECTION' },
                { label: 'LOADED', value: 'LOADED' },
                { label: 'NO LOADED', value: 'NO LOADED' }
            ]
        }
    ])

    // Paginación
    const pagination = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 0,
        from: 0,
        to: 0
    })

    // Filtros y búsqueda
    const filters = ref<CotizacionProveedorFilters>({ estado_china: 'todos', estado_coordinacion: 'todos', estado: 'todos', fecha_inicio: '', fecha_fin: '' })
    const search = ref('')
    const itemsPerPage = ref(100)

    // Datos específicos de China
    const documentosChina = ref<FileItem[]>([])
    const inspeccionChina = ref<FileItem[]>([])
    const notasChina = ref<string>('')
    const proveedor = ref<Proveedor>({
        id: 0,
        peso: 0,
        estados: '',
        qty_box: 0,
        products: '',
        supplier: '',
        cbm_total: 0,
        estado_china: '',
        id_proveedor: 0,
        code_supplier: '',
        qty_box_china: 0,
        supplier_phone: '',
        cbm_total_china: 0,
        arrive_date_china: '',
        cliente_nombre: '',
    })

    const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
    const totalRecords = computed(() => pagination.value.total)
    const currentPage = computed(() => pagination.value.current_page)
    const hasData = computed(() => cotizacionProveedor.value.length > 0)

    const route = useRoute()

    /**
     * Obtiene las cotizaciones de proveedores
     */
    const getCotizacionProveedor = async (id: number) => {
        if (!id) return

        loading.value = true
        error.value = null
        if (!filters.value.fecha_inicio || filters.value.fecha_inicio == '') {
            //remove fecha_inicio and fecha_fin
            delete filters.value.fecha_inicio
        }
        if (!filters.value.fecha_fin || filters.value.fecha_fin == '') {
            //remove fecha_inicio and fecha_fin
            delete filters.value.fecha_fin
        }

        if (!filters.value.estado || filters.value.estado == 'todos') {
            //remove estado
            delete filters.value.estado
        }
        if (!filters.value.estado_coordinacion || filters.value.estado_coordinacion == 'todos') {
            //remove estado_coordinacion
            delete filters.value.estado_coordinacion
        }
        if (!filters.value.estado_china) {
            //remove estado_china
            delete filters.value.estado_china
        }
        try {
            const response = await CotizacionProveedorService.getCotizacionesProveedores(
                id,
                filters.value,
                search.value,
                itemsPerPage.value,
                currentPage.value
            )

            cotizacionProveedor.value = response.data
            pagination.value = response.pagination
        } catch (err: any) {
            error.value = err.message || 'Error al obtener las cotizaciones de proveedores'
            console.error('Error en getCotizacionProveedor:', err)
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene los documentos de China
     */
    const getDocumentosChina = async (id: number) => {
        if (!id) return

        loadingDocumentos.value = true
        error.value = null

        try {
            const response = await CotizacionProveedorService.getDocumentosChina(id)
            documentosChina.value = response.data
        } catch (err: any) {
            error.value = err.message || 'Error al obtener los documentos de China'
            console.error('Error en getDocumentosChina:', err)
        } finally {
            loadingDocumentos.value = false
        }
    }

    /**
     * Obtiene la información de inspección de China
     */
    const getInspeccionChina = async (id: number) => {
        if (!id) return

        loadingInspeccion.value = true
        error.value = null

        try {
            const response = await CotizacionProveedorService.getInspeccionChina(id)
            inspeccionChina.value = response.data
        } catch (err: any) {
            error.value = err.message || 'Error al obtener la información de inspección'
            console.error('Error en getInspeccionChina:', err)
        } finally {
            loadingInspeccion.value = false
        }
    }

    /**
     * Obtiene las notas de China
     */
    const getNotasChina = async (id: number) => {
        if (!id) return

        loadingNotas.value = true
        error.value = null

        try {
            const response = await CotizacionProveedorService.getNotasChina(id)
            notasChina.value = response.data.nota
        } catch (err: any) {
            error.value = err.message || 'Error al obtener las notas'
            console.error('Error en getNotasChina:', err)
        } finally {
            loadingNotas.value = false
        }
    }
    const saveNotasChina = async (data: any) => {
        if (!data) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.saveNotasChina(data)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al enviar las notas'
            console.error('Error en saveNotasChina:', err)
        } finally {
            loading.value = false
        }
    }

    /**
     * Maneja cambios en la búsqueda
     */
    const handleSearch = (value: string) => {
        search.value = value
        pagination.value.current_page = 1 // Resetear a la primera página
        getCotizacionProveedor(Number(route.params.id))
    }

    /**
     * Maneja cambios de página
     */
    const handlePageChange = (value: number) => {
        pagination.value.current_page = value
        getCotizacionProveedor(Number(route.params.id))
    }

    /**
     * Maneja cambios en el número de elementos por página
     */
    const handleItemsPerPageChange = (value: number) => {
        itemsPerPage.value = value
        pagination.value.current_page = 1 // Resetear a la primera página
        getCotizacionProveedor(Number(route.params.id))
    }

    /**
     * Maneja cambios en los filtros
     */
    const handleFilterChange = async (filterType: string, value: string) => {
        filters.value = {
            ...filters.value,
            [filterType]: value
        }
        pagination.value.current_page = 1 // Resetear a la primera página
        await getCotizacionProveedor(Number(route.params.id))
    }

    const getProveedorById = async (id: number) => {
        if (!id) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.getProveedor(id)
            proveedor.value = response.data

            return response
        } catch (err: any) {
            error.value = err.message || 'Error al obtener la cotización de proveedor'
            console.error('Error en getCotizacionProveedor:', err)
        } finally {
            loading.value = false
        }
    }
    const saveDocumentosChina = async (data: any) => {
        if (!data) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.saveDocumentosChina(data)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al enviar los documentos de China'
            console.error('Error en saveDocumentosChina:', err)
        } finally {
            loading.value = false
        }
    }
    const saveInspeccionChina = async (data: any) => {
        if (!data) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.saveInspeccionChina(data)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al enviar la inspección de China'
            console.error('Error en saveInspeccionChina:', err)
        } finally {
            loading.value = false
        }
    }
    const deleteDocumentosChina = async (id: number) => {
        if (!id) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.deleteDocumentosChina(id)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al eliminar el documento de China'
            console.error('Error en deleteDocumentosChina:', err)
        } finally {
            loading.value = false
        }
    }
    const deleteInspeccionChina = async (id: number) => {
        if (!id) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.deleteInspeccionChina(id)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al eliminar la inspección de China'
            console.error('Error en deleteInspeccionChina:', err)
        } finally {
            loading.value = false
        }
    }
    const deleteCotizacion = async (id: number) => {
        if (!id) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.deleteCotizacion(id)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al eliminar la cotización'
            console.error('Error en deleteCotizacion:', err)
        } finally {
            loading.value = false
        }
    }
    const updateProveedor = async (data: any) => {
        if (!data) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.updateProveedor(data)
            return response

        } catch (err: any) {
            error.value = err.message || 'Error al actualizar el proveedor'
            console.error('Error en updateProveedor:', err)
        } finally {
            loading.value = false
        }
    }
    const updateProveedorEstado = async (data: any) => {
        if (!data) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.updateProveedorEstado(data)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al actualizar el estado del proveedor'
            console.error('Error en updateProveedorEstado:', err)
        } finally {
            loading.value = false
        }
    }
    const resetFiltersProveedor = () => {
        filters.value = {
            fecha_inicio: '',
            fecha_fin: '',
            estado: 'todos',
            estado_coordinacion: 'todos',
            estado_china: 'todos'
        }
    }

    // Global clear listener: respond to centralized DataTable clear action
    if (typeof window !== 'undefined') {
        const globalClearHandler = () => {
            try {
                filters.value = {
                    fecha_inicio: '',
                    fecha_fin: '',
                    estado: 'todos',
                    estado_coordinacion: 'todos',
                    estado_china: 'todos'
                }
                pagination.value.current_page = 1
                const id = Number(route.params.id)
                if (id) getCotizacionProveedor(id)
            } catch (err) {
                console.error('Error handling global clear for cotizacion proveedor', err)
            }
        }
        onMounted(() => window.addEventListener('probusiness:clear-all-filters', globalClearHandler as EventListener))
        onBeforeUnmount(() => window.removeEventListener('probusiness:clear-all-filters', globalClearHandler as EventListener))
    }
    const exportData = async () => {
        loading.value = true
        try {
            const blob = await CotizacionProveedorService.downloadEmbarque(Number(route.params.id), filters.value)
            const url = window.URL.createObjectURL(new Blob([blob]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `cotizacion_proveedor_${route.params.id}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error('Error al exportar datos:', error)
        }
    }
    const refreshRotuladoStatus = async (id: number) => {
        if (!id) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.refreshRotuladoStatus(id)
            return response
        }
        catch (error) {
            error.value = error.message || 'Error al actualizar el estado del proveedor'
            console.error('Error en refreshRotuladoStatus:', error)
        } finally {
            loading.value = false
        }
    }
    const updateArriveDate = async (idProveedor: number, arrive_date: string) => {
        if (!idProveedor) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.updateArriveDate(idProveedor, { arrive_date })
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al actualizar arrive_date'
            console.error('Error en updateArriveDate:', err)
        } finally {
            loading.value = false
        }
    }
    const getProveedoresByCotizacion = async (id: number) => {
        if (!id) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.getProveedoresByCotizacion(id)
            return response
        }
        catch (error) {
            error.value = error.message || 'Error al obtener los proveedores por cotización'
            console.error('Error en getProveedoresByCotizacion:', error)
        } finally {
            loading.value = false
        }
    }//downloadEmbarque apply same filters
    const downloadEmbarque = async (id: number) => {
        if (!id) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.downloadEmbarque(id, filters.value)
            return response
        }
        catch (error) {
            error.value = error.message || 'Error al descargar el embarque'
            console.error('Error en downloadEmbarque:', error)
        } finally {
            loading.value = false
        }
    }

    const sendRotulado = async (data: { idCotizacion: number, proveedores: Array<{ id: number, tipo_rotulado: string, force_send: number }> }) => {
        if (!data.idCotizacion || !data.proveedores.length) return
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionProveedorService.sendRotulado(data)
            return response
        }
        catch (error) {
            error.value = error.message || 'Error al enviar rotulado'
            console.error('Error en sendRotulado:', error)
        } finally {
            loading.value = false
        }
    }

    return {
        // Estado principal
        cotizacionProveedor,
        loading,
        error,
        hasData,

        // Estados de carga específicos
        loadingInspeccion,
        loadingNotas,
        loadingDocumentos,

        // Configuración
        filterConfig,
        pagination,
        search,
        itemsPerPage,

        // Computed properties
        totalPages,
        totalRecords,
        currentPage,

        // Datos específicos
        documentosChina,
        inspeccionChina,
        notasChina,
        proveedor,


        // Métodos principales
        getCotizacionProveedor,
        getDocumentosChina,
        getInspeccionChina,
        getNotasChina,

        // Métodos de manejo de UI
        handleSearch,
        handlePageChange,
        handleItemsPerPageChange,
        handleFilterChange,
        getProveedorById,
        saveDocumentosChina,
        saveInspeccionChina,
        deleteDocumentosChina,
        deleteInspeccionChina,
        saveNotasChina,
        deleteCotizacion,
        updateProveedor,
        updateProveedorEstado,
        updateArriveDate,
        resetFiltersProveedor,
        exportData,
        refreshRotuladoStatus,
        getProveedoresByCotizacion,
        downloadEmbarque,
        sendRotulado
    }
}