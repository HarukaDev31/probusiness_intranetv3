<template>
  <div class="mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <UButton 
          label="Volver" 
          icon="i-heroicons-arrow-left"
          variant="outline"
          @click="$emit('back')"
          class="mr-4"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <UIcon :name="icon" class="text-green-600 mr-3 text-2xl" />
            {{ title }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {{ subtitle }}
          </p>
        </div>
      </div>
      <UButton 
        label="Guardar" 
        icon="i-heroicons-document-arrow-down"
        color="primary"
        :loading="loading"
        :disabled="loading"
        @click="$emit('save')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle: string
  icon: string
  loading?: boolean
}

defineProps<Props>()
defineEmits<{
  back: []
  save: []
}>()
</script> 