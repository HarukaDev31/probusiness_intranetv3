<template>
  <div class="max-w-md">
    <div class="flex items-center justify-between mb-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <UIcon name="i-heroicons-building-office" class="mr-1" />
        Entidad
        <span v-if="required" class="text-red-500 ml-1">*</span>
      </label>
      <UButton 
        label="Crear Entidad" 
        icon="i-heroicons-plus" 
        size="xs" 
        variant="outline"
        @click="$emit('create-entity')"
      />
    </div>
    <USelect 
      :model-value="modelValue"
      :items="options" 
      :loading="loading"
      placeholder="Seleccionar entidad" 
      class="w-full"
      :color="error ? 'error' : undefined"
      @update:model-value="$emit('update:modelValue', $event); $emit('clear-error')"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: any
  options: { label: string; value: any }[]
  loading: boolean
  error?: string
  required?: boolean
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: any]
  'clear-error': []
  'create-entity': []
}>()
</script> 