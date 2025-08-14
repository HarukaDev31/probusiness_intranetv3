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
      <div class="flex flex-wrap  flex-row gap-6 max-w-6xl">
        <!-- Card 1: Cotización -->
        <div 
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6 text-center"
          v-for="paso in pasos"
          @click="handleNavigateToStep(paso.name)"
          :key="paso.id"
        >
          <div class="flex flex-col items-center space-y-4">
            <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-clipboard-document-check" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Cotización</h3>
          </div>
        </div>

        <!-- Card 2: Clientes -->
       
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
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
const {getConsolidadoPasos,pasos}=useConsolidado()
const route=useRoute()
const id=Number(route.params.id)  
onMounted(()=>{
  getConsolidadoPasos(id)
})
const pasosMap={
  'COTIZACION':`/cargaconsolidada/abiertos/cotizaciones/${id}`,
  'CLIENTES':`/cargaconsolidada/abiertos/clientes/${id}`,
  'DOCUMENTACION':`/cargaconsolidada/abiertos/documentacion/${id}`,
  'COTIZACION-FINAL':`/cargaconsolidada/abiertos/cotizacion-final/${id}`,
  'FACTURA-GUIA':`/cargaconsolidada/abiertos/factura-guia/${id}`
}
const handleNavigateToStep = (step: string) => {
  navigateTo(pasosMap[step as keyof typeof pasosMap])
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
