import type { CursoItem, CursosDetalleResponse, FiltrosResponse, CursosFilters, CursosResponse, DatosClientePorPedido } from '~/types/cursos/cursos'

import { BaseService } from "~/services/base/BaseService"

export class CursosService extends BaseService {
  private static baseUrl = 'api/cursos'

  static async getCursos(filters: CursosFilters): Promise<CursosResponse> {
    try {
      const response = await this.apiCall<CursosResponse>(`${this.baseUrl}`, {
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
      const response = await this.apiCall<CursosDetalleResponse>(`${this.baseUrl}/${id}`, {
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
      const response = await this.apiCall<{ success: boolean; error?: string }>(`${this.baseUrl}/${id}`, {
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
      const response = await this.apiCall<{ success: boolean; error?: string }>(`${this.baseUrl}/${id}`, {
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
      const response = await this.apiCall<Blob>(`${this.baseUrl}/export`, {
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
      const response = await this.apiCall<FiltrosResponse>(`${this.baseUrl}/filters/options`, {
        method: 'GET'
      })
      return response
    } catch (error) {
      console.error('Error al obtener filtros:', error)
      throw new Error('No se pudieron obtener los filtros')
    }
  }
  static async getDatosClientePorPedido(idPedido: number): Promise<DatosClientePorPedido> {
    try {
      const response = await this.apiCall<DatosClientePorPedido>(`${this.baseUrl}/pedido/${idPedido}/cliente`, {
        method: 'GET'
      })
      return response
    } catch (error) {
      console.error('Error al obtener datos del cliente por pedido:', error)
      throw new Error('No se pudieron obtener los datos del cliente por pedido')
    }
  }
  static async actualizarDatosCliente(id: number, datos: Partial<DatosClientePorPedido>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiCall<{ success: boolean; error?: string }>(`${this.baseUrl}/cliente/${id}`, {
        method: 'PUT',
        body: datos
      })
      return response
    } catch (error) {
      console.error('Error al actualizar datos del cliente:', error)
      throw new Error('No se pudo actualizar los datos del cliente')
    }

  }
  static async changeTipoCurso(data: { id_pedido: number, id_tipo_curso: number }): Promise<CursosResponse> {
    try {
      const response = await this.apiCall<CursosResponse>(`${this.baseUrl}/change-tipo-curso`, {
        method: 'POST',
        body: data
      })
      return response

    } catch (error) {
      console.error('Error al cambiar el tipo de curso:', error)
      throw new Error('No se pudo cambiar el tipo de curso')
    }
  }
  //change-estado-pedido
  static async changeEstadoPedido(data: { id_pedido: number, estado_pedido: number }): Promise<CursosResponse> {
    try {
      const response = await this.apiCall<CursosResponse>(`${this.baseUrl}/change-estado-pedido`, {
        method: 'POST',
        body: data
      })
      return response

    } catch (error) {
      console.error('Error al cambiar el estado de pedido:', error)
      throw new Error('No se pudo cambiar el estado de pedido')
    }
  }
  static async changeImportePedido(data: { id_pedido: number, importe: number }): Promise<CursosResponse> {
    try {
      const response = await this.apiCall<CursosResponse>(`${this.baseUrl}/change-importe-pedido`, {
        method: 'POST',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al cambiar el importe de pedido:', error)
      throw new Error('No se pudo cambiar el importe de pedido')
    }
  }
  static async deleteCurso(data: { id_pedido: number }): Promise<CursosResponse> {
    try {
      const response = await this.apiCall<CursosResponse>(`${this.baseUrl}/${data.id_pedido}`, {
        method: 'DELETE',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al eliminar el curso:', error)
      throw new Error('No se pudo eliminar el curso')
    }
  }
  static async changeEstadoUsuarioExterno(data: { id_usuario: number, id_pedido: number }): Promise<CursosResponse> {
    try {
      const response = await this.apiCall<CursosResponse>(`${this.baseUrl}/change-estado-usuario-externo`, {
        method: 'POST',
        body: data
      })
      return response
    } catch (error) {
      console.error('Error al cambiar el estado de usuario externo:', error)
      throw new Error('No se pudo cambiar el estado de usuario externo')
    }
  }
}