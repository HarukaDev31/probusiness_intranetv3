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
      //data.data ="{\"viatico_id\":4,\"viatico_subject\":\"Taxi\",\"viatico_total_amount\":\"35.00\",\"viatico_status\":\"PENDING\",\"usuario_id\":28790,\"usuario_nombre\":\"Danitza\",\"message\":\"Vi\\u00e1tico creado exitosamente\",\"updated_at\":\"2026-01-29T15:07:51+00:00\"}"

      const viatico = JSON.parse(data.data) 
      const {usuario_nombre, viatico_subject, viatico_total_amount} = viatico
      const message = `El usuario ${usuario_nombre} ha solicitado el reintegro de ${viatico_total_amount} para ${viatico_subject}.`
      showSuccess('Reintegro solicitado', message)
    })
  

 
  
    // ============================================
    // SUSCRIBIR EVENTOS AL ROL COTIZADOR
    // ============================================
    
    subscribeEventsToRole(
      ROLES.ADMINISTRACION,
      `Administracion-notifications`,
      [
        WS_EVENTS.REINTEGRO_REQUEST
      ],
      'private'
    )
  
  }
  
  