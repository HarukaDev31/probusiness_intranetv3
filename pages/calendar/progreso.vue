<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center gap-4">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="sm"
          label="Regresar"
          @click="navigateTo('/calendar')"
        />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">TABLA DE PROGRESO</h1>
      </div>
    </div>

    <!-- Mi Progreso (solo para no-Jefes) -->
    <div v-if="!isJefeImportaciones" class="max-w-7xl mx-auto px-4 md:px-6 py-4">
      <div class="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-success-600" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Mi progreso</span>
        <div class="flex items-center gap-6 ml-4">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <span class="text-xs text-gray-500 dark:text-gray-400">Total</span>
            <span class="text-lg font-bold text-gray-900 dark:text-white">{{ myProgress.total }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
            <span class="text-xs text-success-600 dark:text-success-400">Completadas</span>
            <span class="text-lg font-bold text-success-700 dark:text-success-400">{{ myProgress.completadas }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <span class="text-xs text-orange-600 dark:text-orange-400">Progresos</span>
            <span class="text-lg font-bold text-orange-700 dark:text-orange-400">{{ myProgress.enProgreso }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
            <span class="text-xs text-warning-600 dark:text-warning-400">Pendientes</span>
            <span class="text-lg font-bold text-warning-700 dark:text-warning-400">{{ myProgress.pendientes }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y Tabla -->
    <div class="max-w-7xl mx-auto px-4 md:px-6 pb-6">
      <UCard>
        <!-- Filtros -->
        <div class="flex flex-wrap items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <!-- Buscar Fecha -->
          <UPopover>
            <UButton
              icon="i-heroicons-calendar"
              :label="dateFilterLabel"
              variant="outline"
              size="sm"
            />
            <template #content>
              <div class="p-3 space-y-3 w-64">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">Desde:</label>
                  <UCalendar v-model="filterStartDate" class="w-full" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">Hasta:</label>
                  <UCalendar v-model="filterEndDate" class="w-full" />
                </div>
                <div class="flex gap-2">
                  <UButton label="Aplicar" color="primary" size="xs" class="flex-1" @click="applyFilters" />
                  <UButton label="Limpiar" variant="outline" size="xs" class="flex-1" @click="clearDateFilter" />
                </div>
              </div>
            </template>
          </UPopover>

          <!-- Estado -->
          <USelectMenu
            v-model="filterStatus"
            :items="statusOptions"
            value-attribute="value"
            placeholder="Estado"
            size="sm"
            class="w-36"
            @update:model-value="applyFilters"
          />

          <!-- Prioridad -->
          <USelectMenu
            v-model="filterPriority"
            :items="priorityOptions"
            value-attribute="value"
            placeholder="Prioridad"
            size="sm"
            class="w-36"
            @update:model-value="applyFilters"
          />

          <!-- Responsable -->
          <USelectMenu
            v-if="calendarPermissions.canFilterByResponsable"
            v-model="filterResponsable"
            :items="responsableOptions"
            value-attribute="value"
            placeholder="Responsable"
            size="sm"
            class="w-40"
            @update:model-value="applyFilters"
          />

          <!-- Consolidado (múltiple) -->
          <USelectMenu
            :model-value="selectedContenedorOptions"
            :items="contenedorOptionsMulti"
            value-attribute="value"
            :placeholder="filterContenedorIds.length ? `${filterContenedorIds.length} seleccionado(s)` : 'Consolidado(s)'"
            size="sm"
            class="w-48 min-w-0"
            multiple
            searchable
            searchable-placeholder="Buscar..."
            @update:model-value="onContenedorIdsChange"
          />
        </div>

        <!-- Tabla -->
        <div class="overflow-x-auto pt-4">
          <table class="w-full min-w-[1200px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actividad</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Prioridad</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Consolidado</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Duración</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">F. Inicio</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">F. Fin</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Responsables</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Notas</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="activity in visibleActivities"
                :key="activity.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <!-- Actividad -->
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                  {{ activity.name || activity.title }}
                </td>

                <!-- Estado -->
                <td class="px-4 py-3">
                  <StatusDropdown
                    :activity="activity"
                    :can-edit="canEditStatus(activity)"
                    :current-user-id="currentUserId"
                    :is-jefe="isJefeImportaciones"
                    @update="(chargeId, status) => handleStatusUpdate(chargeId, status)"
                  />
                </td>

                <!-- Prioridad -->
                <td class="px-4 py-3">
                  <PriorityDropdown
                    :priority="activity.priority"
                    :can-edit="calendarPermissions.canEditPriority"
                    @update="(priority) => handlePriorityUpdate(activity.id, priority)"
                  />
                </td>

                <!-- Consolidado -->
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ activity.contenedor?.nombre || activity.contenedor?.codigo || '-' }}
                </td>

                <!-- Duración -->
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ calculateDuration(activity) }} days
                </td>

                <!-- F. Inicio -->
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(activity.start_date || getFirstDate(activity)) }}
                </td>

                <!-- F. Fin -->
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(activity.end_date || getLastDate(activity)) }}
                </td>

                <!-- Responsables -->
                <td class="px-4 py-3">
                  <div class="flex items-center -space-x-2">
                    <UTooltip
                      v-for="charge in (activity.charges || []).slice(0, 3)"
                      :key="charge.id"
                      :text="charge.user?.nombre || 'N/A'"
                    >
                      <UAvatar
                        :alt="charge.user?.nombre || 'U'"
                        size="sm"
                        class="ring-2 ring-white dark:ring-gray-800"
                        :src="charge.user?.avatar"
                        :style="{
                          backgroundColor: getResponsableColor(charge.user_id, charge.user?.nombre),
                          color: '#fff'
                        }"
                      />
                    </UTooltip>
                  </div>
                </td>

                <!-- Notas: jefe ve/edita notas de la actividad; no-jefe ve/edita solo sus notas (charge) -->
                <td class="px-4 py-3">
                  <div class="max-w-xs">
                    <template v-if="isJefeImportaciones">
                      <p
                        v-if="activity.notes"
                        class="text-sm text-gray-600 dark:text-gray-400 truncate cursor-pointer hover:text-primary-600"
                        @click="openNotesModal(activity)"
                      >
                        {{ activity.notes }}
                      </p>
                      <UButton
                        v-else
                        icon="i-heroicons-plus"
                        variant="ghost"
                        size="xs"
                        color="neutral"
                        @click="openNotesModal(activity)"
                      />
                    </template>
                    <template v-else>
                      <template v-if="getMyCharge(activity)">
                        <p
                          v-if="getMyCharge(activity)?.notes"
                          class="text-sm text-gray-600 dark:text-gray-400 truncate cursor-pointer hover:text-primary-600"
                          @click="openNotesModal(activity, getMyCharge(activity))"
                        >
                          {{ getMyCharge(activity)?.notes }}
                        </p>
                        <UButton
                          v-else
                          icon="i-heroicons-plus"
                          variant="ghost"
                          size="xs"
                          color="neutral"
                          @click="openNotesModal(activity, getMyCharge(activity))"
                        />
                      </template>
                      <span v-else class="text-sm text-gray-400 dark:text-gray-500">—</span>
                    </template>
                  </div>
                </td>

                <!-- Acciones -->
                <td class="px-4 py-3 text-center">
                  <UTooltip text="Ver tracking">
                    <UButton
                      icon="i-heroicons-clipboard-document-list"
                      variant="ghost"
                      size="xs"
                      color="primary"
                      @click="openTrackingModal(activity)"
                    />
                  </UTooltip>
                </td>
              </tr>

              <!-- Empty state -->
              <tr v-if="visibleActivities.length === 0 && !loading">
                <td colspan="10" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  No hay actividades registradas
                </td>
              </tr>

              <!-- Loading skeleton -->
              <template v-if="loading">
                <tr v-for="i in 6" :key="i" class="animate-pulse">
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div></td>
                  <td class="px-4 py-3"><div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                  <td class="px-4 py-3"><div class="flex gap-1"><div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div><div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div></td>
                  <td class="px-4 py-3 text-center"><div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Modal de Notas (jefe: notas de la actividad; no-jefe: mis notas del charge) -->
    <UModal :open="isNotesModalOpen" @close="closeNotesModal" class="w-full max-w-md">
      <template #header>
        <h3 class="text-lg font-semibold">{{ selectedCharge ? 'Mis notas' : 'Notas de la actividad' }}</h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p class="text-sm text-gray-500">Actividad:</p>
            <p class="font-medium">{{ selectedActivity?.name || selectedActivity?.title }}</p>
          </div>

          <UFormField :label="selectedCharge ? 'Mis notas' : 'Notas'">
            <UTextarea
              v-model="notesText"
              placeholder="Agregar notas..."
              :rows="4"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-between w-full">
          <UButton
            v-if="(selectedCharge ? selectedCharge.notes : selectedActivity?.notes)"
            label="Borrar"
            color="error"
            variant="ghost"
            @click="deleteNotes"
          />
          <div class="flex gap-2 ml-auto">
            <UButton label="Cancelar" variant="ghost" @click="closeNotesModal" />
            <UButton label="Guardar" color="primary" :loading="savingNotes" @click="saveNotes" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal de Tracking -->
    <ActivityTrackingModal
      :open="isTrackingModalOpen"
      :activity="trackingActivity"
      :current-user-id="currentUserId"
      :is-jefe="isJefeImportaciones"
      :get-responsable-color="getResponsableColor"
      @close="closeTrackingModal"
      @update-status="handleTrackingStatusUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CalendarDate, getLocalTimeZone, today, parseDate } from '@internationalized/date'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import type { CalendarEvent, CalendarEventCharge, CalendarEventStatus, CalendarEventPriority } from '~/types/calendar'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, countWeekdaysBetween } from '~/constants/calendar'
