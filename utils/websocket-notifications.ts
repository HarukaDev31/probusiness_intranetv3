// Helper para manejar notificaciones de WebSocket
import { canShowWsNotification, WS_NOTIFICATION_KEYS } from '~/composables/notifications/preferences'

export interface ImportacionExcelData {
  id: number
  nombre_archivo: string
  status: string
  message: string
  estadisticas: {
    total_productos: number
    productos_importados: number
    errores: number
  }
  cantidad_rows: number
  created_at: string
  updated_at: string
  tipo_evento: string
}

export const handleImportacionExcelCompleted = (data: string | ImportacionExcelData) => {
  if (!canShowWsNotification(WS_NOTIFICATION_KEYS.IMPORTACION_EXCEL, 'modal')) return

  const parsedData: ImportacionExcelData = typeof data === 'string' ? JSON.parse(data) : data

  const message = parsedData.message || 'La importación de productos se ha completado correctamente.'
  const details = `Productos importados: ${parsedData.estadisticas?.productos_importados || 0} de ${parsedData.estadisticas?.total_productos || 0}`

  if (typeof window !== 'undefined') {
    const notificationEvent = new CustomEvent('websocket-modal', {
      detail: {
        type: 'success',
        title: '¡Importación Completada!',
        message: `${message}\n\n${details}`,
        duration: 5000,
        key: WS_NOTIFICATION_KEYS.IMPORTACION_EXCEL,
        canal: 'modal',
      }
    })

    window.dispatchEvent(notificationEvent)
  }
}
