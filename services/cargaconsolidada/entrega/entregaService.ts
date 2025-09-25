import type { HeaderResponse } from '~/types/data-table'
import { BaseService } from '~/services/base/BaseService'
import type { EntregaResponse } from '../../../types/cargaconsolidada/entrega/entrega'

export class EntregaService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/contenedor/entrega'

  static async getEntregas(id: number, params: any): Promise<EntregaResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.filters) queryParams.append('filters', JSON.stringify(params.filters))
      const qs = queryParams.toString()
      const response = await this.apiCall<EntregaResponse>(`${this.baseUrl}/entregas/${id}?${qs ? `?${qs}` : ''}`)
      return response
    } catch (error) {
      console.error('Error al obtener entregas:', error)
      throw error
    }
  }

  // Clientes tab (listado base de clientes para gestionar entrega)
  static async getClientes(id: number, params: any): Promise<EntregaResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.filters) queryParams.append('filters', JSON.stringify(params.filters))
      const qs = queryParams.toString()
      const response = await this.apiCall<EntregaResponse>(`${this.baseUrl}/clientes/${id}${qs ? `?${qs}` : ''}`)
      return response
    } catch (error) {
      console.error('Error al obtener clientes para entrega:', error)
      throw error
    }
  }

  static async marcarRegistrado(data: { id_cotizacion: number }): Promise<{ success: boolean }> {
    try {
      const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/marcar-registrado`, {
        method: 'POST',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al marcar registrado:', error)
      throw error
    }
  }

  static async marcarEntregadoCliente(data: { id_cotizacion: number }): Promise<{ success: boolean }> {
    try {
      const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/marcar-entregado-cliente`, {
        method: 'POST',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al marcar entregado cliente:', error)
      throw error
    }
  }

  static async getHeaders(id: number): Promise<HeaderResponse> {
    try {
      const response = await this.apiCall<HeaderResponse>(`${this.baseUrl}/${id}/headers`)
      return response
    } catch (error) {
      console.error('Error al obtener headers de entrega:', error)
      throw error
    }
  }

  static async programarEntrega(data: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data?: any; error?: string }>(`${this.baseUrl}/programar`, {
        method: 'POST',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al programar entrega:', error)
      throw error
    }
  }

  static async marcarEntregado(data: { id: number }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data?: any; error?: string }>(`${this.baseUrl}/marcar-entregado`, {
        method: 'POST',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al marcar entregado:', error)
      throw error
    }
  }
}
