// ============================================
// DEFINICIÓN DE EVENTOS
// ============================================
// Mapa simple de todos los eventos disponibles
// Los eventos se organizan por rol en config/websocket/events/rol.ts
export const WS_EVENTS = {
  // Eventos de Cotización (usados en events/cotizador.ts)
  COTIZACION_STATUS_UPDATED: 'CotizacionStatusUpdated',
  COTIZACION_NEW_REQUEST: 'CotizacionNewRequest',
  //evento cuando china llena arrive date de la cotizacion
  COTIZACION_CHINA_CONTACTED: 'CotizacionChinaContacted',
  COTIZACION_CHINA_RECEIVED: 'CotizacionChinaReceived',
  COTIZACION_CHINA_INSPECTIONED: 'CotizacionChinaInspected',
  //Evento que se envia cuando rolean un carga
  COTIZACION_CHANGE_CONTAINER: 'CotizacionChangeContainer',
  // Eventos de Contenedor (usados en events/contenedor-consolidado.ts)
  CONTAINER_STATUS_CHANGE: 'ContainerStatusChange',
  CONTAINER_NEW: 'NewContainer',
  CONTAINER_ACTIVITY: 'ContainerActivity',
  
  // Eventos de Documentación (usados en events/documentacion.ts)
  DOCUMENT_STATUS_CHANGE: 'DocumentStatusChange',
  DOCUMENT_NEW: 'NewDocument',
  DOCUMENT_REQUEST: 'DocumentRequest',
  IMPORTACION_EXCEL_COMPLETED: 'ImportacionExcelCompleted',
  TEST_EVENT: 'TestEvent',
  
  // Eventos de Almacén (usados en events/contenedor-almacen.ts)
  STOCK_UPDATE: 'StockUpdate',
  WAREHOUSE_ALERT: 'WarehouseAlert',
  
  // Eventos de Coordinación (usados en events/coordinacion.ts)
  TASK_ASSIGNMENT: 'TaskAssignment',
  SCHEDULE_UPDATE: 'ScheduleUpdate',
  
  // Eventos de Sistema (usados en events/admin.ts y events/user.ts)
  SYSTEM_GENERAL: 'GeneralNotification',
  SYSTEM_MAINTENANCE: 'MaintenanceAlert',
  SYSTEM_UPDATE: 'SystemUpdate',
  USER_ACTIVITY: 'UserActivity',
  DASHBOARD_UPDATE: 'DashboardUpdate',
  //evnetos de administracion
  REINTEGRO_REQUEST:'ViaticoCreado'
} as const

// ============================================
// CONFIGURACIÓN DE EVENTOS POR ROL
// ============================================
export interface RoleEventConfig {
  role: string
  channels: {
    name: string
    type: 'private' | 'presence'
    events: string[]
  }[]
}

// Configuración base (estática) - Ahora vacía, todos los eventos se registran dinámicamente
// Los eventos están organizados por rol en config/websocket/events/
const BASE_ROLE_EVENTS_CONFIG: RoleEventConfig[] = []

// ============================================
// SISTEMA DE REGISTRO DINÁMICO
// ============================================
// Almacenamiento dinámico para roles y eventos agregados programáticamente
const dynamicRoleConfigs: Map<string, RoleEventConfig> = new Map()
const dynamicEventHandlers: Map<string, (data: any) => void> = new Map()

/**
 * Registra un handler para un evento
 * @param eventName - Nombre del evento
 * @param handler - Función callback que se ejecutará cuando se reciba el evento
 */
export const registerEventHandler = (eventName: string, handler: (data: any) => void): void => {
  dynamicEventHandlers.set(eventName, handler)
}

/**
 * Registra un nuevo rol con su configuración de canales y eventos
 * @param role - Nombre del rol
 * @param channels - Array de canales con sus eventos
 */
export const registerRole = (
  role: string,
  channels: {
    name: string
    type: 'private' | 'presence'
    events: string[]
  }[]
): void => {
  const existingConfig = dynamicRoleConfigs.get(role)
  
  if (existingConfig) {
    // Si el rol ya existe, fusionar los canales
    const existingChannelNames = new Set(existingConfig.channels.map(c => c.name))
    
    channels.forEach(newChannel => {
      const existingChannel = existingConfig.channels.find(c => c.name === newChannel.name)
      
      if (existingChannel) {
        // Fusionar eventos del canal existente
        const existingEvents = new Set(existingChannel.events)
        newChannel.events.forEach(event => existingEvents.add(event))
        existingChannel.events = Array.from(existingEvents)
      } else {
        // Agregar nuevo canal
        existingConfig.channels.push(newChannel)
      }
    })
  } else {
    // Crear nueva configuración de rol
    dynamicRoleConfigs.set(role, {
      role,
      channels: [...channels]
    })
  }
}

