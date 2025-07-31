<template>
  <div 
    :class="[
      'flex items-center justify-center',
      size === 'sm' && 'p-2',
      size === 'md' && 'p-4',
      size === 'lg' && 'p-6',
      size === 'xl' && 'p-8',
      fullScreen && 'fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-50'
    ]"
  >
    <div class="text-center">
      <div 
        :class="[
          'animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600',
          size === 'sm' && 'w-4 h-4 border-t-blue-500',
          size === 'md' && 'w-6 h-6 border-t-blue-500',
          size === 'lg' && 'w-8 h-8 border-t-blue-500',
          size === 'xl' && 'w-12 h-12 border-t-blue-500'
        ]"
      ></div>
      <p 
        v-if="text"
        :class="[
          'mt-2 text-gray-600 dark:text-gray-400',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          size === 'xl' && 'text-lg'
        ]"
      >
        {{ text }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  fullScreen: false
})
</script> 