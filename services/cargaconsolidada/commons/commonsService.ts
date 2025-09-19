import { BaseService } from "~/services/base/BaseService"

export interface forceSendRequest {
    idCotizacion: number
    idContainer: number
    proveedores?: number[]
}
export interface forceMoveRequest extends forceSendRequest {
    idContainerDestino: number
    idContainerPagoDestino: number
}
export class CommonsService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/commons'

    static async forceSendInspection(data: forceSendRequest): Promise<{ success: boolean }> {
        try {
            const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/force-send-inspection`, {
                method: 'POST',
                body: data
            })
            return response

        } catch (error) {
            console.error('Error en CommonsService.forceSendInspection:', error)
            throw error
        }
    }
    static async forceSendRotulado(data: forceSendRequest): Promise<{ success: boolean }> {
        try {
            const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/force-send-rotulado`, {
                method: 'POST',
                body: data
            })
            return response

        } catch (error) {
            console.error('Error en CommonsService.forceSendRotulado:', error)
            throw error
        }
    }
    static async forceSendCobranza(data: forceSendRequest): Promise<{ success: boolean }> {
        try {
            const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/force-send-cobranza`, {
                method: 'POST',
                body: data
            })
            return response

        } catch (error) {
            console.error('Error en CommonsService.forceSendCobranza:', error)
            throw error
        }
    }

    static async forceSendMove(data: forceMoveRequest): Promise<{ success: boolean }> {
        try {
            const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/force-send-move`, {
                method: 'POST',
                body: data
            })
            return response

        } catch (error) {
            console.error('Error en CommonsService.forceSendMove:', error)
            throw error
        }
    }
}
