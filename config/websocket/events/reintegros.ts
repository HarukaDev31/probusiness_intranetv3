import { 
    registerEventHandler, 
    subscribeEventsToRole,
    WS_EVENTS 
  } from '~/config/websocket/channels'
  import { ROLES } from '~/constants/roles'
  import { useModal } from '~/composables/commons/useModal'
  import { useUserRole } from '~/composables/auth/useUserRole'
  const { currentId } = useUserRole()
  /**
   * Configuración de eventos para el rol Reintegro
   * Este archivo se ejecuta antes de la suscripción a los canales
   */
  export const registerReintegroEvents = () => {
    // ============================================
    // HANDLERS PARA EVENTOS DE COTIZACIÓN
    // ============================================
    
    // Handler para CotizacionStatusUpdated
    registerEventHandler(WS_EVENTS.REINTEGRO_REQUEST, (data) => {
      const { showSuccess } = useModal()
      showSuccess('Reintegro solicitado', data.message || 'Se ha solicitado el reintegro exitosamente.')
    })
  

 
  
    // ============================================
    // SUSCRIBIR EVENTOS AL ROL COTIZADOR
    // ============================================
    
    subscribeEventsToRole(
      ROLES.ADMINISTRACION,
      `${ROLES.ADMINISTRACION}-notifications`,
      [
        WS_EVENTS.REINTEGRO_REQUEST
      ],
      'private'
    )
  
  }
  
  