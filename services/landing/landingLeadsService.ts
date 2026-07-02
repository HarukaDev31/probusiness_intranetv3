import { BaseService } from '~/services/base/BaseService'
import type {
  LandingConsolidadoLeadsResponse,
  LandingCursoLeadsResponse
} from '~/types/landing-leads'

type LeadsQueryParams = {
  page?: number
  per_page?: number
  search?: string
}

export class LandingLeadsService extends BaseService {
  private static baseUrl = 'api/landing-leads'

  static async getConsolidadoLeads(params: LeadsQueryParams): Promise<LandingConsolidadoLeadsResponse> {
    return await this.apiCall<LandingConsolidadoLeadsResponse>(`${this.baseUrl}/consolidado`, {
      method: 'GET',
      params
    })
  }

  static async getCursoLeads(params: LeadsQueryParams): Promise<LandingCursoLeadsResponse> {
    return await this.apiCall<LandingCursoLeadsResponse>(`${this.baseUrl}/curso`, {
      method: 'GET',
      params
    })
  }

  static async exportConsolidadoLeads(params: LeadsQueryParams): Promise<Blob> {
    return await this.apiCall<Blob>(`${this.baseUrl}/consolidado/export`, {
      method: 'GET',
      params,
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
  }

  static async exportCursoLeads(params: LeadsQueryParams): Promise<Blob> {
    return await this.apiCall<Blob>(`${this.baseUrl}/curso/export`, {
      method: 'GET',
      params,
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
  }
}

