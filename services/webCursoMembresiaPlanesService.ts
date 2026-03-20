import type { WebCursoPlan, WebCursoPlanPayload } from '~/types/cursos/webCursoPlanes'
import { BaseService } from '~/services/base/BaseService'

export class WebCursoMembresiaPlanesService extends BaseService {
  private static baseUrl = 'api/cursos/web-planes-membresia'

  static async list(pageKey: string = 'curso_membresia'): Promise<{ data: WebCursoPlan[] }> {
    return this.apiCall<{ data: WebCursoPlan[] }>(this.baseUrl, {
      method: 'GET',
      params: { page_key: pageKey }
    })
  }

  static async create(body: WebCursoPlanPayload): Promise<{ data: WebCursoPlan; message?: string }> {
    return this.apiCall<{ data: WebCursoPlan; message?: string }>(this.baseUrl, {
      method: 'POST',
      body
    })
  }

  static async update(
    id: number,
    body: WebCursoPlanPayload
  ): Promise<{ data: WebCursoPlan; message?: string }> {
    return this.apiCall<{ data: WebCursoPlan; message?: string }>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body
    })
  }

  static async delete(id: number): Promise<{ message?: string }> {
    return this.apiCall<{ message?: string }>(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    })
  }
}
