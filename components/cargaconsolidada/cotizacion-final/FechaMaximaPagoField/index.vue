<template>
  <div class="flex items-center gap-2 bg-white dark:bg-gray-800 shadow-sm rounded p-2">
    <div class="flex flex-col space-y-1">
      <div class="text-xs font-semibold text-orange-600">Fecha máx. de pago</div>
      <div v-if="editable" class="flex items-center gap-2">
        <input
          type="date"
          :value="modelValue || ''"
          class="text-sm text-gray-700 dark:text-gray-400 bg-transparent outline-none"
          @input="onInput"
        >
        <UButton
          size="xs"
          variant="outline"
          color="primary"
          icon="material-symbols:save-outline"
          :loading="loading"
          :disabled="!canSave"
          aria-label="Guardar fecha máxima de pago"
          @click="emit('save')"
        />
      </div>
      <div
        v-else
        class="text-sm"
        :class="displayValue === 'Sin definir' ? 'text-orange-600' : 'text-gray-700 dark:text-gray-300'"
      >
        {{ displayValue }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDateForDisplay } from '~/utils/data-table'
import type { FechaMaximaPagoFieldProps } from './types'

const props = withDefaults(defineProps<FechaMaximaPagoFieldProps>(), {
  modelValue: null,
  savedValue: null,
  editable: false,
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  save: []
}>()

const displayValue = computed(() => {
  const value = props.savedValue || props.modelValue
  if (!value) return 'Sin definir'
  return formatDateForDisplay(value) || value
})

const canSave = computed(() => {
  const draft = (props.modelValue || '').trim()
  const saved = (props.savedValue || '').trim()
  return !!draft && draft !== saved && !props.loading
})

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value || null)
}
</script>
