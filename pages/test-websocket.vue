<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">🧪 Prueba de WebSocket</h1>
    
    <!-- Estado de conexión -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Estado de Conexión</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex items-center space-x-2">
          <div :class="connectionStatus ? 'bg-green-500' : 'bg-red-500'" class="w-3 h-3 rounded-full"></div>
          <span>{{ connectionStatus ? 'Conectado' : 'Desconectado' }}</span>
        </div>
        <div class="text-sm text-gray-600">
          Socket ID: {{ socketId || 'N/A' }}
        </div>
        <div class="text-sm text-gray-600">
          Canal: {{ channelName || 'N/A' }}
        </div>
      </div>
    </div>

    <!-- Botones de prueba -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Pruebas</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UButton 
          @click="testConnection"
          :loading="testing"
          class="w-full"
        >
          🔍 Probar Conexión
        </UButton>
        
        <UButton 
          @click="sendTestEvent"
          :loading="sendingTest"
          class="w-full"
        >
          🧪 Enviar Evento de Prueba
        </UButton>
        
        <UButton 
          @click="simulateImport"
          :loading="simulating"
          class="w-full"
        >
          📊 Simular Importación
        </UButton>
        
        <UButton 
          @click="checkChannels"
          :loading="checking"
          class="w-full"
        >
          📻 Verificar Canales
        </UButton>
      </div>
    </div>

    <!-- Logs -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Logs</h2>
      <div class="bg-gray-100 rounded p-4 h-64 overflow-y-auto">
        <div v-for="(log, index) in logs" :key="index" class="text-sm font-mono mb-1">
          <span class="text-gray-500">{{ log.timestamp }}</span>
          <span :class="getLogClass(log.type)">{{ log.message }}</span>
        </div>
      </div>
      <div class="mt-4 flex justify-between">
        <UButton @click="clearLogs" size="sm">
          🗑️ Limpiar Logs
        </UButton>
        <UButton @click="exportLogs" size="sm">
          📄 Exportar Logs
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { testWebSocketConnection, sendTestEvent, checkChannelStatus, simulateImportEvent } from '~/utils/websocket-test'

// Estado
const connectionStatus = ref(false)
const socketId = ref('')
const channelName = ref('private-Documentacion-notifications')
const logs = ref<Array<{timestamp: string, message: string, type: 'info' | 'success' | 'error' | 'warning'}>>([])

// Loading states
const testing = ref(false)
const sendingTest = ref(false)
const simulating = ref(false)
const checking = ref(false)

// Funciones
const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  logs.value.push({
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  })
}

const getLogClass = (type: string) => {
  switch (type) {
    case 'success': return 'text-green-600'
    case 'error': return 'text-red-600'
    case 'warning': return 'text-yellow-600'
    default: return 'text-gray-800'
  }
}

const clearLogs = () => {
  logs.value = []
  addLog('Logs limpiados', 'info')
}

const exportLogs = () => {
  const logText = logs.value.map(log => `${log.timestamp} - ${log.message}`).join('\n')
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `websocket-logs-${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)
  addLog('Logs exportados', 'success')
}

const testConnection = async () => {
  testing.value = true
  addLog('Probando conexión WebSocket...', 'info')
  
  try {
    const result = testWebSocketConnection()
    if (result) {
      connectionStatus.value = true
      addLog('✅ Conexión WebSocket exitosa', 'success')
    } else {
      connectionStatus.value = false
      addLog('❌ Conexión WebSocket fallida', 'error')
    }
  } catch (error) {
    addLog(`❌ Error probando conexión: ${error}`, 'error')
  } finally {
    testing.value = false
  }
}

const sendTestEvent = async () => {
  sendingTest.value = true
  addLog('Enviando evento de prueba...', 'info')
  
  try {
    sendTestEvent()
    addLog('✅ Evento de prueba enviado', 'success')
  } catch (error) {
    addLog(`❌ Error enviando evento: ${error}`, 'error')
  } finally {
    sendingTest.value = false
  }
}

const simulateImport = async () => {
  simulating.value = true
  addLog('Simulando evento de importación...', 'info')
  
  try {
    simulateImportEvent()
    addLog('✅ Evento de importación simulado', 'success')
  } catch (error) {
    addLog(`❌ Error simulando importación: ${error}`, 'error')
  } finally {
    simulating.value = false
  }
}

const checkChannels = async () => {
  checking.value = true
  addLog('Verificando canales...', 'info')
  
  try {
    const result = checkChannelStatus()
    if (result) {
      addLog('✅ Canales verificados correctamente', 'success')
    } else {
      addLog('❌ Error verificando canales', 'error')
    }
  } catch (error) {
    addLog(`❌ Error verificando canales: ${error}`, 'error')
  } finally {
    checking.value = false
  }
}

// Verificar estado inicial
onMounted(() => {
  addLog('Página de prueba cargada', 'info')
  
  // Verificar si Echo está disponible
  if (typeof window !== 'undefined' && (window as any).Echo) {
    const echo = (window as any).Echo
    if (echo.connector?.pusher?.connection?.state === 'connected') {
      connectionStatus.value = true
      socketId.value = echo.socketId() || 'N/A'
      addLog('✅ WebSocket conectado al cargar la página', 'success')
    } else {
      addLog('⚠️ WebSocket no está conectado', 'warning')
    }
  } else {
    addLog('❌ Echo no está disponible', 'error')
  }
})
</script>
