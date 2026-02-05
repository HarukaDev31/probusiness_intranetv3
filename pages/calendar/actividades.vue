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

        <!-- Buscar responsable -->
        <USelectMenu
          v-if="calendarPermissions.canFilterByResponsable"
          v-model="filterResponsable"
          :items="responsableOptions"
          value-attribute="value"
          placeholder="Buscar responsable"
          size="sm"
          class="w-48"
          @update:model-value="applyFilters"
        />

        <!-- Buscar consolidado -->
        <USelectMenu
          v-model="filterContenedor"
          :items="contenedorOptions"
          value-attribute="value"
          placeholder="Buscar consolidado"
          size="sm"
          class="w-48"
          @update:model-value="applyFilters"
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
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">F. inicio</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">F. fin</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Consolidado</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Duración</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Responsables</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="activity in visibleActivities"
                :key="activity.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {{ activity.name || activity.title }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(activity.start_date || getFirstDate(activity)) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(activity.end_date || getLastDate(activity)) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ activity.contenedor?.nombre || activity.contenedor?.codigo || '-' }}
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
              <tr v-if="visibleActivities.length === 0 && !loading">
                <td colspan="7" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  No hay actividades registradas
                </td>
              </tr>

              <!-- Loading skeleton -->
              <template v-if="loading">
                <tr v-for="i in 6" :key="i" class="animate-pulse">
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div></td>
                  <td class="px-4 py-3"><div class="flex gap-1"><div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div></div></td>
                  <td class="px-4 py-3 text-right"><div class="flex gap-1 justify-end"><div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div><div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div></div></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Modal Nueva/Editar Actividad -->
    <ActivityModal
      v-if="isModalOpen"
      :open="isModalOpen"
      :event="editingActivity"
      :responsables="responsables"
      :contenedores="contenedores"
      :calendar-permissions="calendarPermissions"
      :get-responsable-color="getResponsableColor"
      :actividades-predefinidas="activityCatalog"
      :loading="saving"
      :initial-date="initialDate"
      :on-create-activity="handleCreateActivityInCatalog"
      @save="handleSaveActivity"
      @delete="handleDeleteFromModal"
      @close="closeModal"
    />

    <!-- Modal Confirmar Eliminación -->
    <UModal :open="isDeleteModalOpen" @close="isDeleteModalOpen = false">
      <template #header>
        <h3 class="text-lg font-semibold">Confirmar eliminación</h3>
      </template>
      <template #body>
        <p>¿Estás seguro de que deseas eliminar la actividad "{{ activityToDelete?.name }}"?</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Cancelar" variant="ghost" @click="isDeleteModalOpen = false" />
          <UButton label="Eliminar" color="error" :loading="deleting" @click="deleteActivityConfirm" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CalendarDate, getLocalTimeZone, today, parseDate } from '@internationalized/date'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import type { CalendarEvent, CreateCalendarEventRequest } from '~/types/calendar'
import { MONTHS_SHORT, countWeekdaysBetween } from '~/constants/calendar'
import ActivityModal from '~/components/calendar/ActivityModal.vue'

const {
  visibleActivities,
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
  initialize
} = useCalendarStore()

const { showSuccess, showError } = useModal()

// Estado
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const editingActivity = ref<CalendarEvent | null>(null)
const activityToDelete = ref<CalendarEvent | null>(null)
const saving = ref(false)
const deleting = ref(false)
const initialDate = ref<string | undefined>(undefined)

// Filtros
const filterStartDate = ref<CalendarDate | null>(null)
const filterEndDate = ref<CalendarDate | null>(null)
const filterResponsable = ref<number | null>(null)
const filterContenedor = ref<number | null>(null)

// Computed
const dateFilterLabel = computed(() => {
  if (filterStartDate.value && filterEndDate.value) {
    return `${filterStartDate.value.day}/${filterStartDate.value.month} - ${filterEndDate.value.day}/${filterEndDate.value.month}`
  }
  return 'Buscar Fecha'
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
const applyFilters = async (force = false) => {
  const filters: any = {}
  if (filterStartDate.value) {
    filters.start_date = `${filterStartDate.value.year}-${String(filterStartDate.value.month).padStart(2, '0')}-${String(filterStartDate.value.day).padStart(2, '0')}`
  }
  if (filterEndDate.value) {
    filters.end_date = `${filterEndDate.value.year}-${String(filterEndDate.value.month).padStart(2, '0')}-${String(filterEndDate.value.day).padStart(2, '0')}`
  }
  const responsableVal = extractValue(filterResponsable.value)
  if (responsableVal) {
    filters.responsable_id = responsableVal
  }
  const contenedorVal = extractValue(filterContenedor.value)
  if (contenedorVal) {
    filters.contenedor_id = contenedorVal
  }
  await getEvents(filters, force)
}

const clearDateFilter = () => {
  filterStartDate.value = null
  filterEndDate.value = null
  applyFilters()
}

const openCreateModal = () => {
  editingActivity.value = null
  const todayDate = today(getLocalTimeZone())
  initialDate.value = `${todayDate.year}-${String(todayDate.month).padStart(2, '0')}-${String(todayDate.day).padStart(2, '0')}`
  isModalOpen.value = true
}

const openEditModal = (activity: CalendarEvent) => {
  console.log(calendarPermissions.value.canEditActivity)
  if (!calendarPermissions.value.canEditActivity) {
    showError('Sin permisos', 'No tienes permisos para editar actividades.')
    return
  }
  editingActivity.value = activity
  initialDate.value = undefined
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingActivity.value = null
}

const handleSaveActivity = async (data: CreateCalendarEventRequest) => {
  saving.value = true
  try {
    if (editingActivity.value) {
      const result = await updateActivity({ id: editingActivity.value.id, ...data })
      if (result) {
        showSuccess('Éxito', 'Actividad actualizada correctamente')
        closeModal()
        await applyFilters(true)
      }
    } else {
      const result = await createActivity(data)
      if (result) {
        showSuccess('Éxito', 'Actividad creada correctamente')
        closeModal()
        await applyFilters(true)
      }
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudo guardar la actividad')
  } finally {
    saving.value = false
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

const handleDeleteFromModal = () => {
  if (editingActivity.value) {
    confirmDelete(editingActivity.value)
    closeModal()
  }
}

const confirmDelete = (activity: CalendarEvent) => {
  activityToDelete.value = activity
  isDeleteModalOpen.value = true
}

const deleteActivityConfirm = async () => {
  if (!activityToDelete.value) return
  deleting.value = true
  try {
    const success = await deleteActivity(activityToDelete.value.id)
    if (success) {
      showSuccess('Éxito', 'Actividad eliminada correctamente')
      isDeleteModalOpen.value = false
      activityToDelete.value = null
      await applyFilters(true)
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudo eliminar la actividad')
  } finally {
    deleting.value = false
  }
}

// Inicialización
onMounted(async () => {
  await initialize()
  await getEvents()
})

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>
