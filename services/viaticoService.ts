import { BaseService } from './base/BaseService'
import type {
  Viatico,
  CreateViaticoRequest,
  UpdateViaticoRequest,
  ViaticosResponse,
  ViaticoResponse,
  ViaticoFilters
} from '~/types/viatico'

export class ViaticoService extends BaseService {
  private static instance: ViaticoService
  private static baseUrl = '/api/viaticos'

  /**
   * Obtener lista de viáticos
   */
  static async getViaticos(filters?: ViaticoFilters): Promise<ViaticosResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters?.status) queryParams.append('status', filters.status)
      if (filters?.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio)
      if (filters?.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin)
      // Mapear posibles claves de filtro de área desde la UI
      if (filters?.requesting_area) queryParams.append('requesting_area', filters.requesting_area)
      if (filters?.area_solicitante) queryParams.append('requesting_area', filters.area_solicitante)
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.page) queryParams.append('page', filters.page.toString())
      if (filters?.per_page) queryParams.append('per_page', filters.per_page.toString())
      if (filters?.sort_by) queryParams.append('sort_by', filters.sort_by)
      if (filters?.sort_order) queryParams.append('sort_order', filters.sort_order)

      const response = await this.apiCall<ViaticosResponse>(`${this.baseUrl}?${queryParams.toString()}`)
      return response
    } catch (error: any) {
      console.error('Error fetching viaticos:', error)
      throw new Error(error.message || 'Error al obtener viáticos')
    }
  }

  /**
   * Obtener viáticos pendientes
   */
  static async getPendientes(filters?: Omit<ViaticoFilters, 'status'>): Promise<ViaticosResponse> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('status', 'PENDING')
      
      if (filters?.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio)
      if (filters?.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin)
      // Mapear posibles claves de filtro de área desde la UI
      if (filters?.requesting_area) queryParams.append('requesting_area', filters.requesting_area)
      if (filters?.area_solicitante) queryParams.append('requesting_area', filters.area_solicitante)
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.page) queryParams.append('page', filters.page.toString())
      if (filters?.per_page) queryParams.append('per_page', filters.per_page.toString())
      if (filters?.sort_by) queryParams.append('sort_by', filters.sort_by)
      if (filters?.sort_order) queryParams.append('sort_order', filters.sort_order)

      const response = await this.apiCall<ViaticosResponse>(`${this.baseUrl}/pendientes/list?${queryParams.toString()}`)
      return response
    } catch (error: any) {
      console.error('Error fetching pendientes:', error)
      throw new Error(error.message || 'Error al obtener viáticos pendientes')
    }
  }

  /**
   * Obtener viáticos completados
   */
  static async getCompletados(filters?: Omit<ViaticoFilters, 'status'>): Promise<ViaticosResponse> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('status', 'CONFIRMED')
      
      if (filters?.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio)
      if (filters?.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin)
      // Mapear posibles claves de filtro de área desde la UI
      if (filters?.requesting_area) queryParams.append('requesting_area', filters.requesting_area)
      if (filters?.area_solicitante) queryParams.append('requesting_area', filters.area_solicitante)
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.page) queryParams.append('page', filters.page.toString())
      if (filters?.per_page) queryParams.append('per_page', filters.per_page.toString())
      if (filters?.sort_by) queryParams.append('sort_by', filters.sort_by)
      if (filters?.sort_order) queryParams.append('sort_order', filters.sort_order)

      const response = await this.apiCall<ViaticosResponse>(`${this.baseUrl}/completados/list?${queryParams.toString()}`)
      return response
    } catch (error: any) {
      console.error('Error fetching completados:', error)
      throw new Error(error.message || 'Error al obtener viáticos completados')
    }
  }

  /**
   * Obtener un viático por ID
   */
  static async getViaticoById(id: number): Promise<ViaticoResponse> {
    try {
      const response = await this.apiCall<ViaticoResponse>(`${this.baseUrl}/${id}`)
      return response
    } catch (error: any) {
      console.error('Error fetching viatico:', error)
      throw new Error(error.message || 'Error al obtener viático')
    }
  }

  /**
   * Crear un nuevo viático
   */
  static async createViatico(data: CreateViaticoRequest): Promise<ViaticoResponse> {
    try {
      const formData = new FormData()
      // If an id is provided, include it so backend can handle create-or-update behavior
      if ((data as any).id !== undefined && (data as any).id !== null) {
        formData.append('id', String((data as any).id))
      }
      formData.append('subject', data.subject)
      formData.append('reimbursement_date', data.reimbursement_date)
      formData.append('requesting_area', data.requesting_area)
      formData.append('expense_description', data.expense_description)
      formData.append('total_amount', data.total_amount.toString())
      
      if (data.receipt_file) {
        formData.append('receipt_file', data.receipt_file)
      }

      const response = await this.apiCall<ViaticoResponse>(this.baseUrl, {
        method: 'POST',
        body: formData
      })
      return response
    } catch (error: any) {
      console.error('Error creating viatico:', error)
      throw new Error(error.message || 'Error al crear viático')
    }
  }

  /**
   * Actualizar un viático
   */
  static async updateViatico(id: number, data: UpdateViaticoRequest): Promise<ViaticoResponse> {
    try {
      const formData = new FormData()
      
      if (data.status) {
        formData.append('status', data.status)
      }
      
      // Para el comprobante de retribución (subido por admin)
      if (data.payment_receipt_file !== undefined) {
        if (data.payment_receipt_file === null) {
          // Para eliminar el archivo, enviar delete_file como true
          formData.append('delete_file', 'true')
        } else if (data.payment_receipt_file instanceof File) {
          formData.append('payment_receipt_file', data.payment_receipt_file) // El backend espera 'receipt_file' pero lo guarda en payment_receipt_file
        }
      }

      const response = await this.apiCall<ViaticoResponse>(`${this.baseUrl}/update/${id}`, {
        method: 'POST',
        body: formData
      })
      return response
    } catch (error: any) {
      console.error('Error updating viatico:', error)
      throw new Error(error.message || 'Error al actualizar viático')
    }
  }

  /**
   * Eliminar un viático
   */
  static async deleteViatico(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error: any) {
      console.error('Error deleting viatico:', error)
      throw new Error(error.message || 'Error al eliminar viático')
    }
  }
}
