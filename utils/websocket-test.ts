// Utilidades para probar el WebSocket
export const testWebSocketConnection = () => {
  console.log('🧪 Probando conexión WebSocket...')
  
  // Verificar si Pusher está disponible
  if (typeof window !== 'undefined' && (window as any).Pusher) {
    console.log('✅ Pusher está disponible')
    
    // Verificar si Echo está disponible
    if ((window as any).Echo) {
      console.log('✅ Echo está disponible')
      return true
    } else {
      console.log('❌ Echo no está disponible')
      return false
    }
  } else {
    console.log('❌ Pusher no está disponible')
    return false
  }
}

// Función para enviar un evento de prueba manualmente
export const sendTestEvent = () => {
  console.log('🧪 Enviando evento de prueba...')
  
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
    console.log('✅ Evento de prueba enviado')
  }
}

// Función para verificar el estado de los canales
export const checkChannelStatus = () => {
  console.log('🔍 Verificando estado de canales...')
  
  if (typeof window !== 'undefined' && (window as any).Echo) {
    const echo = (window as any).Echo
    
    // Verificar canales activos
    console.log('📻 Canales activos:', echo.connector?.channels || 'No hay canales')
    
    // Verificar estado de conexión
    if (echo.connector?.pusher?.connection) {
      const state = echo.connector.pusher.connection.state
      console.log('🔌 Estado de conexión:', state)
      
      if (state === 'connected') {
        console.log('✅ WebSocket conectado correctamente')
        return true
      } else {
        console.log('❌ WebSocket no está conectado')
        return false
      }
    } else {
      console.log('❌ No se puede verificar el estado de conexión')
      return false
    }
  } else {
    console.log('❌ Echo no está disponible')
    return false
  }
}

// Función para simular un evento de importación
export const simulateImportEvent = () => {
  console.log('📊 Simulando evento de importación...')
  
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
    console.log('✅ Evento de importación simulado enviado')
  }
}

// Función para agregar listeners de prueba
export const addTestListeners = () => {
  if (typeof window !== 'undefined') {
    // Listener para eventos de prueba
    window.addEventListener('websocket-test', (event: any) => {
      console.log('🧪 Evento de prueba recibido:', event.detail)
    })
    
    // Listener para eventos de importación
    window.addEventListener('websocket-import', (event: any) => {
      console.log('📊 Evento de importación recibido:', event.detail)
    })
    
    console.log('✅ Listeners de prueba agregados')
  }
}
