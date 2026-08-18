import { BaseService } from '~/services/base/BaseService'
import type {
  FacturaComercialBatchEnqueueResponse,
  FacturaComercialBatchListResponse
} from '~/types/cargaconsolidada/documentacion/factura-comercial-batch'

export class FacturaComercialBatchService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/contenedor/documentacion'

  static async enqueue(idContenedor: number): Promise<FacturaComercialBatchEnqueueResponse> {
    return await this.apiCall<FacturaComercialBatchEnqueueResponse>(
      `${this.baseUrl}/factura-comercial-batches/${idContenedor}`,
      { method: 'POST' }
    )
  }

  static async listByContenedor(idContenedor: number): Promise<FacturaComercialBatchListResponse> {
    return await this.apiCall<FacturaComercialBatchListResponse>(
      `${this.baseUrl}/factura-comercial-batches/${idContenedor}`
    )
  }

  static async download(id: number): Promise<Blob> {
    return await this.apiCall<Blob>(
      `${this.baseUrl}/factura-comercial-batches/${id}/download`,
      { method: 'GET', responseType: 'blob' }
    )
  }
}
