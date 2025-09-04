import { BaseService } from "~/services/base/BaseService"
import type { CursosResponse, CursosFilters, CursosDetalleResponse } from '../types/cursos-pagos'

export class PagosService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/pagos/cursos'
  constructor() {
    super()
  }

  /**
   * Actualiza la nota administrativa de un curso
   */
  static async updateNota(id: number, nota: string): Promise<any> {
    try {
      const response = await this.apiCall<any>(`${this.baseUrl}/updateNota/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ note_administracion: nota })
      })
      return response
    } catch (error) {
      console.error(`Error al actualizar nota del curso ${id}:`, error)
      throw new Error('No se pudo actualizar la nota del curso')
    }
  }

  /**
   * Obtiene la lista de pagos de cursos con filtros y paginación
   */
  static async getCursosPagos(filters?: CursosFilters & { page?: number; limit?: number }): Promise<CursosResponse> {
    try {
      const queryParams = new URLSearchParams()

      // Parámetros de paginación
      if (filters?.page) queryParams.append('page', filters.page.toString())
      if (filters?.limit) queryParams.append('limit', filters.limit.toString())

      // Filtros de fecha
      if (filters?.Filtro_Fe_Inicio) queryParams.append('Filtro_Fe_Inicio', filters.Filtro_Fe_Inicio)
      if (filters?.Filtro_Fe_Fin) queryParams.append('Filtro_Fe_Fin', filters.Filtro_Fe_Fin)

      //filtro de busqueda
      if (filters?.search) queryParams.append('search', filters.search)

      // Filtros adicionales
      if (filters?.campana) queryParams.append('campana', filters.campana.toString())
      if (filters?.estado_pago) queryParams.append('estado_pago', filters.estado_pago)

      const url = `${this.baseUrl}?${queryParams.toString()}`

      const response = await this.apiCall<CursosResponse>(url, {
        method: 'GET'
      })

      return response
    } catch (error) {
      console.error('Error al obtener pagos de cursos:', error)
      throw new Error('No se pudieron obtener los pagos de cursos')
    }
  }

  /**
   * Obtiene los detalles de un curso específico
   */
  static async getCursoDetalle(id: number): Promise<CursosDetalleResponse> {
    try {
      const response = await this.apiCall<CursosDetalleResponse>(
        `${this.baseUrl}/${id}`,
        {
          method: 'GET'
        }
      )
      return response
    } catch (error) {
      console.error(`Error al obtener detalle del curso ${id}:`, error)
      throw new Error('No se pudo obtener el detalle del curso')
    }
  }

  /**
   * Actualiza el estado de pago de un curso
   */
  static async updateEstadoPago(id: number, status: string): Promise<{success: boolean}> {
    try {
      // send both keys: `status` is expected by the backend validation,
      const response = await this.actualizarPagoCurso(id, status)
      return response
    } catch (error) {
      console.error(`Error al actualizar estado del curso ${id}:`, error)
      throw new Error('No se pudo actualizar el estado del curso')
    }
  }

  /**
   * Llama al endpoint de cursos para actualizar un pago y devolver datos actualizados
   */
  static async actualizarPagoCurso(idPago: number, status: string,): Promise<any> {
    try {
      const payload: any = { status }
      const response = await this.apiCall<any>(`${this.baseUrl}/saveStatus/${idPago}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      return response
    } catch (error) {
      console.error(`Error al actualizar pago del curso ${idPago}:`, error)
      throw new Error('No se pudo actualizar el pago del curso')
    }
  }

  /**
   * Exporta los datos de cursos
   */
  static async exportCursos(filters?: CursosFilters): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams()

      // Filtros de fecha
      if (filters?.Filtro_Fe_Inicio) queryParams.append('Filtro_Fe_Inicio', filters.Filtro_Fe_Inicio)
      if (filters?.Filtro_Fe_Fin) queryParams.append('Filtro_Fe_Fin', filters.Filtro_Fe_Fin)

      // Filtros adicionales
      if (filters?.campana) queryParams.append('campana', filters.campana.toString())
      if (filters?.estado_pago) queryParams.append('estado_pago', filters.estado_pago)

      const url = `${this.baseUrl}/export?${queryParams.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al exportar datos')
      }

      return await response.blob()
    } catch (error) {
      console.error('Error al exportar cursos:', error)
      throw new Error('No se pudo exportar los datos de cursos')
    }
  }

} 