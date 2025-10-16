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
              console.log('Alerta del sistema:', data)
            }
          },
          {
            event: 'UserActivity',
            callback: (data) => {
              console.log('Actividad de usuario:', data)
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
              console.log('Actualización dashboard:', data)
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
              console.log('Actualización de stock:', data)
            }
          },
          {
            event: 'WarehouseAlert',
            callback: (data) => {
              console.log('Alerta de almacén:', data)
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
              console.log('Cambio de estado del contenedor:', data)
            }
          },
          {
            event: WS_EVENTS.CONTAINER.NEW,
            callback: (data) => {
              console.log('Nuevo contenedor:', data)
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
              console.log('Actividad de contenedor:', data)
            }
          }
        ]
      }
    ]
  },
  [ROLES.COORDINACION]: {
    role: ROLES.COORDINACION,
    channels: [
      {
        name: `${ROLES.COORDINACION}-notifications`,
        type: 'private',
        handlers: [
          {
            event: 'TaskAssignment',
            callback: (data) => {
              console.log('Asignación de tarea:', data)
            }
          },
          {
            event: 'ScheduleUpdate',
            callback: (data) => {
              console.log('Actualización de cronograma:', data)
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
              console.log('Nueva solicitud de cotización:', data)
            }
          },
          {
            event: WS_EVENTS.COTIZACION.STATUS_UPDATED,
            callback: (data) => {
              console.log('Actualización de estado de cotización:', data)
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
              console.log('Nuevo documento:', data)
            }
          },
          {
            event: WS_EVENTS.DOCUMENT.STATUS_CHANGE,
            callback: (data) => {
              console.log('Cambio de estado de documento:', data)
            }
          },
          {
            event: WS_EVENTS.DOCUMENT.REQUEST,
            callback: (data) => {
              console.log('Solicitud de documento:', data)
            }
          },
                               {
            event: WS_EVENTS.DOCUMENT.IMPORT_EXCEL_COMPLETED,
            callback: (data) => {
              console.log('📊 Importación Excel completada:', data)
              
              
              try {
                // Mostrar notificación de éxito
                const { showSuccess } = useModal()
                showSuccess('Importación Completada', data.message || 'La importación se ha completado exitosamente.')
                
                // Log adicional para debugging
                if (data.estadisticas) {
                  console.log('📈 Estadísticas de importación:', data.estadisticas)
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
               console.log('🧪 Evento de prueba recibido:', data)
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
              console.log('Notificación general:', data)
            }
          },
          {
            event: WS_EVENTS.SYSTEM.UPDATE,
            callback: (data) => {
              console.log('Actualización del sistema:', data)
            }
          },
          {
            event: WS_EVENTS.SYSTEM.MAINTENANCE,
            callback: (data) => {
              console.log('Alerta de mantenimiento:', data)
            }
          }
        ]
      }
    ]
  }
}