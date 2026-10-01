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

    <div v-else class="flex flex-col gap-1">
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" :class="option.badgeClass">
        {{ option.label }}
      </span>
      <UPopover v-if="isJefe && activity.charges.length > 1">
        <button class="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1">
          <UIcon name="i-heroicons-users" class="w-3 h-3" />
          Ver responsables
        </button>
        <template #content>
          <div class="p-3 space-y-2 min-w-[200px]">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Responsables:</p>
            <p v-for="charge in activity.charges" :key="charge.id" class="text-sm text-gray-600 dark:text-gray-400 py-1">
              {{ charge.user?.nombre ?? 'N/A' }}
            </p>
          </div>
        </template>
      </UPopover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { CalendarEvent, CalendarEventStatus } from '~/types/calendar'
import { STATUS_OPTIONS, getStatusOption } from '~/constants/calendar'
import { findChargeOfUser } from '~/utils/calendar/events'

const props = defineProps<{
  activity: CalendarEvent
  canEdit: boolean
  currentUserId: number
  isJefe: boolean
}>()

const emit = defineEmits<{
  /** Jefe: estado de toda la actividad. */
  (e: 'update', eventId: number, status: CalendarEventStatus): void
  /** Miembro: estado de su propio charge. */
  (e: 'update-charge', chargeId: number, status: CalendarEventStatus): void
}>()

const myCharge = computed(() => (props.isJefe ? undefined : findChargeOfUser(props.activity, props.currentUserId)))

/** El miembro ve su propio estado; el jefe, el estado global de la actividad. */
const status = computed<CalendarEventStatus>(() => myCharge.value?.status ?? props.activity.status)
const option = computed(() => getStatusOption(status.value))

const items = computed<DropdownMenuItem[][]>(() => [
  STATUS_OPTIONS.map(o => ({
    label: o.label,
    icon: o.value === status.value ? 'i-heroicons-check' : undefined,
    onSelect: () => {
      if (o.value === status.value) return
      if (myCharge.value) emit('update-charge', myCharge.value.id, o.value)
      else emit('update', props.activity.id, o.value)
    }
  }))
])
</script>
