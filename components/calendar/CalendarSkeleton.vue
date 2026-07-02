<template>
  <div class="animate-pulse">
    <!-- Skeleton para vista de mes -->
    <div v-if="viewMode === 'month'" class="bg-white dark:bg-gray-800 h-full">
      <!-- Días de la semana -->
      <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div
          v-for="i in 7"
          :key="i"
          class="p-3 text-center"
        >
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 mx-auto"></div>
        </div>
      </div>
      <!-- Días del mes -->
      <div class="grid grid-cols-7 h-[calc(100%-49px)]">
        <div
          v-for="i in 42"
          :key="i"
          class="min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700 p-2"
          :class="{
            'bg-gray-50/50 dark:bg-gray-900/50': i <= 7 || i > 35,
            'bg-white dark:bg-gray-800': i > 7 && i <= 35
          }"
        >
          <div class="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full mb-2"></div>
          <div class="space-y-1.5">
            <div class="h-3.5 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div class="h-3.5 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
            <div v-if="i % 5 === 0" class="h-3.5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton para vista de semana -->
    <div v-else-if="viewMode === 'week'" class="bg-white dark:bg-gray-800 h-full">
      <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div class="p-3"></div>
        <div
          v-for="i in 7"
          :key="i"
          class="p-3 border-l border-gray-200 dark:border-gray-700 text-center"
        >
          <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-10 mx-auto mb-2"></div>
          <div class="h-7 bg-gray-300 dark:bg-gray-600 rounded-full w-10 mx-auto"></div>
        </div>
      </div>
      <div class="grid grid-cols-8 h-[calc(100%-65px)]">
        <div class="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div
            v-for="i in 24"
            :key="i"
            class="h-16 border-b border-gray-200 dark:border-gray-700 p-2"
          >
            <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
          </div>
        </div>
        <div
          v-for="i in 7"
          :key="i"
          class="border-r border-gray-200 dark:border-gray-700 relative"
        >
          <div
            v-for="j in 24"
            :key="j"
            class="h-16 border-b border-gray-200 dark:border-gray-700"
          ></div>
          <!-- Eventos skeleton aleatorios -->
          <div
            v-for="k in (i % 3)"
            :key="k"
            class="absolute left-1 right-1 rounded"
            :style="{
              top: `${(k * 4 + 2) * 64}px`,
              height: `${(k + 1) * 64}px`,
              backgroundColor: '#e5e7eb'
            }"
          >
            <div class="p-2">
              <div class="h-3 bg-gray-400 dark:bg-gray-500 rounded w-3/4 mb-1"></div>
              <div class="h-2 bg-gray-400 dark:bg-gray-500 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton para vista de actividades (tabla) -->
    <div v-else-if="viewMode === 'activities'" class="bg-white dark:bg-gray-800 h-full p-4">
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="grid grid-cols-7 gap-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3">
          <div v-for="i in 7" :key="i" class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
        </div>
        <div v-for="row in 8" :key="row" class="grid grid-cols-7 gap-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3 items-center">
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-28"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-14"></div>
          <div class="flex gap-1">
            <div class="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div class="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton para vista de día -->
    <div v-else class="bg-white dark:bg-gray-800 flex flex-col h-full">
      <div class="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
        <div class="h-8 bg-gray-300 dark:bg-gray-600 rounded w-72 mb-2"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="grid grid-cols-12">
          <div class="col-span-1 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div
              v-for="i in 24"
              :key="i"
              class="h-16 border-b border-gray-200 dark:border-gray-700 p-2"
            >
              <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
            </div>
          </div>
          <div class="col-span-11 relative">
            <div
              v-for="i in 24"
              :key="i"
              class="h-16 border-b border-gray-200 dark:border-gray-700"
            ></div>
            <!-- Eventos skeleton aleatorios -->
            <div
              v-for="k in 3"
              :key="k"
              class="absolute left-2 right-2 rounded shadow-sm"
              :style="{
                top: `${(k * 5 + 2) * 64}px`,
                height: `${(k + 1) * 64}px`,
                backgroundColor: '#e5e7eb'
              }"
            >
              <div class="p-2">
                <div class="h-4 bg-gray-400 dark:bg-gray-500 rounded w-2/3 mb-1"></div>
                <div class="h-2.5 bg-gray-400 dark:bg-gray-500 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  viewMode: 'month' | 'week' | 'day' | 'activities'
}

defineProps<Props>()
</script>

