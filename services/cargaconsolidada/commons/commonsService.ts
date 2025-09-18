import { BaseService } from "~/services/base/BaseService"

export interface forceSendRequest {
    idCotizacion: number
    idContainer: number
    proveedores: number[]
}
export class CommonsService extends BaseService {
    private static baseUrl = 'api/carga-consolidada/commons'
    
    static async forceSendInspection(data: forceSendRequest): Promise<{ success: boolean }> {
        const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/force-send-inspection`, {
            method: 'POST',
            body: data
        })
        return response
    }
    static async forceSendRotulado(data: forceSendRequest): Promise<{ success: boolean }> {
        const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/force-send`, {
            method: 'POST',
            body: data
        })
        return response
    }
    static async forceSendCobranza(data: forceSendRequest): Promise<{ success: boolean }> {
        const response = await this.apiCall<{ success: boolean }>(`${this.baseUrl}/force-send-cobranza`, {
            method: 'POST',
            body: data
        })
        return response
    }
}
