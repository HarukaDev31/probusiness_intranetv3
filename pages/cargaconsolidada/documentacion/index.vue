<template>
  <div class="p-4 md:p-6 space-y-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Documentación</h1>
    <p class="text-sm text-gray-600 dark:text-gray-400">Selecciona la vista que deseas consultar.</p>
    <div class="flex flex-wrap gap-4">
      <NuxtLink
        to="/cargaconsolidada/documentacion/abiertos"
        class="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
      >
        <UIcon name="i-heroicons-folder-open" class="w-5 h-5" />
        Carga abierta
      </NuxtLink>
      <NuxtLink
        to="/cargaconsolidada/documentacion/completados"
        class="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 transition-colors"
      >
        <UIcon name="i-heroicons-check-badge" class="w-5 h-5" />
        Carga completada
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>
