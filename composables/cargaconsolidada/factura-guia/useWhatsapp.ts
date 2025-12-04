import { ref, readonly } from 'vue'
import { WhatsappService } from '~/services/cargaconsolidada/factura-guia/whatsappService'
import type { SendDocumentResponse } from '~/services/cargaconsolidada/factura-guia/whatsappService'

export const useWhatsapp = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Enviar factura comercial por WhatsApp
   */
  const sendFactura = async (idCotizacion: number): Promise<SendDocumentResponse> => {
    try {
      loading.value = true
      error.value = null
      const response = await WhatsappService.sendFactura(idCotizacion)
      return response
    } catch (err: any) {
      error.value = err?.message || 'Error al enviar la factura'
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Enviar guía de remisión por WhatsApp
   */
  const sendGuia = async (idCotizacion: number): Promise<SendDocumentResponse> => {
    try {
      loading.value = true
      error.value = null
      const response = await WhatsappService.sendGuia(idCotizacion)
      return response
    } catch (err: any) {
      error.value = err?.message || 'Error al enviar la guía'
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    sendFactura,
    sendGuia
  }
}

