<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <!-- Error Icon -->
      <div class="mb-8">
        <div class="relative mx-auto w-32 h-32">
          <!-- Background circle -->
          <div class="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <UIcon 
              name="i-heroicons-exclamation-triangle" 
              class="w-16 h-16 text-red-500 dark:text-red-400"
            />
          </div>
          <!-- Animated border -->
          <div class="absolute inset-0 rounded-full border-4 border-red-200 dark:border-red-800 animate-pulse"></div>
        </div>
      </div>

      <!-- Error Code -->
      <h1 class="text-8xl font-bold text-red-500 dark:text-red-400 mb-4">
        {{ error?.statusCode || '404' }}
      </h1>

      <!-- Error Title -->
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        {{ getErrorMessage() }}
      </h2>

      <!-- Error Description -->
      <p class="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
        {{ getErrorDescription() }}
      </p>

      <!-- Action Buttons -->
      <div class="space-y-4">
        <!-- Go Home Button -->
        <UButton 
          label="Ir al inicio" 
          icon="i-heroicons-home"
          color="primary"
          size="lg"
          class="w-full"
          @click="goHome"
        />
        
        <!-- Go Back Button -->
        <UButton 
          label="Volver atrás" 
          icon="i-heroicons-arrow-left"
          variant="outline"
          size="lg"
          class="w-full"
          @click="goBack"
        />

        <!-- Retry Button (only for 500+ errors) -->
        <UButton 
          v-if="isRetryableError()"
          label="Intentar de nuevo" 
          icon="i-heroicons-arrow-path"
          variant="ghost"
          size="lg"
          class="w-full"
          @click="retry"
        />
      </div>

      <!-- Additional Help -->
      <div class="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
          ¿Necesitas ayuda?
        </h3>
        <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• Verifica que la URL sea correcta</p>
          <p>• Intenta recargar la página</p>
          <p>• Contacta al soporte técnico si el problema persiste</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-xs text-gray-500 dark:text-gray-500">
        <p>Probusiness Intranet v3</p>
        <p class="mt-1">Error: {{ error?.statusCode || '404' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

// Props
interface Props {
  error: NuxtError
}

const props = defineProps<Props>()

// Methods
const getErrorMessage = (): string => {
  const statusCode = props.error?.statusCode || 404
  
  switch (statusCode) {
    case 404:
      return 'Página no encontrada'
    case 403:
      return 'Acceso denegado'
    case 500:
      return 'Error del servidor'
    case 503:
      return 'Servicio no disponible'
    default:
      return 'Algo salió mal'
  }
}

const getErrorDescription = (): string => {
  const statusCode = props.error?.statusCode || 404
  
  switch (statusCode) {
    case 404:
      return 'La página que buscas no existe o ha sido movida. Verifica la URL e intenta de nuevo.'
    case 403:
      return 'No tienes permisos para acceder a esta página. Contacta al administrador si crees que esto es un error.'
    case 500:
      return 'Ocurrió un error interno en el servidor. Nuestro equipo ha sido notificado y está trabajando para solucionarlo.'
    case 503:
      return 'El servicio está temporalmente no disponible debido a mantenimiento. Por favor, intenta más tarde.'
    default:
      return 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo o contacta al soporte técnico.'
  }
}

const isRetryableError = (): boolean => {
  const statusCode = props.error?.statusCode || 404
  return statusCode >= 500 || statusCode === 0
}

const goHome = () => {
  clearError()
  navigateTo('/')
}

const goBack = () => {
  clearError()
  if (process.client && window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/')
  }
}

const retry = () => {
  clearError()
  window.location.reload()
}
</script>

<style scoped>
/* Animaciones adicionales */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Gradiente personalizado */
.bg-gradient-to-br {
  background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
}

.dark .bg-gradient-to-br {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}
</style> 