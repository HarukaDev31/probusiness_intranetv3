import { BaseService } from '~/services/base/BaseService'
import type {
  PlantillaFinalBatchListResponse,
  PlantillaFinalBatchEnqueueResponse
} from '~/types/cargaconsolidada/cotizacion-final/plantilla-final-batch'

export class PlantillaFinalBatchService extends BaseService {
  private static baseUrl = 'api/carga-consolidada/contenedor/cotizacion-final/general'

  static async listByContenedor(idContenedor: number): Promise<PlantillaFinalBatchListResponse> {
    return await this.apiCall<PlantillaFinalBatchListResponse>(
      `${this.baseUrl}/plantilla-final-batches/${idContenedor}`
    )
  }

  static async uploadPlantillaFinal(data: FormData): Promise<PlantillaFinalBatchEnqueueResponse> {
    return await this.apiCall<PlantillaFinalBatchEnqueueResponse>(
      `${this.baseUrl}/upload-plantilla-final`,
      { method: 'POST', body: data }
    )
  }

  static async downloadPlantilla(id: number): Promise<Blob> {
    return await this.apiCall<Blob>(
      `${this.baseUrl}/plantilla-final-batches/${id}/download-plantilla`,
      { method: 'GET', responseType: 'blob' }
    )
  }

  static async downloadZip(id: number): Promise<Blob> {
    return await this.apiCall<Blob>(
      `${this.baseUrl}/plantilla-final-batches/${id}/download-zip`,
      { method: 'GET', responseType: 'blob' }
    )
  }
}
