import type { WsNotificationChannel, WsNotificationType } from '~/types/notifications/preferences'
import { WS_NOTIFICATION_KEYS } from './keys'

/** Canales disponibles para configurar (con etiqueta e icono para el panel). */
export const WS_NOTIFICATION_CHANNELS: { value: WsNotificationChannel; label: string; icon: string }[] = [
  { value: 'modal', label: 'Aviso en pantalla', icon: 'i-heroicons-window' },
  { value: 'sonido', label: 'Sonido', icon: 'i-heroicons-speaker-wave' },
  { value: 'navegador', label: 'Notificación del navegador', icon: 'i-heroicons-bell-alert' },
]

const modalOnly = (key: string, label: string, modulo: string, descripcion?: string): WsNotificationType => ({
  key,
  label,
  descripcion,
  modulo,
  canales: ['modal'],
  silenciable: true,
  defaults: { modal: true },
})

/**
 * Catálogo de tipos de notificación que llegan por websocket.
 * Solo afecta avisos en vivo; la campana de notificaciones persistidas no cambia.
 */
export const WS_NOTIFICATION_TYPES: WsNotificationType[] = [
  // — Calendario —
  modalOnly(
    WS_NOTIFICATION_KEYS.CALENDARIO_ACTIVIDAD,
    'Cambios en el calendario',
    'Calendario',
    'Aviso para recargar el calendario cuando una actividad cambia.'
  ),

  // — Cotizaciones —
  modalOnly(
    WS_NOTIFICATION_KEYS.COTIZACION_ESTADO,
    'Cotización actualizada',
    'Cotizaciones',
    'Cuando cambia el estado de una cotización.'
  ),
  modalOnly(
    WS_NOTIFICATION_KEYS.COTIZACION_NUEVA,
    'Nueva solicitud de cotización',
    'Cotizaciones'
  ),
  modalOnly(
    WS_NOTIFICATION_KEYS.COTIZACION_CHINA_CONTACTADO,
    'Contacto con China',
    'Cotizaciones',
    'Cuando se registra contacto con proveedor en China.'
  ),
  modalOnly(
    WS_NOTIFICATION_KEYS.COTIZACION_CARGA_ROLEADA,
    'Carga roleada a otro contenedor',
    'Cotizaciones',
    'Cuando mueven una carga a otro consolidado.'
  ),
  modalOnly(
    WS_NOTIFICATION_KEYS.COTIZACION_CHINA_RECIBIDA,
    'Cotización recibida de China',
    'Cotizaciones'
  ),
  modalOnly(
    WS_NOTIFICATION_KEYS.COTIZACION_CHINA_INSPECCIONADA,
    'Carga inspeccionada en China',
    'Cotizaciones',
    'Cuando se completa la inspección de la carga.'
  ),

  // — Contenedor consolidado —
  modalOnly(WS_NOTIFICATION_KEYS.CONTENEDOR_ESTADO, 'Cambio de estado del contenedor', 'Contenedor'),
  modalOnly(WS_NOTIFICATION_KEYS.CONTENEDOR_NUEVO, 'Nuevo contenedor', 'Contenedor'),
  modalOnly(WS_NOTIFICATION_KEYS.CONTENEDOR_ACTIVIDAD, 'Actividad en contenedor', 'Contenedor'),

  // — Documentación —
  modalOnly(WS_NOTIFICATION_KEYS.DOCUMENTO_NUEVO, 'Nuevo documento', 'Documentación'),
  modalOnly(WS_NOTIFICATION_KEYS.DOCUMENTO_ESTADO, 'Cambio de estado de documento', 'Documentación'),
  modalOnly(WS_NOTIFICATION_KEYS.DOCUMENTO_SOLICITUD, 'Solicitud de documento', 'Documentación'),
  modalOnly(
    WS_NOTIFICATION_KEYS.IMPORTACION_EXCEL,
    'Importación de Excel completada',
    'Importación',
    'Cuando termina una importación de productos por Excel.'
  ),
  modalOnly(
    WS_NOTIFICATION_KEYS.PLANTILLA_FINAL_LOTE,
    'Plantillas finales generadas',
    'Documentación',
    'Cuando termina la generación masiva de plantillas finales.'
  ),
  modalOnly(
    WS_NOTIFICATION_KEYS.SEGUIMIENTO_DRIVE,
    'Excel de seguimiento en Drive',
    'Carga consolidada',
    'Cuando termina de vincular el Excel de seguimiento a Google Drive.'
  ),

  // — Contabilidad —
  modalOnly(
    WS_NOTIFICATION_KEYS.FACTURACION_IMPORTACION,
    'Importación de datos de facturación',
    'Contabilidad',
    'Cuando termina una importación de datos de facturación.'
  ),

  // — Almacén —
  modalOnly(WS_NOTIFICATION_KEYS.ALMACEN_STOCK, 'Actualización de stock', 'Almacén'),
  modalOnly(WS_NOTIFICATION_KEYS.ALMACEN_ALERTA, 'Alerta de almacén', 'Almacén'),

  // — Coordinación —
  modalOnly(WS_NOTIFICATION_KEYS.COORDINACION_TAREA, 'Tarea asignada', 'Coordinación'),
  modalOnly(WS_NOTIFICATION_KEYS.COORDINACION_HORARIO, 'Cambio de horario', 'Coordinación'),

  // — Administración —
  modalOnly(
    WS_NOTIFICATION_KEYS.VIATICO_REINTEGRO,
    'Solicitud de reintegro / viático',
    'Administración',
    'Cuando un usuario solicita un reintegro o viático.'
  ),

  // — WhatsApp —
  {
    key: WS_NOTIFICATION_KEYS.WHATSAPP_INBOX_MENSAJE,
    label: 'Nuevos mensajes de WhatsApp',
    descripcion: 'Aviso, sonido y notificación del navegador al llegar mensajes al inbox.',
    modulo: 'WhatsApp',
    canales: ['modal', 'sonido', 'navegador'],
    silenciable: true,
    defaults: { modal: true, sonido: true, navegador: true },
  },

  // — Soporte TI —
  {
    key: WS_NOTIFICATION_KEYS.SOPORTE_TI_MENSAJE,
    label: 'Mensajes de Soporte TI',
    descripcion: 'Aviso en pantalla y notificación del navegador en chats de Soporte TI.',
    modulo: 'Soporte TI',
    canales: ['modal', 'navegador'],
    silenciable: true,
    defaults: { modal: true, navegador: true },
  },
  modalOnly(
    WS_NOTIFICATION_KEYS.SOPORTE_TI_ESTADO,
    'Cambio de estado en Soporte TI',
    'Soporte TI',
    'Cuando cambia el estado de un ticket.'
  ),

  // — Sistema (crítico) —
  {
    key: WS_NOTIFICATION_KEYS.SISTEMA_MANTENIMIENTO,
    label: 'Alertas de mantenimiento',
    descripcion: 'Avisos críticos del sistema. No se pueden desactivar.',
    modulo: 'Sistema',
    canales: ['modal'],
    silenciable: false,
    defaults: { modal: true },
  },
  modalOnly(WS_NOTIFICATION_KEYS.SISTEMA_GENERAL, 'Avisos generales del sistema', 'Sistema'),
  modalOnly(WS_NOTIFICATION_KEYS.SISTEMA_ACTUALIZACION, 'Actualizaciones del sistema', 'Sistema'),
]

/** Busca un tipo del catálogo por su clave. */
export const getWsNotificationType = (key: string): WsNotificationType | undefined =>
  WS_NOTIFICATION_TYPES.find(type => type.key === key)
