import { BaseService } from '~/services/base/BaseService'
import type {
  SystemNews,
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsListResponse,
  NewsResponse,
  NewsFilters
} from '~/types/news'

export class NewsService extends BaseService {
  private static instance: NewsService

  private constructor() {
    super()
  }

  /**
   * Obtener lista de noticias públicas (solo publicadas)
   */
  static async getNews(filters?: NewsFilters): Promise<NewsListResponse> {
    const params = new URLSearchParams()
    
    if (filters?.type) params.append('type', filters.type)
    if (filters?.solicitada_por) params.append('solicitada_por', filters.solicitada_por)
    if (filters?.per_page) params.append('per_page', filters.per_page.toString())
    if (filters?.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const endpoint = `/api/news${queryString ? `?${queryString}` : ''}`

    return this.apiCall<NewsListResponse>(endpoint, {
      method: 'GET'
    })
  }

  /**
   * Obtener una noticia específica
   */
  static async getNewsById(id: number): Promise<NewsResponse> {
    return this.apiCall<NewsResponse>(`/api/news/${id}`, {
      method: 'GET'
    })
  }

  /**
   * Obtener lista de noticias (admin - incluye no publicadas)
   */
  static async getAdminNews(filters?: NewsFilters): Promise<NewsListResponse> {
    const params = new URLSearchParams()
    
    if (filters?.type) params.append('type', filters.type)
    if (filters?.solicitada_por) params.append('solicitada_por', filters.solicitada_por)
    if (filters?.is_published !== undefined) params.append('is_published', filters.is_published.toString())
    if (filters?.per_page) params.append('per_page', filters.per_page.toString())
    if (filters?.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const endpoint = `/api/admin/news${queryString ? `?${queryString}` : ''}`

    return this.apiCall<NewsListResponse>(endpoint, {
      method: 'GET'
    })
  }

  /**
   * Crear una nueva noticia (admin)
   */
  static async createNews(newsData: CreateNewsRequest): Promise<NewsResponse> {
    return this.apiCall<NewsResponse>('/api/admin/news', {
      method: 'POST',
      body: JSON.stringify(newsData)
    })
  }

  /**
   * Actualizar una noticia (admin)
   */
  static async updateNews(id: number, newsData: UpdateNewsRequest): Promise<NewsResponse> {
    return this.apiCall<NewsResponse>(`/api/admin/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(newsData)
    })
  }

  /**
   * Eliminar una noticia (admin)
   */
  static async deleteNews(id: number): Promise<{ success: boolean; message: string }> {
    return this.apiCall<{ success: boolean; message: string }>(`/api/admin/news/${id}`, {
      method: 'DELETE'
    })
  }
}

