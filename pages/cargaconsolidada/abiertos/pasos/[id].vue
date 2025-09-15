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
      <div class="flex flex-wrap flex-row gap-3 max-w-6xl">
        <!-- Loading state -->
        <div v-if="loading" class="flex flex-wrap flex-row gap-3 max-w-6xl">
          <!-- Skeleton para cada paso -->
          <div 
            v-for="i in 5" 
            :key="`skeleton-${i}`"
            class="bg-white min-w-40 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center animate-pulse"
          >
            <div class="flex flex-col items-center space-y-4">
              <!-- Icono skeleton -->
              <div class="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <!-- Título skeleton -->
              <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </div>
        </div>

        <!-- Cards reales cuando no está cargando -->
        <div
          v-else
          class="rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 hover:dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer p-3 text-center"
          v-for="paso in pasos" 
          @click="handleNavigateToStep(paso.name)" 
          :key="paso.id"
        >
          <div class="flex flex-col items-center space-y-4 min-w-40">
            <div class="w-14 h-14 rounded-full flex items-center justify-center">
              <!--load image from url-->
              <img :src="paso.iconURL"/>
            </div>
            <h3 class="text-md text-gray-900 dark:text-white">{{ formatNombre(paso.name) }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Regresar Button -->
    <div class="flex justify-center">
      <UButton label="Regresar" color="neutral" variant="outline" size="lg" class="w-4xl justify-center px-8 py-3" @click="goBack" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConsolidado } from '../../../../composables/cargaconsolidada/useConsolidado'
const { getConsolidadoPasos, pasos, loading } = useConsolidado()
const route = useRoute()
const id = Number(route.params.id)
onMounted(async () => {
  await getPasos()
})
const getPasos = async () => {
  const pasos = await getConsolidadoPasos(id)
}
const formatNombre = (s: string) => {
  if (!s) return ''
  const lower = s.toLocaleLowerCase('es-PE')
  return lower.charAt(0).toLocaleUpperCase('es-PE') + lower.slice(1)
}
const pasosMap = {
  'Cotizacion': `/cargaconsolidada/abiertos/cotizaciones/${id}?tab=prospectos`,
  'Clientes': `/cargaconsolidada/abiertos/clientes/${id}`,
  'Documentacion': `/cargaconsolidada/abiertos/documentacion/${id}`,
  'Cotización Final': `/cargaconsolidada/abiertos/cotizacion-final/${id}?tab=general`,
  'Factura y Guía': `/cargaconsolidada/abiertos/factura-guia/${id}`,
  'Aduana': `/cargaconsolidada/abiertos/aduana/${id}`
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
