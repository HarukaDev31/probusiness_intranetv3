import { CotizacionPagosService } from "~/services/cargaconsolidada/cotizacion-pagosService"
import type { Filters, PaginationInfo, TableColumn } from "~/types/data-table"

export const useCotizacionPagos = () => {
    const cotizacionPagos = ref<any[]>([])
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
    const filters = ref<Filters>({ estado_china: 'todos' })
    const headers = ref<TableColumn<any>[]>([])
    const getCotizacionPagos = async (id: number) => {
        loading.value = true
        error.value = null
        try {
            const response = await CotizacionPagosService.getCotizacionesPagos(id)
            cotizacionPagos.value = response.data
            pagination.value = response.pagination
        } catch (err: any) {
            error.value = err.message || 'Error al obtener las cotizaciones de pagos'
            console.error('Error en getCotizacionPagos:', err)
        } finally {
            loading.value = false
        }
    }

    return {
        cotizacionPagos,
        loading,
        error,
        getCotizacionPagos,
        pagination,
        search,
        itemsPerPage,
        totalPages,
        totalRecords,
        currentPage,
        filters,
        headers
    }
}