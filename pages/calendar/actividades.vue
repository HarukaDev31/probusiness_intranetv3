<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UButton
              icon="i-heroicons-arrow-left"
              variant="ghost"
              size="sm"
              label="Regresar"
              @click="navigateTo('/calendar/config')"
            />
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Registro de actividades</h1>
          </div>
          <UButton
            v-if="calendarPermissions.canCreateActivity"
            icon="i-heroicons-plus"
            label="Nueva actividad"
            color="primary"
            @click="openCreateModal"
          />
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
        <!-- Buscar Fecha -->
        <UPopover>
          <UButton
            icon="i-heroicons-calendar"
            :label="dateFilterLabel"
            variant="outline"
            size="sm"
          />
          <template #content>
            <div class="p-3 flex flex-col gap-3">
              <div class="flex flex-wrap items-start gap-4">
                <div>
                  <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Desde:</label>
                  <UCalendar v-model="filterStartDate" class="w-full" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Hasta:</label>
                  <UCalendar v-model="filterEndDate" class="w-full" :placeholder="endDatePlaceholder" />
                </div>
              </div>
              <div class="flex gap-2">
                <UButton label="Aplicar" color="primary" size="xs" class="flex-1" @click="() => applyFilters()" />
                <UButton label="Limpiar" variant="outline" size="xs" class="flex-1" @click="clearDateFilter" />
              </div>
            </div>
          </template>
        </UPopover>

        <!-- Responsable (múltiple) -->
        <USelectMenu
          v-if="calendarPermissions.canFilterByResponsable"
          v-model="responsableModelValue"
          :items="responsableOptionsMulti"
          value-key="value"
          :placeholder="filterResponsableIds.length ? `${filterResponsableIds.length} seleccionado(s)` : 'Todos'"
          size="sm"
          class="w-48"
          multiple
          :search-input="{ placeholder: 'Buscar...' }"
        >
          <template #item="{ item }">
            <div class="flex items-center gap-2">
              <div
                v-if="(item?.value ?? null) != null && item?.value !== RESPONSABLE_TODOS_VALUE"
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: (item as any)?.color || '#6B7280' }"
              />
              <span class="text-sm">{{ (item as any)?.label }}</span>
            </div>
          </template>
        </USelectMenu>

        <!-- Consolidado (múltiple) -->
        <USelectMenu
          v-model="contenedorModelValue"
          :items="contenedorOptionsMulti"
          value-key="value"
          :placeholder="filterContenedorIds.length ? `${filterContenedorIds.length} seleccionado(s)` : 'Todos'"
          size="sm"
          class="w-48"
          multiple
          :search-input="{ placeholder: 'Buscar...' }"
        />
      </div>
    </div>

    <!-- Tabla -->
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <UCard>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actividad</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"># Consolidado</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Inicio</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Fin</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Duración</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Responsables</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="activity in sortedActivities"
                :key="activity.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {{ activity.name || activity.title }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ activity.contenedor?.nombre || activity.contenedor?.codigo || '-' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(activity.start_date || getFirstDate(activity)) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(activity.end_date || getLastDate(activity)) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ calculateDuration(activity) }} días
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <span
                      v-for="charge in (activity.charges || []).slice(0, 2)"
                      :key="charge.id"
                      class="text-xs px-2 py-1 rounded-full text-white"
                      :style="{ backgroundColor: getResponsableColor(charge.user_id, charge.user?.nombre) }"
                    >
                      {{ charge.user?.nombre?.split(' ')[0] || 'N/A' }}
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
                      @click="openEditModal(activity)"
                    />
                    <UButton
                      v-if="calendarPermissions.canDeleteActivity"
                      icon="i-heroicons-trash"
                      variant="ghost"
                      size="xs"
                      color="error"
                      @click="confirmDelete(activity)"
                    />
                  </div>
                </td>
              </tr>

              <!-- Empty state -->
              <tr v-if="sortedActivities.length === 0 && !loading">
                <td colspan="7" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  No hay actividades registradas
                </td>
              </tr>

              <!-- Loading skeleton -->
              <template v-if="loading">
                <tr v-for="i in 6" :key="i" class="animate-pulse">
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div></td>
                  <td class="px-4 py-3"><div class="flex gap-1"><div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div></div></td>
                  <td class="px-4 py-3 text-right"><div class="flex gap-1 justify-end"><div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div><div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div></div></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <!-- Paginación -->
        <div
          v-if="eventsPagination && eventsPagination.total > 0"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Mostrando
              {{ (eventsPagination.current_page - 1) * eventsPagination.per_page + 1 }}
              -
              {{ Math.min(eventsPagination.current_page * eventsPagination.per_page, eventsPagination.total) }}
              de {{ eventsPagination.total }}
            </span>
            <USelectMenu
              v-model="perPageOption"
              :items="perPageOptions"
              value-attribute="value"
              class="w-28"
            />
          </div>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-heroicons-chevron-left"
              variant="outline"
              size="sm"
              :disabled="eventsPagination.current_page <= 1 || loading"
              @click="goToPage(eventsPagination.current_page - 1)"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Página {{ eventsPagination.current_page }} de {{ eventsPagination.last_page }}
            </span>
            <UButton
              icon="i-heroicons-chevron-right"
              variant="outline"
              size="sm"
              :disabled="eventsPagination.current_page >= eventsPagination.last_page || loading"
              @click="goToPage(eventsPagination.current_page + 1)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CalendarDate, getLocalTimeZone, today, parseDate } from '@internationalized/date'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useOverlay } from '#imports'
