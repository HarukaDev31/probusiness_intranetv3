<template>
  <div>
    <UDropdownMenu v-if="canEdit" :items="items">
      <span
        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
        :class="option.badgeClass"
      >
        {{ option.label }}
        <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 ml-1" />
      </span>
    </UDropdownMenu>
    <span v-else class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" :class="option.badgeClass">
      {{ option.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { CalendarEventPriority } from '~/types/calendar'
import { PRIORITY_OPTIONS, getPriorityOption } from '~/constants/calendar'

const props = defineProps<{
  priority: CalendarEventPriority
  canEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'update', priority: CalendarEventPriority): void
}>()

const option = computed(() => getPriorityOption(props.priority))

const items = computed<DropdownMenuItem[][]>(() => [
  PRIORITY_OPTIONS.map(o => ({
    label: o.label,
    icon: o.value === props.priority ? 'i-heroicons-check' : undefined,
    onSelect: () => {
      if (o.value !== props.priority) emit('update', o.value)
    }
  }))
])
</script>
