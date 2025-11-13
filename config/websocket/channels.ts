import type { WebSocketRole } from '~/types/websocket/echo'
import { ROLES } from '~/constants/roles'
import { useModal } from '~/composables/commons/useModal'

// Definir los nombres de eventos como constantes para evitar errores
export const WS_EVENTS = {
  COTIZACION: {
    STATUS_UPDATED: 'CotizacionStatusUpdated',
    NEW_REQUEST: 'CotizacionNewRequest'
  },
  CONTAINER: {
    STATUS_CHANGE: 'ContainerStatusChange',
    NEW: 'NewContainer'
  },
  DOCUMENT: {
    STATUS_CHANGE: 'DocumentStatusChange',
    NEW: 'NewDocument',
    REQUEST: 'DocumentRequest',
    IMPORT_EXCEL_COMPLETED: 'ImportacionExcelCompleted'
  },
  IMPORTACION: {
    EXCEL_COMPLETED: 'ImportacionExcelCompleted'
  },
  SYSTEM: {
    GENERAL: 'GeneralNotification',
    MAINTENANCE: 'MaintenanceAlert',
    UPDATE: 'SystemUpdate'
  }
} as const

export const websocketRoles: Record<string, WebSocketRole> = {
  [ROLES.ADMIN]: {
    role: ROLES.ADMIN,
    channels: [
      {
        name: `${ROLES.ADMIN}-notifications`,
        type: 'private',
        handlers: [
          {
            event: WS_EVENTS.SYSTEM.UPDATE,
            callback: (data) => {
              
            }
          },
          {
            event: 'UserActivity',
            callback: (data) => {
              
            }
          }
        ]
      },
      {
        name: `presence-${ROLES.ADMIN}-dashboard`,
        type: 'presence',
        handlers: [
          {
            event: 'DashboardUpdate',
            callback: (data) => {
              
            }
          }
        ]
      }
    ]
  },
  [ROLES.CONTENEDOR_ALMACEN]: {
    role: ROLES.CONTENEDOR_ALMACEN,
    channels: [
      {
        name: `${ROLES.CONTENEDOR_ALMACEN}-notifications`,
        type: 'private',
        handlers: [
          {
            event: 'StockUpdate',
            callback: (data) => {
              
            }
          },
          {
            event: 'WarehouseAlert',
            callback: (data) => {
              
            }
          }
        ]
      }
    ]
  },
  [ROLES.CONTENEDOR_CONSOLIDADO]: {
    role: ROLES.CONTENEDOR_CONSOLIDADO,
    channels: [
      {
        name: `${ROLES.CONTENEDOR_CONSOLIDADO}-notifications`,
        type: 'private',
        handlers: [
          {
            event: WS_EVENTS.CONTAINER.STATUS_CHANGE,
            callback: (data) => {
              
            }
          },
          {
            event: WS_EVENTS.CONTAINER.NEW,
            callback: (data) => {
              
            }
          }
        ]
      },
      {
        name: `presence-${ROLES.CONTENEDOR_CONSOLIDADO}-dashboard`,
        type: 'presence',
        handlers: [
          {
            event: 'ContainerActivity',
            callback: (data) => {
              
            }
          }
        ]
      }
    ]
  },
  [ROLES.COORDINACION]: {
    role: 'Coordinacion',
    channels: [
      {
        name: `Coordinacion-notifications`,
        type: 'private',
        handlers: [
          {
            event: 'TaskAssignment',
            callback: (data) => {
              
            }
          },
          {
            event: 'ScheduleUpdate',
            callback: (data) => {
              
            }
          }
        ]
      }
    ]
  },
  [ROLES.COTIZADOR]: {
    role: ROLES.COTIZADOR,
    channels: [
      {
        name: `${ROLES.COTIZADOR}-notifications`,
        type: 'private',
        handlers: [
          {
            event: WS_EVENTS.COTIZACION.NEW_REQUEST,
            callback: (data) => {
              
            }
          },
          {
            event: WS_EVENTS.COTIZACION.STATUS_UPDATED,
            callback: (data) => {
              
            }
          }
        ]
      }
    ]
  },
  [ROLES.DOCUMENTACION]: {
    role: ROLES.DOCUMENTACION,
    channels: [
      {
        name: `${ROLES.DOCUMENTACION}-notifications`,
        type: 'private',
        handlers: [
          
          {
            event: WS_EVENTS.DOCUMENT.NEW,
            callback: (data) => {
              
            }
          },
          {
            event: WS_EVENTS.DOCUMENT.STATUS_CHANGE,
            callback: (data) => {
              
            }
          },
          {
            event: WS_EVENTS.DOCUMENT.REQUEST,
            callback: (data) => {
              
            }
          },
                               {
            event: WS_EVENTS.DOCUMENT.IMPORT_EXCEL_COMPLETED,
            callback: (data) => {
              
              
              
              try {
                // Mostrar notificación de éxito
                const { showSuccess } = useModal()
                showSuccess('Importación Completada', data.message || 'La importación se ha completado exitosamente.')
                
                // Log adicional para debugging
                if (data.estadisticas) {
                  
                }
              } catch (error) {
                console.error('❌ Error en callback de ImportacionExcelCompleted:', error)
              }
            }
          },
           // Evento de prueba para verificar que los eventos personalizados funcionan
           {
             event: 'TestEvent',
             callback: (data) => {
               
               const { showSuccess } = useModal()
               showSuccess('Evento de Prueba', 'WebSocket funcionando correctamente')
             }
           }
        ]
      }
    ]
  },
  [ROLES.USER]: {
    role: ROLES.USER,
    channels: [
      {
        name: `${ROLES.USER}-notifications`,
        type: 'private',
        handlers: [
          {
            event: WS_EVENTS.SYSTEM.GENERAL,
            callback: (data) => {
              
            }
          },
          {
            event: WS_EVENTS.SYSTEM.UPDATE,
            callback: (data) => {
              
            }
          },
          {
            event: WS_EVENTS.SYSTEM.MAINTENANCE,
            callback: (data) => {
              
            }
          }
        ]
      }
    ]
  }
}