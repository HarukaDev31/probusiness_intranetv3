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

  static async createConversation(payload: {
    contact_name: string
    phone: string
    assigned_user_id?: number | null
  }) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations`, {
      method: 'POST',
      body: {
        contact_name: payload.contact_name,
        phone: payload.phone,
        assigned_user_id: payload.assigned_user_id ?? 0
      }
    })
  }

  static async getMessages(conversationId: number, params: { per_page?: number; page?: number } = {}) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/messages`, {
      method: 'GET',
      params
    })
  }

  static async sendMessage(
    conversationId: number,
    payload: {
      message?: string
      file?: File
      mediaKind?: string
      replyToMetaMessageId?: string | null
    }
  ) {
    const text = payload.message?.trim() || ''
    const file = payload.file
    if (file) {
      const fd = new FormData()
      if (text) fd.append('message', text)
      fd.append('file', file)
      if (payload.mediaKind) fd.append('media_kind', payload.mediaKind)
      if (payload.replyToMetaMessageId) {
        fd.append('reply_to_meta_message_id', payload.replyToMetaMessageId)
      }
      return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: fd
      })
    }

    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: {
        message: text,
        reply_to_meta_message_id: payload.replyToMetaMessageId || undefined
      }
    })
  }

  static async sendTemplate(
    conversationId: number,
    payload: {
      template_name: string
      params: Record<string, string>
      files?: Record<string, File>
      /** document | image | video por clave de archivo (p. ej. header_media) */
      fileKinds?: Record<string, string>
    }
  ) {
    const files = payload.files ?? {}
    const fileKinds = payload.fileKinds ?? {}
    const fileKeys = Object.keys(files)
    if (fileKeys.length === 0) {
      return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/templates`, {
        method: 'POST',
        body: {
          template_name: payload.template_name,
          params: payload.params
        }
      })
    }

    const fd = new FormData()
    fd.append('template_name', payload.template_name)
    fd.append('params', JSON.stringify(payload.params))
    for (const key of fileKeys) {
      const file = files[key]
      fd.append(key, file)
      const kind = fileKinds[key]
      if (key === 'header_media' && kind) {
        fd.append('header_file_kind', kind)
      }
    }

    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/templates`, {
      method: 'POST',
      body: fd
    })
  }

  static async assign(conversationId: number, userId: number | null) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/assign`, {
      method: 'PATCH',
      body: { user_id: userId ?? 0 }
    })
  }

  static async renameContact(conversationId: number, contactName: string) {
    return await this.apiCall<any>(`${this.baseUrl}/conversations/${conversationId}/contact-name`, {
      method: 'PATCH',
      body: { contact_name: contactName.trim() }
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
