import { ref } from 'vue'
import { VariacionService } from '../services/cargaconsolidada/clientes/variacionService'
import type { PaginationInfo } from '../types/data-table'
import { useRoute } from '#app'
import { useSpinner } from '../composables/commons/useSpinner'
const { withSpinner } = useSpinner()

export const useVariacion = () => {
    const route = useRoute()
    const id = route.params.id
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
    const itemsPerPageVariacion = ref(100)
    const totalPagesVariacion = computed(() => Math.ceil(paginationVariacion.value.total / itemsPerPageVariacion.value))
    const totalRecordsVariacion = computed(() => paginationVariacion.value.total)
    const currentPageVariacion = computed(() => paginationVariacion.value.current_page)
    const filtersVariacion = ref<any>({})
    const filterConfig = ref<any>({
    })
    const handlePageVariacionChange = (page: number) => {
        paginationVariacion.value.current_page = page
        getClientesVariacion(Number(id))
    }
    const handleItemsPerPageChangeVariacion = (itemsPerPage: number) => {
        itemsPerPageVariacion.value = itemsPerPage
        getClientesVariacion(Number(id))
    }
    const handleFilterChangeVariacion = (filter: any) => {
        filtersVariacion.value = filter
        getClientesVariacion(Number(id))
    }
    const handleSearchVariacion = (search: string) => {
        searchVariacion.value = search
        getClientesVariacion(Number(id))
    }
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
    const updateVolumenSelected = async (data: any) => {
        try {
            const response = await VariacionService.updateVolSelected(data)
            return response
        } catch (err) {
            error.value = err as string
        }
    }
    const exportData = async () => {
        error.value = null
        try {
            await withSpinner(async () => {
                const blob = await VariacionService.exportClientes(Number(id))
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `clientes_variacion_${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            })
        } catch (err) {
            error.value = err as string
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
        totalRecordsVariacion,
        handlePageVariacionChange,
        handleItemsPerPageChangeVariacion,
        handleFilterChangeVariacion,
        handleSearchVariacion,
        updateVolumenSelected,
        exportData
    }
}   