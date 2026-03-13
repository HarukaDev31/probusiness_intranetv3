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
          @click="navigateTo(getCalendarRoute('/calendar'))"
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
              <div class="p-3 flex flex-col gap-3">
              <div class="flex flex-wrap items-start gap-4">
                  <div>
                    <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Desde:</label>
                    <UCalendar v-model="filterStartDate" class="w-full" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Hasta:</label>
                    <UCalendar v-model="filterEndDate" class="w-full" :placeholder="endDatePlaceholder as any" />
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton label="Aplicar" color="primary" size="xs" class="flex-1" @click="() => applyFilters()" />
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
          <template v-if="calendarPermissions.canFilterByResponsable">
            <!-- No-Jefe: solo Todos / Yo (select simple) -->
            <USelectMenu
              v-if="!isJefeImportaciones"
              v-model="nonJefeResponsableModel"
              :items="[{ label: 'Todos', value: 'todos' }, { label: 'Yo', value: 'yo' }]"
              size="sm"
              class="w-36"
              @update:model-value="onNonJefeResponsableChange"
            />
            <!-- Jefe: multi-select con todos los responsables -->
            <USelectMenu
              v-else
              v-model="responsableModelValue"
              :items="responsableOptionsMulti"
              value-key="value"
              :placeholder="filterResponsableIds.length ? `${filterResponsableIds.length} seleccionado(s)` : 'Todos'"
              size="sm"
              class="w-40"
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
          </template>

          <!-- Consolidado (múltiple): solo si el grupo usa consolidado -->
          <USelectMenu
            v-if="usaConsolidado"
            v-model="contenedorModelValue"
            :items="contenedorOptionsMulti"
            value-key="value"
            :placeholder="filterContenedorIds.length ? `${filterContenedorIds.length} seleccionado(s)` : 'Consolidado(s)'"
            size="sm"
            class="w-48 min-w-0"
            multiple
            :search-input="{ placeholder: 'Buscar...' }"
          />
        </div>

        <!-- Tabla -->
        <div class="overflow-x-auto pt-4">
          <table class="w-full min-w-[1200px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actividad</th>
                <th v-if="usaConsolidado" class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"># Consolidado</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Prioridad</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Inicio</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Fin</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Duración</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Responsables</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <template
                v-for="activity in visibleActivities"
                :key="activity.id"
              >
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <!-- Actividad -->
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                    <button
                      v-if="canOpenSubtasksRow(activity)"
                      class="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      @click="toggleSubtasksRow(activity)"
                    >
                      <UIcon
                        :name="expandedActivityId === activity.id ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                        class="w-4 h-4 shrink-0 text-gray-400"
                      />
                      <span>{{ activity.name || activity.title }}</span>
                    </button>
                    <span v-else>{{ activity.name || activity.title }}</span>
                  </td>

                  <!-- # Consolidado: solo si el grupo usa consolidado -->
                  <td v-if="usaConsolidado" class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {{ activity.contenedor?.nombre || activity.contenedor?.codigo || '-' }}
                  </td>

                  <!-- Estado -->
                  <td class="px-4 py-3">
                    <StatusDropdown
                      :activity="activity"
                      :can-edit="canEditStatus(activity)"
                      :current-user-id="currentUserId"
                      :is-jefe="isJefeImportaciones"
                      @update="(eventId, status) => handleStatusUpdate(eventId, status)"
                      @update-charge="(chargeId, status) => handleChargeStatusUpdate(chargeId, status)"
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

                  <!-- Fecha Inicio -->
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDate(activity.start_date || getFirstDate(activity)) }}
                  </td>

                  <!-- Fecha Fin -->
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDate(activity.end_date || getLastDate(activity)) }}
                  </td>

                  <!-- Duración -->
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {{ calculateDuration(activity) }} days
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

                  <!-- Acciones -->
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <!-- Crear subtareas -->
                      <UTooltip
                        v-if="canCreateSubtasksForActivity(activity)"
                        text="Crear subtareas"
                      >
                        <UButton
                          icon="i-heroicons-plus"
                          variant="ghost"
                          size="xs"
                          color="primary"
                          @click="openCreateSubtasksModalFromActivity(activity)"
                        />
                      </UTooltip>

                      <!-- Notas -->
                      <UTooltip text="Notas">
                        <UButton
                          v-if="isJefeImportaciones || getMyCharge(activity)"
                          icon="i-heroicons-chat-bubble-left-right"
                          variant="ghost"
                          size="xs"
                          color="neutral"
                          @click="isJefeImportaciones ? openNotesModal(activity) : openNotesModal(activity, getMyCharge(activity)!)"
                        />
                      </UTooltip>
                    </div>
                  </td>
                </tr>

                <!-- Fila expandida con subtareas -->
                <tr
                  v-if="expandedActivityId === activity.id"
                  :key="`activity-subtasks-${activity.id}`"
                  class="bg-gray-50/60 dark:bg-gray-900/40"
                >
                  <td :colspan="usaConsolidado ? 9 : 8" class="px-4 py-3 w-full" style="min-width: 1200px;">
                    <div class="space-y-3 w-full">
                      

                      <div
                        v-if="getChargesToShowForSubtasks(activity).length === 0"
                        class="text-sm text-gray-500 dark:text-gray-400"
                      >
                        {{ isJefeImportaciones ? 'Esta actividad no tiene responsables asignados.' : 'No eres responsable de esta actividad.' }}
                      </div>

                      <div
                        v-for="charge in getChargesToShowForSubtasks(activity)"
                        :key="charge.id"
                        class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3 w-full min-w-0"
                      >
                       

                        <!-- Lista de subtareas -->
                        <div v-if="(charge.subtasks || []).length > 0" class="space-y-2">
                          <div
                            v-for="task in charge.subtasks || []"
                            :key="task.id"
                            class="flex flex-col gap-2 bg-white dark:bg-gray-900 rounded px-3 py-2"
                          >
                            <!-- Vista normal -->
                            <template v-if="editingSubtaskId !== task.id">
                              <div class="flex items-center gap-2 justify-between min-w-0">
                                <div class="flex-1 min-w-0">
                                  <p class="text-sm font-medium truncate">
                                    {{ task.name }}
                                  </p>
                                  <p class="text-xs text-gray-500 dark:text-gray-400">
                                    Duración: {{ task.duration_hours ?? 0 }} h
                                  </p>
                                  <p class="text-xs text-gray-500 dark:text-gray-400">
                                    Fecha fin: {{ formatDate(task.end_date) }}
                                  </p>
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                  <USelectMenu
                                    :model-value="getSubtaskStatusOption(task.status)"
                                    :items="statusOptionsSubtasks as any"
                                    value-attribute="value"
                                    size="xs"
                                    class="w-32"
                                    @update:model-value="(item) => onSubtaskStatusChange(task, item)"
                                  />
                                  <UButton
                                    v-if="canManageSubtasksForCharge(charge)"
                                    icon="i-heroicons-pencil-square"
                                    variant="ghost"
                                    size="xs"
                                    color="primary"
                                    @click="() => openEditSubtask(task)"
                                  />
                                  <UButton
                                    icon="i-heroicons-trash"
                                    variant="ghost"
                                    size="xs"
                                    color="error"
                                    @click="() => onDeleteSubtask(task)"
                                  />
                                </div>
                              </div>
                            </template>
                            <!-- Formulario edición -->
                            <template v-else>
                              <div class="grid grid-cols-1 md:grid-cols-4 gap-2 items-end w-full">
                                <UFormField label="Nombre">
                                  <UInput v-model="editSubtaskName" placeholder="Nombre" size="sm" />
                                </UFormField>
                                <UFormField label="Duración (h)">
                                  <UInput v-model.number="editSubtaskHours" type="number" min="0" size="sm" />
                                </UFormField>
                                <UFormField label="Fecha fin">
                                  <UPopover :open="undefined">
                                    <UButton
                                      color="neutral"
                                      variant="outline"
                                      size="sm"
                                      icon="i-lucide-calendar"
                                      class="w-full justify-start"
                                      :class="{ 'text-gray-400 dark:text-gray-500': !editSubtaskEndDate }"
                                    >
                                      {{ editSubtaskEndDate ? formatDate(calendarDateToYmd(editSubtaskEndDate) ?? '') : 'Seleccionar fecha' }}
                                    </UButton>
                                    <template #content>
                                      <UCalendar v-model="editSubtaskEndDate" class="p-2" />
                                    </template>
                                  </UPopover>
                                </UFormField>
                                <UFormField label="Estado">
                                  <USelectMenu
                                    :model-value="getSubtaskStatusOption(editSubtaskStatus ?? 'PENDIENTE')"
                                    :items="statusOptionsSubtasks as any"
                                    value-attribute="value"
                                    size="sm"
                                    class="w-full"
                                    @update:model-value="(item) => { editSubtaskStatus = (item && typeof item === 'object' && 'value' in item ? item.value : item) as CalendarEventStatus }"
                                  />
                                </UFormField>
                              </div>
                              <div class="flex gap-2">
                                <UButton label="Guardar" color="primary" size="xs" :loading="savingEditSubtask" @click="() => saveEditSubtask(task)" />
                                <UButton label="Cancelar" variant="outline" size="xs" @click="cancelEditSubtask" />
                              </div>
                            </template>
                          </div>
                        </div>
                        <p v-else class="text-xs text-gray-500">
                          Sin subtareas para este responsable.
                        </p>

                      </div>
                    </div>
                  </td>
                </tr>
              </template>

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
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                  <td class="px-4 py-3"><div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div></td>
                  <td class="px-4 py-3"><div class="flex gap-1"><div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div><div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div></div></td>
                  <td class="px-4 py-3 text-center"><div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                  <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="eventsPagination" class="flex items-center justify-between pt-4 mt-2 border-t border-gray-200 dark:border-gray-700 flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <USelectMenu
              v-model="perPageOption"
              :items="perPageOptions"
              size="sm"
              class="w-36"
            />
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ eventsPagination.total }} registros
            </span>
          </div>
          <UPagination
            v-model:page="page"
            :total="eventsPagination.total"
            :items-per-page="perPage"
            size="sm"
            @update:page="goToPage"
          />
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

    <!-- Modal de Crear Subtareas (batch) -->
    <CreateSubtasksModal
      :open="isCreateSubtasksModalOpen"
      :charge-name="createSubtasksChargeName"
      :saving="savingSubtask"
      @close="closeCreateSubtasksModal"
      @create="handleBatchCreateSubtasks"
    />

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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarDate, getLocalTimeZone, today, parseDate } from '@internationalized/date'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import type { CalendarEvent, CalendarEventCharge, CalendarEventStatus, CalendarEventPriority } from '~/types/calendar'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, countWeekdaysBetween } from '~/constants/calendar'
import StatusDropdown from '~/components/calendar/StatusDropdown.vue'
import PriorityDropdown from '~/components/calendar/PriorityDropdown.vue'
import ActivityTrackingModal from '~/components/calendar/ActivityTrackingModal.vue'
import CreateSubtasksModal from '~/components/calendar/CreateSubtasksModal.vue'

