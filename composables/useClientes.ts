import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ClienteService, type Cliente, type ClientesQueryParams, type PaginationInfo } from '../services/clienteService'
import type { Header } from '../types/data-table'
import { useSpinner } from '../composables/commons/useSpinner'
const { withSpinner } = useSpinner()

// Función para cargar estado desde sessionStorage
const loadStateFromStorage = () => {
  if (typeof window === 'undefined') return null
  
  const savedState = sessionStorage.getItem('clientes_state')
  if (savedState) {
    try {
      return JSON.parse(savedState)
    } catch {
      return null
    }
  }
  return null
}

// Función para guardar estado en sessionStorage
const saveStateToStorage = (state: any) => {
  if (typeof window === 'undefined') return
  
  sessionStorage.setItem('clientes_state', JSON.stringify(state))
}

export const useClientes = () => {
  // Cargar estado guardado
  const savedState = loadStateFromStorage()
  
  // Debug: ver qué se cargó desde storage
  
  if (savedState) {
    console.log('🔄 Estado restaurado desde sessionStorage:', {
      search: savedState.search,
      primarySearch: savedState.primarySearch,
      filters: savedState.filters,
      pagination: savedState.pagination
    })
  } else {
    
  }
  
  // State
  const clientes = ref<Cliente[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>(savedState?.pagination || {
    current_page: 1,
    last_page: 1,
    per_page: 100,
    total: 0,
    from: 0,
    to: 0
  })

  // Filtros y búsqueda - Restaurar desde sessionStorage si existe
  const search = ref(savedState?.search || '')
  const primarySearch = ref(savedState?.primarySearch || '')
  const filters = ref(savedState?.filters || {
    categoria: 'todos',
    fecha_inicio: '',
    fecha_fin: '',
    servicio: 'todos'
  })
  const headers = ref<Header[]>([])
  // Opciones de filtros
  const filterOptions = ref<{
    categorias: string[]
    fechas: string[]
  }>({
    categorias: ['Cliente', 'Recurrente', 'Premium', 'Inactivo'],
    fechas: []
  })

  // Computed
  const hasData = computed(() => clientes.value.length > 0)
  const totalPages = computed(() => pagination.value.last_page)
  const currentPage = computed(() => pagination.value.current_page)
  const totalItems = computed(() => pagination.value.total)
  const itemsPerPage = computed(() => {
    return typeof pagination.value.per_page === 'string' ? parseInt(pagination.value.per_page) : pagination.value.per_page
  })

  // Methods
  const loadClientes = async (params: ClientesQueryParams = {}) => {
    loading.value = true
    error.value = null

    try {
      // Combinar parámetros locales con los pasados
      const queryParams: ClientesQueryParams = {
        currentPage: params.currentPage || currentPage.value,
        itemsPerPage: params.itemsPerPage || itemsPerPage.value,
        search: params.search || search.value,
        categoria: params.categoria || filters.value.categoria,
        fecha_inicio: params.fecha_inicio || filters.value.fecha_inicio,
        fecha_fin: params.fecha_fin || filters.value.fecha_fin,
        servicio: params.servicio || filters.value.servicio
      }

      // Solo incluir parámetros que tengan valor
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof ClientesQueryParams] === '' || queryParams[key as keyof ClientesQueryParams] === undefined) {
          delete queryParams[key as keyof ClientesQueryParams]
        }
      })

      const response = await ClienteService.getClientes(queryParams)
      clientes.value = response.data
      headers.value = response.headers
      // Actualizar pagination de forma más explícita para asegurar reactividad
      pagination.value.current_page = response.pagination.current_page
      pagination.value.last_page = response.pagination.last_page
      pagination.value.per_page = response.pagination.per_page
      pagination.value.total = response.pagination.total
      pagination.value.from = response.pagination.from
      pagination.value.to = response.pagination.to

      // Guardar estado en sessionStorage
      saveStateToStorage({
        pagination: pagination.value,
        search: search.value,
        primarySearch: primarySearch.value,
        filters: filters.value
      })



      // Si la página actual es mayor que el total de páginas disponibles, 
      // cargar la primera página automáticamente
      if (pagination.value.current_page > pagination.value.last_page && pagination.value.last_page > 0) {
        await loadClientes({ currentPage: 1 })
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar clientes'
      showError(`Error al cargar clientes ${err}`)
    } finally {
      loading.value = false
    }
  }

  const loadFilterOptions = async () => {
    try {
      const options = await ClienteService.getFilterOptions()
      filterOptions.value = options
    } catch (err: any) {
      showError(`Error al cargar opciones de filtro ${err}`)
      // Mantener opciones por defecto
    }
  }

  // Timeout para el debounce de búsqueda
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  const handleSearch = async (searchTerm: string) => {
    // Actualizar el valor de búsqueda inmediatamente para que se refleje en el input
    search.value = searchTerm
    
    // Limpiar el timeout anterior si existe
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Crear un nuevo timeout que ejecutará la búsqueda después de 500ms de inactividad
    searchTimeout = setTimeout(async () => {
      await loadClientes({ currentPage: 1, search: searchTerm })
      searchTimeout = null
    }, 500)
  }

  // Función para convertir fecha de DD/MM/YYYY a YYYY-MM-DD
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ''
    const parts = dateString.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return dateString
  }

  const formatDateForBackend = (dateString: string): string => {
    if (!dateString) return ''
    const parts = dateString.split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day}/${month}/${year}`
    }
    return dateString
  }

  const handleFilterChange = async (filterType: string, value: string) => {
    // Convertir fechas de YYYY-MM-DD a DD/MM/YYYY para el backend
    let formattedValue = value

    // Manejar el valor 'todos' como vacío para el backend
    if (value === 'todos') {
      formattedValue = ''
    } else if ((filterType === 'fecha_inicio' || filterType === 'fecha_fin') && value) {
      formattedValue = formatDateForBackend(value)
    }

    filters.value = { ...filters.value, [filterType]: formattedValue }
    // Resetear a la primera página cuando se cambian los filtros
    await loadClientes({ currentPage: 1 })
  }

  const handlePageChange = async (currentPage: number) => {
    await loadClientes({ currentPage })
  }

  const handleItemsPerPageChange = async (itemsPerPage: number) => {
    // Cargar los datos con el nuevo límite
    await loadClientes({ currentPage: 1, itemsPerPage })
  }

  const createCliente = async (clienteData: Partial<Cliente>) => {
    loading.value = true
    error.value = null

    try {
      const newCliente = await ClienteService.createCliente(clienteData)
      clientes.value.unshift(newCliente)
      return { success: true, data: newCliente }
    } catch (err: any) {
      error.value = err.message || 'Error al crear cliente'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateCliente = async (id: number, clienteData: Partial<Cliente>) => {
    loading.value = true
    error.value = null

    try {
      const updatedCliente = await ClienteService.updateCliente(id, clienteData)
      const index = clientes.value.findIndex(c => c.id === id)
      if (index !== -1) {
        clientes.value[index] = updatedCliente
      }
      return { success: true, data: updatedCliente }
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar cliente'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteCliente = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      await ClienteService.deleteCliente(id)
      clientes.value = clientes.value.filter(c => c.id !== id)
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar cliente'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const uploadClientesFile = async (file: File) => {
    loading.value = true
    error.value = null

    try {
      const result = await ClienteService.uploadClientesFile(file)
      // Recargar la lista después de subir
      await loadClientes()
      return { success: true, message: result.message }
    } catch (err: any) {
      error.value = err.message || 'Error al subir archivo'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const exportClientes = async () => {
    loading.value = true
    error.value = null

    try {
      await withSpinner(async () => {
        const blob = await ClienteService.exportClientes({
          search: search.value,
          categoria: filters.value.categoria,
          fecha_inicio: filters.value.fecha_inicio,
          fecha_fin: filters.value.fecha_fin,
          servicio: filters.value.servicio
        })

        // Crear y descargar el archivo
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 'Exportando clientes...')
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Error al exportar clientes'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }
  const handleClearFilters = async () => {
    try {
      filters.value = {
        categoria: 'todos',
        fecha_inicio: '',
        fecha_fin: '',
        servicio: 'todos'
      }
      search.value = ''
      primarySearch.value = ''
      
      const response = await ClienteService.getClientes(filters.value)
      clientes.value = response.data
      pagination.value = response.pagination
      headers.value = response.headers
      
      // Guardar estado limpio en sessionStorage
      saveStateToStorage({
        pagination: pagination.value,
        search: '',
        primarySearch: '',
        filters: filters.value
      })
      
      return { success: true, data: clientes }
    } catch (err: any) {
      error.value = err.message || 'Error al limpiar filtros'
      return { success: false, error: error.value }
    }
  }

  // Global clear listener so DataTable's centralized clear triggers cliente composable clear
  if (typeof window !== 'undefined') {
    const globalClearHandler = async () => {
      try {
        filters.value = {
          categoria: 'todos',
          fecha_inicio: '',
          fecha_fin: '',
          servicio: 'todos'
        }
        search.value = ''
        primarySearch.value = ''
        await loadClientes({ currentPage: 1 })
      } catch (err) {
        console.error('Error clearing clientes filters via global event', err)
      }
    }
    onMounted(() => window.addEventListener('probusiness:clear-all-filters', globalClearHandler as EventListener))
    onBeforeUnmount(() => window.removeEventListener('probusiness:clear-all-filters', globalClearHandler as EventListener))
  }


  const getClienteById = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const cliente = await ClienteService.getClienteById(id)
      return { success: true, data: cliente }
    } catch (err: any) {
      error.value = err.message || 'Error al obtener cliente'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const resetFilters = () => {
    search.value = ''
    primarySearch.value = ''
    filters.value = {
      categoria: 'todos',
      fecha_inicio: '',
      fecha_fin: '',
      servicio: 'todos'
    }
  }

  const clearStoredState = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('clientes_state')
    }
  }

  return {
    // State
    clientes,
    loading,
    error,
    pagination,
    search,
    primarySearch,
    filters,
    filterOptions,
    headers,

    // Computed
    hasData,
    totalPages,
    currentPage,
    totalItems,
    itemsPerPage,

    // Methods
    loadClientes,
    loadFilterOptions,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    handleItemsPerPageChange,
    createCliente,
    updateCliente,
    deleteCliente,
    uploadClientesFile,
    exportClientes,
    getClienteById,
    clearError,
    resetFilters,
    handleClearFilters,
    clearStoredState
  }
} 