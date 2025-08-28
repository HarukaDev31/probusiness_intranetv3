<template>
  <div class="mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center justify-between w-full">
        
        <div class="flex flex-col items-start gap-4">
          <button
            v-if="!hideBackButton"
            @click="$emit('back')"
            aria-label="Regresar"
            class="inline-flex items-center gap-3 px-3.5 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 text-gray-500" />
            <span class="whitespace-nowrap">Regresar</span>
          </button>

          <h1 class="mt-3 text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <UIcon :name="icon" class="text-secondary mr-3 text-2xl" />
            {{ title }}
          </h1>
        
        </div>
        <slot name="actions"></slot>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle: string
  icon: string
  loading?: boolean
  hideBackButton?: boolean
  
}

defineProps<Props>()
defineEmits<{
  back: []
  save: []
}>()
</script> 