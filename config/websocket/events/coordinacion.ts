import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import {
  dispatchWaInboxMessageCreated,
  dispatchWaInboxMessageStatusUpdated
} from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'
import { useModal } from '~/composables/commons/useModal'
import { useUserRole } from '~/composables/auth/useUserRole'
const { currentId } = useUserRole()
/**
 * Configuración de eventos para el rol Coordinación
 * Este archivo se ejecuta antes de la suscripción a los canales
 */
export const registerCoordinacionEvents = () => {
  // ============================================
  // HANDLERS PARA EVENTOS DE COORDINACIÓN
  // ============================================
  
  registerEventHandler(WS_EVENTS.TASK_ASSIGNMENT, (data) => {
    // Handler para asignación de tarea
  })

  registerEventHandler(WS_EVENTS.SCHEDULE_UPDATE, (data) => {
    // Handler para actualización de horario
  })
  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_CONTACTED, (data) => {
    const { showSuccess } = useModal()
    showSuccess(
      'Contacto con China', 
      data.message || 'Se ha contactado con China para la cotización.'
    )
  })
  registerEventHandler(WS_EVENTS.COTIZACION_CHANGE_CONTAINER, (data) => {
    const { showSuccess } = useModal()
    showSuccess('Cambio de Contenedor', data.message || 'Se ha cambiado el contenedor de la cotización.')
  })
  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_RECEIVED, (data) => {
    if(data.usuario_id == currentId.value) {
      return
    }
    const { showSuccess } = useModal()
    showSuccess('Cotización Recibida', data.message || 'Se ha recibido la cotización.')
  })
  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_INSPECTIONED, (data) => {
    if(data.usuario_id == currentId.value) {
      return
    }
    const { showSuccess } = useModal()
    showSuccess('Cotización Inspectada', data.message || 'Se ha inspeccionado la cotización.')
  })

  registerEventHandler(WA_INBOX_WS_EVENTS.MESSAGE_CREATED, dispatchWaInboxMessageCreated)
  registerEventHandler(WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED, dispatchWaInboxMessageStatusUpdated)

  registerEventHandler(WS_EVENTS.PLANTILLA_FINAL_BATCH_FINISHED, (data) => {
    const { showSuccess, showError } = useModal()
    const estado = String(data?.estado || '').toUpperCase()
    const title = estado === 'COMPLETED'
      ? 'Plantillas finales listas'
      : 'Plantillas finales con error'
    const message = data?.message || 'La generación masiva de plantillas finales ha finalizado.'

    if (estado === 'COMPLETED') {
      showSuccess(title, message)
    } else {
      showError(title, message)
    }

    if (process.client) {
      window.dispatchEvent(new CustomEvent('plantilla-final-batch-finished', { detail: data }))
    }
  })

  // ============================================
  // SUSCRIBIR EVENTOS AL ROL COORDINACIÓN
  // ============================================
  
  subscribeEventsToRole(
    'Coordinación',
    `${'Coordinacion'}-notifications`,
    [
      WS_EVENTS.TASK_ASSIGNMENT,
      WS_EVENTS.SCHEDULE_UPDATE,
      WS_EVENTS.COTIZACION_CHINA_CONTACTED,
      WS_EVENTS.COTIZACION_CHANGE_CONTAINER,
      WS_EVENTS.COTIZACION_CHINA_RECEIVED,
      WS_EVENTS.COTIZACION_CHINA_INSPECTIONED,
      WS_EVENTS.PLANTILLA_FINAL_BATCH_FINISHED
    ],
    'private'
  )

  subscribeEventsToRole(
    ROLES.COORDINACION,
    WA_INBOX_WS_CHANNEL,
    [
      WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
      WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED
    ],
    'private'
  )

}