import type { CalendarEvent, CreateCalendarEventRequest } from '~/types/calendar'
import { MONTHS_SHORT, countWeekdaysBetween } from '~/constants/calendar'
import ActivityModal from '~/components/calendar/ActivityModal.vue'

const {
  visibleActivities,
  eventsPagination,
  responsables,
  contenedores,
  activityCatalog,
  loading,
  calendarPermissions,
  getEvents,
  createActivity,
  updateActivity,
  deleteActivity,
  getResponsableColor,
  createActivityInCatalog,
  deleteActivityFromCatalog,
  initialize
} = useCalendarStore()

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const overlay = useOverlay()
const activityModal = overlay.create(ActivityModal)
const activityModalOpenKey = ref(0)

// Estado

// Filtros
const filterStartDate = ref<CalendarDate | null>(null)
const filterEndDate = ref<CalendarDate | null>(null)
const filterResponsableIds = ref<number[]>([])
const filterContenedorIds = ref<number[]>([])

/** Mes que muestra el 2.º calendario (Hasta): el mes siguiente al "Desde" o al actual */
const endDatePlaceholder = computed(() => {
  const base = filterStartDate.value ?? today(getLocalTimeZone())
  const nextMonth = base.add({ months: 1 })
  return new CalendarDate(nextMonth.year, nextMonth.month, 1)
})

// Paginación
const page = ref(1)
const perPage = ref(10)
const perPageOptions = [
  { label: '10 por página', value: 10 },
  { label: '25 por página', value: 25 },
  { label: '50 por página', value: 50 },
  { label: '100 por página', value: 100 }
]
const perPageOption = computed({
  get: () => perPageOptions.find(o => o.value === perPage.value) || perPageOptions[0],
  set: (v: { label: string; value: number }) => {
    if (v?.value) {
      perPage.value = v.value
      page.value = 1
      applyFilters(true, false)
    }
  }
})

// Computed
const dateFilterLabel = computed(() => {
  if (filterStartDate.value && filterEndDate.value) {
    return `${filterStartDate.value.day}/${filterStartDate.value.month} - ${filterEndDate.value.day}/${filterEndDate.value.month}`
  }
  return 'Buscar Fecha'
})

const RESPONSABLE_TODOS_VALUE = -1
const CONTENEDOR_TODOS_VALUE = -1

const responsableOptionsMulti = computed(() => {
  const options: { label: string; value: number; color?: string }[] = [
    { label: 'Todos', value: RESPONSABLE_TODOS_VALUE }
  ]
  responsables.value.forEach(r => {
    options.push({
      label: r.nombre,
      value: r.id,
      color: getResponsableColor(r.id, r.nombre)
    })
  })
  return options
})

const responsableModelValue = computed({
  get: () => filterResponsableIds.value.length ? [...filterResponsableIds.value] : [RESPONSABLE_TODOS_VALUE],
  set: (val: unknown) => onResponsableIdsChange(val)
})

const contenedorOptionsMulti = computed(() => {
  const options: { label: string; value: number }[] = [
    { label: 'Todos', value: CONTENEDOR_TODOS_VALUE }
  ]
  contenedores.value.forEach(c => {
    options.push({ label: c.nombre || c.codigo || `#${c.id}`, value: c.id })
  })
  return options
})

