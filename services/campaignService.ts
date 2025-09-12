import { BaseService } from "~/services/base/BaseService"

// Tipos
export interface Campaign {
  id: number
  fecha_creacion: string
  nombre_campana: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_personas: number
}

export interface CampaignData {
  Fe_Inicio: string
  Fe_Fin: string
  Dias_Seleccionados: string[]
}

export interface CampaignFilters {
  mes?: string
  estado?: string
}

export interface CampaignListParams {
  page?: number
  limit?: number
  search?: string
  filters?: CampaignFilters
}

export interface CampaignListResponse {
  data: Campaign[]
  total: number
  page: number
  limit: number
}

export class CampaignService extends BaseService {
  private static baseUrl = '/api/campaigns'
  constructor() {
    super()
  }
  /**
   * Obtener lista de campañas con paginación y filtros
   */
  static async getCampaigns(params: CampaignListParams = {}): Promise<CampaignListResponse> {
    // Simular llamada a API
    try {
      const response = await this.apiCall<CampaignListResponse>(`${this.baseUrl}`, {
        method: 'GET',
        params: params
      })
      return response
    } catch (error) {
      console.error('Error en getCampaigns:', error)
      throw error
    }
  }

  /**
   * Crear una nueva campaña
   */
  static async createCampaign(campaignData: CampaignData): Promise<{ data: Campaign }> {
    // Simular creación
    try {
      const response = await this.apiCall<{ success: boolean; data: Campaign }>(`${this.baseUrl}`, {
        method: 'POST',
        body: JSON.stringify(campaignData)
      })
      return response
    } catch (error) {
      console.error('Error en createCampaign:', error)
      throw error
    }
  }

  /**
   * Actualizar una campaña existente
   */
  static async updateCampaign(id: number, campaignData: Partial<Campaign>): Promise<{ data: Campaign }> {
    // Simular actualización
    try {
      const response = await this.apiCall<{ success: boolean; data: Campaign }>(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(campaignData)
      })
      return response
    } catch (error) {
      console.error('Error en updateCampaign:', error)
      throw error
    }
  }

  /**
   * Eliminar una campaña
   */
  static async deleteCampaign(id: number): Promise<any> {
    // Simular eliminación
    try {
      const response = await this.apiCall<any>(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error en deleteCampaign:', error)
      throw error
    }
  }

  /**
   * Obtener una campaña por ID
   */
  static async getCampaignById(id: number): Promise<Campaign> {
    // Simular obtención
    try {
      const response = await this.apiCall<Campaign>(`${this.baseUrl}/${id}`, {
        method: 'GET'
      })
      return response
    } catch (error) {
      console.error('Error en getCampaignById:', error)
      throw error
    }
    
    return {
      id,
      fecha_creacion: new Date().toISOString().split('T')[0],
      nombre_campana: 'Campaña',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date().toISOString().split('T')[0],
      cantidad_personas: 0
    }
  }

  /**
   * Obtener estadísticas de campañas
   */
  static async getCampaignStats(): Promise<{
    total: number
    activas: number
    finalizadas: number
    programadas: number
  }> {
    // Simular estadísticas
    try {
      const response = await this.apiCall<{
        total: number
        activas: number
        finalizadas: number
        programadas: number
      }>(`${this.baseUrl}/stats`)
      return response
    } catch (error) {
      console.error('Error en getCampaignStats:', error)
      throw error
    }
    
    return {
      total: 0,
      activas: 0,
      finalizadas: 0,
      programadas: 0
    }
  }

  /**
   * Validar fechas de campaña
   */
  static async validateCampaignDates(campaignData: CampaignData): Promise<{
    valid: boolean
    message?: string
  }> {
    // Simular validación
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      valid: true,
      message: 'Fechas válidas'
    }
  }
}

// Exportar instancia singleton
export const campaignService = new CampaignService()
