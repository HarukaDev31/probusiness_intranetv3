import type { HeaderResponse } from '~/types/data-table'
import { BaseService } from '~/services/base/BaseService'
import type { EntregaResponse } from '../../../types/cargaconsolidada/entrega/entrega'
import type { TimeSlot } from '~/types/horarios'

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
      const response = await this.apiCall<EntregaResponse>(`${this.baseUrl}/entregas/${id}${qs ? `?${qs}` : ''}`)
      return response
    } catch (error) {
      console.error('Error al obtener entregas:', error)
      throw error
    }
  }
  static async getEntregasDetalle(id_cotizacion: number): Promise<EntregaResponse> {
    try {
      const response = await this.apiCall<EntregaResponse>(`${this.baseUrl}/entregas/detalle/${id_cotizacion}`)
      return response
    } catch (error: any) {
      const msg = error?.message || ''
      // Si el backend responde 404 devolvemos stub vacío para no romper UI
      if (/404/.test(msg) || /no encontrada/i.test(msg)) {
        console.warn('Entrega no encontrada (detalle):', id_cotizacion)
        return {
          success: false,
          data: [],
          pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 1,
            total: 0,
            from: 0,
            to: 0
          }
        }
      }
      console.error('Error al obtener detalles de entrega:', error)
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

  // --- PAGOS DELIVERY ---
  static async getDelivery(id: number, params: any): Promise<EntregaResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.filters) queryParams.append('filters', JSON.stringify(params.filters))
      const qs = queryParams.toString()
      const response = await this.apiCall<EntregaResponse>(`${this.baseUrl}/delivery/${id}${qs ? `?${qs}` : ''}`)
      return response
    } catch (error) {
      console.error('Error al obtener delivery:', error)
      throw error
    }
  }

  static async registrarPagoDelivery(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data?: any; error?: string }>(`${this.baseUrl}/delivery/pagos`, {
        method: 'POST',
        body: formData
      })
      return response
    } catch (error) {
      console.error('Error al registrar pago delivery:', error)
      throw error
    }
  }
  static async deletePagoDelivery(pagoId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data?: any; error?: string }>(`${this.baseUrl}/delivery/pagos/${pagoId}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error al eliminar pago delivery:', error)
      throw error
    }
  }

  // --- HORARIOS DISPONIBLES (ADMIN/ENTREGA) ---
  static async getHorariosDisponibles(idContenedor: number): Promise<{ success: boolean; data: Array<Partial<TimeSlot> & Record<string, any>> }> {
    try {
      const response = await this.apiCall<{ success: boolean; data: Array<Partial<TimeSlot> & Record<string, any>> }>(
        `${this.baseUrl}/${idContenedor}/horarios-disponibles`
      )
      return response
    } catch (error) {
      console.error('Error al obtener horarios disponibles:', error)
      throw error
    }
  }

  // --- CRUD FECHAS ---
  static async createFecha(idContenedor: number, date: string | { day: number; month: number; year: number }): Promise<{
    success: boolean;
    data: { id: number; day: number; month: number; year: number; duplicated?: boolean };
    message?: string;
  }> {
    try {
      const body = typeof date === 'string' ? { date } : date
      return await this.apiCall(`${this.baseUrl}/${idContenedor}/fechas`, {
        method: 'POST',
        body
      })
    } catch (error) {
      console.error('Error al crear/obtener fecha:', error)
      throw error
    }
  }

  static async deleteFecha(idContenedor: number, idFecha: number): Promise<{ success: boolean }> {
    try {
      return await this.apiCall(`${this.baseUrl}/${idContenedor}/fechas/${idFecha}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Error al eliminar fecha:', error)
      throw error
    }
  }

  // --- CRUD RANGOS (HORARIOS) ---
  static async createRango(
    idContenedor: number,
    idFecha: number,
    payload: { start_time: string; end_time: string; delivery_count: number }
  ): Promise<{
    success: boolean;
    data: { id: number; id_date: number; start_time: string; end_time: string; delivery_count: number };
  }> {
    try {
      return await this.apiCall(`${this.baseUrl}/${idContenedor}/fechas/${idFecha}/rangos`, {
        method: 'POST',
        body: payload
      })
    } catch (error) {
      console.error('Error al crear rango:', error)
      throw error
    }
  }

  static async updateRango(
    idContenedor: number,
    idFecha: number,
    idRango: number,
    payload: { start_time: string; end_time: string; delivery_count: number }
  ): Promise<{ success: boolean }> {
    try {
      return await this.apiCall(`${this.baseUrl}/${idContenedor}/fechas/${idFecha}/rangos/${idRango}`, {
        method: 'PUT',
        body: payload
      })
    } catch (error) {
      console.error('Error al actualizar rango:', error)
      throw error
    }
  }

  static async deleteRango(idContenedor: number, idFecha: number, idRango: number): Promise<{ success: boolean }> {
    try {
      return await this.apiCall(`${this.baseUrl}/${idContenedor}/fechas/${idFecha}/rangos/${idRango}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error al eliminar rango:', error)
      throw error
    }
  }

  static async updateImporteDelivery(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data?: any; error?: string }>(`${this.baseUrl}/delivery/importe`, {
        method: 'POST',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al actualizar importe de delivery:', error)
      throw error
    }
  }
  static async sendMessageForCotizacion(id_cotizacion: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; data?: any; error?: string }>(`${this.baseUrl}/delivery/send-message/${id_cotizacion}`, {
        method: 'POST',
      
      })
      return response
    } catch (error) {
      console.error('Error al enviar mensaje para cotización:', error)
      throw error
    }
  }

  // --- DETALLE CLIENTE (guardar formulario) ---
  static async updateClienteDetalle(id_cotizacion: number, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await this.apiCall(`${this.baseUrl}/entregas/detalle/${id_cotizacion}/update`, {
        method: 'POST',
        body: data
      })
    } catch (error) {
      console.error('Error al actualizar detalle de cliente:', error)
      throw error
    }
  }

  // --- CONFORMIDAD (fotos) ---
  static async uploadConformidad(formData: FormData): Promise<{ success: boolean; data: { id: number; photo_1: string; photo_2: string } }> {
    try {
      return await this.apiCall(`${this.baseUrl}/entregas/conformidad`, {
        method: 'POST',
        body: formData
      })
    } catch (error) {
      console.error('Error al subir conformidad:', error)
      throw error
    }
  }

  static async updateConformidad(id: number, formData: FormData): Promise<{ success: boolean; data: { id: number; photo_1: string; photo_2: string } }> {
    try {
      return await this.apiCall(`${this.baseUrl}/entregas/conformidad/${id}/update`, {
        method: 'POST',
        body: formData
      })
    } catch (error) {
      console.error('Error al actualizar conformidad:', error)
      throw error
    }
  }

  static async deleteConformidad(id: number, typeForm: 0 | 1): Promise<{ success: boolean }> {
    try {
      return await this.apiCall(`${this.baseUrl}/entregas/conformidad/${id}?type_form=${typeForm}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error al eliminar conformidad:', error)
      throw error
    }
  }
}
