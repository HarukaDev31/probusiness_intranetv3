<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-800">
    <!-- Header de la tabla -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Registro de Actividades</h2>
      <UButton
        v-if="calendarPermissions.canCreateActivity"
        icon="i-heroicons-plus"
        label="Nueva actividad"
        color="primary"
        size="sm"
        @click="$emit('create')"
      />
    </div>

    <!-- Tabla -->
    <div class="flex-1 overflow-auto">
      <table class="w-full min-w-[1000px]">
        <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Actividad
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Estado
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Prioridad
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Consolidado
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Duración
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              F. Inicio
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              F. Fin
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Responsables
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Notas
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="activity in activities"
            :key="activity.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <!-- Actividad -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div
                  class="w-1 h-8 rounded-full"
                  :style="{ backgroundColor: getActivityColor(activity) }"
                />
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ activity.name || activity.title }}
                </span>
              </div>
            </td>

            <!-- Estado -->
            <td class="px-4 py-3">
              <ActivityStatusBadge
                :activity="activity"
                :can-edit="canEditStatus(activity)"
                :current-user-id="currentUserId"
                :is-jefe="isJefe"
                @update-status="(chargeId, status) => $emit('update-status', chargeId, status)"
              />
            </td>

            <!-- Prioridad -->
            <td class="px-4 py-3">
              <ActivityPriorityBadge
                :priority="activity.priority"
                :can-edit="calendarPermissions.canEditPriority"
                @update-priority="(priority) => $emit('update-priority', activity.id, priority)"
              />
            </td>

            <!-- Consolidado -->
            <td class="px-4 py-3">
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ activity.contenedor?.nombre || activity.contenedor?.codigo || '-' }}
              </span>
            </td>

            <!-- Duración -->
            <td class="px-4 py-3">
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ calculateDuration(activity) }} días
              </span>
            </td>

            <!-- F. Inicio -->
            <td class="px-4 py-3">
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ formatDate(activity.start_date || getFirstDate(activity)) }}
              </span>
            </td>

            <!-- F. Fin -->
            <td class="px-4 py-3">
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ formatDate(activity.end_date || getLastDate(activity)) }}
              </span>
            </td>

            <!-- Responsables -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <div
                  v-for="charge in (activity.charges || []).slice(0, 2)"
                  :key="charge.id"
                  class="flex items-center"
                >
                  <UTooltip :text="charge.user?.nombre || 'Sin nombre'">
                    <UAvatar
                      :alt="charge.user?.nombre || 'U'"
                      size="xs"
                      :style="{
                        backgroundColor: getResponsableColor(charge.user_id, charge.user?.nombre),
                        color: '#fff'
                      }"
                    />
                  </UTooltip>
                </div>
                <span
                  v-if="(activity.charges || []).length > 2"
                  class="text-xs text-gray-500"
                >
                  +{{ (activity.charges || []).length - 2 }}
                </span>
              </div>
            </td>

            <!-- Notas -->
            <td class="px-4 py-3">
              <UTooltip v-if="activity.notes" :text="activity.notes">
                <UButton
                  icon="i-heroicons-document-text"
                  variant="ghost"
                  size="xs"
                  color="primary"
                  @click="$emit('open-notes', activity)"
                />
              </UTooltip>
              <UButton
                v-else
                icon="i-heroicons-plus"
                variant="ghost"
                size="xs"
                color="neutral"
                @click="$emit('open-notes', activity)"
              />
            </td>

            <!-- Acciones -->
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <UButton
                  v-if="calendarPermissions.canEditActivity"
                  icon="i-heroicons-pencil"
                  variant="ghost"
                  size="xs"
                  color="primary"
                  @click="$emit('edit', activity)"
                />
                <UButton
                  v-if="calendarPermissions.canDeleteActivity"
                  icon="i-heroicons-trash"
                  variant="ghost"
                  size="xs"
                  color="error"
                  @click="$emit('delete', activity)"
                />
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="activities.length === 0">
            <td colspan="10" class="px-4 py-12 text-center">
              <div class="flex flex-col items-center gap-2">
                <UIcon name="i-heroicons-calendar" class="w-12 h-12 text-gray-300 dark:text-gray-600" />
                <p class="text-sm text-gray-500 dark:text-gray-400">No hay actividades registradas</p>
                <UButton
                  v-if="calendarPermissions.canCreateActivity"
                  label="Crear primera actividad"
                  variant="outline"
                  size="sm"
                  @click="$emit('create')"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent, CalendarEventStatus, CalendarEventPriority } from '~/types/calendar'
import ActivityStatusBadge from './ActivityStatusBadge.vue'
import ActivityPriorityBadge from './ActivityPriorityBadge.vue'

interface Props {
  activities: CalendarEvent[]
  calendarPermissions: any
  currentUserId: number
  isJefe?: boolean
  getResponsableColor: (userId: number, nombre?: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', activity: CalendarEvent): void
  (e: 'delete', activity: CalendarEvent): void
  (e: 'open-notes', activity: CalendarEvent): void
  (e: 'update-status', chargeId: number, status: CalendarEventStatus): void
  (e: 'update-priority', activityId: number, priority: CalendarEventPriority): void
}>()

// Helpers
const getActivityColor = (activity: CalendarEvent): string => {
  // Color del primer responsable
  const firstCharge = activity.charges?.[0]
  if (firstCharge) {
    return props.getResponsableColor(firstCharge.user_id, firstCharge.user?.nombre)
  }
  return '#6B7280'
}

const getFirstDate = (activity: CalendarEvent): string => {
  if (activity.days && activity.days.length > 0) {
    return activity.days.sort((a, b) => a.date.localeCompare(b.date))[0].date
  }
  return activity.start_date || ''
}

const getLastDate = (activity: CalendarEvent): string => {
  if (activity.days && activity.days.length > 0) {
    return activity.days.sort((a, b) => b.date.localeCompare(a.date))[0].date
  }
  return activity.end_date || ''
}

const calculateDuration = (activity: CalendarEvent): number => {
  const start = activity.start_date || getFirstDate(activity)
  const end = activity.end_date || getLastDate(activity)
  if (!start || !end) return 1
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const canEditStatus = (activity: CalendarEvent): boolean => {
  if (props.calendarPermissions.canEditAnyStatus) {
    return true
  }
  // Solo puede editar si es responsable de la actividad
  return activity.charges?.some(c => c.user_id === props.currentUserId) || false
}
</script>
