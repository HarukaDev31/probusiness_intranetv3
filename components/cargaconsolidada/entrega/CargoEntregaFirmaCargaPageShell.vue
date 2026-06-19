<template>
  <ClientOnly>
    <component
      :is="viewComponent"
      v-if="viewComponent"
      :back-url="backUrl"
      :id-cotizacion="idCotizacion"
      :id-contenedor="idContenedor"
    />
    <div v-else class="min-h-[60vh] flex flex-col items-center justify-center gap-2 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
      <p class="text-sm">Cargando documento...</p>
    </div>
    <template #fallback>
      <div class="min-h-[60vh] flex items-center justify-center text-gray-500 text-sm">
        Cargando...
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import type { Component } from 'vue'
import type { CargoEntregaFirmaCargaViewProps } from './CargoEntregaFirmaCargaView/types'

defineProps<CargoEntregaFirmaCargaViewProps>()

const viewComponent = shallowRef<Component | null>(null)

onMounted(async () => {
  try {
    const mod = await import('./CargoEntregaFirmaCargaView/index.vue')
    viewComponent.value = mod.default
  } catch (err) {
    console.error('No se pudo cargar la vista de firma:', err)
    showError({
      statusCode: 500,
      statusMessage: 'No se pudo cargar la vista de firma de carga',
      fatal: false,
    })
  }
})
</script>
