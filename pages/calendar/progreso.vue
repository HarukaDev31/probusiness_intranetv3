<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900">
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center gap-4">
        <UButton icon="i-heroicons-arrow-left" variant="ghost" size="sm" label="Regresar" @click="router.back()" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">TABLA DE PROGRESO</h1>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 md:px-6 py-4 space-y-3 w-full">
      <ProgressStatsBar
        v-if="isJefeImportaciones"
        title="Progreso global"
        icon="i-heroicons-globe-alt"
        icon-class="text-primary-600"
        :stats="globalProgressStats"
      />
      <ProgressStatsBar
        v-else
        title="Mi progreso"
        icon="i-heroicons-chart-bar"
        icon-class="text-success-600"
        :stats="myProgressStats"
      />
    </div>

    <div class="max-w-7xl mx-auto px-4 md:px-6 pb-6 w-full">
      <UCard>
        <div class="flex flex-wrap items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <CalendarDateRangeButton
            v-model:start="startDate"
            v-model:end="endDate"
            @apply="applyFilters()"
            @clear="applyFilters()"
          />

          <USelectMenu
            :model-value="statusItems.find(i => i.value === status)"
            :items="statusItems"
            placeholder="Estado"
            size="sm"
            class="w-36"
            @update:model-value="(item) => { status = item?.value ?? null; applyFilters() }"
          />

          <USelectMenu
            :model-value="priorityItems.find(i => i.value === priority)"
            :items="priorityItems"
            placeholder="Prioridad"
            size="sm"
            class="w-36"
            @update:model-value="(item) => { priority = item?.value ?? null; applyFilters() }"
          />

          <template v-if="calendarPermissions.canFilterByResponsable">
            <CalendarMultiSelect
              v-if="isJefeImportaciones"
              v-model="responsableIds"
              :options="responsableOptions"
              class="w-40"
              show-colors
              @update:model-value="applyFilters()"
            />
            <USelectMenu
              v-else
              :model-value="onlyMine ? MINE_ITEMS[1] : MINE_ITEMS[0]"
              :items="MINE_ITEMS"
              size="sm"
              class="w-36"
              @update:model-value="(item) => setOnlyMine(item?.value === 'yo')"
            />
          </template>

          <CalendarMultiSelect
            v-if="usaConsolidado"
            v-model="contenedorIds"
            :options="contenedorOptions"
            class="w-48 min-w-0"
            @update:model-value="applyFilters()"
          />
        </div>

        <div class="overflow-x-auto overflow-y-visible pt-4">
          <table class="w-full min-w-[1200px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th v-for="column in columns" :key="column" class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 last:text-center">
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <template v-if="!loading">
                <ProgressActivityRow
                  v-for="activity in visibleActivities"
                  :key="activity.id"
                  :activity="activity"
                  :usa-consolidado="usaConsolidado"
                  :is-jefe="isJefeImportaciones"
                  :current-user-id="currentUserId"
                  :permissions="calendarPermissions"
                  :expanded="expandedActivityId === activity.id"
                  :get-responsable-color="getResponsableColor"
                  @toggle="expandedActivityId = expandedActivityId === activity.id ? null : activity.id"
                  @expand="expandedActivityId = activity.id"
                  @update-status="onEventStatus"
                  @update-charge-status="onChargeStatus"
                  @update-priority="(p) => onPriority(activity.id, p)"
                  @create-subtasks="(charge) => (subtasksTarget = { activity, charge })"
                  @open-notes="(charge) => (notesTarget = { activity, charge })"
                />
                <tr v-if="visibleActivities.length === 0">
                  <td :colspan="columns.length" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    No hay actividades registradas
                  </td>
                </tr>
              </template>
              <template v-else>
                <tr v-for="i in 6" :key="i" class="animate-pulse">
                  <td v-for="column in columns" :key="column" class="px-4 py-3">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
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
          @update:page="goToPage"
          @update:per-page="(n) => { perPage = n; applyFilters(true) }"
        />
      </UCard>
    </div>

    <ActivityNotesModal
      :activity="notesTarget?.activity ?? null"
      :charge="notesTarget?.charge ?? null"
      @close="notesTarget = null"
    />

    <CreateSubtasksModal
      :open="subtasksTarget !== null"
      :activity-name="subtasksTarget?.activity.name"
      :activity-end-date="formatIsoDate(subtasksTarget?.activity.end_date)"
      :saving="savingSubtasks"
      @close="subtasksTarget = null"
      @create="createSubtasks"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useCalendarListFilters } from '~/composables/calendar/useCalendarListFilters'
import { useModal } from '~/composables/commons/useModal'
import type {
  CalendarEvent,
  CalendarEventCharge,
  CalendarEventPriority,
  CalendarEventStatus,
  CalendarFilters
} from '~/types/calendar'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '~/constants/calendar'
import { formatIsoDate } from '~/utils/calendar/dates'
import CalendarDateRangeButton from '~/components/calendar/CalendarDateRangeButton.vue'
import CalendarMultiSelect from '~/components/calendar/CalendarMultiSelect.vue'
import type { CalendarMultiSelectOption } from '~/components/calendar/CalendarMultiSelect.vue'
import CalendarPaginationBar from '~/components/calendar/CalendarPaginationBar.vue'
import CreateSubtasksModal from '~/components/calendar/CreateSubtasksModal.vue'
import type { NewSubtask } from '~/components/calendar/CreateSubtasksModal.vue'
import ProgressStatsBar from '~/components/calendar/progreso/ProgressStatsBar.vue'
import ProgressActivityRow from '~/components/calendar/progreso/ProgressActivityRow.vue'
import ActivityNotesModal from '~/components/calendar/progreso/ActivityNotesModal.vue'

