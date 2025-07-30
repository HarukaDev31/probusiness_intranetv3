<template>
  <div class="text-center py-12">
    <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-500 mx-auto mb-4" />
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error al cargar la regulación</h3>
    <p class="text-gray-600 dark:text-gray-400 mb-4">{{ message }}</p>
    <UButton label="Intentar de nuevo" @click="$emit('retry')" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string
}

defineProps<Props>()
defineEmits<{
  retry: []
}>()
</script> 