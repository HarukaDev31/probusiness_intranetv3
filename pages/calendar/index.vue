<template>
  <div class="flex flex-col h-full min-h-0 bg-white dark:bg-gray-900">
    <div class="flex items-center min-h-[72px] py-5 gap-3 flex-nowrap border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:px-5 shrink-0">
      <CalendarFilters
        v-if="isCoordinacionOrDocumentacion"
        :responsables="responsablesForFilter"
        :contenedores="contenedores"
        :usa-consolidado="usaConsolidado"
        :can-filter-by-responsable="calendarPermissions.canFilterByResponsable"
        :current-user-id="currentUserId"
        :filters="filters"
        :get-responsable-color="getResponsableColor"
        :disabled="!hasLoadedInitially"
        @filter-change="onFilterChange"
      />
      <CalendarHeaderActions
        :role-groups="myRoleGroups"
        :selected-role-group-id="currentRoleGroupId"
        :can-access-config="isCoordinacionOrDocumentacion && calendarPermissions.canAccessConfig"
        :can-create="isJefeImportaciones"
        :disabled="!hasLoadedInitially"
        @change-role-group="onRoleGroupChange"
        @open-progress="navigateTo(getCalendarRoute('/calendar/progreso'))"
        @open-config="navigateTo(getCalendarRoute('/calendar/config'))"
        @create="activityModal.open({ initialDate: toIsoDate(currentDate) })"
      />
    </div>

    <div class="flex-1 min-h-0 overflow-auto relative px-4 md:px-6 lg:px-8 py-4 w-9/10 mx-auto">
      <div v-if="error && !loading" class="text-center py-12">
        <p class="text-red-500">{{ error }}</p>
        <UButton label="Reintentar" class="mt-4" @click="loadEvents(true)" />
      </div>

      <div class="h-full bg-white dark:bg-gray-800 relative">
        <div v-if="loading" class="absolute inset-0 z-20 bg-white dark:bg-gray-900">
          <CalendarSkeleton />
        </div>
        <Transition name="slide-fade" mode="out-in">
          <div v-show="!loading" :key="months.map(m => m.key).join('|')" class="pb-4">
            <CalendarMonthGrid
              v-for="(month, index) in months"
              :key="month.key"
              :class="index > 0 ? 'mt-8' : ''"
              :month="month"
              :show-consolidado="usaConsolidado"
              :can-reorder="isJefeImportaciones"
              :dragging-event="draggingEvent"
              :drag-over-event-id="dragOverEventId"
              :reordering-date="reorderingDate"
              :get-event-colors="getEventColors"
              :get-responsable-color="getResponsableColor"
              @day-click="onDayClick"
              @event-click="onEventClick"
              @drag-start="onDragStart"
              @drag-enter="onDragEnter"
              @drop="onDrop"
              @drag-end="resetDrag"
            />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useActivityModal } from '~/composables/calendar/useActivityModal'
import { useModal } from '~/composables/commons/useModal'
import type { CalendarEvent, IsoDate } from '~/types/calendar'
import { buildCalendarMonth } from '~/utils/calendar/monthLayout'
import type { CalendarDayCell, CalendarMonth } from '~/utils/calendar/monthLayout'
import { monthRange, monthsBetween, parseIsoDate, toIsoDate } from '~/utils/calendar/dates'
import CalendarFilters from '~/components/calendar/CalendarFilters.vue'
import type { CalendarFilterChange } from '~/components/calendar/CalendarFilters.vue'
import CalendarHeaderActions from '~/components/calendar/CalendarHeaderActions.vue'
import CalendarSkeleton from '~/components/calendar/CalendarSkeleton.vue'
import CalendarMonthGrid from '~/components/calendar/month/CalendarMonthGrid.vue'

const {
  visibleEvents,
  responsables,
  contenedores,
  loading,
  error,
  filters,
  calendarPermissions,
  isJefeImportaciones,
  isCoordinacionOrDocumentacion,
  usaConsolidado,
  currentUserId,
  currentRoleGroupId,
  myRoleGroups,
  getEvents,
  getEventColors,
  getResponsableColor,
  reorderEvents,
  setFilters,
  clearFilters,
  initialize,
  refresh,
  getCalendarRoute
} = useCalendarStore()

const { showError } = useModal()
const route = useRoute()
const router = useRouter()

const activityModal = useActivityModal(() => loadEvents(true))

const hasLoadedInitially = ref(false)

// ============================================
// MES VISIBLE
// ============================================

const queryNumber = (key: string): number | null => {
  const raw = route.query[key]
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN
  return Number.isNaN(n) ? null : n
}

/** Mes de ?year=&month= o el día de hoy. */
const dateFromRoute = (): CalendarDate => {
  const year = queryNumber('year')
  const month = queryNumber('month')
  if (year && month && month >= 1 && month <= 12) return new CalendarDate(year, month, 1)
  return today(getLocalTimeZone())
}

const currentDate = shallowRef<CalendarDate>(dateFromRoute())
const todayIso = toIsoDate(today(getLocalTimeZone()))

/** Un mes, o dos si el filtro de fechas abarca exactamente dos meses consecutivos. */
const months = computed<CalendarMonth[]>(() => {
  const { year, month } = currentDate.value
  const list = [buildCalendarMonth(year, month, visibleEvents.value, todayIso)]
  const { start_date: start, end_date: end } = filters.value
  if (start && end && monthsBetween(start, end) === 1) {
    const next = new CalendarDate(year, month, 1).add({ months: 1 })
    list.push(buildCalendarMonth(next.year, next.month, visibleEvents.value, todayIso))
  }
  return list
})

