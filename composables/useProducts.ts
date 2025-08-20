import type { Product, ProductMapped, ProductFilters, ProductResponse, ProductsServiceResponse, FilterOptions, Pagination } from '../types/product'
import type { Header } from '../types/data-table'
import {ProductService} from '../services/productService'

export const useProducts = () => {
  const products = ref<ProductMapped[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalRecords = ref(0)
  const currentPage = ref(1)
  const itemsPerPage = ref(100)
  const totalPages = ref(0)
  const search = ref('')
  const headers = ref<Header[]>([])

  // Función para mapear productos de la API al formato del frontend
  const mapProduct = (product: Product): ProductMapped => {
    const mapped = {
      id: product.id,
      nombreComercial: product.nombre_comercial,
      codigo: product.item,
      foto: product.foto || undefined,
      caracteristicas: product.caracteristicas,
      descripcion: product.caracteristicas, // Usar características como descripción
      rubro: product.rubro,
      tipoProducto: product.tipo_producto,
      unidadComercial: product.unidad_comercial,
      precioExw: parseFloat(product.precio_exw),
      subpartida: product.subpartida,
      campana: product.tipo || 'Sin campaña', // Usar tipo como campaña
      entidad_id: parseInt(product.entidad_id) || 0,
      tipo_etiquetado_id: parseInt(product.tipo_etiquetado_id) || 0,
      antidumping_value: product.antidumping_value || '',
      cargaContenedor: product.carga_contenedor,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }
    return mapped
  }
  
  // Filtros y búsqueda
  const searchQuery = ref('')
  const filters = ref<ProductFilters>({})
  const filterOptions = ref<FilterOptions>({
    rubros: [],
    tiposProducto: [],
    campanas: []
  })

  // Computed properties
  const hasProducts = computed(() => products.value.length > 0)
  const isEmpty = computed(() => !loading.value && products.value.length === 0)
  const canLoadMore = computed(() => currentPage.value < totalPages.value)

  // Métodos
  const loadProducts = async (params: {
    page?: number
    limit?: number
    search?: string
    filters?: ProductFilters
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) => {
    loading.value = true
    error.value = null

    try {

      const response: ProductsServiceResponse = await ProductService.getProducts({
        page: params.page || currentPage.value,
        limit: params.limit || itemsPerPage.value,
        search: params.search || searchQuery.value,
        filters: params.filters || filters.value,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
      })
      console.log('Response:', response)


      if (response.success) {
        // Mapear productos de la API al formato del frontend
        products.value = response.data.map(mapProduct)
        
        // Usar datos de paginación real
        if (response.pagination) {
          totalRecords.value = parseInt(response.pagination.total.toString())
          currentPage.value = parseInt(response.pagination.current_page.toString())
          totalPages.value = parseInt(response.pagination.last_page.toString())
          itemsPerPage.value = parseInt(response.pagination.per_page.toString())
        } else {
          // Fallback si no hay paginación
          totalRecords.value = response.data.length
          currentPage.value = 1
          totalPages.value = 1
          itemsPerPage.value = response.data.length
        }
        console.log('Headers:', response.headers)
        headers.value = response.headers
      } else {
        error.value = response.error || 'Error al cargar productos'
        products.value = []
        console.log('Error loading products:', response.error)
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error loading products:', err)
      products.value = []
    } finally {
      loading.value = false
      console.log('Loading finished. Products count:', products.value.length)
    }
  }

  const loadFilterOptions = async () => {
    try {
      console.log('Loading filter options...')
      const options = await ProductService.getFilterOptions()
      console.log('Filter options response:', options)
      filterOptions.value = options
    } catch (err) {
      console.error('Error loading filter options:', err)
    }
  }

  const searchProducts = async () => {
    currentPage.value = 1
    await loadProducts()
  }
  const handleSearch = async (searchTerm: string) => {
    search.value = searchTerm
    console.log('Search term:', searchTerm)
    await loadProducts({ page: 1, search: searchTerm })
  }
  const applyFilters = async () => {
    currentPage.value = 1
    await loadProducts()
  }

  const clearFilters = async () => {
    filters.value = {}
    searchQuery.value = ''
    currentPage.value = 1
    await loadProducts()
  }

  const loadMore = async () => {
    if (canLoadMore.value) {
      currentPage.value++
      await loadProducts()
    }
  }

  const getProductById = async (id: number): Promise<Product | null> => {
    try {
      const response: ProductResponse = await ProductService.getProductById(id)
      
      if (response.success && response.data) {
        return response.data
      } else {
        error.value = response.error || 'Error al obtener el producto'
        return null
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error getting product:', err)
      return null
    }
  }

  const createProduct = async (product: Omit<Product, 'id'>): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response: ProductResponse = await ProductService.createProduct(product)
      
      if (response.success) {
        await loadProducts() // Recargar la lista
        return true
      } else {
        error.value = response.error || 'Error al crear el producto'
        return false
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error creating product:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (id: number, product: Partial<Product>): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      // Mapear solo los campos que acepta el servicio de actualización
      const updateData = {
        link: product.link,
        arancel_sunat: product.arancel_sunat,
        arancel_tlc: product.arancel_tlc || undefined,
        correlativo: product.correlativo || undefined,
        antidumping: product.antidumping || undefined,
        antidumping_value: product.antidumping_value,
        tipo_producto: product.tipo_producto,
        entidad_id: product.entidad_id ? parseInt(product.entidad_id) : undefined,
        etiquetado: product.etiquetado || undefined,
        tipo_etiquetado_id: product.tipo_etiquetado_id ? parseInt(product.tipo_etiquetado_id) : undefined,
        doc_especial: product.doc_especial || undefined,
        tiene_observaciones: product.tiene_observaciones,
        observaciones: product.observaciones
      }
      const response: ProductResponse = await ProductService.updateProduct(id, updateData)
      
      if (response.success) {
        await loadProducts() // Recargar la lista
        return true
      } else {
        error.value = response.error || 'Error al actualizar el producto'
        return false
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error updating product:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: number): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await ProductService.deleteProduct(id)
      
      if (response.success) {
        await loadProducts() // Recargar la lista
        return true
      } else {
        error.value = response.error || 'Error al eliminar el producto'
        return false
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error deleting product:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const exportProducts = async (format: 'excel' | 'csv' | 'pdf' = 'excel'): Promise<boolean> => {
    try {
      const response = await ProductService.exportProducts({
        format,
        filters: filters.value,
        search: searchQuery.value
      })

      if (response.success && response.data) {
        // Crear y descargar el archivo
        const url = window.URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        const extension = format === 'excel' ? 'xlsx' : format
        link.download = `productos_${new Date().toISOString().split('T')[0]}.${extension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        return true
      } else {
        error.value = response.error || 'Error al exportar productos'
        return false
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error exporting products:', err)
      return false
    }
  }
  const importExcel = async (file: File): Promise<{
    success: boolean
    message: string
  }> => {
    try {                                                                                                 
      const response = await ProductService.importExcel(file)
      return response
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error importing Excel:', err)
      return { success: false, message: 'Error al importar el archivo' }
    }
  }
  const deleteExcel = async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await ProductService.deleteExcel(id)
      return response
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error deleting Excel:', err)
      return { success: false, message: 'Error al eliminar el archivo' }
    }
  }
  const getExcelsList = async (): Promise<{
    success: boolean;
    data: {
      id: number;
      nombre_archivo: string;
      cantidad_rows: number;
      created_at: string;
      ruta_archivo: string;
    }[]
  }> => { 
    try {
      const response = await ProductService.getExcelsList()
      return response
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error getting Excel list:', err)
      return { success: false, data: [] }
    }
  }
  const resetState = () => {
    products.value = []
    loading.value = false
    error.value = null
    totalRecords.value = 0
    currentPage.value = 1
    totalPages.value = 0
    searchQuery.value = ''
    filters.value = {}
  }

  return {
    // State
    products: readonly(products),
    loading: readonly(loading),
    error: readonly(error),
    totalRecords: readonly(totalRecords),
    currentPage: readonly(currentPage),
    itemsPerPage: readonly(itemsPerPage),
    totalPages: readonly(totalPages),
    searchQuery,
    filters,
    filterOptions: readonly(filterOptions),

    // Computed
    hasProducts,
    isEmpty,
    canLoadMore,

    // Methods
    loadProducts,
    loadFilterOptions,
    searchProducts,
    applyFilters,
    clearFilters,
    loadMore,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    exportProducts,
    resetState,
    handleSearch,
    importExcel,
    deleteExcel,
    headers,
    getExcelsList
  }
} 