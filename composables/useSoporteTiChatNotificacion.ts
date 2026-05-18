import { ref } from 'vue'
import { navigateTo } from '#imports'
import { useSoporteTi } from '~/composables/useSoporteTi'
import { rutaDetalleSoporteTiPorChatUuid } from '~/utils/soporteTiRutas'

export interface SoporteTiChatNotificacionPayload {
  chatUuid: string
  codigo: string
  title: string
  message: string
}

const abierto = ref(false)
const payload = ref<SoporteTiChatNotificacionPayload | null>(null)

function urlDetalleActual(): string | null {
  const p = payload.value
  if (!p?.chatUuid) return null
  const { solicitudPorChatUuid } = useSoporteTi()
  return rutaDetalleSoporteTiPorChatUuid(p.chatUuid, solicitudPorChatUuid)
}

export function useSoporteTiChatNotificacion() {
  function mostrar(data: SoporteTiChatNotificacionPayload) {
    if (!data.chatUuid) return
    payload.value = data
    abierto.value = true
  }

  function cerrar() {
    abierto.value = false
    payload.value = null
  }

  function irAlChat() {
    const path = urlDetalleActual()
    if (!path) return
    cerrar()
    void navigateTo(path)
  }

  function abrirEnNuevaPestaña() {
    const path = urlDetalleActual()
    if (!path || typeof window === 'undefined') return
    const url = `${window.location.origin}${path}`
    window.open(url, '_blank', 'noopener,noreferrer')
    cerrar()
  }

  return {
    abierto,
    payload,
    mostrar,
    cerrar,
    irAlChat,
    abrirEnNuevaPestaña
  }
}
