<template>
  <UModal :model-value="isOpen" @update:model-value="$emit('update:isOpen', $event)" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-check" class="w-6 h-6 text-green-600 dark:text-green-400" />
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
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton 
            v-if="showSecondaryButton" 
            variant="outline" 
            @click="handleSecondaryAction"
          >
            {{ secondaryButtonText }}
          </UButton>
          <UButton 
            color="success" 
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
  primaryButtonText?: string
  showSecondaryButton?: boolean
  secondaryButtonText?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'secondary-action'): void
  (e: 'update:isOpen', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '¡Éxito!',
  subtitle: 'Operación completada',
  primaryButtonText: 'Aceptar',
  showSecondaryButton: false,
  secondaryButtonText: 'Cancelar'
})

const emit = defineEmits<Emits>()

const handleClose = () => {
  emit('close')
}

const handleSecondaryAction = () => {
  emit('secondary-action')
}
</script> 