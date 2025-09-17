<template>
  <div class="space-y-4">
    <div 
      v-for="n in count" 
      :key="n"
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <!-- Header con ícono y título -->
          <div class="flex items-center gap-2 mb-2">
            <div class="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
            <div class="h-4 bg-blue-200 dark:bg-blue-800 rounded-full w-12"></div>
          </div>
          
          <!-- Mensaje principal -->
          <div class="mb-2">
            <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-1"></div>
            <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
          
          <!-- Descripción (opcional) -->
          <div v-if="showDescription" class="mb-2">
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          
          <!-- Metadata -->
          <div class="flex items-center gap-4">
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
        
        <!-- Botones de acción -->
        <div class="flex items-center gap-2 ml-4">
          <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number
  showDescription?: boolean
}

withDefaults(defineProps<Props>(), {
  count: 5,
  showDescription: true
})
</script>
