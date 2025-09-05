import { ref } from 'vue'
import { GeneralService } from '~/services/cargaconsolidada/clientes/generalService'
import type { Header, PaginationInfo } from '~/types/data-table'

export const useGeneral = () => {
    const headers = ref<Header[]>([])
    const carga = ref<string | null>(null)
    const route = useRoute()
    const id = route.params.id
    const clientes = ref<any[]>([])
    const loadingGeneral = ref(false)
    const error = ref<string | null>(null)
    const paginationGeneral = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 0,
        from: 0,
        to: 0
    })
    const loadingHeaders = ref(false)
    const searchGeneral = ref('')
    const itemsPerPageGeneral = ref(100)
    const totalPagesGeneral = computed(() => Math.ceil(paginationGeneral.value.total / itemsPerPageGeneral.value))
    const totalRecordsGeneral = computed(() => paginationGeneral.value.total)
    const currentPageGeneral = computed(() => paginationGeneral.value.current_page)
    const filtersGeneral = ref<any>({})
    const filterConfig = ref<any>({
    })
    const handlePageGeneralChange = (page: number) => {
        paginationGeneral.value.current_page = page
        getClientes(Number(id))
    }
    const handleItemsPerPageChangeGeneral = (itemsPerPage: number) => {
        itemsPerPageGeneral.value = itemsPerPage
        getClientes(Number(id))
    }
    const handleFilterChangeGeneral = (filter: any) => {
        filtersGeneral.value = filter
        getClientes(Number(id))
    }
    const handleSearchGeneral = (search: string) => {
        searchGeneral.value = search
        getClientes(Number(id))
    }
    const getClientes = async (id: number) => {
        try {
            loadingGeneral.value = true
            const response = await GeneralService.getClientes(id,
                filtersGeneral.value,
                searchGeneral.value,
                itemsPerPageGeneral.value,
                currentPageGeneral.value
            )
            clientes.value = response.data
            paginationGeneral.value = response.pagination
        } catch (err) {
            error.value = err as string
        } finally {
            loadingGeneral.value = false
        }
    }
    const updateEstadoCliente = async (data: any) => {
        try {
            const response = await GeneralService.updateEstadoCliente(data)
            return response
        } catch (err) {
            error.value = err as string
        }
    }
    const getHeaders = async (id: number) => {
        try {
            loadingHeaders.value = true
            const response = await GeneralService.getHeaders(id)
            headers.value = response.data
            carga.value = response.carga
        } catch (err) {
            error.value = err as string
        } finally {
            loadingHeaders.value = false
            }
    }
    return {
        clientes,
        loadingGeneral,
        error,
        paginationGeneral,
        searchGeneral,
        itemsPerPageGeneral,
        totalPagesGeneral,
        currentPageGeneral,
        filtersGeneral,
        filterConfig,
        getClientes,
        totalRecordsGeneral,
        updateEstadoCliente,
        handlePageGeneralChange,
        handleItemsPerPageChangeGeneral,
        handleFilterChangeGeneral,
        handleSearchGeneral,
        getHeaders,
        headers,
        carga,
        loadingHeaders
    }
}   