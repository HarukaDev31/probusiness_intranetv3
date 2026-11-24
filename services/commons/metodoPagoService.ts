import { BaseService } from '~/services/base/BaseService'

/** CFG-26-0056: método de pago preferido del usuario para recibir reintegros. */
export interface MetodoPagoPreferido {
  metodo: string
  metodo_label: string
  numero: string | null
  /** false = aún no lo configuró (se asume Yape con el celular de la cuenta) */
  configurado: boolean
}

export interface MetodoPagoResponse {
  success: boolean
  message?: string
  data: MetodoPagoPreferido
  metodos: { value: string; label: string }[]
}

export class MetodoPagoService extends BaseService {
  private static baseUrl = 'api/auth/metodo-pago'

  static async get(): Promise<MetodoPagoResponse> {
    return this.apiCall<MetodoPagoResponse>(this.baseUrl)
  }

  static async update(metodo: string, numero: string): Promise<MetodoPagoResponse> {
    return this.apiCall<MetodoPagoResponse>(this.baseUrl, {
      method: 'PUT',
      body: { metodo, numero }
    })
  }
}
