import { ref } from 'vue'
import { GeneralService } from '../services/cargaconsolidada/clientes/generalService'
import type { PaginationInfo } from '../types/data-table'

export const useGeneral = () => {
    const clientes = ref<any[]>([])
    const loadingGeneral = ref(false)
    const error = ref<string | null>(null)
    const paginationGeneral = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    })
    const searchGeneral = ref('')
    const itemsPerPageGeneral = ref(10)
    const totalPagesGeneral = computed(() => Math.ceil(paginationGeneral.value.total / itemsPerPageGeneral.value))
    const totalRecordsGeneral = computed(() => paginationGeneral.value.total)
    const currentPageGeneral = computed(() => paginationGeneral.value.current_page)
    const filtersGeneral = ref<any>({})
    const filterConfig = ref<any>({
    })
    const getClientes = async (id: number) => {
        try {
            loadingGeneral.value = true
            const response = await GeneralService.getClientes(id)
            clientes.value = response.data
            paginationGeneral.value = response.pagination
        } catch (err) {
            error.value = err as string
        } finally {
            loadingGeneral.value = false
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
        totalRecordsGeneral
    }
}   