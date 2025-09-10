import type { TableColumn } from '@nuxt/ui'
import { ref, computed } from 'vue'
import { PagosService } from '~/services/curso/pagosService'
import type { CursosFilters, PaginationInfo, CursosDetalleResponse, CursoItem, DatosClientePorPedido, PagoDetalle } from '~/types/cursos/cursos'
import type { FilterConfig } from '~/types/data-table'


export const usePagos = () => {
    const pagosData = ref<CursoItem[]>([])
    const loadingPagos = ref(false)
    const error = ref<string | null>(null)
    const filtersPagos = ref<CursosFilters>({})
    const pagination = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    })
    const searchQueryPagos = ref('')
    const itemsPerPagePagos = ref(100)
    const currentPagePagos = ref(1)
    const filterConfigPagos = ref<FilterConfig[]>([
        {
            key: 'estados_pago',
            label: 'Estado de pago',
            placeholder: 'Seleccionar estado de pago',
            options: [
                { label: 'Todos', value: 'todos' },
                { label: 'Pendiente', value: 'PENDIENTE' },
                { label: 'Adelanto', value: 'ADELANTO' },
                { label: 'Pagado', value: 'PAGADO' },
                { label: 'Sobrepago', value: 'SOBREPAGO' }
            ]
        },
        {
            key: 'campanas',
            label: 'Campaña',
            placeholder: 'Seleccionar campaña',
            options: []
        },
        {
            key: 'fecha_inicio',
            label: 'Fecha de inicio',
            placeholder: 'Seleccionar fecha de inicio',
            options: [
                { label: 'Todos', value: 'todos' }
            ]
        },
        {
            key: 'fecha_fin',
            label: 'Fecha de fin',
            placeholder: 'Seleccionar fecha de fin',
            options: [
                { label: 'Todos', value: 'todos' }
            ]
        },
        {
            key: 'tipo_curso',
            label: 'Tipo de curso',
            placeholder: 'Seleccionar tipo de curso',
            options: [
                { label: 'Virtual', value: '0' },
                { label: 'En vivo', value: '1' }
            ]
        },
    ])

    // Método principal para cargar cursos
    const loadPagos = async (params: {
        page?: number
        limit?: number
        search?: string
        filters?: CursosFilters
    } = {}) => {
        loadingPagos.value = true
        error.value = null
        try {
            // Agregar búsqueda si existe
            if (searchQueryPagos.value.trim()) {
                params.search = searchQueryPagos.value.trim()
            }
            const mergedFilters = {
                ...filtersPagos.value,
                ...(params.filters || {}),
                search: params.search ?? searchQueryPagos.value,
                page: params.page ?? currentPagePagos.value,
                limit: params.limit ?? itemsPerPagePagos.value
            }
            const response = await PagosService.getCursosPagos(mergedFilters)
            pagosData.value = response.data
            console.log(pagosData.value)
            pagination.value = response.pagination
            totalAmountPagos.value = response.total_amount
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Error al obtener datos de pagos'
            // showError(`Error al obtener datos de cursos ${err}`) // Si tienes showError, descomenta
        } finally {
            loadingPagos.value = false
        }
    }



    // Handlers
    const handleSearchPagos = async (searchTerm: string) => {
        searchQueryPagos.value = searchTerm
        console.log('Search term:', searchTerm)
        currentPagePagos.value = 1
        await loadPagos({ page: 1, search: searchTerm })
    }

    const handleFilterChangePagos = async (key: string, value: any) => {
        // Si el value es un objeto con propiedad value, extrae el value
        const realValue = (typeof value === 'object' && value !== null && 'value' in value) ? value.value : value
        filtersPagos.value = { ...filtersPagos.value, [key]: realValue }
        console.log('Updated filters:', filtersPagos.value)
        currentPagePagos.value = 1
        await loadPagos({ page: 1, filters: filtersPagos.value })
    }

    const handlePageChangePagos = async (page: number) => {
        currentPagePagos.value = page
        await loadPagos({ page })
    }

    const handleItemsPerPageChangePagos = async (limit: number) => {
        itemsPerPagePagos.value = limit
        currentPagePagos.value = 1
        await loadPagos({ page: 1, limit })
    }

    const clearFiltersPagos = async () => {
        filtersPagos.value = {}
        searchQueryPagos.value = ''
        currentPagePagos.value = 1
        await loadPagos({ page: 1 })
    }

    // Otros métodos
    const getPagoById = (id: number): CursoItem | undefined => {
        try {
            return pagosData.value.find(pago => pago.ID_Pedido_Curso === id)
        } catch (error) {
            console.error('Error al obtener pago por ID:', error)
            return undefined
        }
    }


    // Computed
    const hasDataPagos = computed(() => pagosData.value.length > 0)
    const totalPagesPagos = computed(() => Math.ceil(pagination.value.total / itemsPerPagePagos.value))
    const totalRecordsPagos = computed(() => pagination.value.total)
    const totalAmountPagos = ref(0)
    const registrarPago = async (formData: FormData) => {
        try{    
            const response = await PagosService.registrarPago(formData)
            return response
        }catch(err){
            error.value = err as string
        }
    }
    const deletePago = async (id: number) => {
        try{
            const response = await PagosService.deletePago(id)
            return response
        }catch(err){
            error.value = err as string
        }
    }
    return {
        pagosData,
        loadingPagos,
        error,
        pagination,
        filtersPagos,
        filterConfigPagos,
        searchQueryPagos,
        currentPagePagos,
        itemsPerPagePagos,
        loadPagos,
        handleSearchPagos,
        handleFilterChangePagos,
        handlePageChangePagos,
        handleItemsPerPageChangePagos,
        clearFiltersPagos,
        getPagoById,
        hasDataPagos,
        totalPagesPagos,
        totalRecordsPagos,
        totalAmountPagos,
        registrarPago,
        deletePago,
    }
}