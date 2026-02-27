import { BaseService } from "~/services/base/BaseService"

export class ComprobanteFormService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/contenedor/factura-guia/contabilidad'

  static async getFormByCotizacion(idCotizacion: number): Promise<any> {
    try {
      return await this.apiCall<any>(`${this.baseUrl}/comprobante-form/${idCotizacion}`)
    } catch (error: any) {
      console.error('Error al obtener formulario de comprobante:', error)
      return { success: false, data: null, error: error?.message }
    }
  }
}
