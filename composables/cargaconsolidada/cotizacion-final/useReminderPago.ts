import { GeneralService } from '~/services/cargaconsolidada/cotizacion-final/generalService'
import type { ReminderPagoPreview } from '~/types/cargaconsolidada/cotizacion-final/general'

export const useReminderPago = () => {
  const previewReminderPago = async (idCotizacion: number) => {
    return GeneralService.previewReminderPago(idCotizacion)
  }

  const sendReminderPago = async (idCotizacion: number) => {
    return GeneralService.sendReminderPago(idCotizacion)
  }

  return {
    previewReminderPago,
    sendReminderPago,
  }
}

export type { ReminderPagoPreview }
