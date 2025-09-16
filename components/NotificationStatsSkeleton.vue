<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div 
      v-for="n in 3" 
      :key="n"
      class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
    >
      <div class="flex items-center">
        <div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
        <div>
          <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
          <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No necesita props por ahora
</script>
