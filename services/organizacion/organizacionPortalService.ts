import { BaseService } from '~/services/base/BaseService'
import type { OrganizacionPortalResponse } from '~/types/organizacion-portal'

export class OrganizacionPortalService extends BaseService {
  static async getPortal(organizacionId?: number): Promise<OrganizacionPortalResponse> {
    const qs = new URLSearchParams()
    if (organizacionId && organizacionId > 0) {
      qs.set('organizacion_id', String(organizacionId))
    }
    const suffix = qs.toString() ? `?${qs}` : ''
    return await this.apiCall<OrganizacionPortalResponse>(`/api/organizacion-portales${suffix}`)
  }
}
