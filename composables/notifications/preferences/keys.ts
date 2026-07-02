/**
 * Claves estables del catálogo de preferencias websocket.
 * Usar estas constantes en handlers para evitar typos.
 */
export const WS_NOTIFICATION_KEYS = {
  // Calendario
  CALENDARIO_ACTIVIDAD: 'calendario.actividad.actualizada',

  // Cotizaciones / carga
  COTIZACION_ESTADO: 'cotizacion.estado.actualizado',
  COTIZACION_NUEVA: 'cotizacion.nueva.solicitud',
  COTIZACION_CHINA_CONTACTADO: 'cotizacion.china.contactado',
  COTIZACION_CARGA_ROLEADA: 'cotizacion.carga.roleada',
  COTIZACION_CHINA_RECIBIDA: 'cotizacion.china.recibida',
  COTIZACION_CHINA_INSPECCIONADA: 'cotizacion.china.inspeccionada',

  // Contenedor consolidado
  CONTENEDOR_ESTADO: 'contenedor.estado.cambiado',
  CONTENEDOR_NUEVO: 'contenedor.nuevo',
  CONTENEDOR_ACTIVIDAD: 'contenedor.actividad',

  // Documentación
  DOCUMENTO_NUEVO: 'documento.nuevo',
  DOCUMENTO_ESTADO: 'documento.estado.cambiado',
  DOCUMENTO_SOLICITUD: 'documento.solicitud',
  IMPORTACION_EXCEL: 'importacion.excel.completada',
  PLANTILLA_FINAL_LOTE: 'plantilla.final.lote.finalizado',

  // Contabilidad
  FACTURACION_IMPORTACION: 'facturacion.importacion.finalizada',

  // Almacén
  ALMACEN_STOCK: 'almacen.stock.actualizado',
  ALMACEN_ALERTA: 'almacen.alerta',

  // Coordinación
  COORDINACION_TAREA: 'coordinacion.tarea.asignada',
  COORDINACION_HORARIO: 'coordinacion.horario.actualizado',

  // Administración
  VIATICO_REINTEGRO: 'viatico.reintegro.solicitado',

  // Seguimiento Drive
  SEGUIMIENTO_DRIVE: 'seguimiento.drive.vinculado',

  // WhatsApp
  WHATSAPP_INBOX_MENSAJE: 'whatsapp.inbox.mensaje',

  // Soporte TI
  SOPORTE_TI_MENSAJE: 'soporte-ti.chat.mensaje',
  SOPORTE_TI_ESTADO: 'soporte-ti.chat.estado',

  // Sistema
  SISTEMA_GENERAL: 'sistema.general',
  SISTEMA_ACTUALIZACION: 'sistema.actualizacion',
  SISTEMA_MANTENIMIENTO: 'sistema.mantenimiento',
} as const

export type WsNotificationKey = typeof WS_NOTIFICATION_KEYS[keyof typeof WS_NOTIFICATION_KEYS]
