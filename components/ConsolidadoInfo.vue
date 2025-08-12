<template>
  <UCard class="mb-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Consolidado -->
      <div class="border-r border-gray-200 pr-4">
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Consolidado</span>
          <div class="mt-1">
            <label class="text-lg font-semibold text-gray-900 dark:text-white">{{ consolidado.numero }}</label>
          </div>
        </div>
      </div>

      <!-- Cliente -->
      <div class="border-r border-gray-200 pr-4">
        <div class="flex items-center">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Cliente:</span>
          <span class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{ cliente.nombre }}</span>
        </div>
      </div>

      <!-- Código Proveedor -->
      <div>
        <div class="flex items-center">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Código:</span>
          <span class="text-lg font-semibold text-gray-900 dark:text-white">{{ codigo }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  consolidado: {
    numero: string
    nombre: string
  }
  cliente: {
    nombre: string
    codigo: string
  }
  codigo: string
}

defineProps<Props>()
</script>
