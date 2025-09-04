<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="mr-2" />
          Notas
        </h2>
       
      </div>
    </template>

          <div class="h-64 w-full">
        <UTextarea
          :disabled="disabled"
          :model-value="modelValue"
          placeholder="Escribe tus notas aquí..."
          class="h-full resize-none w-full"
          :rows="10"
          @input="$emit('update:modelValue', $event.target.value)"
        />
      </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  disabled: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
