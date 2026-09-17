import { GeneralService } from '~/services/cargaconsolidada/cotizacion-final/generalService'
import type { ReminderPagoPreview } from '~/types/cargaconsolidada/cotizacion-final/general'

export const useReminderPago = () => {
  const previewReminderPago = async (idCotizacion: number) => {
    try {
      return await GeneralService.previewReminderPago(idCotizacion)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, message }
    }
  }

  const sendReminderPago = async (idCotizacion: number) => {
    try {
      return await GeneralService.sendReminderPago(idCotizacion)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, message }
    }
  }

  return {
    previewReminderPago,
    sendReminderPago,
  }
}

export type { ReminderPagoPreview }