const updateUrl = () => {
  router.replace({
    path: '/calendar',
    query: {
      ...route.query,
      year: String(currentDate.value.year),
      month: String(currentDate.value.month),
      view: 'month',
      ...(currentRoleGroupId.value != null ? { role_group_id: String(currentRoleGroupId.value) } : {})
    }
  })
}

/** Carga el rango del filtro de fechas o, si no hay, el mes visible. */
const loadEvents = async (force = false) => {
  const { start_date, end_date } = filters.value
  if (start_date && end_date) {
    await getEvents({}, force)
    return
  }
  const range = monthRange(currentDate.value.year, currentDate.value.month)
  await getEvents({ start_date: range.start, end_date: range.end }, force)
}

// ============================================
// FILTROS Y GRUPO
// ============================================

/** El jefe filtra por todo el equipo; un miembro solo puede elegirse a sí mismo. */
const responsablesForFilter = computed(() =>
  isJefeImportaciones.value ? responsables.value : responsables.value.filter(r => r.id === currentUserId.value)
)

const onFilterChange = async (change: CalendarFilterChange) => {
  setFilters({
    responsable_id: change.responsable_id,
    responsable_ids: change.responsable_ids,
    contenedor_ids: change.contenedor_ids,
    start_date: change.start_date,
    end_date: change.end_date
  })
  const start = parseIsoDate(change.start_date)
  if (start && change.end_date) {
    currentDate.value = new CalendarDate(start.year, start.month, 1)
    updateUrl()
  }
  await loadEvents(true)
}

const onRoleGroupChange = async (roleGroupId: number) => {
  await router.push({ path: route.path, query: { ...route.query, role_group_id: String(roleGroupId) } })
  await refresh({ reloadEvents: false })
  // El jefe ve a todo el equipo del grupo nuevo
  if (isJefeImportaciones.value) clearFilters()
  applyMemberDefaults()
  await loadEvents(true)
}

/** Un miembro ve por defecto solo sus actividades del mes visible. */
const applyMemberDefaults = () => {
  if (isJefeImportaciones.value) return
  const { responsable_id, responsable_ids, start_date, end_date } = filters.value
  if (responsable_id == null && !responsable_ids?.length && currentUserId.value) {
    setFilters({ responsable_id: currentUserId.value })
  }
  if (!start_date || !end_date) {
    const range = monthRange(currentDate.value.year, currentDate.value.month)
    setFilters({ start_date: range.start, end_date: range.end })
  }
}

// ============================================
// CLICS EN LA GRILLA
// ============================================

const progressRoute = (eventId?: number) => {
  const base = getCalendarRoute('/calendar/progreso')
  return eventId == null ? base : `${base}${base.includes('?') ? '&' : '?'}event_id=${eventId}`
}

/** Quien no puede editar va a la tabla de progreso. */
const onDayClick = (cell: CalendarDayCell) => {
  if (cell.isWeekend) return
  if (!calendarPermissions.value.canEditActivity) {
    navigateTo(progressRoute())
    return
  }
  activityModal.open({ initialDate: cell.dateStr })
}

const onEventClick = (event: CalendarEvent) => {
  if (!calendarPermissions.value.canEditActivity) {
    navigateTo(progressRoute(event.id))
    return
  }
  activityModal.open({ event })
}

// ============================================
// ORDEN MANUAL (DRAG & DROP, SOLO JEFE)
// ============================================

const draggingEvent = shallowRef<CalendarEvent | null>(null)
const dragOverEventId = ref<number | null>(null)
const reorderingDate = ref<IsoDate | null>(null)

const resetDrag = () => {
  draggingEvent.value = null
  dragOverEventId.value = null
}

const onDragStart = (event: CalendarEvent) => {
  if (isJefeImportaciones.value) draggingEvent.value = event
}

const onDragEnter = (event: CalendarEvent) => {
  if (!draggingEvent.value) return
  dragOverEventId.value = draggingEvent.value.id === event.id ? null : event.id
}

/** Mueve el evento arrastrado a la posición del evento destino y guarda el orden. */
const onDrop = async (target: CalendarEvent) => {
  const source = draggingEvent.value
  resetDrag()
  if (!isJefeImportaciones.value || !source || source.id === target.id) return
  const ids = visibleEvents.value.map(e => e.id)
  const from = ids.indexOf(source.id)
  const to = ids.indexOf(target.id)
  if (from === -1 || to === -1) return
  ids.splice(from, 1)
  ids.splice(to, 0, source.id)
  reorderingDate.value = target.start_date
  const ok = await reorderEvents(ids)
  reorderingDate.value = null
  if (!ok) showError('Error', 'No se pudo guardar el nuevo orden.')
}

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  await initialize()
  // Si la URL pide otro grupo que el cargado, recargar con ese grupo
  const requestedGroup = queryNumber('role_group_id')
  if (requestedGroup != null && requestedGroup !== currentRoleGroupId.value) await refresh({ reloadEvents: false })
  applyMemberDefaults()
  await loadEvents()
  hasLoadedInitially.value = true
  updateUrl()
})

// Navegación atrás/adelante entre meses por URL
watch(() => [route.query.year, route.query.month], () => {
  if (!hasLoadedInitially.value) return
  const next = dateFromRoute()
  if (next.year === currentDate.value.year && next.month === currentDate.value.month) return
  currentDate.value = next
  loadEvents()
})

definePageMeta({
  middleware: ['auth']
})
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}
</style>
