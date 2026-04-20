import {
  registerEventHandler,
  subscribeEventsToRole,
  WS_EVENTS
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { useModal } from '~/composables/commons/useModal'

/**
 * Configuracion de eventos para el rol Contabilidad.
 */
export const registerContabilidadEvents = () => {
  registerEventHandler(WS_EVENTS.USUARIO_DATOS_FACTURACION_IMPORT_FINISHED, (data) => {
    const { showSuccess, showError } = useModal()

    const status = String(data?.status || '').toUpperCase()
    const title = status === 'COMPLETADO'
      ? 'Importacion de facturacion completada'
      : 'Importacion de facturacion con errores'
    const message = data?.message || 'La importacion de datos de facturacion ha finalizado.'

    if (status === 'COMPLETADO') {
      showSuccess(title, message)
    } else {
      showError(title, message)
    }

    if (process.client) {
      window.dispatchEvent(new CustomEvent('udf-import-finished', {
        detail: data
      }))
    }
  })

  subscribeEventsToRole(
    ROLES.CONTABILIDAD,
    `${ROLES.CONTABILIDAD}-notifications`,
    [WS_EVENTS.USUARIO_DATOS_FACTURACION_IMPORT_FINISHED],
    'private'
  )
}

