// Helper para manejar notificaciones de WebSocket
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
  console.log('Importación Excel completada:', data)
  
  // Parsear los datos si vienen como string
  const parsedData: ImportacionExcelData = typeof data === 'string' ? JSON.parse(data) : data
  
  // Crear el mensaje de notificación
  const message = parsedData.message || 'La importación de productos se ha completado correctamente.'
  const details = `Productos importados: ${parsedData.estadisticas?.productos_importados || 0} de ${parsedData.estadisticas?.total_productos || 0}`
  
  // Emitir un evento personalizado que será capturado por el sistema de notificaciones
  if (typeof window !== 'undefined') {
    const notificationEvent = new CustomEvent('websocket-notification', {
      detail: {
        type: 'success',
        title: '¡Importación Completada!',
        subtitle: 'Excel procesado exitosamente',
        message,
        details,
        autoClose: true,
        duration: 5000
      }
    })
    
    window.dispatchEvent(notificationEvent)
  }
}

