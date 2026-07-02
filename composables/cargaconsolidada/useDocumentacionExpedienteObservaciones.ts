import { DocumentacionObservacionService } from '~/services/cargaconsolidada/clientes/documentacionObservacionService'
import {
  DOC_EXPEDIENTE_OBS_WS_EVENT,
  documentacionExpedienteObsChannelName
} from '~/constants/documentacionExpedienteObservaciones'
import { useEcho, getEchoInstance } from '~/composables/websocket/useEcho'
import type {
  DocumentacionExpedienteObservacionWsPayload,
  DocumentacionObservacion,
  DocumentacionObservacionCategoria
} from '~/types/cargaconsolidada/documentacionObservacion'

function parseWsPayload(raw: unknown): DocumentacionExpedienteObservacionWsPayload | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as DocumentacionExpedienteObservacionWsPayload
    } catch {
      return null
    }
  }
  return raw as DocumentacionExpedienteObservacionWsPayload
}

export function useDocumentacionExpedienteObservaciones(proveedorId: Ref<number | null | undefined>) {
  const observaciones = ref<DocumentacionObservacion[]>([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref<string | null>(null)
  const categoriaSeleccionada = ref<DocumentacionObservacionCategoria>('factura_comercial')
  const mensajeDraft = ref('')

  const { subscribeToChannel, unsubscribeFromChannel, isConnected } = useEcho()
  let canalActivo: string | null = null
  let proveedorSuscripcion: number | null = null

  const appendObservacion = (obs: DocumentacionObservacion) => {
    if (observaciones.value.some((item) => item.id === obs.id)) return
    observaciones.value = [...observaciones.value, obs]
  }

  const desuscribirCanal = () => {
    if (!canalActivo) return
    try {
      unsubscribeFromChannel(canalActivo)
    } catch (e) {
      console.warn('[DocExpObs] Error al desuscribir canal:', canalActivo, e)
    }
    canalActivo = null
    proveedorSuscripcion = null
  }

  const suscribirCanal = (idProveedor: number) => {
    if (!idProveedor || typeof window === 'undefined') return
    if (!getEchoInstance()) return

    const channelName = documentacionExpedienteObsChannelName(idProveedor)
    if (canalActivo === channelName) return

    desuscribirCanal()

    subscribeToChannel({
      name: channelName,
      type: 'private',
      handlers: [
        {
          event: DOC_EXPEDIENTE_OBS_WS_EVENT,
          callback: (raw: unknown) => {
            const payload = parseWsPayload(raw)
            if (!payload?.observacion || Number(payload.id_proveedor) !== idProveedor) return
            appendObservacion(payload.observacion)
          }
        }
      ]
    })

    canalActivo = channelName
    proveedorSuscripcion = idProveedor
  }

  const cargarObservaciones = async (idProveedor: number) => {
    loading.value = true
    error.value = null
    try {
      const res = await DocumentacionObservacionService.listByProveedor(idProveedor)
      observaciones.value = res.data ?? []
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'No se pudieron cargar las observaciones.'
      observaciones.value = []
    } finally {
      loading.value = false
    }
  }

  const sincronizarProveedor = async (idProveedor: number | null | undefined) => {
    desuscribirCanal()
    observaciones.value = []
    mensajeDraft.value = ''

    if (!idProveedor) return

    await cargarObservaciones(idProveedor)
    suscribirCanal(idProveedor)
  }

  watch(
    proveedorId,
    (id) => {
      void sincronizarProveedor(id ?? null)
    },
    { immediate: true }
  )

  watch(isConnected, (connected) => {
    if (!connected || !proveedorSuscripcion) return
    suscribirCanal(proveedorSuscripcion)
  })

  onBeforeUnmount(() => {
    desuscribirCanal()
  })

  const enviarObservacion = async () => {
    const idProveedor = proveedorId.value
    const mensaje = mensajeDraft.value.trim()

    if (!idProveedor) {
      throw new Error('Selecciona un proveedor.')
    }
    if (!mensaje) {
      throw new Error('Escribe una observación.')
    }

    sending.value = true
    try {
      const res = await DocumentacionObservacionService.create(idProveedor, {
        categoria: categoriaSeleccionada.value,
        mensaje
      })
      appendObservacion(res.data)
      mensajeDraft.value = ''
      return res.data
    } finally {
      sending.value = false
    }
  }

  return {
    observaciones,
    loading,
    sending,
    error,
    categoriaSeleccionada,
    mensajeDraft,
    cargarObservaciones,
    enviarObservacion
  }
}
