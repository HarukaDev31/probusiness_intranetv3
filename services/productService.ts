import type { Product, ProductFilters, ProductResponse, ProductsResponse, FilterOptionsResponse, FilterOptions, Pagination, ProductsServiceResponse } from '~/types/product'
import { apiCall } from '~/utils/api'

class ProductService {
  private static instance: ProductService

  private constructor() {}

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService()
    }
    return ProductService.instance
  }

  // Obtener todos los productos con paginación y filtros
  async getProducts(params: {
    page?: number
    limit?: number
    search?: string
    filters?: ProductFilters
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<ProductsServiceResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.search) queryParams.append('search', params.search)
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      
      // Agregar filtros
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value.toString())
        })
      }

      console.log('Calling API with URL:', `/api/base-datos/productos?${queryParams.toString()}`)
      const response = await apiCall<ProductsResponse>(`/api/base-datos/productos?${queryParams.toString()}`)
      console.log('API Response:', response)
      
      // Verificar si la respuesta tiene la estructura esperada
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          pagination: response.pagination
        }
      } else {
        console.error('Unexpected API response structure:', response)
        return {
          success: false,
          data: [],
          pagination: null,
          error: 'Estructura de respuesta inesperada'
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      return {
        success: false,
        data: [],
        pagination: null,
        error: 'Error al obtener productos'
      }
    }
  }

  // Obtener un producto por ID
  async getProductById(id: number): Promise<ProductResponse> {
    try {
      const response = await apiCall<ProductResponse>(`/api/base-datos/productos/${id}`)
      console.log('Product response:', response)
      return response
    } catch (error) {
      console.error('Error fetching product:', error)
      return {
        success: false,
        data: null,
        error: 'Error al obtener el producto'
      }
    }
  }

  // Crear un nuevo producto
  async createProduct(product: Omit<Product, 'id'>): Promise<ProductResponse> {
    try {
      const response = await apiCall<ProductResponse>('/api/base-datos/productos', {
        method: 'POST',
        body: product
      })
      return response
    } catch (error) {
      console.error('Error creating product:', error)
      return {
        success: false,
        data: null,
        error: 'Error al crear el producto'
      }
    }
  }

  // Actualizar un producto con campos opcionales
  async updateProduct(id: number, productData: {
    link?: string
    arancel_sunat?: string
    arancel_tlc?: string
    correlativo?: string
    antidumping?: string
    antidumping_value?: string
    tipo_producto?: string
    entidad_id?: number
    etiquetado?: string
    tipo_etiquetado_id?: number
    doc_especial?: string
    tiene_observaciones?: boolean
    observaciones?: string
  }): Promise<ProductResponse> {
    try {
      // Filtrar campos que no sean undefined o null
      const filteredData = Object.fromEntries(
        Object.entries(productData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      )

      const response = await apiCall<ProductResponse>(`/api/base-datos/productos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(filteredData)
      })
      return response
    } catch (error) {
      console.error('Error updating product:', error)
      return {
        success: false,
        data: null,
        error: 'Error al actualizar el producto'
      }
    }
  }

  // Eliminar un producto
  async deleteProduct(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      await apiCall(`/api/base-datos/productos/${id}`, {
        method: 'DELETE'
      })
      return { success: true }
    } catch (error) {
      console.error('Error deleting product:', error)
      return {
        success: false,
        error: 'Error al eliminar el producto'
      }
    }
  }

  // Obtener opciones para filtros
  async getFilterOptions(): Promise<FilterOptions> {
    try {
      console.log('Calling filter options API...')
      const response = await apiCall<FilterOptionsResponse>('/api/base-datos/productos/filters/options')
      console.log('Filter options API response:', response)
      
      if (response.status === 'success') {
        const options = {
          rubros: response.data.rubros || [],
          tiposProducto: response.data.tipos_producto || [],
          campanas: response.data.cargas || [] // Usar 'cargas' como campañas
        }
        console.log('Processed filter options:', options)
        return options
      }
      
      return {
        rubros: [],
        tiposProducto: [],
        campanas: []
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
      return {
        rubros: [],
        tiposProducto: [],
        campanas: []
      }
    }
  }

  // Exportar productos
  async exportProducts(params: {
    format: 'excel' | 'csv' | 'pdf'
    filters?: ProductFilters
    search?: string
  }): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('format', params.format)
      
      if (params.search) queryParams.append('search', params.search)
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value.toString())
        })
      }

      const response = await apiCall<Blob>(`/api/base-datos/productos/export?${queryParams.toString()}`, {
        responseType: 'blob'
      })
      
      return { success: true, data: response }
    } catch (error) {
      console.error('Error exporting products:', error)
      return {
        success: false,
        error: 'Error al exportar productos'
      }
    }
  }
}

export default ProductService 