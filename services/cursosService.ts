import type { CursoItem, CursosDetalleResponse, CursosFilters, CursosResponse } from '~/types/cursos/cursos'
import { apiCall } from '~/utils/api'

export class CursosService {
  private static baseUrl = 'api/cursos'

  static async getCursos(filters: CursosFilters): Promise<CursosResponse> {
    try {
      const response = await apiCall<CursosResponse>(`${this.baseUrl}`, {
        method: 'GET',
        params: filters
      })
      return response
    } catch (error) {
      console.error('Error al obtener cursos:', error)
      throw new Error('No se pudieron obtener los cursos')
    }
  }
  static async getCursoDetalle(id: number): Promise<CursosDetalleResponse> {
    try {
      const response = await apiCall<CursosDetalleResponse>(`${this.baseUrl}/${id}`, {
        method: 'GET'
      })
      return response
    } catch (error) {
      console.error('Error al obtener curso detalle:', error)
      throw new Error('No se pudo obtener el curso detalle')
    }
  }
  static async borrarCurso(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; error?: string }>(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error al borrar curso:', error)
      throw new Error('No se pudo borrar el curso')
    }
  }
  static async updateCurso(id: number, curso: CursoItem): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiCall<{ success: boolean; error?: string }>(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        body: curso
      })
      return response
    } catch (error) {
      console.error('Error al actualizar curso:', error)
      throw new Error('No se pudo actualizar el curso')
    }
  }
  static async exportCursos(filters: CursosFilters): Promise<Blob> {
    try {
      const response = await apiCall<Blob>(`${this.baseUrl}/export`, {
        method: 'POST',
        body: filters
      })
      return response
    } catch (error) {
      console.error('Error al exportar cursos:', error)
      throw new Error('No se pudo exportar los cursos')
    }
  }
  static async getFiltros(): Promise<FiltrosResponse> {   
    try {
      const response = await apiCall<FiltrosResponse>(`${this.baseUrl}/filters/options`, {
        method: 'GET'
      })
      return response
    } catch (error) {
      console.error('Error al obtener filtros:', error)
      throw new Error('No se pudieron obtener los filtros')
    }
  }

}   