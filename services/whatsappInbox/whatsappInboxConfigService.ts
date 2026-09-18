import { BaseService } from '~/services/base/BaseService'
import type { WaInboxOrgConfig, WaInboxOrgConfigPayload } from '~/types/whatsapp-inbox'

export class WhatsappInboxConfigService extends BaseService {
  private static baseUrl = 'api/whatsapp-inbox/config'

  static async getConfig() {
    return await this.apiCall<{ success: boolean; data: WaInboxOrgConfig; message?: string }>(
      this.baseUrl,
      { method: 'GET' }
    )
  }

  static async saveConfig(payload: WaInboxOrgConfigPayload) {
    return await this.apiCall<{ success: boolean; data: WaInboxOrgConfig; message?: string }>(
      this.baseUrl,
      { method: 'PUT', body: payload }
    )
  }
}
