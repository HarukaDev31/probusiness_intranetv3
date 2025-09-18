import type { forceSendRequest } from "~/services/cargaconsolidada/commons/commonsService"
import { CommonsService } from "~/services/cargaconsolidada/commons/commonsService"
export const useCommons = () => {
    const forceSendInspection = async (data: forceSendRequest) => {
        const response = await CommonsService.forceSendInspection(data)
        return response
    }
    const forceSendRotulado = async (data: forceSendRequest) => {
        const response = await CommonsService.forceSendRotulado(data)
        return response
    }
    const forceSendCobranza = async (data: forceSendRequest) => {
        const response = await CommonsService.forceSendCobranza(data)
        return response
    }
    return {
        forceSendInspection,
        forceSendRotulado,
        forceSendCobranza
    }
}