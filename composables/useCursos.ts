import type { TableColumn } from '@nuxt/ui'
import { ref, computed } from 'vue'
import { CursosService } from '~/services/cursosService'
import type { CursosFilters, PaginationInfo, CursosDetalleResponse, CursoItem } from '~/types/cursos/cursos'
import type { FilterConfig } from '~/types/data-table'


export const useCursos = () => {
    const cursosData = ref<CursoItem[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const filters = ref<CursosFilters>({})
    const pagination = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    })
    const search = ref('')
    const itemsPerPage = ref(10)
    const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
    const totalRecords = computed(() => pagination.value.total)
    const currentPage = computed(() => pagination.value.current_page)
    const filterConfig = ref<FilterConfig[]>([
        {
            key: 'estado_pago',
            label: 'Estado de pago',
            placeholder: 'Seleccionar estado de pago',
            options: [
                { label: 'Todos', value: 'todos' },
                //PENDIENTE ADELANTO PAGADO SOBREPAGO ,
                { label: 'Pendiente', value: 'PENDIENTE' },
                { label: 'Adelanto', value: 'ADELANTO' },
                { label: 'Pagado', value: 'PAGADO' },
                { label: 'Sobrepago', value: 'SOBREPAGO' },
            ]
        },
        {
            key: 'campana',
            label: 'Campaña',
            placeholder: 'Seleccionar campaña',
            options: [


            ]
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
        }
    ]
    )
    const fetchCursosData = async (customFilters?: CursosFilters, page: number = 1, perPage: number = 10) => {
        loading.value = true
        error.value = null

        try {
            const mergedFilters = { ...filters.value, ...customFilters, page, limit: perPage }
            const response = await CursosService.getCursos(mergedFilters)
            cursosData.value = response.data
            pagination.value = response.pagination
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Error al obtener datos de cursos'
            console.error('Error al obtener datos de cursos:', err)
        }
    }

    const getCursoDetalle = async (id: number): Promise<CursosDetalleResponse> => {
        loading.value = true
        error.value = null

        try {
            const response = await CursosService.getCursoDetalle(id)
            return response
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Error al obtener detalle'
            console.error('Error al obtener detalle:', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    const updateCurso = async (id: number, curso: CursoItem) => {
        try {
            await CursosService.updateCurso(id, curso)
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Error al actualizar curso'
            console.error('Error al actualizar curso:', err)
            throw err
        }
    }
    const exportData = async () => {
        try {
            const response = await CursosService.exportCursos(filters.value)
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Error al exportar datos'
            console.error('Error al exportar datos:', err)
            throw err
        }
    }
    const updateFilters = (newFilters: Partial<CursosFilters>) => {
        filters.value = { ...filters.value, ...newFilters }
    }
    const clearFilters = () => {
        filters.value = {}
    }
    const getFiltros = async () => {
        const response = await CursosService.getFiltros()
        return response
    }

    return {
        cursosData,
        loading,
        error,
        pagination,
        filters,
        filterConfig,
        fetchCursosData,
        getCursoDetalle,
        updateCurso,
        exportData,
        updateFilters,
        clearFilters,
        totalPages,
        totalRecords,
        currentPage,
        itemsPerPage,
        search,
        getFiltros
    }
}