const {
  visibleActivities,
  eventsPagination,
  myProgressStats,
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
  updateEventNotes,
  updateChargeNotes,
  getResponsableColor,
  initialize,
  clearFilters,
  getCalendarRoute,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  invalidateCache
} = useCalendarStore()

const { showSuccess, showError } = useModal()

// Estado de filtros
const filterStartDate = ref<any | null>(null)
const filterEndDate = ref<any | null>(null)
const filterStatus = ref<CalendarEventStatus | null>(null)
const filterPriority = ref<CalendarEventPriority | null>(null)
const filterResponsableIds = ref<number[]>([])
const filterContenedorIds = ref<number[]>([])

/** Mes que muestra el 2.º calendario (Hasta): el mes siguiente al "Desde" o al actual */
const endDatePlaceholder = computed<CalendarDate>(() => {
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

// Estado de notas (para no-jefe se edita el charge del usuario; para jefe las notas de la actividad)
const isNotesModalOpen = ref(false)
const selectedActivity = ref<CalendarEvent | null>(null)
const selectedCharge = ref<CalendarEventCharge | null>(null)
const notesText = ref('')
const savingNotes = ref(false)

// Estado de tracking modal
const isTrackingModalOpen = ref(false)
const trackingActivity = ref<CalendarEvent | null>(null)

// Filtro por evento (desde query ?event_id= para abrir progreso desde calendario)
const filterEventId = ref<number | null>(null)

// Estado de subtareas (fila expandida en tabla)
const expandedActivityId = ref<number | null>(null)
const savingSubtask = ref(false)

// Modal de crear subtareas (batch)
const isCreateSubtasksModalOpen = ref(false)
const createSubtasksChargeId = ref<number | null>(null)
const createSubtasksChargeName = ref('')

// Edición de subtarea
const editingSubtaskId = ref<number | null>(null)
const editSubtaskName = ref('')
const editSubtaskHours = ref<number | null>(null)
const editSubtaskEndDate = ref<any>(null)
const editSubtaskStatus = ref<CalendarEventStatus | null>(null)
const savingEditSubtask = ref(false)

// Computed
const dateFilterLabel = computed(() => {
  if (filterStartDate.value && filterEndDate.value) {
    return `${filterStartDate.value.day}/${filterStartDate.value.month} - ${filterEndDate.value.day}/${filterEndDate.value.month}`
  }
  return 'Buscar Fecha'
})

// Mi progreso: viene del servidor para reflejar TODAS las páginas, no solo la actual
const myProgress = computed(() => {
  if (myProgressStats.value) {
    return {
      total:      myProgressStats.value.total,
      completadas: myProgressStats.value.completadas,
      enProgreso:  myProgressStats.value.en_progreso,
      pendientes:  myProgressStats.value.pendientes,
    }
  }
  return { total: 0, completadas: 0, enProgreso: 0, pendientes: 0 }
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

const RESPONSABLE_TODOS_VALUE = -1
const CONTENEDOR_ALL_VALUE = '__all__' as const

// --- Responsable para no-Jefe (select simple) ---
const nonJefeResponsableModel = ref<{ label: string; value: string } | null>(null)
const onNonJefeResponsableChange = (val: any) => {
  const v = typeof val === 'object' && val ? val.value : val
  if (v === 'yo') {
    filterResponsableIds.value = [Number(currentUserId.value)]
  } else {
    filterResponsableIds.value = []
  }
  applyFilters()
}

const responsableOptionsMulti = computed(() => {
  if (!isJefeImportaciones.value) {
    return [
      { label: 'Todos', value: RESPONSABLE_TODOS_VALUE },
      { label: 'Yo', value: Number(currentUserId.value) }
    ]
  }
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

const contenedorOptionsMulti = computed(() => {
  const options: { label: string; value: number | string }[] = [
    { label: 'Todos', value: CONTENEDOR_ALL_VALUE }
  ]
  contenedores.value.forEach(c => {
    options.push({ label: c.nombre || c.codigo || `#${c.id}`, value: c.id })
  })
  return options
})

const contenedorModelValue = computed({
  get: () => filterContenedorIds.value.length ? [...filterContenedorIds.value] : [CONTENEDOR_ALL_VALUE],
  set: (val: unknown) => onContenedorIdsChange(val)
})

const onContenedorIdsChange = (val: unknown) => {
  const arr = Array.isArray(val) ? val : val != null ? [val] : []
  const values = arr.map((v: any) => typeof v === 'object' && v && 'value' in v ? v.value : v)
  const hasAll = values.some(v => v === CONTENEDOR_ALL_VALUE || String(v) === CONTENEDOR_ALL_VALUE)
  const hadOtherSelected = filterContenedorIds.value.length > 0
  if (hasAll && (values.length === 1 || hadOtherSelected)) {
    filterContenedorIds.value = []
  } else {
    const numericIds = values
      .map((v: any) => (typeof v === 'number' ? v : Number(v)))
      .filter((n: number) => !Number.isNaN(n) && n > 0)
    filterContenedorIds.value = numericIds
  }
  applyFilters()
}

// Helpers
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

/** Convierte string YYYY-MM-DD a valor para UCalendar. */
const toCalendarDate = (s: string | null | undefined): any => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  try {
    return parseDate(s)
  } catch {
    return null
  }
}

/** Convierte valor de UCalendar (year/month/day) a string YYYY-MM-DD para la API. */
const calendarDateToYmd = (d: { year: number; month: number; day: number } | null): string | null => {
  if (!d || d.year == null || d.month == null || d.day == null) return null
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
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
  const statusVal = extractValue(filterStatus.value)
  if (statusVal) filters.status = statusVal
  const priorityVal = extractValue(filterPriority.value)
  if (priorityVal !== null && priorityVal !== undefined) filters.priority = priorityVal
  if (filterResponsableIds.value.length > 0) filters.responsable_ids = filterResponsableIds.value
  if (usaConsolidado.value && filterContenedorIds.value.length > 0) filters.contenedor_ids = filterContenedorIds.value
  if (filterEventId.value != null) filters.event_id = filterEventId.value

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
  applyFilters()
}

const handleStatusUpdate = async (eventId: number, status: CalendarEventStatus) => {
  if (!calendarPermissions.value.canEditAnyStatus) {
    const activity = visibleActivities.value.find(a => a.id === eventId)
    if (!activity?.charges?.some(c => c.user_id === Number(currentUserId.value))) {
      showError('Error', 'No puedes actualizar el estado de esta actividad')
      return
    }
  }
  const success = await updateEventStatus(eventId, status)
  if (success) {
    showSuccess('Éxito', 'Estado actualizado correctamente')
    await applyFilters()
  } else {
    showError('Error', 'No se pudo actualizar el estado')
  }
}

const handleChargeStatusUpdate = async (chargeId: number, status: CalendarEventStatus) => {
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

// Subtareas
/** Si no es jefe, solo puede abrir la fila de subtareas cuando es responsable de la actividad. */
const canOpenSubtasksRow = (activity: CalendarEvent): boolean => {
  if (isJefeImportaciones.value) return true
  return !!getMyCharge(activity)
}

/** Charges a mostrar en la fila expandida: jefe ve todos; no-jefe solo el suyo. */
const getChargesToShowForSubtasks = (activity: CalendarEvent): CalendarEventCharge[] => {
  const charges = activity.charges || []
  if (isJefeImportaciones.value) return charges
  const myId = Number(currentUserId.value)
  return charges.filter(c => c.user_id === myId)
}

const toggleSubtasksRow = (activity: CalendarEvent) => {
  if (!canOpenSubtasksRow(activity)) {
    showError('Error', 'Solo puedes ver subtareas de actividades donde eres responsable')
    return
  }
  expandedActivityId.value = expandedActivityId.value === activity.id ? null : activity.id
}

const canManageSubtasksForCharge = (charge: CalendarEventCharge): boolean => {
  if (isJefeImportaciones.value) return true
  return charge.user_id === Number(currentUserId.value)
}

const statusOptionsSubtasks: { label: string; value: CalendarEventStatus }[] = [
  { label: 'Pendiente', value: 'PENDIENTE' as CalendarEventStatus },
  { label: 'En progreso', value: 'PROGRESO' as CalendarEventStatus },
  { label: 'Completado', value: 'COMPLETADO' as CalendarEventStatus }
]

/** Devuelve el ítem de opción que coincide con el status (para que USelectMenu muestre la etiqueta correcta). */
const getSubtaskStatusOption = (status: string | undefined): { label: string; value: CalendarEventStatus } => {
  const s = (status || 'PENDIENTE').toUpperCase()
  return statusOptionsSubtasks.find(o => o.value === s) || statusOptionsSubtasks[0]
}

const canCreateSubtasksForActivity = (activity: CalendarEvent): boolean => {
  if (isJefeImportaciones.value) return (activity.charges || []).length > 0
  return !!getMyCharge(activity)
}

const openCreateSubtasksModal = (charge: CalendarEventCharge) => {
  createSubtasksChargeId.value = charge.id
  createSubtasksChargeName.value = charge.user?.nombre || `Responsable #${charge.user_id}`
  isCreateSubtasksModalOpen.value = true
}

const openCreateSubtasksModalFromActivity = (activity: CalendarEvent) => {
  if (isJefeImportaciones.value) {
    const charges = activity.charges || []
    if (charges.length === 1) {
      openCreateSubtasksModal(charges[0])
    } else if (charges.length > 1) {
      expandedActivityId.value = activity.id
    }
    return
  }
  const myCharge = getMyCharge(activity)
  if (myCharge) openCreateSubtasksModal(myCharge)
}

const closeCreateSubtasksModal = () => {
  isCreateSubtasksModalOpen.value = false
  createSubtasksChargeId.value = null
  createSubtasksChargeName.value = ''
}

const handleBatchCreateSubtasks = async (items: { name: string; duration_hours: number; end_date: any }[]) => {
  if (!createSubtasksChargeId.value || items.length === 0) return
  savingSubtask.value = true
  let successCount = 0
  let failCount = 0
  try {
    for (const item of items) {
      const payload = {
        name: item.name,
        duration_hours: item.duration_hours,
        status: 'PENDIENTE' as CalendarEventStatus,
        end_date: calendarDateToYmd(item.end_date)
      }
      const created = await createSubtask(createSubtasksChargeId.value, payload)
      if (created) {
        successCount++
      } else {
        failCount++
      }
    }
    if (failCount === 0) {
      showSuccess('Éxito', `${successCount} subtarea${successCount !== 1 ? 's' : ''} creada${successCount !== 1 ? 's' : ''} correctamente`)
      closeCreateSubtasksModal()
    } else {
      showError('Error parcial', `${successCount} creada(s), ${failCount} fallida(s)`)
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudieron crear las subtareas')
  } finally {
    savingSubtask.value = false
  }
}

const openEditSubtask = (task: { id: number; name: string; duration_hours?: number; end_date?: string | null; status?: string }) => {
  editingSubtaskId.value = task.id
  editSubtaskName.value = task.name
  editSubtaskHours.value = task.duration_hours ?? null
  editSubtaskEndDate.value = toCalendarDate(task.end_date ?? null)
  editSubtaskStatus.value = (task.status as CalendarEventStatus) ?? 'PENDIENTE'
}

const cancelEditSubtask = () => {
  editingSubtaskId.value = null
  editSubtaskName.value = ''
  editSubtaskHours.value = null
  editSubtaskEndDate.value = null
  editSubtaskStatus.value = null
}

const saveEditSubtask = async (task: { id: number }) => {
  if (!editSubtaskName.value.trim()) {
    showError('Error', 'El nombre es obligatorio')
    return
  }
  savingEditSubtask.value = true
  try {
    const payload = {
      name: editSubtaskName.value.trim(),
      duration_hours: editSubtaskHours.value != null ? Number(editSubtaskHours.value) : 0,
      status: editSubtaskStatus.value ?? 'PENDIENTE',
      end_date: calendarDateToYmd(editSubtaskEndDate.value)
    }
    const ok = await updateSubtask(task.id, payload)
    if (ok) {
      showSuccess('Éxito', 'Subtarea actualizada correctamente')
      cancelEditSubtask()
    } else {
      showError('Error', 'No se pudo actualizar la subtarea')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudo actualizar la subtarea')
  } finally {
    savingEditSubtask.value = false
  }
}

const onSubtaskStatusChange = async (task: any, item: any) => {
  const status = (item && typeof item === 'object' && 'value' in item ? item.value : item) as CalendarEventStatus
  if (!status) return
  const ok = await updateSubtask(task.id, { status })
  if (!ok) {
    showError('Error', 'No se pudo actualizar la subtarea')
  }
}

const onDeleteSubtask = async (task: any) => {
  const ok = await deleteSubtask(task.id)
  if (ok) {
    showSuccess('Éxito', 'Subtarea eliminada correctamente')
  } else {
    showError('Error', 'No se pudo eliminar la subtarea')
  }
}


const route = useRoute()
const router = useRouter()

/** Corrige URL mal formada (ej. ?role_group_id=2?event_id=131) y devuelve el query normalizado para leer event_id. */
function normalizeProgressQuery(): Record<string, string> | null {
  if (typeof window === 'undefined') return null
  const raw = window.location.search
  if (!raw || !raw.includes('?event_id=')) return null
  const fixed = raw.replace(/\?event_id=/, '&event_id=')
  const params = new URLSearchParams(fixed)
  const query: Record<string, string> = {}
  params.forEach((value, key) => { query[key] = value })
  return query
}

// Inicialización
onMounted(async () => {
  const normalized = normalizeProgressQuery()
  if (normalized) {
    await router.replace({ path: route.path, query: normalized })
  }

  await initialize()
  clearFilters()
  if (!isJefeImportaciones.value) {
    nonJefeResponsableModel.value = { label: 'Yo', value: 'yo' }
    filterResponsableIds.value = [Number(currentUserId.value)]
  }

  const eventIdRaw = normalized?.event_id ?? route.query.event_id
  if (eventIdRaw != null && eventIdRaw !== '') {
    const id = Number(eventIdRaw)
    if (!Number.isNaN(id)) {
      filterEventId.value = id
      expandedActivityId.value = id
    }
  }
  await applyFilters(true)

  document.addEventListener('visibilitychange', onVisibilityChange)
})

const onVisibilityChange = async () => {
  if (document.visibilityState !== 'visible') return
  invalidateCache('events')
  await applyFilters(true)
}

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

definePageMeta({
  middleware: ['auth']
})
</script>
