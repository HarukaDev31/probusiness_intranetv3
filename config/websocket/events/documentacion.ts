import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { wsShowSuccess, WS_NOTIFICATION_KEYS } from '~/composables/notifications/preferences'

/**
 * Configuración de eventos para el rol Documentacion
 */
export const registerDocumentacionEvents = () => {
  registerEventHandler(WS_EVENTS.DOCUMENT_NEW, (_data) => {
    // Sin UI por ahora
  })

  registerEventHandler(WS_EVENTS.DOCUMENT_STATUS_CHANGE, (_data) => {
    // Sin UI por ahora
  })

  registerEventHandler(WS_EVENTS.DOCUMENT_REQUEST, (_data) => {
    // Sin UI por ahora
  })

  registerEventHandler(WS_EVENTS.IMPORTACION_EXCEL_COMPLETED, (data) => {
    try {
      wsShowSuccess(
        WS_NOTIFICATION_KEYS.IMPORTACION_EXCEL,
        'Importación Completada',
        data.message || 'La importación se ha completado exitosamente.'
      )
    } catch (error) {
      console.error('❌ Error en callback de ImportacionExcelCompleted:', error)
    }
  })

  registerEventHandler(WS_EVENTS.TEST_EVENT, (_data) => {
    wsShowSuccess(WS_NOTIFICATION_KEYS.IMPORTACION_EXCEL, 'Evento de Prueba', 'WebSocket funcionando correctamente')
  })

  subscribeEventsToRole(
    ROLES.DOCUMENTACION,
    `${ROLES.DOCUMENTACION}-notifications`,
    [
      WS_EVENTS.DOCUMENT_NEW,
      WS_EVENTS.DOCUMENT_STATUS_CHANGE,
      WS_EVENTS.DOCUMENT_REQUEST,
      WS_EVENTS.IMPORTACION_EXCEL_COMPLETED,
      WS_EVENTS.TEST_EVENT
    ],
    'private'
  )
}
