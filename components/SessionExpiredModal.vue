<template>
  <!-- Modal simplificado para testing -->
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
      <h2 class="text-xl font-bold text-red-600 mb-4">Sesión Expirada</h2>
      <p class="text-gray-700 mb-6">Tu sesión ha expirado por seguridad.</p>
      <UButton 
        label="Ir al Login" 
        color="error"
        class="w-full"
        @click="goToLogin"
      />
    </div>
  </div>
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