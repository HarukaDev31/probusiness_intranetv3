import { ref } from 'vue'
import { VariacionService } from '../services/cargaconsolidada/clientes/variacionService'
import type { PaginationInfo } from '../types/data-table'

export const useVariacion = () => {
    const clientesVariacion = ref<any[]>([])
    const loadingVariacion = ref(false)
    const error = ref<string | null>(null)
    const paginationVariacion = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    })
    const searchVariacion = ref('')
    const itemsPerPageVariacion = ref(10)
    const totalPagesVariacion = computed(() => Math.ceil(paginationVariacion.value.total / itemsPerPageVariacion.value))
    const totalRecordsVariacion = computed(() => paginationVariacion.value.total)
    const currentPageVariacion = computed(() => paginationVariacion.value.current_page)
    const filtersVariacion = ref<any>({})
    const filterConfig = ref<any>({
    })
    const getClientesVariacion = async (id: number) => {
        try {
            loadingVariacion.value = true
            const response = await VariacionService.getClientes(id)
            clientesVariacion.value = response.data
            paginationVariacion.value = response.pagination
        } catch (err) {
            error.value = err as string
        } finally {
            loadingVariacion.value = false
        }
    }
    return {
        clientesVariacion,
        loadingVariacion,
        error,
        paginationVariacion,
        searchVariacion,
        itemsPerPageVariacion,
        totalPagesVariacion,
        currentPageVariacion,
        filtersVariacion,
        filterConfig,
        getClientesVariacion,
        totalRecordsVariacion
    }
}   