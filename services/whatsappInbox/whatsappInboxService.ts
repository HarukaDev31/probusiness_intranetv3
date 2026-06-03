import { BaseService } from '~/services/base/BaseService'
import type { WaInboxFilter } from '~/types/whatsapp-inbox'

export class WhatsappInboxService extends BaseService {
  private static baseUrl = 'api/whatsapp-inbox'

  static async getSession() {
    return await this.apiCall<any>(`${this.baseUrl}/session`, { method: 'GET' })
  }

  static async getConversations(params: {
    search?: string
    filter?: WaInboxFilter
    per_page?: number
    page?: number
  } = {}) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations`, {
      method: 'GET',
      params
    })
  }

  static async getMessages(conversationId: number, params: { per_page?: number; page?: number } = {}) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/messages`, {
      method: 'GET',
      params
    })
  }

  static async sendMessage(conversationId: number, message: string) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { message }
    })
  }

  static async sendTemplate(
    conversationId: number,
    payload: { template_name: string; params: Record<string, string> }
  ) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/templates`, {
      method: 'POST',
      body: payload
    })
  }

  static async assign(conversationId: number, userId: number | null) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/assign`, {
      method: 'PATCH',
      body: { user_id: userId ?? 0 }
    })
  }

  static async markRead(conversationId: number) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/read`, {
      method: 'PATCH'
    })
  }

  static async getTemplates() {
    return await this.apiCall<any>(`${this.baseUrl}/templates`, { method: 'GET' })
  }

  static async getAssignableUsers() {
    return await this.apiCall<any>(`${this.baseUrl}/users/assignable`, { method: 'GET' })
  }
}
