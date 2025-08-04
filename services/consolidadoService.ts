import { apiCall } from '~/utils/api'
import type { ConsolidadoResponse, ConsolidadoFilters, PagoDetalleResponse } from '~/types/consolidado'

export class ConsolidadoService {
  private static baseUrl = 'api/carga-consolidada/pagos/consolidado'

  /**
   * Obtiene la lista de pagos consolidados
   */
  static async getConsolidadoPagos(filters?: ConsolidadoFilters & { page?: number; per_page?: number }): Promise<ConsolidadoResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio)
        if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin)
        if (filters.estado) queryParams.append('estado', filters.estado)
        if (filters.carga) queryParams.append('carga', filters.carga)
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl

      const response = await apiCall<ConsolidadoResponse>(url, {
        method: 'GET'
      })

      return response
    } catch (error) {
      console.error('Error al obtener pagos consolidados:', error)
      throw new Error('No se pudieron obtener los pagos consolidados')
    }
  }

  /**
   * Actualiza el estado de pago de un registro
   */
  static async updateEstadoPago(id: number, estado: string): Promise<{ success: boolean }> {
    try {
      const response = await apiCall<{ success: boolean }>(
        `${this.baseUrl}/${id}/estado`,
        {
          method: 'PUT',
          data: { estado }
        }
      )

      return response
    } catch (error) {
      console.error('Error al actualizar estado de pago:', error)
      throw new Error('No se pudo actualizar el estado de pago')
    }
  }

  /**
   * Obtiene los detalles de un pago específico
   */
  static async getPagoDetalle(id: number): Promise<PagoDetalleResponse> {
    try {
      const response = await apiCall<PagoDetalleResponse>(
        `${this.baseUrl}/${id}`,
        {
          method: 'GET'
        }
      )

      return response
    } catch (error) {
      console.error('Error al obtener detalle de pago:', error)
      throw new Error('No se pudo obtener el detalle del pago')
    }
  }

  /**
   * Exporta los datos de consolidado
   */
  static async exportConsolidado(filters?: ConsolidadoFilters): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio)
        if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin)
        if (filters.estado) queryParams.append('estado', filters.estado)
        if (filters.carga) queryParams.append('carga', filters.carga)
        if (filters.search) queryParams.append('search', filters.search)
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}/export?${queryParams.toString()}`
        : `${this.baseUrl}/export`

      // Corregido: apiCall espera un string como primer argumento (la URL) y un objeto de opciones como segundo argumento
      const response = await apiCall<Blob>(
        url,
        {
          method: 'GET',
          responseType: 'blob'
        }
      )

      return response
    } catch (error) {
      console.error('Error al exportar consolidado:', error)
      throw new Error('No se pudo exportar el consolidado')
    }
  }
} 