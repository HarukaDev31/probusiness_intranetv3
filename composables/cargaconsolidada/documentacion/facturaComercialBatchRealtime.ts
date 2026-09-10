import { useModal } from '~/composables/commons/useModal'
import { canShowWsNotification, WS_NOTIFICATION_KEYS } from '~/composables/notifications/preferences'
import { downloadFacturaComercialBatchFile } from '~/composables/cargaconsolidada/documentacion/useFacturasGenerales'

export const FACTURA_COMERCIAL_BATCH_FINISHED_EVENT = 'factura-comercial-batch-finished'

export function handleFacturaComercialBatchFinished(data: {
  estado?: string
  message?: string
  batch_id?: number
  nombre_archivo?: string | null
  has_file?: boolean
  id_contenedor?: number
}): void {
  const estado = String(data?.estado || '').toUpperCase()
  const title = estado === 'COMPLETED'
    ? 'Factura general lista'
    : 'Factura general con error'
  const message = data?.message
    || (estado === 'COMPLETED'
      ? 'La factura general se generó correctamente.'
      : 'No se pudo generar la factura general.')

  if (canShowWsNotification(WS_NOTIFICATION_KEYS.FACTURA_COMERCIAL_LOTE, 'modal')) {
    const { showConfirmation, showError } = useModal()

    if (estado === 'COMPLETED' && data?.batch_id && data?.has_file !== false) {
      showConfirmation(
        title,
        message,
        async () => {
          await downloadFacturaComercialBatchFile(
            Number(data.batch_id),
            data.nombre_archivo
          )
        },
        undefined,
        {
          confirmLabel: 'Descargar',
          cancelLabel: 'Cerrar',
          persistent: true
        }
      )
    } else {
      showError(title, message)
    }
  }

  if (import.meta.client) {
    window.dispatchEvent(new CustomEvent(FACTURA_COMERCIAL_BATCH_FINISHED_EVENT, { detail: data }))
  }
}