const contenedorModelValue = computed({
  get: () => filterContenedorIds.value.length ? [...filterContenedorIds.value] : [CONTENEDOR_TODOS_VALUE],
  set: (val: unknown) => onContenedorIdsChange(val)
})

const onResponsableIdsChange = (val: unknown) => {
  const arr = Array.isArray(val) ? val : val != null ? [val] : []
  const ids = arr
    .map((v: unknown) => (typeof v === 'object' && v && 'value' in v ? (v as { value: number }).value : v))
    .filter((id): id is number => typeof id === 'number')
  const hasTodos = ids.includes(RESPONSABLE_TODOS_VALUE)
  const hadOtherSelected = filterResponsableIds.value.length > 0
  if (hasTodos && (ids.length === 1 || hadOtherSelected)) {
    filterResponsableIds.value = []
  } else {
    filterResponsableIds.value = ids.filter(id => id !== RESPONSABLE_TODOS_VALUE)
  }
  applyFilters()
}

const onContenedorIdsChange = (val: unknown) => {
  const arr = Array.isArray(val) ? val : val != null ? [val] : []
  const ids = arr
    .map((v: unknown) => (typeof v === 'object' && v && 'value' in v ? (v as { value: number }).value : v))
    .filter((id): id is number => typeof id === 'number')
  const hasTodos = ids.includes(CONTENEDOR_TODOS_VALUE)
  const hadOtherSelected = filterContenedorIds.value.length > 0
  if (hasTodos && (ids.length === 1 || hadOtherSelected)) {
    filterContenedorIds.value = []
  } else {
    filterContenedorIds.value = ids.filter(id => id !== CONTENEDOR_TODOS_VALUE)
  }
  applyFilters()
}

/** Actividades ordenadas por fecha de inicio (ascendente: las que empiezan antes primero), como en el backend */
const sortedActivities = computed(() => {
  const list = visibleActivities.value.slice()
  const getStartDate = (activity: CalendarEvent) =>
    activity.start_date || (activity.days?.length ? activity.days.map(d => d.date).sort()[0] : '')
  return list.sort((a, b) => {
    const dateA = getStartDate(a) || '9999-12-31'
    const dateB = getStartDate(b) || '9999-12-31'
    return dateA.localeCompare(dateB) || (a.id ?? 0) - (b.id ?? 0)
  })
})

// Helpers
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const getFirstDate = (activity: CalendarEvent): string => {
  if (activity.days && activity.days.length > 0) {
    return activity.days.sort((a, b) => a.date.localeCompare(b.date))[0].date
  }
  return ''
}

const getLastDate = (activity: CalendarEvent): string => {
  if (activity.days && activity.days.length > 0) {
    return activity.days.sort((a, b) => b.date.localeCompare(a.date))[0].date
  }
  return ''
}

const calculateDuration = (activity: CalendarEvent): number => {
  const start = activity.start_date || getFirstDate(activity)
  const end = activity.end_date || getLastDate(activity)
  if (!start || !end) return 1
  return countWeekdaysBetween(start, end) || 1
}

// Helper para extraer valor de un select (puede venir como objeto o primitivo)
const extractValue = (val: any): any => {
  if (val === null || val === undefined) return null
  if (typeof val === 'object' && 'value' in val) return val.value
  return val
}

// Acciones
const applyFilters = async (force = false, resetPage = true) => {
  if (resetPage) page.value = 1
  const filters: any = {
    page: page.value,
    per_page: perPage.value
  }
  if (filterStartDate.value) {
    filters.start_date = `${filterStartDate.value.year}-${String(filterStartDate.value.month).padStart(2, '0')}-${String(filterStartDate.value.day).padStart(2, '0')}`
  }
  if (filterEndDate.value) {
    filters.end_date = `${filterEndDate.value.year}-${String(filterEndDate.value.month).padStart(2, '0')}-${String(filterEndDate.value.day).padStart(2, '0')}`
  }
  if (filterResponsableIds.value.length > 0) {
    filters.responsable_ids = filterResponsableIds.value
  }
  if (filterContenedorIds.value.length > 0) {
    filters.contenedor_ids = filterContenedorIds.value
  }
  await getEvents(filters, force)
}

const goToPage = (p: number) => {
  if (p < 1) return
  const meta = eventsPagination.value
  if (meta && p > meta.last_page) return
  page.value = p
  applyFilters(true, false)
}