import StatusDropdown from '~/components/calendar/StatusDropdown.vue'
import PriorityDropdown from '~/components/calendar/PriorityDropdown.vue'
import ActivityTrackingModal from '~/components/calendar/ActivityTrackingModal.vue'

const {
  visibleActivities,
  responsables,
  contenedores,
  loading,
  calendarPermissions,
  isJefeImportaciones,
  currentUserId,
  getEvents,
  updateChargeStatus,
  updateEventPriority,
  updateEventNotes,
  updateChargeNotes,
  getResponsableColor,
  initialize
} = useCalendarStore()

const { showSuccess, showError } = useModal()

// Estado de filtros
const filterStartDate = ref<CalendarDate | null>(null)
const filterEndDate = ref<CalendarDate | null>(null)
const filterStatus = ref<CalendarEventStatus | null>(null)
const filterPriority = ref<CalendarEventPriority | null>(null)
const filterResponsable = ref<number | null>(null)
const filterContenedorIds = ref<number[]>([])

// Estado de notas (para no-jefe se edita el charge del usuario; para jefe las notas de la actividad)
const isNotesModalOpen = ref(false)
const selectedActivity = ref<CalendarEvent | null>(null)
const selectedCharge = ref<CalendarEventCharge | null>(null)
const notesText = ref('')
const savingNotes = ref(false)

