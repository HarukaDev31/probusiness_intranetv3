<template>

  <div class="space-y-3 w-50 grid grid-cols-2 lg:grid-cols-7 gap-2 w-full h-full">
    <div
      v-for="(item, index) in instances"
      :key="index"
      class="flex items-center justify-between p-3 h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center gap-3">
        <UIcon 
          name="i-heroicons-device-phone-mobile" 
          class="w-5 h-5 text-gray-500"
        />
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ item.key }}
          </p>
          
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <div
          v-if="loadingStates[item.instanceName]"
          class="flex items-center gap-2 text-xs text-gray-500"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
          <span>Verificando...</span>
        </div>
        <UBadge
          v-else
          :color="getStatusColor(item.instanceName) as any"
          variant="soft"
          size="sm"
        >
          {{ getStatusBadge(item.instanceName) }}
          <!- if state is not open, show a button to resync -->
          <UButton
            v-if="getStatusBadge(item.instanceName) === 'Desconectado'"
            icon="i-heroicons-arrow-path-rounded-square"
            size="xs"
            color="primary"
            variant="ghost"
            @click="redirectToManager"
          />
        </UBadge>
      </div>
    </div>
    
    <div v-if="instances.length === 0" class="text-center py-8 text-gray-500">
      <UIcon name="i-heroicons-inbox" class="w-12 h-12 mx-auto mb-2" />
      <p class="text-sm">No hay instancias para verificar</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

interface InstanceItem {
  instanceName: string
  key: string
}

interface InstanceStatus {
  instanceName: string
  state: string
}

interface InstanceResponse {
  instance: InstanceStatus
}

interface Props {
  instances: InstanceItem[]
  autoRefresh?: boolean
  refreshInterval?: number
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 30000, // 30 segundos por defecto
  compact: false
})

const config = useRuntimeConfig()
const whatsappApiUrl = config.public.whatsappApiUrl
const whatsappApiKey = config.public.whatsappApiKey

const instanceStates = ref<Record<string, InstanceStatus | null>>({})
const loadingStates = ref<Record<string, boolean>>({})
const errorStates = ref<Record<string, string | null>>({})

// Computed para modo compacto
const firstInstance = computed(() => props.instances[0])
const isConnected = computed(() => {
  if (!firstInstance.value) return false
  const status = instanceStates.value[firstInstance.value.instanceName]
  return status?.state === 'open'
})
const isLoading = computed(() => {
  if (!firstInstance.value) return false
  return loadingStates.value[firstInstance.value.instanceName] === true
})
const redirectToManager = () => {
  if (whatsappApiUrl) {
    window.open(`${whatsappApiUrl}/manager`, '_blank')
  }
}
const fetchInstanceStatus = async (instanceName: string) => {
  if (!whatsappApiUrl) {
    console.error('whatsappApiUrl no está configurado')
    errorStates.value[instanceName] = 'URL no configurada'
    return
  }

  loadingStates.value[instanceName] = true
  errorStates.value[instanceName] = null

  try {
    const url = `${whatsappApiUrl}/instance/connectionState/${instanceName}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    // Agregar API key al header si está configurado
    if (whatsappApiKey) {
      headers['apikey'] = String(whatsappApiKey)
    }
    
    const response = await $fetch<InstanceResponse>(url, {
      method: 'GET',
      headers
    })

    if (response && response.instance) {
      instanceStates.value[instanceName] = response.instance
      errorStates.value[instanceName] = null
    } else {
      errorStates.value[instanceName] = 'Respuesta inválida'
      instanceStates.value[instanceName] = null
    }
  } catch (error: any) {
    console.error(`Error al verificar instancia ${instanceName}:`, error)
    errorStates.value[instanceName] = (error?.message as string) || 'Error al conectar'
    instanceStates.value[instanceName] = null
  } finally {
    loadingStates.value[instanceName] = false
  }
}

const fetchAllInstances = async () => {
  if (!props.instances || props.instances.length === 0) return

  // Inicializar estados
  props.instances.forEach(item => {
    if (!instanceStates.value[item.instanceName]) {
      instanceStates.value[item.instanceName] = null
      loadingStates.value[item.instanceName] = false
      errorStates.value[item.instanceName] = null
    }
  })

  // Hacer fetch de todas las instancias en paralelo
  await Promise.all(
    props.instances.map(item => fetchInstanceStatus(item.instanceName))
  )
}

const getStatusText = (instanceName: string): string => {
  if (loadingStates.value[instanceName]) {
    return 'Verificando estado...'
  }
  
  if (errorStates.value[instanceName]) {
    return errorStates.value[instanceName] || 'Error desconocido'
  }
  
  const status = instanceStates.value[instanceName]
  if (!status) {
    return 'Estado desconocido'
  }
  
  return `Estado: ${status.state}`
}

const getStatusBadge = (instanceName: string): string => {
  if (errorStates.value[instanceName]) {
    return 'Error'
  }
  
  const status = instanceStates.value[instanceName]
  if (!status) {
    return 'Desconocido'
  }
  
  return status.state === 'open' ? 'Conectado' : 'Desconectado'
}

const getStatusColor = (instanceName: string): string => {
  if (errorStates.value[instanceName]) {
    return 'error'
  }
  
  const status = instanceStates.value[instanceName]
  if (!status) {
    return 'neutral'
  }
  
  return status.state === 'open' ? 'success' : 'warning'
}

let refreshIntervalId: number | null = null

onMounted(() => {
  fetchAllInstances()
  
  if (props.autoRefresh) {
    refreshIntervalId = window.setInterval(() => {
      fetchAllInstances()
    }, props.refreshInterval)
  }
})

watch(() => props.instances, () => {
  fetchAllInstances()
}, { deep: true })

onUnmounted(() => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
  }
})
</script>

