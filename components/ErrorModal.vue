<template>
  <UModal :model-value="isOpen" @update:model-value="$emit('update:isOpen', $event)" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ subtitle }}
            </p>
          </div>
        </div>
      </template>

      <div class="py-4">
        <p class="text-gray-700 dark:text-gray-300">
          {{ message }}
        </p>
        <div v-if="details" class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p class="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {{ details }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton 
            v-if="showRetryButton" 
            variant="outline" 
            @click="handleRetry"
          >
            Reintentar
          </UButton>
          <UButton 
            color="error" 
            @click="handleClose"
          >
            {{ primaryButtonText }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  title?: string
  subtitle?: string
  message: string
  details?: string
  primaryButtonText?: string
  showRetryButton?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'retry'): void
  (e: 'update:isOpen', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Error',
  subtitle: 'Algo salió mal',
  primaryButtonText: 'Cerrar',
  showRetryButton: false
})

const emit = defineEmits<Emits>()

const handleClose = () => {
  emit('close')
}

const handleRetry = () => {
  emit('retry')
}
</script> 