<template>
  <div class="mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <UButton 
          v-if="!hideBackButton"
          label="Volver" 
          icon="i-heroicons-arrow-left text-secondary"
          variant="outline"
          color="secondary"
          @click="$emit('back')"
          class="mr-4"
        />
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <UIcon :name="icon" class="text-secondary mr-3 text-2xl" />
            {{ title }}
          </h1>
        
        </div>
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