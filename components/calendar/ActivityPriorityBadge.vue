<template>
  <div>
    <!-- Editable: dropdown -->
    <UDropdownMenu v-if="canEdit" :items="priorityItems">
      <UButton
        :label="currentPriorityLabel"
        :color="currentPriorityColor"
        variant="soft"
        size="xs"
        trailing-icon="i-heroicons-chevron-down"
      />
    </UDropdownMenu>

    <!-- Read-only: badge simple -->
    <UBadge v-else :color="currentPriorityColor" variant="soft" size="sm">
      {{ currentPriorityLabel }}
    </UBadge>
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
  (e: 'update-priority', priority: CalendarEventPriority): void
}>()

const currentPriorityLabel = computed(() => {
  const option = PRIORITY_OPTIONS.find(o => o.value === props.priority)
  return option?.label || 'Bajo'
})

const currentPriorityColor = computed(() => {
  const option = PRIORITY_OPTIONS.find(o => o.value === props.priority)
  return option?.color || 'success'
})

// Items para el dropdown
const priorityItems = computed(() => {
  return PRIORITY_OPTIONS.map(option => ({
    label: option.label,
    icon: option.value === props.priority ? 'i-heroicons-check' : undefined,
    click: () => {
      if (option.value !== props.priority) {
        emit('update-priority', option.value)
      }
    }
  }))
})
</script>
