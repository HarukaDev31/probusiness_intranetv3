<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center">
        <UIcon name="i-heroicons-truck" class="text-2xl mr-3 text-gray-700 dark:text-gray-300" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pasos de Carga Consolidada</h1>
      </div>
    </div>

    <!-- Cards Container -->
    <div class="flex justify-center mb-8">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-6xl">
        <!-- Card 1: Cotización -->
        <div 
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6 text-center"
          @click="navigateToStep('cotizacion')"
        >
          <div class="flex flex-col items-center space-y-4">
            <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-clipboard-document-check" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Cotización</h3>
          </div>
        </div>

        <!-- Card 2: Clientes -->
        <div 
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6 text-center"
          @click="navigateToStep('clientes')"
        >
          <div class="flex flex-col items-center space-y-4">
            <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-user-group" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Clientes</h3>
          </div>
        </div>

        <!-- Card 3: Documentación -->
        <div 
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6 text-center"
          @click="navigateToStep('documentacion')"
        >
          <div class="flex flex-col items-center space-y-4">
            <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-folder-open" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Documentación</h3>
          </div>
        </div>

        <!-- Card 4: Cotización Final -->
        <div 
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6 text-center"
          @click="navigateToStep('cotizacion-final')"
        >
          <div class="flex flex-col items-center space-y-4">
            <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Cotización Final</h3>
          </div>
        </div>

        <!-- Card 5: Factura y Guía -->
        <div 
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6 text-center"
          @click="navigateToStep('factura-guia')"
        >
          <div class="flex flex-col items-center space-y-4">
            <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-receipt-refund" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Factura y Guía</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Regresar Button -->
    <div class="flex justify-center">
      <UButton
        label="Regresar"
        color="neutral"
        variant="outline"
        size="lg"
        class="px-8 py-3"
        @click="goBack"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Methods
const navigateToStep = (step: string) => {
  // Navegar a la página correspondiente según el paso seleccionado
  switch (step) {
    case 'cotizacion':
      navigateTo('/cargaconsolidada/abiertos/pasos/cotizacion')
      break
    case 'clientes':
      navigateTo('/cargaconsolidada/abiertos/pasos/clientes')
      break
    case 'documentacion':
      navigateTo('/cargaconsolidada/abiertos/pasos/documentacion')
      break
    case 'cotizacion-final':
      navigateTo('/cargaconsolidada/abiertos/pasos/cotizacion-final')
      break
    case 'factura-guia':
      navigateTo('/cargaconsolidada/abiertos/pasos/factura-guia')
      break
    default:
      console.log('Paso no reconocido:', step)
  }
}

const goBack = () => {
  navigateTo('/cargaconsolidada/abiertos')
}
</script>

<style scoped>
/* Estilos adicionales para mejorar la apariencia */
.grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
