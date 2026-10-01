<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UButton icon="i-heroicons-arrow-left" variant="ghost" size="sm" label="Regresar" @click="router.back()" />
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Registro de actividades</h1>
        </div>
        <UButton
          v-if="calendarPermissions.canCreateActivity"
          icon="i-heroicons-plus"
          label="Nueva actividad"
          color="primary"
          @click="activityModal.open({ initialDate: todayIso })"
        />
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
        <CalendarDateRangeButton
          v-model:start="startDate"
          v-model:end="endDate"
          @apply="applyFilters()"
          @clear="clearAllFilters"
        />
        <CalendarMultiSelect
          v-if="calendarPermissions.canFilterByResponsable"
          v-model="responsableIds"
          :options="responsableOptions"
          class="w-48"
          show-colors
          @update:model-value="applyFilters()"
        />
        <CalendarMultiSelect
          v-if="usaConsolidado"
          v-model="contenedorIds"
          :options="contenedorOptions"
          class="w-48"
          @update:model-value="applyFilters()"
        />
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <UCard>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th v-for="column in columns" :key="column" class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 last:text-right">
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <template v-if="!loading">
                <tr v-for="activity in sortedActivities" :key="activity.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ activity.name }}</td>
                  <td v-if="usaConsolidado" class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {{ activity.contenedor?.nombre ?? '-' }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ formatIsoDate(activity.start_date, '-') }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ formatIsoDate(activity.end_date, '-') }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ getEventWorkingDays(activity) }} días</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <span
                        v-for="charge in activity.charges.slice(0, 2)"
                        :key="charge.id"
                        class="text-xs px-2 py-1 rounded-full text-white"
                        :style="{ backgroundColor: getResponsableColor(charge.user_id, charge.user?.nombre) }"
                      >
                        {{ charge.user?.nombre.split(' ')[0] ?? 'N/A' }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        v-if="calendarPermissions.canEditActivity"
                        icon="i-heroicons-pencil-square"
                        variant="ghost"
                        size="xs"
                        color="primary"
                        @click="activityModal.open({ event: activity })"
                      />
                      <UButton
                        v-if="calendarPermissions.canDeleteActivity"
                        icon="i-heroicons-trash"
                        variant="ghost"
                        size="xs"
                        color="error"
                        @click="activityModal.confirmDelete(activity)"
                      />
                    </div>
                  </td>
                </tr>
                <tr v-if="sortedActivities.length === 0">
                  <td :colspan="columns.length" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    No hay actividades registradas
                  </td>
                </tr>
              </template>
              <template v-else>
                <tr v-for="i in 6" :key="i" class="animate-pulse">
                  <td v-for="column in columns" :key="column" class="px-4 py-3">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <CalendarPaginationBar
          v-if="eventsPagination"
          :page="page"
          :per-page="perPage"
          :total="eventsPagination.total"
          @update:page="(p) => { page = p; applyFilters(true, false) }"
          @update:per-page="(n) => { perPage = n; applyFilters(true) }"
        />
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { getLocalTimeZone, today } from '@internationalized/date'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useCalendarListFilters } from '~/composables/calendar/useCalendarListFilters'
import { useActivityModal } from '~/composables/calendar/useActivityModal'
import { formatIsoDate, toIsoDate } from '~/utils/calendar/dates'
import { getEventWorkingDays } from '~/utils/calendar/events'
import CalendarDateRangeButton from '~/components/calendar/CalendarDateRangeButton.vue'
import CalendarMultiSelect from '~/components/calendar/CalendarMultiSelect.vue'
import type { CalendarMultiSelectOption } from '~/components/calendar/CalendarMultiSelect.vue'
import CalendarPaginationBar from '~/components/calendar/CalendarPaginationBar.vue'

const {
  visibleActivities,
  eventsPagination,
  responsables,
  contenedores,
  loading,
  calendarPermissions,
  usaConsolidado,
  getEvents,
  getResponsableColor,
  initialize,
  clearFilters
} = useCalendarStore()

const router = useRouter()
const todayIso = toIsoDate(today(getLocalTimeZone()))

const { startDate, endDate, responsableIds, contenedorIds, page, perPage, buildFilters } = useCalendarListFilters(10)

const applyFilters = async (force = false, resetPage = true) => {
  if (resetPage) page.value = 1
  await getEvents(buildFilters(usaConsolidado.value), force)
}

const activityModal = useActivityModal(() => applyFilters(true, false))

/** "Limpiar" del rango de fechas limpia todos los filtros de la página. */
const clearAllFilters = () => {
  responsableIds.value = []
  contenedorIds.value = []
  applyFilters()
}

const responsableOptions = computed<CalendarMultiSelectOption[]>(() =>
  responsables.value.map(r => ({ label: r.nombre, value: r.id, color: getResponsableColor(r.id, r.nombre) }))
)
const contenedorOptions = computed<CalendarMultiSelectOption[]>(() =>
  contenedores.value.map(c => ({ label: c.nombre, value: c.id }))
)

const columns = computed(() => [
  'Actividad',
  ...(usaConsolidado.value ? ['# Consolidado'] : []),
  'Fecha Inicio', 'Fecha Fin', 'Duración', 'Responsables', 'Acciones'
])

/** Por fecha de inicio ascendente (como el backend), luego por id. */
const sortedActivities = computed(() =>
  [...visibleActivities.value].sort((a, b) =>
    (a.start_date ?? '9999-12-31').localeCompare(b.start_date ?? '9999-12-31') || a.id - b.id
  )
)

onMounted(async () => {
  await initialize()
  clearFilters()
  await applyFilters()
})

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>
