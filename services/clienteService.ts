import { apiCall } from '~/utils/api'

// Interfaces para la API
export interface Cliente {
  id: number
  nombre: string
  documento: string | null
  correo: string
  telefono: string
  fecha: string
  primer_servicio: {
    servicio: string
    fecha: string
    categoria: string
  }
  total_servicios: number
  servicios: Array<{
    servicio: string
    fecha: string
    categoria: string
  }>
}

export interface PaginationInfo {
  current_page: number
  last_page: number
  per_page: string | number // Puede venir como string desde el backend
  total: number
  from: number
  to: number
}

export interface ClientesResponse {
  success: boolean
  data: Cliente[]
  pagination: PaginationInfo
}

export interface ErrorResponse {
  status: string
  message: string
}

// Parámetros para la consulta
export interface ClientesQueryParams {
  limit?: number
  page?: number
  search?: string
  categoria?: string
  fecha_inicio?: string
  fecha_fin?: string
}

export class ClienteService {
  private baseUrl: string

  constructor() {
    // Usar la URL base desde las variables de entorno
    const config = useRuntimeConfig()
    this.baseUrl = `${config.public.apiBaseUrl}/api/base-datos/clientes`
  }

  /**
   * Obtiene la lista de clientes con paginación y filtros
   */
  async getClientes(params: ClientesQueryParams = {}): Promise<ClientesResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.search) queryParams.append('search', params.search)
      if (params.categoria) queryParams.append('categoria', params.categoria)

      // Construir la URL base con los parámetros normales
      let url = `${this.baseUrl}?${queryParams.toString()}`
      
      // Agregar las fechas manualmente para evitar la codificación
      if (params.fecha_inicio) {
        url += `&fecha_inicio=${params.fecha_inicio}`
      }
      if (params.fecha_fin) {
        url += `&fecha_fin=${params.fecha_fin}`
      }
      
      const response = await apiCall<ClientesResponse>(url, {
        method: 'GET'
      })

      return response
    } catch (error: any) {
      console.error('Error en getClientes:', error)
      throw new Error(error?.data?.message || 'Error al obtener clientes')
    }
  }

  /**
   * Obtiene un cliente específico por ID
   */
  async getClienteById(id: number): Promise<Cliente> {
    try {
      const response = await apiCall<{ success: boolean; data: Cliente; message: string }>(`${this.baseUrl}/${id}`, {
        method: 'GET'
      })

      return response.data
    } catch (error: any) {
      console.error('Error en getClienteById:', error)
      throw new Error(error?.data?.message || 'Error al obtener el cliente')
    }
  }

  /**
   * Crea un nuevo cliente
   */
  async createCliente(clienteData: Partial<Cliente>): Promise<Cliente> {
    try {
      const response = await apiCall<{ success: boolean; data: Cliente }>(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(clienteData)
      })

      return response.data
    } catch (error: any) {
      console.error('Error en createCliente:', error)
      throw new Error(error?.data?.message || 'Error al crear el cliente')
    }
  }

  /**
   * Actualiza un cliente existente
   */
  async updateCliente(id: number, clienteData: Partial<Cliente>): Promise<Cliente> {
    try {
      const response = await apiCall<{ success: boolean; data: Cliente }>(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(clienteData)
      })

      return response.data
    } catch (error: any) {
      console.error('Error en updateCliente:', error)
      throw new Error(error?.data?.message || 'Error al actualizar el cliente')
    }
  }

  /**
   * Elimina un cliente
   */
  async deleteCliente(id: number): Promise<void> {
    try {
      await apiCall(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      })
    } catch (error: any) {
      console.error('Error en deleteCliente:', error)
      throw new Error(error?.data?.message || 'Error al eliminar el cliente')
    }
  }

  /**
   * Sube un archivo de clientes
   */
  async uploadClientesFile(file: File): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiCall<{ success: boolean; message: string }>(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData
      })

      return response
    } catch (error: any) {
      console.error('Error en uploadClientesFile:', error)
      throw new Error(error?.data?.message || 'Error al subir el archivo')
    }
  }

  /**
   * Exporta clientes a Excel
   */
  async exportClientes(params: ClientesQueryParams = {}): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.search) queryParams.append('search', params.search)
      if (params.categoria) queryParams.append('categoria', params.categoria)

      // Construir la URL base con los parámetros normales
      let url = `${this.baseUrl}/export?${queryParams.toString()}`
      
      // Agregar las fechas manualmente para evitar la codificación
      if (params.fecha_inicio) {
        url += `&fecha_inicio=${params.fecha_inicio}`
      }
      if (params.fecha_fin) {
        url += `&fecha_fin=${params.fecha_fin}`
      }
      
      const response = await apiCall<Blob>(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
      })

      return response
    } catch (error: any) {
      console.error('Error en exportClientes:', error)
      throw new Error(error?.data?.message || 'Error al exportar clientes')
    }
  }

  /**
   * Obtiene las opciones de filtros disponibles
   */
  async getFilterOptions(): Promise<{
    categorias: string[]
    fechas: string[]
  }> {
    try {
      const response = await apiCall<{
        success: boolean
        data: {
          categorias: string[]
          fechas: string[]
        }
      }>(`${this.baseUrl}/filters`, {
        method: 'GET'
      })

      return response.data
    } catch (error: any) {
      console.error('Error en getFilterOptions:', error)
      // Retornar opciones por defecto en caso de error
      return {
        categorias: ['Cliente', 'Recurrente', 'Premiun', 'Inactivo'],
        fechas: []
      }
    }
  }
}

// Instancia singleton del servicio
export const clienteService = new ClienteService() 