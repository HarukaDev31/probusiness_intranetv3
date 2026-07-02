import { ref, reactive, computed } from 'vue'
import { InspeccionadosService } from '~/services/cargaconsolidada/inspeccionadosService'
import type { PaginationInfo } from '~/types/data-table'

type PaginationState = PaginationInfo & { itemsPerPage: number }

export const useInspeccionados = () => {
    const inspeccionados = ref<any[]>([])
    const loading        = ref(false)
    const error          = ref<string | null>(null)
    const search         = ref('')
    const filters        = ref<Record<string, string>>({})

    const pagination = reactive<PaginationState>({
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 0,
        from: 0,
        to: 0,
        itemsPerPage: 100,
    })

    const totalPages   = computed(() => pagination.last_page)
    const totalRecords = computed(() => pagination.total)
    const currentPage  = computed(() => pagination.current_page)
    const itemsPerPage = computed(() => pagination.itemsPerPage)

    const getInspeccionados = async () => {
        loading.value = true
        error.value   = null
        try {
            const activeFilters: Record<string, string> = {}
            for (const [k, v] of Object.entries(filters.value)) {
                if (v && v !== 'todos') activeFilters[k] = v
            }
            const response = await InspeccionadosService.getInspeccionados({
                search:  search.value,
                page:    pagination.current_page,
                limit:   pagination.itemsPerPage,
                filters: activeFilters,
            })
            inspeccionados.value = response.data ?? []
            Object.assign(pagination, response.pagination)
            if (response.pagination?.per_page != null) {
                pagination.itemsPerPage = response.pagination.per_page
            }
        } catch (err: any) {
            error.value = err.message || 'Error al obtener los inspeccionados'
        } finally {
            loading.value = false
        }
    }

    const handleSearch = async (term: string) => {
        search.value = term
        pagination.current_page = 1
        await getInspeccionados()
    }

    const handlePageChange = async (page: number) => {
        pagination.current_page = page
        await getInspeccionados()
    }

    const handleItemsPerPageChange = async (items: number) => {
        pagination.itemsPerPage = items
        pagination.current_page = 1
        await getInspeccionados()
    }

    const handleFilterChange = async (key: string, value: string) => {
        filters.value = { ...filters.value, [key]: value }
        pagination.current_page = 1
        await getInspeccionados()
    }

    return {
        inspeccionados,
        loading,
        error,
        search,
        itemsPerPage,
        filters,
        pagination,
        totalPages,
        totalRecords,
        currentPage,
        getInspeccionados,
        handleSearch,
        handlePageChange,
        handleItemsPerPageChange,
        handleFilterChange,
    }
}
