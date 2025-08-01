import { ref, computed } from 'vue'
import { clienteService, type Cliente, type ClientesQueryParams, type PaginationInfo } from '~/services/clienteService'

export const useClientes = () => {
  // State
  const clientes = ref<Cliente[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0
  })

  // Filtros y búsqueda
  const search = ref('')
  const secondarySearch = ref('')
  const filters = ref({
    categoria: '',
    fecha_inicio: '',
    fecha_fin: ''
  })

  // Opciones de filtros
  const filterOptions = ref({
    categorias: ['Comercial', 'Industrial', 'Personal'],
    fechas: []
  })

  // Computed
  const hasData = computed(() => clientes.value.length > 0)
  const totalPages = computed(() => pagination.value.last_page)
  const currentPage = computed(() => pagination.value.current_page)
  const totalItems = computed(() => pagination.value.total)

  // Methods
  const loadClientes = async (params: ClientesQueryParams = {}) => {
    loading.value = true
    error.value = null

    try {
      // Combinar parámetros locales con los pasados
      const queryParams: ClientesQueryParams = {
        page: params.page || currentPage.value,
        limit: params.limit || pagination.value.per_page,
        search: params.search || search.value,
        categoria: params.categoria || filters.value.categoria,
        fecha_inicio: params.fecha_inicio || filters.value.fecha_inicio,
        fecha_fin: params.fecha_fin || filters.value.fecha_fin
      }

      const response = await clienteService.getClientes(queryParams)
      
      clientes.value = response.data
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err.message || 'Error al cargar clientes'
      console.error('Error loading clientes:', err)
    } finally {
      loading.value = false
    }
  }

  const loadFilterOptions = async () => {
    try {
      const options = await clienteService.getFilterOptions()
      filterOptions.value = options
    } catch (err: any) {
      console.error('Error loading filter options:', err)
      // Mantener opciones por defecto
    }
  }

  const handleSearch = async (searchTerm: string) => {
    search.value = searchTerm
    await loadClientes({ page: 1, search: searchTerm })
  }

  const handleFilterChange = async (newFilters: any) => {
    filters.value = { ...filters.value, ...newFilters }
    await loadClientes({ page: 1 })
  }

  const handlePageChange = async (page: number) => {
    await loadClientes({ page })
  }

  const createCliente = async (clienteData: Partial<Cliente>) => {
    loading.value = true
    error.value = null

    try {
      const newCliente = await clienteService.createCliente(clienteData)
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
      const updatedCliente = await clienteService.updateCliente(id, clienteData)
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
      await clienteService.deleteCliente(id)
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
      const result = await clienteService.uploadClientesFile(file)
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
      const blob = await clienteService.exportClientes({
        search: search.value,
        categoria: filters.value.categoria,
        fecha_inicio: filters.value.fecha_inicio,
        fecha_fin: filters.value.fecha_fin
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

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Error al exportar clientes'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const getClienteById = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const cliente = await clienteService.getClienteById(id)
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
    secondarySearch.value = ''
    filters.value = {
      categoria: '',
      fecha_inicio: '',
      fecha_fin: ''
    }
  }

  return {
    // State
    clientes,
    loading,
    error,
    pagination,
    search,
    secondarySearch,
    filters,
    filterOptions,

    // Computed
    hasData,
    totalPages,
    currentPage,
    totalItems,

    // Methods
    loadClientes,
    loadFilterOptions,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    createCliente,
    updateCliente,
    deleteCliente,
    uploadClientesFile,
    exportClientes,
    getClienteById,
    clearError,
    resetFilters
  }
} 