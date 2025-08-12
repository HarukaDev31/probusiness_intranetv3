<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="mr-2" />
          Notas
        </h2>
        <UButton 
          label="Guardar" 
          icon="i-heroicons-save" 
          color="warning" 
          size="sm"
          @click="$emit('save')"
        />
      </div>
    </template>

          <div class="h-64">
        <UTextarea
          :model-value="modelValue"
          placeholder="Escribe tus notas aquí..."
          class="h-full resize-none"
          :rows="10"
          @input="$emit('update:modelValue', $event.target.value)"
        />
      </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
