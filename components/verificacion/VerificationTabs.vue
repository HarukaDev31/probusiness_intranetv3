<template>
  <div class="mb-3 flex items-center">
    <div class="inline-flex gap-2 rounded-md bg-gray-100 p-1 dark:bg-gray-900">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="rounded-md px-4 py-2 text-sm font-medium transition"
        :class="modelValue === tab.value ? 'border-2 border-gray-300 bg-white shadow-sm dark:bg-gray-800' : 'text-gray-600'"
        @click="emit('update:modelValue', tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="ml-1 rounded bg-orange-500 px-1.5 text-xs text-white">{{ tab.count }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VERIFICATION_TAB } from '~/constants/supplierPayment'

const props = defineProps<{
  modelValue: string
  administration?: boolean
  pendingCount?: number
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const tabs = computed(() => {
  const items = [
    { value: 'consolidado', label: 'Consolidado' },
    { value: 'cursos', label: 'Cursos' },
    { value: 'delivery', label: 'Delivery' }
  ]
  if (props.administration) {
    items.push({ value: 'permisos', label: 'Permisos' })
  }
  items.push({ value: 'boletin-quimico', label: 'Boletín Químico' })
  if (props.administration) {
    items.push({ value: VERIFICATION_TAB, label: 'Pago a Proveedor', count: props.pendingCount || 0 } as { value: string; label: string; count?: number })
  }
  return items
})
</script>
