// Utilidades para probar el WebSocket
export const testWebSocketConnection = () => {
  
  
  // Verificar si Pusher está disponible
  if (typeof window !== 'undefined' && (window as any).Pusher) {
    
    
    // Verificar si Echo está disponible
    if ((window as any).Echo) {
      
      return true
    } else {
      
      return false
    }
  } else {
    
    return false
  }
}

// Función para enviar un evento de prueba manualmente
export const sendTestEvent = () => {
  
  
  // Crear un evento personalizado
  const testEvent = new CustomEvent('websocket-test', {
    detail: {
      event: 'TestEvent',
      data: {
        message: 'Evento de prueba enviado manualmente',
        timestamp: new Date().toISOString(),
        test: true
      }
    }
  })
  
  // Disparar el evento
  if (typeof window !== 'undefined') {
    window.dispatchEvent(testEvent)
    
  }
}

// Función para verificar el estado de los canales
export const checkChannelStatus = () => {
  
  
  if (typeof window !== 'undefined' && (window as any).Echo) {
    const echo = (window as any).Echo
    
    // Verificar canales activos
    
    
    // Verificar estado de conexión
    if (echo.connector?.pusher?.connection) {
      const state = echo.connector.pusher.connection.state
      
      
      if (state === 'connected') {
        
        return true
      } else {
        
        return false
      }
    } else {
      
      return false
    }
  } else {
    
    return false
  }
}

// Función para simular un evento de importación
export const simulateImportEvent = () => {
  
  
  const importEvent = new CustomEvent('websocket-import', {
    detail: {
      event: 'ImportacionExcelCompleted',
      data: {
        id: 999,
        nombre_archivo: 'archivo_prueba.xlsx',
        status: 'completed',
        message: 'Importación de prueba completada exitosamente. 10 productos importados de 10 totales.',
        estadisticas: {
          total_productos: 10,
          productos_importados: 10,
          errores: 0
        },
        cantidad_rows: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tipo_evento: 'importacion_excel_completed'
      }
    }
  })
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(importEvent)
    
  }
}

// Función para agregar listeners de prueba
export const addTestListeners = () => {
  if (typeof window !== 'undefined') {
    // Listener para eventos de prueba
    window.addEventListener('websocket-test', (event: any) => {
      
    })
    
    // Listener para eventos de importación
    window.addEventListener('websocket-import', (event: any) => {
      
    })
    
    
  }
}
