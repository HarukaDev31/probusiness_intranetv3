import { BaseService } from '~/services/base/BaseService'

type CopilotoLeadsParams = {
  page?: number
  per_page?: number
  search?: string
}

type CopilotoConversationParams = {
  per_page?: number
  conversation_id?: number
}

export class CopilotoService extends BaseService {
  private static baseUrl = 'api/copiloto'

  static async getLeads(params: CopilotoLeadsParams = {}) {
    return await this.apiCall<any>(`${this.baseUrl}/leads`, {
      method: 'GET',
      params
    })
  }

  static async getConversacion(phone: string, params: CopilotoConversationParams = {}) {
    return await this.apiCall<any>(`${this.baseUrl}/conversacion/${phone}`, {
      method: 'GET',
      params
    })
  }

  static async getFicha(phone: string) {
    return await this.apiCall<any>(`${this.baseUrl}/ficha/${phone}`, {
      method: 'GET'
    })
  }

  static async getAduanaContext(params: { q: string; limit?: number }) {
    return await this.apiCall<any>(`${this.baseUrl}/aduana`, {
      method: 'GET',
      params: {
        q: params.q,
        limit: params.limit ?? 18
      }
    })
  }

  static async responder(payload: { phone: string; message: string; conversation_id?: number | null }) {
    return await this.apiCall<any>(`${this.baseUrl}/responder`, {
      method: 'POST',
      body: payload
    })
  }
}

