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

// Tipos para estudiantes de campaña
// Basado en CursoItem de types/cursos/cursos.ts
export interface CampaignStudent {
  ID_Empresa: number
  ID_Organizacion: number
  ID_Pedido_Curso: number
  Fe_Emision: string
  Fe_Registro?: string // Fecha de registro (puede venir como Fe_Emision o Fe_Registro)
  ID_Entidad: number
  id_cliente: number
  ID_Pais: number
  ID_Medio_Pago: number
  ID_Moneda: number
  Ss_Total: string
  Nu_Estado: number
  id_cliente_importacion: number | null
  Nu_Estado_Usuario_Externo: number
  Fe_Modificacion: string
  ID_Referencia_Pago_Online: number | null
  ID_Campana: number
  note_administracion: string | null
  tipo_curso: number
  send_constancia: string
  from_intranet: number
  url_constancia: string | null
  // Campos del cliente (opcionales, pueden venir en el response)
  No_Entidad?: string // Nombre del cliente
  Nu_Documento_Identidad?: string // DNI
  Nu_Celular_Entidad?: string // Teléfono/WhatsApp
  Txt_Email_Entidad?: string // Email
  // Campos adicionales para estado de pago
  total_pagos?: string // Total pagado
  pagos_count?: number // Cantidad de pagos
  puede_constancia?: boolean // Si puede generar constancia
}

export interface CampaignStudentsResponse {
  success: boolean
  data: CampaignStudent[]
  headers?: {
    importe_total?: {
      value: number
      label: string
    }
  }
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  total_pedidos?: number
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

  /**
   * Obtener estudiantes de una campaña
   */
  static async getCampaignStudents(id: number, params: any = {}): Promise<CampaignStudentsResponse> {
    try {
      const response = await this.apiCall<CampaignStudentsResponse>(`${this.baseUrl}/${id}/students`, {
        method: 'GET',
        params: params
      })
      return response
    } catch (error) {
      console.error('Error en getCampaignStudents:', error)
      throw error
    }
  }
}

// Exportar instancia singleton
export const campaignService = new CampaignService()
