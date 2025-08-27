import type { TableColumn } from '@nuxt/ui'
import { ref, computed } from 'vue'
import { CursosService } from '~/services/cursosService'
import type { CursosFilters, PaginationInfo, CursosDetalleResponse, CursoItem, DatosClientePorPedido } from '~/types/cursos/cursos'
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
    const searchQuery = ref('')
    const itemsPerPage = ref(10)
    const currentPage = ref(1)
    const filterConfig = ref<FilterConfig[]>([
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
                { label: 'Virtual', value: 0 },
                { label: 'En vivo', value: 1 }
            ]
        },
    ])

    // Método principal para cargar cursos
    const loadCursos = async (params: {
        page?: number
        limit?: number
        search?: string
        filters?: CursosFilters
    } = {}) => {
        loading.value = true
        error.value = null
        try {
            // Agregar búsqueda si existe
            if (searchQuery.value.trim()) {
                params.search = searchQuery.value.trim()
            }
            const mergedFilters = {
                ...filters.value,
                ...(params.filters || {}),
                search: params.search ?? searchQuery.value,
                page: params.page ?? currentPage.value,
                limit: params.limit ?? itemsPerPage.value
            }
            const response = await CursosService.getCursos(mergedFilters)
            cursosData.value = response.data
            pagination.value = response.pagination
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Error al obtener datos de cursos'
            // showError(`Error al obtener datos de cursos ${err}`) // Si tienes showError, descomenta
        } finally {
            loading.value = false
        }
    }



    // Handlers
    const handleSearch = async (searchTerm: string) => {
        searchQuery.value = searchTerm
        console.log('Search term:', searchTerm)
        currentPage.value = 1
        await loadCursos({ page: 1, search: searchTerm })
    }

    const handleFilterChange = async (key: string, value: any) => {
        // Si el value es un objeto con propiedad value, extrae el value
        const realValue = (typeof value === 'object' && value !== null && 'value' in value) ? value.value : value
        filters.value = { ...filters.value, [key]: realValue }
        console.log('Updated filters:', filters.value)
        currentPage.value = 1
        await loadCursos({ page: 1, filters: filters.value })
    }

    const handlePageChange = async (page: number) => {
        currentPage.value = page
        await loadCursos({ page })
    }

    const handleItemsPerPageChange = async (limit: number) => {
        itemsPerPage.value = limit
        currentPage.value = 1
        await loadCursos({ page: 1, limit })
    }

    const clearFilters = async () => {
        filters.value = {}
        searchQuery.value = ''
        currentPage.value = 1
        await loadCursos({ page: 1 })
    }

    // Otros métodos
    const getCursoById = (id: number): CursoItem | undefined => {
        try {
            return cursosData.value.find(curso => curso.ID_Pedido_Curso === id)
        } catch (error) {
            console.error('Error al obtener curso por ID:', error)
            return undefined
        }
    }

    //Método para cargar datos del cliente por pedido
    const cargarDatosClientePorPedido = async (idPedido: number): Promise<DatosClientePorPedido | null> => {
        try {
            const response = await CursosService.getDatosClientePorPedido(idPedido)
            // Si la respuesta es { status: "success", data: {...} }
            return response.data ?? null
        } catch (error) {
            console.error('Error al obtener datos del cliente:', error)
            return null
        }
    }
    const editarDatosCliente = async (id: number, datos: Partial<DatosClientePorPedido>) => {
        try {
            const response = await CursosService.actualizarDatosCliente(id, datos)
            return response
        } catch (error) {
            console.error('Error al editar datos del cliente:', error)
            throw error
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
            // showError(`Error al obtener detalle ${err}`)
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
            throw err
        }
    }

    const exportData = async () => {
        try {
            await CursosService.exportCursos(filters.value)
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Error al exportar datos'
            console.error('Error al exportar datos:', err)
            throw err
        }
    }

    const getFiltros = async () => {
        const response = await CursosService.getFiltros()
        return response
    }

    // Computed
    const hasData = computed(() => cursosData.value.length > 0)
    const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
    const totalRecords = computed(() => pagination.value.total)

    return {
        cursosData,
        loading,
        error,
        pagination,
        filters,
        filterConfig,
        searchQuery,
        currentPage,
        itemsPerPage,
        loadCursos,
        fetchCursosData,
        handleSearch,
        handleFilterChange,
        handlePageChange,
        handleItemsPerPageChange,
        clearFilters,
        getCursoDetalle,
        getCursoById,
        cargarDatosClientePorPedido,
        editarDatosCliente,
        updateCurso,
        exportData,
        getFiltros,
        hasData,
        totalPages,
        totalRecords
    }
}