
import type { CursosResponse, CursosFilters, CursosDetalleResponse } from '../types/cursos-pagos'

export class PagosService {
  private static baseUrl = 'api/carga-consolidada/pagos/cursos'

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
      
      // Filtros adicionales
      if (filters?.campana) queryParams.append('campana', filters.campana.toString())
      if (filters?.estado_pago) queryParams.append('estado_pago', filters.estado_pago)
      
      const url = `${this.baseUrl}?${queryParams.toString()}`
      
      const response = await apiCall<CursosResponse>(url, {
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
      const response = await apiCall<CursosDetalleResponse>(
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
  static async updateEstadoPago(id: number, estado: string): Promise<any> {
    try {
      const response = await apiCall(`${this.baseUrl}/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado_pago: estado })
      })
      return response
    } catch (error) {
      console.error(`Error al actualizar estado del curso ${id}:`, error)
      throw new Error('No se pudo actualizar el estado del curso')
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