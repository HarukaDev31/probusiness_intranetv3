import { BaseService } from '~/services/base/BaseService'

export class CargosExtraService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/contenedor/cotizacion-final'

  static async getCargosExtra(id: number, params: any): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)
    const qs = queryParams.toString()
    return await this.apiCall<any>(`${this.baseUrl}/cargos-extra/${id}${qs ? `?${qs}` : ''}`)
  }
}
