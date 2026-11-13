import {
  registerEventHandler,
  subscribeEventsToRole,
  WS_EVENTS
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { useVerificationCounts } from '~/composables/verificacion/useVerificationCounts'

/**
 * Contadores de Verificación / Viáticos vía canal Administración.
 * El payload trae counts; no se hace GET al recibir el evento.
 */
export const registerVerificacionEvents = () => {
  registerEventHandler(WS_EVENTS.VERIFICACION_CONTADORES, (data: any) => {
    const partial = data?.counts || data
    if (!partial || typeof partial !== 'object') return
    const { applyPartial } = useVerificationCounts()
    applyPartial(partial)
  })

  subscribeEventsToRole(
    ROLES.ADMINISTRACION,
    'Administracion-notifications',
    [WS_EVENTS.VERIFICACION_CONTADORES],
    'private'
  )
}
