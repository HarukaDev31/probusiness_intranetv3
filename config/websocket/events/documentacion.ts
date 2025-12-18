import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { useModal } from '~/composables/commons/useModal'

/**
 * Configuración de eventos para el rol Documentacion
 * Este archivo se ejecuta antes de la suscripción a los canales
 */
export const registerDocumentacionEvents = () => {
  // ============================================
  // HANDLERS PARA EVENTOS DE DOCUMENTACIÓN
  // ============================================
  
  registerEventHandler(WS_EVENTS.DOCUMENT_NEW, (data) => {
    // Handler para nuevo documento
  })

  registerEventHandler(WS_EVENTS.DOCUMENT_STATUS_CHANGE, (data) => {
    // Handler para cambio de estado de documento
  })

  registerEventHandler(WS_EVENTS.DOCUMENT_REQUEST, (data) => {
    // Handler para solicitud de documento
  })

  registerEventHandler(WS_EVENTS.IMPORTACION_EXCEL_COMPLETED, (data) => {
    try {
      const { showSuccess } = useModal()
      showSuccess('Importación Completada', data.message || 'La importación se ha completado exitosamente.')
      
      if (data.estadisticas) {
        // Log adicional para debugging
      }
    } catch (error) {
      console.error('❌ Error en callback de ImportacionExcelCompleted:', error)
    }
  })

  registerEventHandler(WS_EVENTS.TEST_EVENT, (data) => {
    const { showSuccess } = useModal()
    showSuccess('Evento de Prueba', 'WebSocket funcionando correctamente')
  })

  // ============================================
  // SUSCRIBIR EVENTOS AL ROL DOCUMENTACIÓN
  // ============================================
  
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

