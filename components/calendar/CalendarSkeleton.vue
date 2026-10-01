<template>
  <div class="animate-pulse bg-white dark:bg-gray-800 h-full">
    <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div v-for="i in 7" :key="i" class="p-3 text-center">
        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 mx-auto" />
      </div>
    </div>
    <div class="grid grid-cols-7 h-[calc(100%-49px)]">
      <div
        v-for="i in 42"
        :key="i"
        class="min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700 p-2"
        :class="i <= 7 || i > 35 ? 'bg-gray-50/50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800'"
      >
        <div class="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full mb-2" />
        <div class="space-y-1.5">
          <div class="h-3.5 bg-gray-300 dark:bg-gray-600 rounded w-full" />
          <div class="h-3.5 bg-gray-300 dark:bg-gray-600 rounded w-4/5" />
          <div v-if="i % 5 === 0" class="h-3.5 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
        </div>
      </div>
    </div>
  </div>
</template>
