<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Prueba de Notificaciones WebSocket</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Prueba de Importación Excel -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-lg font-semibold mb-4">Prueba de Importación Excel</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Simula el evento de importación de Excel completada
        </p>
        
        <UButton 
          color="success" 
          @click="simulateImportacionExcel"
          class="w-full"
        >
          Simular Importación Excel Completada
        </UButton>
      </div>

      <!-- Prueba de Notificación Personalizada -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-lg font-semibold mb-4">Prueba de Notificación Personalizada</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Simula una notificación personalizada
        </p>
        
        <UButton 
          color="blue" 
          @click="simulateCustomNotification"
          class="w-full"
        >
          Simular Notificación Personalizada
        </UButton>
      </div>

      <!-- Estado de WebSocket -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-2">
        <h2 class="text-lg font-semibold mb-4">Estado de WebSocket</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-sm text-gray-500 dark:text-gray-400">Conexión</div>
            <div class="text-lg font-semibold" :class="isConnected ? 'text-green-600' : 'text-red-600'">
              {{ isConnected ? 'Conectado' : 'Desconectado' }}
            </div>
          </div>
          
          <div class="text-center">
            <div class="text-sm text-gray-500 dark:text-gray-400">Rol Actual</div>
            <div class="text-lg font-semibold">{{ currentRole || 'No definido' }}</div>
          </div>
          
          <div class="text-center">
            <div class="text-sm text-gray-500 dark:text-gray-400">Canales Activos</div>
            <div class="text-lg font-semibold">{{ activeChannelsCount }}</div>
          </div>
        </div>
      </div>

      <!-- Log de Eventos -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-2">
        <h2 class="text-lg font-semibold mb-4">Log de Eventos</h2>
        
        <div class="bg-gray-100 dark:bg-gray-900 rounded p-4 h-64 overflow-y-auto">
          <div v-if="eventLog.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay eventos registrados
          </div>
          <div v-else>
            <div 
              v-for="(event, index) in eventLog" 
              :key="index"
              class="mb-2 p-2 bg-white dark:bg-gray-800 rounded border"
            >
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ event.timestamp }}
              </div>
              <div class="font-mono text-sm">
                {{ event.message }}
              </div>
            </div>
          </div>
        </div>
        
        <UButton 
          variant="outline" 
          @click="clearEventLog"
          class="mt-4"
        >
          Limpiar Log
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Estado de la página
const eventLog = ref<Array<{timestamp: string, message: string}>>([])
const isConnected = ref(false)
const currentRole = ref<string | null>(null)
const activeChannelsCount = ref(0)

// Función para agregar eventos al log
const addEventLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift({ timestamp, message })
  
  // Limitar el log a 50 eventos
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50)
  }
}

// Función para limpiar el log
const clearEventLog = () => {
  eventLog.value = []
}

// Simular evento de importación Excel
const simulateImportacionExcel = () => {
  const mockData = {
    id: 40,
    nombre_archivo: "PLANTILLA BASE DE PRODUCTO_SISTEMA 2024.xlsx",
    status: "completed",
    message: "Importación completada exitosamente. 15 productos importados de 15 totales.",
    estadisticas: {
      total_productos: 15,
      productos_importados: 15,
      errores: 0
    },
    cantidad_rows: 15,
    created_at: "2025-09-02T19:23:30+00:00",
    updated_at: "2025-09-02T19:24:49+00:00",
    tipo_evento: "importacion_excel_completed"
  }

  // Emitir el evento personalizado
  window.dispatchEvent(new CustomEvent('websocket-notification', {
    detail: {
      type: 'success',
      title: '¡Importación Completada!',
      subtitle: 'Excel procesado exitosamente',
      message: mockData.message,
      details: `Productos importados: ${mockData.estadisticas.productos_importados} de ${mockData.estadisticas.total_productos}`,
      autoClose: true,
      duration: 5000
    }
  }))

  addEventLog('Evento de importación Excel simulado')
}

// Simular notificación personalizada
const simulateCustomNotification = () => {
  window.dispatchEvent(new CustomEvent('websocket-notification', {
    detail: {
      type: 'success',
      title: '¡Notificación de Prueba!',
      subtitle: 'Sistema funcionando correctamente',
      message: 'Esta es una notificación de prueba para verificar que el sistema funciona correctamente.',
      details: 'Notificación generada manualmente para testing',
      autoClose: true,
      duration: 3000
    }
  }))

  addEventLog('Notificación personalizada simulado')
}

// Verificar estado de WebSocket
const checkWebSocketStatus = () => {
  try {
    // Intentar acceder al estado de Echo
    const echo = (window as any).Echo
    if (echo) {
      isConnected.value = echo.connector?.pusher?.connection?.state === 'connected'
      currentRole.value = 'DOCUMENTACION' // Rol de prueba
      activeChannelsCount.value = 1 // Canal de prueba
    } else {
      isConnected.value = false
      currentRole.value = null
      activeChannelsCount.value = 0
    }
  } catch (error) {
    console.error('Error verificando estado de WebSocket:', error)
    isConnected.value = false
  }
}

onMounted(() => {
  addEventLog('Página de prueba cargada')
  
  // Verificar estado inicial
  checkWebSocketStatus()
  
  // Verificar estado cada 5 segundos
  setInterval(checkWebSocketStatus, 5000)
})
</script>

