import { BaseService } from '~/services/base/BaseService'
import type { WaInboxConfigIndex, WaInboxLineaPayload, WaInboxOrgConfig, WaInboxOrgConfigPayload } from '~/types/whatsapp-inbox'

export class WhatsappInboxConfigService extends BaseService {
  private static baseUrl = 'api/whatsapp-inbox/config'

  static async getConfig() {
    return await this.apiCall<{ success: boolean; data: WaInboxConfigIndex; message?: string }>(
      this.baseUrl,
      { method: 'GET' }
    )
  }

  static async saveLinea(id: number | null, payload: WaInboxLineaPayload) {
    const path = id == null ? `${this.baseUrl}/lineas` : `${this.baseUrl}/lineas/${id}`
    return await this.apiCall<{ success: boolean; data: WaInboxConfigIndex; message?: string }>(
      path,
      { method: id == null ? 'POST' : 'PUT', body: payload }
    )
  }

  /** Compatibilidad: actualiza el número principal. */
  static async saveConfig(payload: WaInboxOrgConfigPayload) {
    return await this.apiCall<{ success: boolean; data: WaInboxOrgConfig; message?: string }>(
      this.baseUrl,
      { method: 'PUT', body: payload }
    )
  }
}
