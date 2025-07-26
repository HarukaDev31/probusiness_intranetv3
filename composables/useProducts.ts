import type { Product, ProductMapped, ProductFilters, ProductResponse, ProductsServiceResponse, FilterOptions, Pagination } from '~/types/product'
import ProductService from '~/services/productService'

export const useProducts = () => {
  const products = ref<ProductMapped[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalRecords = ref(0)
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const totalPages = ref(0)

  // Función para mapear productos de la API al formato del frontend
  const mapProduct = (product: Product): ProductMapped => {
    console.log('Mapping product:', product)
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
      cargaContenedor: product.carga_contenedor,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }
    console.log('Mapped product:', mapped)
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
      console.log('Loading products with params:', params)
      const productService = ProductService.getInstance()
      const response: ProductsServiceResponse = await productService.getProducts({
        page: params.page || currentPage.value,
        limit: params.limit || itemsPerPage.value,
        search: params.search || searchQuery.value,
        filters: params.filters || filters.value,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
      })

      console.log('Products response:', response)

      if (response.success) {
        // Mapear productos de la API al formato del frontend
        products.value = response.data.map(mapProduct)
        console.log('Mapped products:', products.value)
        
        // Usar datos de paginación real
        if (response.pagination) {
          totalRecords.value = response.pagination.total
          currentPage.value = response.pagination.current_page
          totalPages.value = response.pagination.last_page
          itemsPerPage.value = response.pagination.per_page
        } else {
          // Fallback si no hay paginación
          totalRecords.value = response.data.length
          currentPage.value = 1
          totalPages.value = 1
          itemsPerPage.value = response.data.length
        }
      } else {
        error.value = response.error || 'Error al cargar productos'
        products.value = []
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error loading products:', err)
      products.value = []
    } finally {
      loading.value = false
    }
  }

  const loadFilterOptions = async () => {
    try {
      console.log('Loading filter options...')
      const productService = ProductService.getInstance()
      const options = await productService.getFilterOptions()
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
      const productService = ProductService.getInstance()
      const response: ProductResponse = await productService.getProductById(id)
      
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
      const productService = ProductService.getInstance()
      const response: ProductResponse = await productService.createProduct(product)
      
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
      const productService = ProductService.getInstance()
      const response: ProductResponse = await productService.updateProduct(id, product)
      
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
      const productService = ProductService.getInstance()
      const response = await productService.deleteProduct(id)
      
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
      const productService = ProductService.getInstance()
      const response = await productService.exportProducts({
        format,
        filters: filters.value,
        search: searchQuery.value
      })

      if (response.success && response.data) {
        // Crear y descargar el archivo
        const url = window.URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = `productos_${new Date().toISOString().split('T')[0]}.${format}`
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
    resetState
  }
} 