<template>
  <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
      <button
        v-if="canOpenSubtasks"
        class="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        @click="emit('toggle')"
      >
        <UIcon :name="expanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="w-4 h-4 shrink-0 text-gray-400" />
        <span>{{ activity.name }}</span>
      </button>
      <span v-else>{{ activity.name }}</span>
    </td>

    <td v-if="usaConsolidado" class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
      {{ activity.contenedor?.nombre ?? '-' }}
    </td>

    <td class="px-4 py-3">
      <StatusDropdown
        :activity="activity"
        :can-edit="permissions.canEditAnyStatus || !!myCharge"
        :current-user-id="currentUserId"
        :is-jefe="isJefe"
        @update="(eventId, status) => emit('update-status', eventId, status)"
        @update-charge="(chargeId, status) => emit('update-charge-status', chargeId, status)"
      />
    </td>

    <td class="px-4 py-3">
      <PriorityDropdown
        :priority="activity.priority"
        :can-edit="permissions.canEditPriority"
        @update="(priority) => emit('update-priority', priority)"
      />
    </td>

    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ formatIsoDate(activity.start_date) }}</td>
    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ formatIsoDate(activity.end_date) }}</td>
    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ getEventWorkingDays(activity) }} días</td>

    <td class="px-4 py-3">
      <div class="flex items-center -space-x-2">
        <UTooltip v-for="charge in activity.charges.slice(0, 3)" :key="charge.id" :text="charge.user?.nombre ?? 'N/A'">
          <UAvatar
            :alt="charge.user?.nombre ?? 'U'"
            size="sm"
            class="ring-2 ring-white dark:ring-gray-800"
            :src="charge.user?.avatar ?? undefined"
            :style="{ backgroundColor: getResponsableColor(charge.user_id, charge.user?.nombre), color: '#fff' }"
          />
        </UTooltip>
      </div>
    </td>

    <td class="px-4 py-3 text-center">
      <div class="flex items-center justify-center gap-1">
        <UTooltip v-if="myCharge" text="Crear subtareas">
          <UButton icon="i-heroicons-plus" variant="ghost" size="xs" color="primary" @click="onCreateSubtasks" />
        </UTooltip>
        <UTooltip v-if="isJefe || myCharge" text="Notas">
          <UButton
            icon="i-heroicons-chat-bubble-left-right"
            variant="ghost"
            size="xs"
            color="neutral"
            @click="emit('open-notes', isJefe ? null : myCharge ?? null)"
          />
        </UTooltip>
      </div>
    </td>
  </tr>

  <!-- Subtareas por responsable -->
  <tr v-if="expanded" class="bg-gray-50/60 dark:bg-gray-900/40">
    <td :colspan="usaConsolidado ? 9 : 8" class="px-4 py-3 w-full" style="min-width: 1200px;">
      <div class="space-y-3 w-full">
        <p v-if="visibleCharges.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          {{ isJefe ? 'Esta actividad no tiene responsables asignados.' : 'No eres responsable de esta actividad.' }}
        </p>
        <div
          v-for="charge in visibleCharges"
          :key="charge.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3 w-full min-w-0"
        >
          <div v-if="charge.subtasks.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <SubtaskCard
              v-for="task in charge.subtasks"
              :key="task.id"
              :task="task"
              :can-edit="isJefe || charge.user_id === currentUserId"
            />
          </div>
          <p v-else class="text-xs text-gray-500">Sin subtareas para este responsable.</p>
        </div>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  CalendarEvent,
  CalendarEventCharge,
  CalendarEventPriority,
  CalendarEventStatus,
  CalendarPermissions
} from '~/types/calendar'
import { formatIsoDate } from '~/utils/calendar/dates'
import { findChargeOfUser, getEventWorkingDays } from '~/utils/calendar/events'
import StatusDropdown from '~/components/calendar/StatusDropdown.vue'
import PriorityDropdown from '~/components/calendar/PriorityDropdown.vue'
import SubtaskCard from '~/components/calendar/progreso/SubtaskCard.vue'

const props = defineProps<{
  activity: CalendarEvent
  usaConsolidado: boolean
  isJefe: boolean
  currentUserId: number
  permissions: CalendarPermissions
  expanded: boolean
  getResponsableColor: (userId: number, nombre?: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'expand'): void
  (e: 'update-status', eventId: number, status: CalendarEventStatus): void
  (e: 'update-charge-status', chargeId: number, status: CalendarEventStatus): void
  (e: 'update-priority', priority: CalendarEventPriority): void
  (e: 'create-subtasks', charge: CalendarEventCharge): void
  /** null = notas de la actividad (jefe). */
  (e: 'open-notes', charge: CalendarEventCharge | null): void
}>()

const myCharge = computed(() => findChargeOfUser(props.activity, props.currentUserId))

/** Un miembro solo abre las subtareas de actividades donde es responsable. */
const canOpenSubtasks = computed(() => props.isJefe || !!myCharge.value)

/** Jefe con varios responsables: se abre la fila para elegir a cuál; si no, se crean para el único/propio. */
const onCreateSubtasks = () => {
  if (props.isJefe && props.activity.charges.length > 1) {
    emit('expand')
    return
  }
  const charge = props.isJefe ? props.activity.charges[0] : myCharge.value
  if (charge) emit('create-subtasks', charge)
}

/** Jefe ve todos los responsables; un miembro, solo el suyo. */
const visibleCharges = computed(() =>
  props.isJefe ? props.activity.charges : props.activity.charges.filter(c => c.user_id === props.currentUserId)
)
</script>
