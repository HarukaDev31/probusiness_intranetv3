import { ref } from 'vue'
import { PagosService } from '~/services/cargaconsolidada/cotizacion-final/pagosService'
import type { PaginationInfo } from '~/types/data-table'

export const usePagos = () => {
    const pagos = ref<any[]>([])
    const loadingPagos = ref(false)
    const error = ref<string | null>(null)
    const paginationPagos = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    })
    const searchPagos = ref('')
    const itemsPerPagePagos = ref(100)
    const totalPagesPagos = computed(() => Math.ceil(paginationPagos.value.total / itemsPerPagePagos.value))
    const totalRecordsPagos = computed(() => paginationPagos.value.total)
    const currentPagePagos = computed(() => paginationPagos.value.current_page)
    const filtersPagos = ref<any>({})
    const filterConfigPagos = ref<any>([

        {
            key: 'estado_cotizacion_final',
            label: 'Estado de cotización',
            placeholder: 'Seleccionar estado de cotización',
            options: [
                { label: 'Todos', value: 'todos' },
                { label: 'PENDIENTE', value: 'PENDIENTE' },
                { label: 'COTIZADO', value: 'COTIZADO' },
                { label: 'PAGADO', value: 'PAGADO' },
                { label: 'AJUSTADO', value: 'AJUSTADO' },
                { label: 'SOBREPAGO', value: 'SOBREPAGO' },
            ]
        }
    ])
    const getPagos = async (id: number) => {
        try {
            loadingPagos.value = true
            const params = {
                page: currentPagePagos.value,
                per_page: itemsPerPagePagos.value,
                ...filtersPagos.value
            }
            const response = await PagosService.getPagos(id, params)
            pagos.value = response.data
            paginationPagos.value = response.pagination
        } catch (err) {
            error.value = err as string
        } finally {
            loadingPagos.value = false
        }
    }
    return {
        pagos,
        loadingPagos,
        error,
        paginationPagos,
        searchPagos,
        itemsPerPagePagos,
        totalPagesPagos,
        currentPagePagos,
        filtersPagos,
        filterConfigPagos,
        getPagos,
        totalRecordsPagos
    }
}   