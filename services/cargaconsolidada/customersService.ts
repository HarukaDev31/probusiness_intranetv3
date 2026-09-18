import { BaseService } from '~/services/base/BaseService'
import type { CustomersFilters, CustomersResponse } from '~/types/cargaconsolidada/customers'

export class CustomersService extends BaseService {
  static baseUrl = 'api/carga-consolidada/customers'

  static async getCustomers(
    filters: CustomersFilters,
    search: string,
    itemsPerPage: number,
    currentPage: number,
  ): Promise<CustomersResponse> {
    const params: Record<string, string | number> = {
      search,
      itemsPerPage,
      currentPage,
    }
    if (filters.id_pais && filters.id_pais !== 'todos') {
      params.id_pais = filters.id_pais
    }
    if (filters.estado_china && filters.estado_china !== 'todos') {
      params.estado_china = filters.estado_china
    }
    if (filters.fecha_inicio) {
      params.fecha_inicio = filters.fecha_inicio
    }
    if (filters.fecha_fin) {
      params.fecha_fin = filters.fecha_fin
    }
    return this.apiCall<CustomersResponse>(this.baseUrl, {
      method: 'GET',
      params,
    })
  }
}
