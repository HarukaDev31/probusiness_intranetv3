import { BaseService } from '~/services/base/BaseService'
import type { HomeStatsResponse } from '~/types/cargaconsolidada/home-stats'

export class HomeStatsService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/home-stats'

  static async getStats(): Promise<HomeStatsResponse> {
    return this.apiCall<HomeStatsResponse>(this.baseUrl, { method: 'GET' })
  }
}
