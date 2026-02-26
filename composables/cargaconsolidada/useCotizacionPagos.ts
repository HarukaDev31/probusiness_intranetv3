import { CotizacionPagosService } from "~/services/cargaconsolidada/cotizacion-pagosService"
import type { PaginationInfo, Header } from "~/types/data-table"

export const useCotizacionPagos = () => {
    const cotizacionPagos = ref<any[]>([])
    const loadingPagos = ref(false)
    const error = ref<string | null>(null)
    const paginationPagos = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 0,
        from: 0,
        to: 0
    })
    const route = useRoute()
    const idPagos = route.params.id as string
    const searchPagos = ref('')
    const itemsPerPagePagos = ref(100)
    const totalPagesPagos = computed(() => Math.ceil(paginationPagos.value.total / itemsPerPagePagos.value))
    const totalRecordsPagos = computed(() => paginationPagos.value.total)
    const currentPagePagos = computed(() => paginationPagos.value.current_page)
    const handleSearchPagos = async (searchTerm: string) => {
        searchPagos.value = searchTerm
        await getCotizacionPagos(Number(idPagos))
    }
    const filtersPagos = ref<Record<string, string>>({})
    const headersPagos = ref<Header[]>([])
    const getCotizacionPagos = async (id: number) => {
        loadingPagos.value = true
        error.value = null
        try {
            const route = useRoute()
            const raw = filtersPagos.value || {}
            const filters: Record<string, string> = {}
            if (raw.estado_inspeccion && raw.estado_inspeccion !== 'todos') filters.estado_inspeccion = raw.estado_inspeccion
            if (raw.estado_pago && raw.estado_pago !== 'todos') filters.estado_pago = raw.estado_pago
            const params: any = {
                search: searchPagos.value
            }
            if (Object.keys(filters).length) params.filters = filters
            const idCotizacionQuery = route.query.idCotizacion
            if (idCotizacionQuery != null && idCotizacionQuery !== '') params.id_cotizacion = idCotizacionQuery
            const response = await CotizacionPagosService.getCotizacionesPagos(id, params)
            cotizacionPagos.value = response.data ?? []
            paginationPagos.value = response.pagination
        } catch (err: any) {
            error.value = err.message || 'Error al obtener las cotizaciones de pagos'
            console.error('Error en getCotizacionPagos:', err)
        } finally {
            loadingPagos.value = false
        }
    }
    const handleSearch = async (searchTerm: string) => {
        searchPagos.value = searchTerm
        await getCotizacionPagos(Number(idPagos))
    }
    const handleFilterChange = async (key: string, value: string) => {
        filtersPagos.value = { ...filtersPagos.value, [key]: value }
        await getCotizacionPagos(Number(idPagos))
    }
    const handlePageChange = async (page: number) => {
        // set page then fetch
        paginationPagos.value.current_page = page
        await getCotizacionPagos(Number(idPagos))
    }
    const handleItemsPerPageChange = async (itemsPerPage: number) => {
        itemsPerPagePagos.value = itemsPerPage
        await getCotizacionPagos(Number(idPagos))
    }
    
    return {
        cotizacionPagos,
        loadingPagos,
        error,
        getCotizacionPagos,
        handleSearch,
        paginationPagos,
        searchPagos,
        itemsPerPagePagos,
        totalPagesPagos,
        totalRecordsPagos,
        currentPagePagos,
        filtersPagos,
        headersPagos,
        handleSearchPagos,
        handleFilterChange,
        handlePageChange,
        handleItemsPerPageChange
    }
}