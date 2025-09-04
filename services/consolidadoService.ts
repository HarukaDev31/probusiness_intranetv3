
import type { ConsolidadoResponse, ConsolidadoFilters, PagoDetalleResponse } from '../types/pagos/consolidado-pagos'
import { BaseService } from "~/services/base/BaseService"

export class ConsolidadoService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/pagos/consolidado'
 

  /**
   * Obtiene la lista de pagos consolidados
   */
  static async getConsolidadoPagos(filters?: ConsolidadoFilters & { page?: number; per_page?: number }): Promise<ConsolidadoResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.fecha_inicio) {
          // Some backend variants expect Filtro_Fe_Inicio
          queryParams.append('Filtro_Fe_Inicio', filters.fecha_inicio)
        }
        if (filters.fecha_fin) {
          queryParams.append('Filtro_Fe_Fin', filters.fecha_fin)
        }
        if (filters.estado) {
          // Some backends check estado_pago
          queryParams.append('estado_pago', filters.estado)
        }
        if (filters.carga) {
          // Also send as 'campana' for compatibility
          queryParams.append('campana', filters.carga)
        }
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.page) queryParams.append('page', String(filters.page))
        if (filters.per_page) {
          // send both per_page and limit to support different backend controllers
          queryParams.append('per_page', String(filters.per_page))
          queryParams.append('limit', String(filters.per_page))
        }
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl

      const response = await this.apiCall<ConsolidadoResponse>(url, {
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
      const resp = await this.actualizarPagoCoordinacion(id, estado)
      return { success: true, ...(resp || {}) } as any
    } catch (err) {
      console.error('Error al actualizar estado de pago:', err)
      throw err
    }
  }

  /**
   * Llama al endpoint de coordinación para actualizar un pago y devolver datos actualizados
   * Intentará varios paths razonables para soportar variantes del backend.
   */
  static async actualizarPagoCoordinacion(idPago: number, status: string, monto?: number, payment_date?: string): Promise<any> {
    try {
      const payload: any = { status }
      if (monto !== undefined) payload.monto = monto
      if (payment_date) payload.payment_date = payment_date

      // Call the specific working endpoint using PUT
      const endpoint = `${this.baseUrl}/saveStatus/${idPago}`
      const response = await this.apiCall<any>(endpoint, {
        method: 'PUT',
        body: payload
      })
      return response
    } catch (error) {
      console.error('Error al actualizar pago (coordinacion):', error)
      throw new Error('No se pudo actualizar el pago (coordinacion)')
    }
  }

  static async updateNota(id: number, nota: string): Promise<{ success: boolean }> {
    try {
      await this.apiCall(`${this.baseUrl}/updateNota/${id}`, {
        method: 'PUT',
  body: { note_administracion: nota }
      })
      return { success: true }
    } catch (error) {
      console.error('Error al actualizar nota:', error)
      throw new Error('No se pudo actualizar la nota')
    }
  }

  /**
   * Obtiene los detalles de un pago específico
   */
  static async getPagoDetalle(id: number): Promise<PagoDetalleResponse> {
    try {
      const response = await this.apiCall<PagoDetalleResponse>(
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
        if (filters.fecha_inicio) {
          queryParams.append('Filtro_Fe_Inicio', filters.fecha_inicio)
        }
        if (filters.fecha_fin) {
          queryParams.append('Filtro_Fe_Fin', filters.fecha_fin)
        }
        if (filters.estado) {
          queryParams.append('estado', filters.estado)
          queryParams.append('estado_pago', filters.estado)
        }
        if (filters.carga) {
          queryParams.append('carga', filters.carga)
          queryParams.append('campana', filters.carga)
        }
        if (filters.search) queryParams.append('search', filters.search)
        if ((filters as any).per_page) {
          queryParams.append('per_page', String((filters as any).per_page))
          queryParams.append('limit', String((filters as any).per_page))
        }
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}/export?${queryParams.toString()}`
        : `${this.baseUrl}/export`

      // Corregido: apiCall espera un string como primer argumento (la URL) y un objeto de opciones como segundo argumento
      const response = await this.apiCall<Blob>(
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
  static async deleteConsolidado(id: number): Promise<{ success: boolean }> {
    try {
      const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error al eliminar consolidado:', error)
      throw new Error('No se pudo eliminar el consolidado')
    }
  }
} 