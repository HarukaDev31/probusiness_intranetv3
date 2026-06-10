import { BaseService } from '~/services/base/BaseService'
import type {
  DocumentacionObservacionCreateRequest,
  DocumentacionObservacionCreateResponse,
  DocumentacionObservacionListResponse
} from '~/types/cargaconsolidada/documentacionObservacion'

export class DocumentacionObservacionService extends BaseService {
  private static baseUrl =
    'api/carga-consolidada/contenedor/clientes/variacion/documentacion/proveedor'

  static async listByProveedor(idProveedor: number): Promise<DocumentacionObservacionListResponse> {
    return this.apiCall<DocumentacionObservacionListResponse>(
      `${this.baseUrl}/${idProveedor}/observaciones`,
      { method: 'GET' }
    )
  }

  static async create(
    idProveedor: number,
    payload: DocumentacionObservacionCreateRequest
  ): Promise<DocumentacionObservacionCreateResponse> {
    return this.apiCall<DocumentacionObservacionCreateResponse>(
      `${this.baseUrl}/${idProveedor}/observaciones`,
      {
        method: 'POST',
        body: payload
      }
    )
  }
}
