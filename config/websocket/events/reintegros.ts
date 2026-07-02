import {
    registerEventHandler,
    subscribeEventsToRole,
    WS_EVENTS
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { wsShowSuccess, WS_NOTIFICATION_KEYS } from '~/composables/notifications/preferences'

/**
 * Configuración de eventos para reintegros / viáticos (Administración).
 */
export const registerReintegroEvents = () => {
    registerEventHandler(WS_EVENTS.REINTEGRO_REQUEST, (data) => {
        const viatico = data
        const { usuario_nombre, viatico_subject, viatico_total_amount } = viatico
        const message = `El usuario ${usuario_nombre} ha solicitado el reintegro de S/ ${viatico_total_amount} para ${viatico_subject}.`
        wsShowSuccess(WS_NOTIFICATION_KEYS.VIATICO_REINTEGRO, 'Reintegro solicitado', message)
    })

    subscribeEventsToRole(
        ROLES.ADMINISTRACION,
        `Administracion-notifications`,
        [
            WS_EVENTS.REINTEGRO_REQUEST
        ],
        'private'
    )
}