// Estado de tracking modal
const isTrackingModalOpen = ref(false)
const trackingActivity = ref<CalendarEvent | null>(null)

// Computed
const dateFilterLabel = computed(() => {
  if (filterStartDate.value && filterEndDate.value) {
    return `${filterStartDate.value.day}/${filterStartDate.value.month} - ${filterEndDate.value.day}/${filterEndDate.value.month}`
  }
  return 'Buscar Fecha'
})

// Mi progreso (para usuarios no-Jefe)
const myProgress = computed(() => {
  const userId = Number(currentUserId.value)
  let total = 0
  let completadas = 0
  let enProgreso = 0
  let pendientes = 0

  visibleActivities.value.forEach(activity => {
    const myCharge = activity.charges?.find(c => c.user_id === userId)
    if (myCharge) {
      total++
      const status = myCharge.status || 'PENDIENTE'
      if (status === 'COMPLETADO') completadas++
      else if (status === 'PROGRESO') enProgreso++
      else pendientes++
    }
  })

  return { total, completadas, enProgreso, pendientes }
})

const statusOptions = computed(() => {
  const options: any[] = [{ label: 'Todos', value: null }]
  STATUS_OPTIONS.forEach(s => {
    options.push({ label: s.label, value: s.value })
  })
  return options
})

const priorityOptions = computed(() => {
  const options: any[] = [{ label: 'Todos', value: null }]
  PRIORITY_OPTIONS.forEach(p => {
    options.push({ label: p.label, value: p.value })
  })
  return options
})

const responsableOptions = computed(() => {
  const options: any[] = [{ label: 'Todos', value: null }]
  responsables.value.forEach(r => {
    options.push({ label: r.nombre, value: r.id })
  })
  return options
})

const contenedorOptions = computed(() => {
  const options: any[] = [{ label: 'Todos', value: null }]
  contenedores.value.forEach(c => {
    options.push({ label: c.nombre || c.codigo || `#${c.id}`, value: c.id })
  })
  return options
})

const contenedorOptionsMulti = computed(() => {
  return contenedores.value.map(c => ({
    label: c.nombre || c.codigo || `#${c.id}`,
    value: c.id
  }))
})

const selectedContenedorOptions = computed(() => {
  const ids = filterContenedorIds.value
  if (ids.length === 0) return []
  return contenedorOptionsMulti.value.filter(opt => ids.includes(opt.value))
})

const onContenedorIdsChange = (val: unknown) => {
  const arr = Array.isArray(val) ? val : []
  filterContenedorIds.value = arr.map((v: any) => typeof v === 'object' && v && 'value' in v ? v.value : v).filter((id): id is number => typeof id === 'number')
  applyFilters()
}

