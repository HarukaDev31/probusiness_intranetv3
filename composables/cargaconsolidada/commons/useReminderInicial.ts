import { CommonsService } from '~/services/cargaconsolidada/commons/commonsService'
import type { ReminderInicialPreview } from '~/types/cargaconsolidada/cotizaciones'

export const useReminderInicial = () => {
  const previewReminderInicial = async (idCotizacion: number) => {
    return CommonsService.previewCobranza(idCotizacion)
  }

  const sendReminderInicial = async (idCotizacion: number, idContainer: number) => {
    return CommonsService.forceSendCobranza({ idCotizacion, idContainer })
  }

  return {
    previewReminderInicial,
    sendReminderInicial,
  }
}

export type { ReminderInicialPreview }