/**
 * Suscribe eventos a un rol existente o nuevo
 * @param role - Nombre del rol
 * @param channelName - Nombre del canal (si no existe, se crea como 'private')
 * @param events - Array de nombres de eventos a suscribir
 * @param channelType - Tipo de canal ('private' o 'presence'), por defecto 'private'
 */
export const subscribeEventsToRole = (
  role: string,
  channelName: string,
  events: string[],
  channelType: 'private' | 'presence' = 'private'
): void => {
  const roleConfig = dynamicRoleConfigs.get(role) || {
    role,
    channels: []
  }
  
  let channel = roleConfig.channels.find(c => c.name === channelName)
  
  if (!channel) {
    // Crear nuevo canal si no existe
    channel = {
      name: channelName,
      type: channelType,
      events: []
    }
    roleConfig.channels.push(channel)
  }
  
  // Agregar eventos al canal (evitar duplicados)
  const existingEvents = new Set(channel.events)
  events.forEach(event => existingEvents.add(event))
  channel.events = Array.from(existingEvents)
  
  dynamicRoleConfigs.set(role, roleConfig)
}

/**
 * Suscribe un evento específico a un rol
 * @param role - Nombre del rol
 * @param channelName - Nombre del canal
 * @param eventName - Nombre del evento
 * @param handler - Handler opcional para el evento
 * @param channelType - Tipo de canal, por defecto 'private'
 */
export const subscribeEventToRole = (
  role: string,
  channelName: string,
  eventName: string,
  handler?: (data: any) => void,
  channelType: 'private' | 'presence' = 'private'
): void => {
  // Registrar handler si se proporciona
  if (handler) {
    registerEventHandler(eventName, handler)
  }
  
  // Suscribir evento al rol
  subscribeEventsToRole(role, channelName, [eventName], channelType)
}

/**
 * Obtiene la configuración completa de roles (base + dinámica)
 * Esta función se ejecuta antes de generar websocketRoles
 */
export const getRoleEventsConfig = (): RoleEventConfig[] => {
  // Combinar configuración base con dinámica
  const allConfigs: RoleEventConfig[] = [...BASE_ROLE_EVENTS_CONFIG]
  
  // Agregar o actualizar configuraciones dinámicas
  dynamicRoleConfigs.forEach((dynamicConfig, role) => {
    const baseIndex = allConfigs.findIndex(config => config.role === role)
    
    if (baseIndex >= 0) {
      // Fusionar con configuración base existente
      const baseConfig = allConfigs[baseIndex]
      const baseChannelNames = new Set(baseConfig.channels.map(c => c.name))
      
      dynamicConfig.channels.forEach(dynamicChannel => {
        const baseChannel = baseConfig.channels.find(c => c.name === dynamicChannel.name)
        
        if (baseChannel) {
          // Fusionar eventos
          const allEvents = new Set([...baseChannel.events, ...dynamicChannel.events])
          baseChannel.events = Array.from(allEvents)
        } else {
          // Agregar nuevo canal
          baseConfig.channels.push(dynamicChannel)
        }
      })
    } else {
      // Agregar nueva configuración de rol
      allConfigs.push(dynamicConfig)
    }
  })
  
  return allConfigs
}

/**
 * Obtiene todos los handlers dinámicos registrados
 */
export const getAllEventHandlers = (): Record<string, (data: any) => void> => {
  const allHandlers: Record<string, (data: any) => void> = {}
  
  // Agregar handlers dinámicos
  dynamicEventHandlers.forEach((handler, eventName) => {
    allHandlers[eventName] = handler
  })
  
  return allHandlers
}

/**
 * Limpia todas las configuraciones dinámicas
 * Útil para testing o reset
 */
export const clearDynamicConfig = (): void => {
  dynamicRoleConfigs.clear()
  dynamicEventHandlers.clear()
}

// Exportar la configuración combinada
export const ROLE_EVENTS_CONFIG = getRoleEventsConfig()

