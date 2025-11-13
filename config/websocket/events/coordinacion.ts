import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { useModal } from '~/composables/commons/useModal'

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
    
  // ============================================
  // SUSCRIBIR EVENTOS AL ROL COORDINACIÓN
  // ============================================
  
  subscribeEventsToRole(
    ROLES.COORDINACION,
    `${ROLES.COORDINACION}-notifications`,
    [
      WS_EVENTS.TASK_ASSIGNMENT,
      WS_EVENTS.SCHEDULE_UPDATE
    ],
    'private'
  )

  console.log('✅ Eventos del rol Coordinación registrados')
}

