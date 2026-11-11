import { BaseService } from './base/BaseService'
import type { VerificationCounts } from '~/composables/verificacion/useVerificationCounts'

export class VerificacionService extends BaseService {
  private static baseUrl = '/api/verificacion'

  static async contadores() {
    return this.apiCall<{ success: boolean; data: VerificationCounts }>(`${this.baseUrl}/contadores`)
  }
}
