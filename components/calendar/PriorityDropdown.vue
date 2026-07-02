<template>
  <div>
    <!-- Editable -->
    <UDropdownMenu v-if="canEdit" :items="priorityItems">
      <span
        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
        :class="priorityClasses"
      >
        {{ currentPriorityLabel }}
        <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 ml-1" />
      </span>
    </UDropdownMenu>

    <!-- Solo lectura -->
    <span
      v-else
      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      :class="priorityClasses"
    >
      {{ currentPriorityLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEventPriority } from '~/types/calendar'
import { PRIORITY_OPTIONS } from '~/constants/calendar'

interface Props {
  priority: CalendarEventPriority
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', priority: CalendarEventPriority): void
}>()

const currentPriorityLabel = computed(() => {
  const option = PRIORITY_OPTIONS.find(o => o.value === props.priority)
  return option?.label || 'Bajo'
})

const priorityClasses = computed(() => {
  switch (props.priority) {
    case 0: // Bajo
      return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
    case 1: // Medio
      return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
    case 2: // Alto
      return 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
})

// Items para el dropdown
const priorityItems = computed(() => {
  return PRIORITY_OPTIONS.map(option => ({
    label: option.label,
    icon: option.value === props.priority ? 'i-heroicons-check' : undefined,
    click: () => {
      if (option.value !== props.priority) {
        emit('update', option.value)
      }
    }
  }))
})
</script>
