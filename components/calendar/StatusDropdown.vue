<template>
  <div>
    <!-- Estado de la actividad (compartido por todos los participantes) -->
    <!-- Editable: cualquier participante o jefe -->
    <UDropdownMenu v-if="canEdit" :items="statusItems">
      <span
        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
        :class="activityStatusClasses"
      >
        {{ activityStatusLabel }}
        <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 ml-1" />
      </span>
    </UDropdownMenu>

    <!-- Solo lectura -->
    <div v-else class="flex flex-col gap-1">
      <span
        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
        :class="activityStatusClasses"
      >
        {{ activityStatusLabel }}
      </span>
      <!-- Jefe: ver responsables (opcional) -->
      <UPopover v-if="isJefe && activity.charges && activity.charges.length > 1">
        <button class="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1">
          <UIcon name="i-heroicons-users" class="w-3 h-3" />
          Ver responsables
        </button>
        <template #content>
          <div class="p-3 space-y-2 min-w-[200px]">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Responsables:</p>
            <div
              v-for="charge in activity.charges"
              :key="charge.id"
              class="flex items-center gap-2 py-1"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ charge.user?.nombre || 'N/A' }}
              </span>
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent, CalendarEventStatus } from '~/types/calendar'
import { STATUS_OPTIONS } from '~/constants/calendar'

interface Props {
  activity: CalendarEvent
  canEdit: boolean
  currentUserId?: number | string
  isJefe?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: 0,
  isJefe: false
})

const emit = defineEmits<{
  (e: 'update', eventId: number, status: CalendarEventStatus): void
}>()

// Estado de la actividad (uno solo para todos; si uno cambia, todos lo ven)
const activityStatus = computed((): CalendarEventStatus => {
  const charges = props.activity.charges || []
  if (charges.length === 0) return 'PENDIENTE'
  const statuses = charges.map(c => c.status || 'PENDIENTE')
  const allCompleted = statuses.every(s => s === 'COMPLETADO')
  if (allCompleted) return 'COMPLETADO'
  const hasProgress = statuses.some(s => s === 'PROGRESO' || s === 'COMPLETADO')
  if (hasProgress) return 'PROGRESO'
  return 'PENDIENTE'
})

const activityStatusLabel = computed(() => getStatusLabel(activityStatus.value))
const activityStatusClasses = computed(() => getStatusClasses(activityStatus.value))

function getStatusLabel(status: CalendarEventStatus): string {
  const option = STATUS_OPTIONS.find(o => o.value === status)
  return option?.label || 'Pendiente'
}

function getStatusClasses(status: CalendarEventStatus): string {
  switch (status) {
    case 'PENDIENTE':
      return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
    case 'PROGRESO':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'COMPLETADO':
      return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

const statusItems = computed(() => {
  const items = STATUS_OPTIONS.map(option => ({
    label: option.label,
    icon: option.value === activityStatus.value ? 'i-heroicons-check' : undefined,
    onSelect: () => {
      if (option.value !== activityStatus.value) {
        emit('update', props.activity.id, option.value)
      }
    }
  }))
  return [items]
})
</script>
