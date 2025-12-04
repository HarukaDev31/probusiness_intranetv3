import { BaseService } from "~/services/base/BaseService"

export interface SendDocumentResponse {
  success: boolean
  message?: string
  error?: string
  data?: any
}

export class WhatsappService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/contenedor/factura-guia'

  /**
   * Enviar factura comercial por WhatsApp
   */
  static async sendFactura(idCotizacion: number): Promise<SendDocumentResponse> {
    try {
      const response = await this.apiCall<SendDocumentResponse>(
        `${this.baseUrl}/send-factura/${idCotizacion}`,
        {
          method: 'POST'
        }
      )
      return response
    } catch (error: any) {
      console.error('Error al enviar factura por WhatsApp:', error)
      return {
        success: false,
        error: error?.message || 'Error al enviar la factura por WhatsApp'
      }
    }
  }

  /**
   * Enviar guía de remisión por WhatsApp
   */
  static async sendGuia(idCotizacion: number): Promise<SendDocumentResponse> {
    try {
      const response = await this.apiCall<SendDocumentResponse>(
        `${this.baseUrl}/send-guia/${idCotizacion}`,
        {
          method: 'POST'
        }
      )
      return response
    } catch (error: any) {
      console.error('Error al enviar guía por WhatsApp:', error)
      return {
        success: false,
        error: error?.message || 'Error al enviar la guía de remisión por WhatsApp'
      }
    }
  }
}