const {
  visibleActivities,
  eventsPagination,
  myProgressStats,
  globalProgressStats,
  responsables,
  contenedores,
  loading,
  calendarPermissions,
  usaConsolidado,
  isJefeImportaciones,
  currentUserId,
  getEvents,
  updateEventStatus,
  updateChargeStatus,
  updateEventPriority,
  getResponsableColor,
  createSubtask,
  initialize,
  clearFilters
} = useCalendarStore()

const { showSuccess, showError } = useModal()
const route = useRoute()
const router = useRouter()

const { startDate, endDate, responsableIds, contenedorIds, page, perPage, buildFilters } = useCalendarListFilters(25)

// ============================================
// FILTROS
// ============================================

const status = ref<CalendarEventStatus | null>(null)
const priority = ref<CalendarEventPriority | null>(null)
/** Actividad puntual (?event_id=) al venir desde el calendario. */
const eventId = ref<number | null>(null)

const statusItems: { label: string; value: CalendarEventStatus | null }[] = [
  { label: 'Todos', value: null },
  ...STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value }))
]
const priorityItems: { label: string; value: CalendarEventPriority | null }[] = [
  { label: 'Todos', value: null },
  ...PRIORITY_OPTIONS.map(o => ({ label: o.label, value: o.value }))
]

/** Un miembro solo elige entre todas las actividades o las suyas. */
const MINE_ITEMS: { label: string; value: 'todos' | 'yo' }[] = [{ label: 'Todos', value: 'todos' }, { label: 'Yo', value: 'yo' }]
const onlyMine = computed(() => responsableIds.value.length === 1 && responsableIds.value[0] === currentUserId.value)
const setOnlyMine = (mine: boolean) => {
  responsableIds.value = mine ? [currentUserId.value] : []
  applyFilters()
}

const responsableOptions = computed<CalendarMultiSelectOption[]>(() =>
  responsables.value.map(r => ({ label: r.nombre, value: r.id, color: getResponsableColor(r.id, r.nombre) }))
)
const contenedorOptions = computed<CalendarMultiSelectOption[]>(() =>
  contenedores.value.map(c => ({ label: c.nombre, value: c.id }))
)

const applyFilters = async (force = false, resetPage = true) => {
  if (resetPage) page.value = 1
  const filters: CalendarFilters = { ...buildFilters(usaConsolidado.value), has_charges: 1, order_desc: 1 }
  if (status.value) filters.status = status.value
  if (priority.value !== null) filters.priority = priority.value
  if (eventId.value !== null) filters.event_id = eventId.value
  await getEvents(filters, force)
}

const goToPage = (p: number) => {
  page.value = p
  applyFilters(true, false)
}

// ============================================
// TABLA
// ============================================

const columns = computed(() => [
  'Actividad',
  ...(usaConsolidado.value ? ['# Consolidado'] : []),
  'Estado', 'Prioridad', 'Fecha Inicio', 'Fecha Fin', 'Duración', 'Responsables', 'Acciones'
])

const expandedActivityId = ref<number | null>(null)

/** Los cambios se aplican sobre la lista local; no hace falta recargar la tabla. */
const notifyResult = (ok: boolean, what: string) =>
  ok ? showSuccess('Éxito', `${what} actualizado correctamente`) : showError('Error', `No se pudo actualizar ${what.toLowerCase()}`)

const onEventStatus = async (id: number, value: CalendarEventStatus) => notifyResult(await updateEventStatus(id, value), 'Estado')
const onChargeStatus = async (chargeId: number, value: CalendarEventStatus) => notifyResult(await updateChargeStatus(chargeId, value), 'Estado')
const onPriority = async (id: number, value: CalendarEventPriority) => notifyResult(await updateEventPriority(id, value), 'Prioridad')

// ============================================
// NOTAS Y SUBTAREAS
// ============================================

const notesTarget = shallowRef<{ activity: CalendarEvent; charge: CalendarEventCharge | null } | null>(null)
const subtasksTarget = shallowRef<{ activity: CalendarEvent; charge: CalendarEventCharge } | null>(null)
const savingSubtasks = ref(false)

const createSubtasks = async (items: NewSubtask[]) => {
  const target = subtasksTarget.value
  if (!target || items.length === 0) return
  savingSubtasks.value = true
  let created = 0
  try {
    for (const item of items) {
      if (await createSubtask(target.charge.id, { ...item, status: 'PENDIENTE' })) created++
    }
  } finally {
    savingSubtasks.value = false
  }
  const failed = items.length - created
  if (failed === 0) {
    showSuccess('Éxito', `${created} subtarea${created !== 1 ? 's' : ''} creada${created !== 1 ? 's' : ''} correctamente`)
    subtasksTarget.value = null
  } else {
    showError('Error parcial', `${created} creada(s), ${failed} fallida(s)`)
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

/** Corrige URLs mal formadas (?role_group_id=2?event_id=131) que llegaban desde el calendario. */
const normalizeMalformedQuery = async () => {
  const search = window.location.search
  if (!search.includes('?event_id=')) return
  const params = new URLSearchParams(search.replace(/\?event_id=/, '&event_id='))
  await router.replace({ path: route.path, query: Object.fromEntries(params.entries()) })
}

onMounted(async () => {
  await normalizeMalformedQuery()
  await initialize()
  clearFilters()
  if (!isJefeImportaciones.value) responsableIds.value = [currentUserId.value]

  const rawEventId = route.query.event_id
  const parsedEventId = typeof rawEventId === 'string' ? Number(rawEventId) : Number.NaN
  if (!Number.isNaN(parsedEventId)) {
    eventId.value = parsedEventId
    expandedActivityId.value = parsedEventId
  }
  await applyFilters(true)
})

definePageMeta({
  middleware: ['auth']
})
</script>
