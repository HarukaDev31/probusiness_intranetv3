<template>
  <div>
    <!-- Welcome Banner -->
    <div class="relative bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-8 mb-8 overflow-hidden">
      <!-- Background Image -->
      <div class="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-400/90"></div>
      <div class="absolute right-0 top-0 bottom-0 w-1/3">
        <div class="relative h-full">
          <!-- Shipping Containers -->
          <div class="absolute right-8 top-8 w-32 h-24 bg-blue-800 rounded transform rotate-12"></div>
          <div class="absolute right-16 top-12 w-32 h-24 bg-blue-700 rounded transform rotate-6"></div>
          <div class="absolute right-24 top-16 w-32 h-24 bg-blue-600 rounded"></div>
          <!-- Sun -->
          <div class="absolute right-4 top-4 w-8 h-8 bg-yellow-300 rounded-full shadow-lg"></div>
        </div>
      </div>
      
      <!-- Welcome Text -->
      <div class="relative z-10">
        <h1 class="text-4xl font-bold text-white mb-2">¡Hola, bienvenido!</h1>
        <p class="text-blue-100 text-lg">Panel de control de Probusiness</p>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Imports Card -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-3xl font-bold text-gray-800">15M</p>
            <p class="text-sm text-gray-500 mt-1">Dólares en importaciones</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Clients Card -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-3xl font-bold text-gray-800">5K</p>
            <p class="text-sm text-gray-500 mt-1">Clientes satisfechos</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- CBM Sold Card -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-3xl font-bold text-gray-800">1100</p>
            <p class="text-sm text-gray-500 mt-1">CBM vendidos</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Imported Containers Card -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-3xl font-bold text-gray-800">10K</p>
            <p class="text-sm text-gray-500 mt-1">Contenedores importados</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity Section -->
    <div class="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">Nuevo contenedor importado</p>
              <p class="text-sm text-gray-500">Contenedor #ABC123 llegó al puerto</p>
            </div>
            <span class="text-xs text-gray-400">Hace 2 horas</span>
          </div>

          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">Importación completada</p>
              <p class="text-sm text-gray-500">Lote de productos procesado exitosamente</p>
            </div>
            <span class="text-xs text-gray-400">Hace 4 horas</span>
          </div>

          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">Nuevo cliente registrado</p>
              <p class="text-sm text-gray-500">Empresa XYZ se unió a Probusiness</p>
            </div>
            <span class="text-xs text-gray-400">Hace 6 horas</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Página home con dashboard de logística
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style> 