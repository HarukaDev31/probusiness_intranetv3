import { BaseService } from '~/services/base/BaseService'

export type LandingCountdownPayload = {
  ends_at: string
  timezone: string
}

type LandingCountdownResponse = {
  success: boolean
  message?: string
  data: LandingCountdownPayload
}

export class LandingCountdownService extends BaseService {
  private static baseUrl = 'api/landing-leads/countdown'

  static async getCountdown(): Promise<LandingCountdownPayload> {
    const res = await this.apiCall<LandingCountdownResponse>(this.baseUrl, {
      method: 'GET'
    })
    return res.data
  }

  static async updateCountdown(endsAt: string): Promise<LandingCountdownPayload> {
    const res = await this.apiCall<LandingCountdownResponse>(this.baseUrl, {
      method: 'PUT',
      body: { ends_at: endsAt }
    })
    return res.data
  }
}
