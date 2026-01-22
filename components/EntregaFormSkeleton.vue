<template>
  <div class="space-y-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex-1">
          <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        </div>
        <div class="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>

      <!-- Form rows -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="n in 6" :key="n" class="space-y-2">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div class="h-9 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        </div>
      </div>

      <!-- Wide fields -->
      <div class="mt-4 space-y-2">
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div class="h-9 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
      </div>

      <!-- Thumbnails / Photos -->
      <div class="mt-4 flex gap-3 items-start">
        <div class="w-28 h-32 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        <div class="w-28 h-32 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        <div class="flex-1">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div class="h-9 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex items-center justify-end gap-3">
        <div class="w-28 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div class="w-28 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple skeleton component, no props required for now
</script>

<style scoped>
/* keep minimal - rely on Tailwind utility classes */
</style>
