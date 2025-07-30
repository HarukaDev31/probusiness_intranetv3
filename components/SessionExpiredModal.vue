<template>
  <UModal 
    v-model="isOpen" 
    :ui="{ 
      overlay: 'bg-black/50 backdrop-blur-sm',
      content: 'relative w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-2xl rounded-lg',
      header: 'p-6 bg-red-600 text-white rounded-t-lg',
      body: 'p-6 space-y-6',
      footer: 'p-6 border-t border-gray-200 dark:border-gray-700'
    }"
    :close-button="false"
    :prevent-close="true"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8" />
        <div>
          <h2 class="text-xl font-bold">Sesión Expirada</h2>
          <p class="text-red-100 text-sm">Tu sesión ha expirado por seguridad</p>
        </div>
      </div>
    </template>

    <template #body>
      <!-- Icono de advertencia -->
      <div class="flex justify-center">
        <div class="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
          <UIcon name="i-heroicons-clock" class="w-12 h-12 text-red-600 dark:text-red-400" />
        </div>
      </div>

      <!-- Mensaje principal -->
      <div class="text-center space-y-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Sesión Cerrada Automáticamente
        </h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          Por seguridad, tu sesión ha sido cerrada debido a inactividad o porque ha expirado el tiempo de sesión.
        </p>
      </div>

      <!-- Información adicional -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div class="text-sm">
            <p class="text-blue-800 dark:text-blue-200 font-medium mb-1">
              Importante:
            </p>
            <ul class="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
              <li>• Todos los datos no guardados se perderán</li>
              <li>• Debes iniciar sesión nuevamente para continuar</li>
              <li>• Tu información de sesión ha sido limpiada por seguridad</li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="space-y-3">
        <UButton 
          label="Ir al Login" 
          icon="i-heroicons-arrow-right-on-rectangle"
          color="error"
          size="lg"
          class="w-full"
          @click="goToLogin"
        />
        
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            No podrás usar la aplicación hasta que inicies sesión
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const router = useRouter()
const isOpen = ref(false)

// Función para manejar el evento de sesión expirada
const handleSessionExpired = () => {
  isOpen.value = true
}

// Función para ir al login
const goToLogin = () => {
  isOpen.value = false
  router.push('/login')
}

// Escuchar el evento global de sesión expirada
onMounted(() => {
  if (process.client) {
    window.addEventListener('session-expired', handleSessionExpired)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('session-expired', handleSessionExpired)
  }
})
</script> 