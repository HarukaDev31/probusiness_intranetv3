
import { BaseService } from "~/services/base/BaseService"

interface RegulationResponse {
  success: boolean
  data: string[]
  error?: string
}

class RegulationService extends BaseService {
  private static instance: RegulationService

  private constructor() {
    super()
  }

  public static getInstance(): RegulationService {
    if (!RegulationService.instance) {
      RegulationService.instance = new RegulationService()
    }
    return RegulationService.instance
  }

  // Obtener entidades para autocompletado
  async getEntidades(search?: string): Promise<RegulationResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (search && search !== '') {
        queryParams.append('search', search)
      }

      const response = await this.apiCall<RegulationResponse>(`/api/base-datos/regulaciones/entidades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`)
      return response
    } catch (error) {
      console.error('Error fetching entidades:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener entidades'
      }
    }
  }

  // Obtener etiquetados para autocompletado
  async getEtiquetados(search?: string): Promise<RegulationResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (search) {
        queryParams.append('search', search)
      }

      const response = await this.apiCall<RegulationResponse>(`/api/regulaciones/etiquetado?${queryParams.toString()}`)
      return response
    } catch (error) {
      console.error('Error fetching etiquetados:', error)
      return {
        success: false,
        data: [],
        error: 'Error al obtener etiquetados'
      }
    }
  }
}

export default RegulationService 