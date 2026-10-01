<template>
  <USelectMenu
    :model-value="selectValue"
    :items="items"
    value-key="value"
    :placeholder="modelValue.length ? `${modelValue.length} seleccionado(s)` : allLabel"
    :size="size"
    :disabled="disabled"
    multiple
    :search-input="{ placeholder: 'Buscar...' }"
    @update:model-value="onChange"
  >
    <template v-if="showColors" #item="{ item }">
      <div class="flex items-center gap-2">
        <div
          v-if="item.value !== ALL_VALUE"
          class="w-3 h-3 rounded-full shrink-0"
          :style="{ backgroundColor: item.color ?? FALLBACK_HEX }"
        />
        <span class="text-sm">{{ item.label }}</span>
      </div>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FALLBACK_HEX } from '~/constants/calendar'

export interface CalendarMultiSelectOption {
  label: string
  value: number
  color?: string
}

/** Valor de la opción "Todos" (no es un id real). */
const ALL_VALUE = -1

const props = withDefaults(defineProps<{
  /** Ids seleccionados; vacío = "Todos". */
  modelValue: number[]
  options: CalendarMultiSelectOption[]
  allLabel?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  showColors?: boolean
}>(), {
  allLabel: 'Todos',
  size: 'sm',
  disabled: false,
  showColors: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', ids: number[]): void
}>()

const items = computed<CalendarMultiSelectOption[]>(() => [{ label: props.allLabel, value: ALL_VALUE }, ...props.options])

const selectValue = computed<number[]>(() => (props.modelValue.length ? [...props.modelValue] : [ALL_VALUE]))

/**
 * "Todos" y los ids reales son excluyentes: elegir "Todos" con otros seleccionados limpia la
 * selección; elegir un id estando en "Todos" deja solo ese id.
 */
const onChange = (value: number[]) => {
  const hasAll = value.includes(ALL_VALUE)
  if (hasAll && (value.length === 1 || props.modelValue.length > 0)) {
    emit('update:modelValue', [])
    return
  }
  emit('update:modelValue', value.filter(id => id !== ALL_VALUE))
}
</script>
