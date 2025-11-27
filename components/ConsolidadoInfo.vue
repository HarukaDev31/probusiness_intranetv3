<template>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-300 dark:border-gray-700">
      <!-- Consolidado -->
      <div class=" border-r border-gray-300 ">
        <div class="flex flex-row items-center gap-2 bg-transparent ">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Consolidado</span>
        
            <template v-if="loading">
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            </template>
            <template v-else>
              <label class="md:text-lg text-sm font-semibold text-gray-900 dark:text-white">{{ consolidado.numero }}</label>
            </template>
          
        </div>
        
      </div>

      <!-- Cliente -->
      <div class="border-r border-gray-200 pr-4">
        <div class="flex items-center">
          <template v-if="loading">
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
          </template>
          <template v-else>
            <span class="md:text-lg text-sm font-semibold text-gray-900 dark:text-white truncate">{{ cliente.nombre }}</span>
          </template>
        </div>
      </div>

      <!-- Código Proveedor -->
      <div>
        <div class="flex items-center">
          <template v-if="loading">
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
          </template>
          <template v-else>
            <span class="md:text-lg text-sm font-semibold text-gray-900 dark:text-white">{{ codigoProveedor }}</span>
          </template>
        </div>
      </div>
    </div>
 
</template>

<script setup lang="ts">
interface Props {
  consolidado: {
    numero: string
  }
  cliente: {
    nombre: string
  }
  codigoProveedor: string
  loading: boolean
}

defineProps<Props>()
</script>