const clearDateFilter = () => {
  filterStartDate.value = null
  filterEndDate.value = null
  filterResponsableIds.value = []
  filterContenedorIds.value = []
  applyFilters()
}

const openCreateModal = () => {
  const todayDate = today(getLocalTimeZone())
  const dateStr = `${todayDate.year}-${String(todayDate.month).padStart(2, '0')}-${String(todayDate.day).padStart(2, '0')}`
  activityModalOpenKey.value++
  activityModal.open({
    openKey: activityModalOpenKey.value,
    event: null,
    responsables: responsables.value,
    contenedores: contenedores.value,
    calendarPermissions: calendarPermissions.value,
    getResponsableColor: getResponsableColor,
    actividadesPredefinidas: activityCatalog.value,
    initialDate: dateStr,
    onSave: async (data: CreateCalendarEventRequest) => {
      await handleSaveActivityOverlay(data)
    },
    onCreateActivity: async (name: string) => {
      return await handleCreateActivityInCatalog(name)
    },
    onDeleteFromCatalog: onDeleteFromCatalogOverlay,
    onClose: () => activityModal.close()
  })
}

const openEditModal = (activity: CalendarEvent) => {
  if (!calendarPermissions.value.canEditActivity) {
    showError('Sin permisos', 'No tienes permisos para editar actividades.')
    return
  }
  activityModalOpenKey.value++
  activityModal.open({
    openKey: activityModalOpenKey.value,
    event: activity,
    responsables: responsables.value,
    contenedores: contenedores.value,
    calendarPermissions: calendarPermissions.value,
    getResponsableColor: getResponsableColor,
    actividadesPredefinidas: activityCatalog.value,
    onSave: async (data: CreateCalendarEventRequest) => {
      await handleUpdateActivityOverlay({ ...data, id: activity.id })
    },
    onCreateActivity: async (name: string) => {
      return await handleCreateActivityInCatalog(name)
    },
    onDeleteFromCatalog: onDeleteFromCatalogOverlay,
    onDelete: async () => {
      activityModal.close()
      confirmDelete(activity)
    },
    onClose: () => activityModal.close()
  })
}

const handleSaveActivityOverlay = async (data: CreateCalendarEventRequest) => {
  try {
    const result = await createActivity(data)
    if (result) {
      showSuccess('Éxito', 'Actividad creada correctamente')
      activityModal.close()
      await applyFilters(true)
    } else {
      showError('Error', 'No se pudo crear la actividad')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudo guardar la actividad')
  }
}

const handleUpdateActivityOverlay = async (data: CreateCalendarEventRequest & { id: number }) => {
  try {
    const result = await updateActivity(data)
    if (result) {
      showSuccess('Éxito', 'Actividad actualizada correctamente')
      activityModal.close()
      await applyFilters(true)
    } else {
      showError('Error', 'No se pudo actualizar la actividad')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudo guardar la actividad')
  }
}

const onDeleteFromCatalogOverlay = async (catalogActivityId: number) => {
  try {
    const success = await deleteActivityFromCatalog(catalogActivityId)
    if (success) {
      showSuccess('Éxito', 'La actividad se ha eliminado del catálogo.')
      activityModal.patch({
        actividadesPredefinidas: activityCatalog.value
      })
    } else {
      showError('Error', 'No se pudo eliminar del catálogo (puede estar en uso).')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudo eliminar del catálogo.')
  }
}

const handleCreateActivityInCatalog = async (name: string) => {
  try {
    const result = await createActivityInCatalog(name)
    if (result) {
      showSuccess('Éxito', `Actividad "${name}" agregada al catálogo`)
      return result
    }
    return null
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudo crear la actividad en el catálogo')
    return null
  }
}

const confirmDelete = (activity: CalendarEvent) => {
  const name = activity.name || activity.title || 'esta actividad'
  showConfirmation(
    'Confirmar eliminación',
    `¿Estás seguro de que deseas eliminar la actividad "${name}"?`,
    async () => {
      await withSpinner(async () => {
        const success = await deleteActivity(activity.id)
        if (success) {
          showSuccess('Éxito', 'Actividad eliminada correctamente')
          await applyFilters(true)
        } else {
          showError('Error', 'No se pudo eliminar la actividad')
        }
      }, 'Eliminando actividad...')
    }
  )
}

// Inicialización
onMounted(async () => {
  await initialize()
  await applyFilters()
})

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>