// Helpers
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-'
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

const canEditStatus = (activity: CalendarEvent): boolean => {
  if (calendarPermissions.value.canEditAnyStatus) {
    return true
  }
  return activity.charges?.some(c => c.user_id === Number(currentUserId.value)) || false
}

const getMyCharge = (activity: CalendarEvent): CalendarEventCharge | undefined => {
  return activity.charges?.find(c => c.user_id === Number(currentUserId.value))
}

// Helper para extraer valor de un select (puede venir como objeto o primitivo)
const extractValue = (val: any): any => {
  if (val === null || val === undefined) return null
  if (typeof val === 'object' && 'value' in val) return val.value
  return val
}

// Acciones
const applyFilters = async () => {
  const filters: any = {}
  if (filterStartDate.value) {
    filters.start_date = `${filterStartDate.value.year}-${String(filterStartDate.value.month).padStart(2, '0')}-${String(filterStartDate.value.day).padStart(2, '0')}`
  }
  if (filterEndDate.value) {
    filters.end_date = `${filterEndDate.value.year}-${String(filterEndDate.value.month).padStart(2, '0')}-${String(filterEndDate.value.day).padStart(2, '0')}`
  }
  
  const statusVal = extractValue(filterStatus.value)
  if (statusVal) {
    filters.status = statusVal
  }
  
  const priorityVal = extractValue(filterPriority.value)
  if (priorityVal !== null && priorityVal !== undefined) {
    filters.priority = priorityVal
  }
  
  const responsableVal = extractValue(filterResponsable.value)
  if (responsableVal) {
    filters.responsable_id = responsableVal
  }
  
  if (filterContenedorIds.value.length > 0) {
    filters.contenedor_ids = filterContenedorIds.value
  }

  await getEvents(filters)
}

const clearDateFilter = () => {
  filterStartDate.value = null
  filterEndDate.value = null
  applyFilters()
}

const handleStatusUpdate = async (chargeId: number, status: CalendarEventStatus) => {
  const success = await updateChargeStatus(chargeId, status)
  if (success) {
    showSuccess('Éxito', 'Estado actualizado correctamente')
    await applyFilters()
  } else {
    showError('Error', 'No se pudo actualizar el estado')
  }
}

const handlePriorityUpdate = async (activityId: number, priority: CalendarEventPriority) => {
  const success = await updateEventPriority(activityId, priority)
  if (success) {
    showSuccess('Éxito', 'Prioridad actualizada correctamente')
    await applyFilters()
  } else {
    showError('Error', 'No se pudo actualizar la prioridad')
  }
}

// Notas (charge = notas del responsable actual; sin charge = notas de la actividad, jefe)
const openNotesModal = (activity: CalendarEvent, charge?: CalendarEventCharge) => {
  selectedActivity.value = activity
  selectedCharge.value = charge ?? null
  if (charge) {
    notesText.value = charge.notes || ''
  } else {
    notesText.value = activity.notes || ''
  }
  isNotesModalOpen.value = true
}

const closeNotesModal = () => {
  isNotesModalOpen.value = false
  selectedActivity.value = null
  selectedCharge.value = null
  notesText.value = ''
}

const saveNotes = async () => {
  if (!selectedActivity.value) return
  savingNotes.value = true
  try {
    let success: boolean
    if (selectedCharge.value) {
      success = await updateChargeNotes(selectedCharge.value.id, notesText.value)
    } else {
      success = await updateEventNotes(selectedActivity.value.id, notesText.value)
    }
    if (success) {
      showSuccess('Éxito', 'Notas guardadas correctamente')
      closeNotesModal()
      await applyFilters()
    } else {
      showError('Error', 'No se pudieron guardar las notas')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudieron guardar las notas')
  } finally {
    savingNotes.value = false
  }
}

const deleteNotes = async () => {
  notesText.value = ''
  await saveNotes()
}

// Tracking Modal
const openTrackingModal = (activity: CalendarEvent) => {
  trackingActivity.value = activity
  isTrackingModalOpen.value = true
}

const closeTrackingModal = () => {
  isTrackingModalOpen.value = false
  trackingActivity.value = null
}

const handleTrackingStatusUpdate = async (chargeId: number, status: CalendarEventStatus) => {
  const success = await updateChargeStatus(chargeId, status)
  if (success) {
    showSuccess('Éxito', 'Estado actualizado correctamente')
    await applyFilters()
  } else {
    showError('Error', 'No se pudo actualizar el estado')
  }
}


// Inicialización
onMounted(async () => {
  await initialize()
  await getEvents()
})

definePageMeta({
  middleware: ['auth']
})
</script>
