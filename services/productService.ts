import type { Product, ProductFilters, ProductResponse, ProductsResponse, FilterOptionsResponse, FilterOptions, Pagination, ProductsServiceResponse } from '../types/product'
import { BaseService } from "~/services/base/BaseService"


export class ProductService extends BaseService {
  private static instance: ProductService
  private static baseUrl = '/api/base-datos/productos';


 

  // Obtener todos los productos con paginación y filtros
  static async getProducts(params: {
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

      console.log('Calling API with URL:', `${this.baseUrl}?${queryParams.toString()}`)
      const response = await this.apiCall<ProductsResponse>(`${this.baseUrl}?${queryParams.toString()}`)
      
      // Verificar si la respuesta tiene la estructura esperada
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          pagination: response.pagination,
          headers: response.headers
        }
      } else {
        console.error('Unexpected API response structure:', response)
        return {
          success: false,
          data: [],
          pagination: null,
          headers: [],
          error: 'Estructura de respuesta inesperada'
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      return {
        success: false,
        data: [],
        pagination: null,
        headers: [],
        error: 'Error al obtener productos'
      }
    }
  }

  // Obtener un producto por ID
  static async getProductById(id: number): Promise<ProductResponse> {
    try {
      const response = await this.apiCall<ProductResponse>(`${this.baseUrl}/${id}`)
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
  static async createProduct(product: Omit<Product, 'id'>): Promise<ProductResponse> {
    try {
      const response = await this.apiCall<ProductResponse>(`${this.baseUrl}`, {
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
  static async updateProduct(id: number, productData: {
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

      const response = await this.apiCall<ProductResponse>(`${this.baseUrl}/${id}`, {
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
  static async deleteProduct(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      await this.apiCall(`/api/base-datos/productos/${id}`, {
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
  static async getFilterOptions(): Promise<FilterOptions> {
    try {
      console.log('Calling filter options API...')
      const response = await this.apiCall<FilterOptionsResponse>(`${this.baseUrl}/filters/options`)
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
  static async exportProducts(params: {
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

      const response = await this.apiCall<Blob>(`${this.baseUrl}/export?${queryParams.toString()}`, {
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
  static async importExcel(file: File): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData()
      formData.append('excel_file', file)

      const response = await this.apiCall<{ success: boolean; message: string }>(`${this.baseUrl}/import-excel`, {
        method: 'POST',
        body: formData
      })

      return response
    } catch (error: any) {
      console.error('Error en importExcel:', error)
      throw new Error(error?.data?.message || 'Error al importar el archivo Excel')
    }
  }
  static async deleteExcel(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message: string }>(`${this.baseUrl}/delete-excel/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error: any) {
      console.error('Error en deleteExcel:', error)
      throw new Error(error?.data?.message || 'Error al eliminar el archivo')
    }
  }
  static async getExcelsList(): Promise<{
    success: boolean;
    data: {
      id: number;
      nombre_archivo: string;
      cantidad_rows: number;
      created_at: string;
      ruta_archivo: string;
    }[]
  }> {
    try {
      const response = await this.apiCall<{
        success: boolean;
        data: {
          id: number;
          nombre_archivo: string;
          cantidad_rows: number;
          created_at: string;
          ruta_archivo: string;
        }[]
      }>(`${this.baseUrl}/list-excels`, {
        method: 'GET'
      })
      //foreac 
      return response
    } catch (error: any) {
      console.error('Error en getExcelsList:', error)
      throw new Error(error?.data?.message || 'Error al obtener la lista de archivos')
    }
  }
}

