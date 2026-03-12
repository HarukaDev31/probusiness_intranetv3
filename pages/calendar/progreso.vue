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
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Notas</th>
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
                    <UTooltip :text="expandedActivityId === activity.id ? 'Ocultar subtareas' : 'Ver subtareas'">
                      <UButton
                        :icon="expandedActivityId === activity.id ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                        variant="ghost"
                        size="xs"
                        color="primary"
                        @click="toggleSubtasksRow(activity.id)"
                      />
                    </UTooltip>
                    <UTooltip text="Ver tracking">
                      <UButton
                        icon="i-heroicons-clipboard-document-list"
                        variant="ghost"
                        size="xs"
                        color="primary"
                        @click="openTrackingModal(activity)"
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
              </tr>

              <!-- Fila expandida con subtareas -->
              <tr
                v-if="expandedActivityId === activity.id"
                :key="`activity-subtasks-${activity.id}`"
                class="bg-gray-50/60 dark:bg-gray-900/40"
              >
                <td :colspan="usaConsolidado ? 10 : 9" class="px-4 py-3">
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Subtareas por responsable
                      </p>
                    </div>

                    <div
                      v-if="(activity.charges || []).length === 0"
                      class="text-sm text-gray-500 dark:text-gray-400"
                    >
                      Esta actividad no tiene responsables asignados.
                    </div>

                    <div
                      v-for="charge in activity.charges || []"
                      :key="charge.id"
                      class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <UAvatar
                            :alt="charge.user?.nombre || 'U'"
                            size="sm"
                            :src="charge.user?.avatar"
                            :style="{
                              backgroundColor: getResponsableColor(charge.user_id, charge.user?.nombre),
                              color: '#fff'
                            }"
                          />
                          <div>
                            <p class="text-sm font-medium">
                              {{ charge.user?.nombre || 'Responsable #' + charge.user_id }}
                            </p>
                            <p class="text-xs text-gray-500">
                              Estado: {{ charge.status }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- Lista de subtareas -->
                      <div v-if="(charge.subtasks || []).length > 0" class="space-y-2">
                        <div
                          v-for="task in charge.subtasks || []"
                          :key="task.id"
                          class="flex items-center gap-2 justify-between bg-white dark:bg-gray-900 rounded px-3 py-2"
                        >
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">
                              {{ task.name }}
                            </p>
                            <p class="text-xs text-gray-500">
                              Duración: {{ task.duration_hours }} h
                            </p>
                          </div>
                          <div class="flex items-center gap-2">
                            <USelectMenu
                              v-model="task.status"
                              :items="statusOptionsSubtasks as any"
                              value-attribute="value"
                              size="xs"
                              class="w-32"
                              @update:model-value="(value) => onSubtaskStatusChange(task, value)"
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
                      </div>
                      <p v-else class="text-xs text-gray-500">
                        Sin subtareas para este responsable.
                      </p>

                      <!-- Formulario nueva subtarea (solo para el propio responsable o jefe) -->
                      <div
                        v-if="canManageSubtasksForCharge(charge)"
                        class="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3"
                      >
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                          <UFormField label="Nombre subtarea">
                            <UInput
                              v-model="newSubtaskName"
                              placeholder="Ej. Revisar documentos"
                            />
                          </UFormField>
                          <UFormField label="Duración (horas)">
                            <UInput
                              v-model.number="newSubtaskHours"
                              type="number"
                              min="0"
                              placeholder="0"
                            />
                          </UFormField>
                          <div class="flex gap-2">
                            <USelectMenu
                              v-model="newSubtaskStatus"
                              :items="statusOptionsSubtasks as any"
                              value-attribute="value"
                              size="sm"
                              class="flex-1"
                            />
                            <UButton
                              label="Agregar"
                              color="primary"
                              size="sm"
                              :loading="savingSubtask"
                              @click="() => saveNewSubtask(charge)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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

    <!-- Modal de Subtareas -->
    <UModal :open="isSubtasksModalOpen" @close="closeSubtasksModal" class="w-full max-w-3xl">
      <template #header>
        <h3 class="text-lg font-semibold">Subtareas por responsable</h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p class="text-sm text-gray-500">Actividad:</p>
            <p class="font-medium">
              {{ subtasksActivity?.name || subtasksActivity?.title }}
            </p>
          </div>

          <div v-if="subtasksSections.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
            Esta actividad no tiene responsables asignados.
          </div>

          <div
            v-for="section in subtasksSections"
            :key="section.charge.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <UAvatar
                  :alt="section.charge.user?.nombre || 'U'"
                  size="sm"
                  :src="section.charge.user?.avatar"
                  :style="{
                    backgroundColor: getResponsableColor(section.charge.user_id, section.charge.user?.nombre),
                    color: '#fff'
                  }"
                />
                <div>
                  <p class="text-sm font-medium">
                    {{ section.charge.user?.nombre || 'Responsable #' + section.charge.user_id }}
                  </p>
                  <p class="text-xs text-gray-500">
                    Estado: {{ section.charge.status }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Lista de subtareas -->
            <div v-if="section.subtasks.length > 0" class="space-y-2">
              <div
                v-for="task in section.subtasks"
                :key="task.id"
                class="flex items-center gap-2 justify-between bg-gray-50 dark:bg-gray-900 rounded px-3 py-2"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ task.name }}
                  </p>
                  <p class="text-xs text-gray-500">
                    Duración: {{ task.duration_hours }} h
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <USelectMenu
                    v-model="task.status"
                    :items="statusOptionsSubtasks as any"
                    value-attribute="value"
                    size="xs"
                    class="w-32"
                    @update:model-value="(value) => onSubtaskStatusChange(task, value)"
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
            </div>
            <p v-else class="text-xs text-gray-500">
              Sin subtareas para este responsable.
            </p>

            <!-- Formulario nueva subtarea (solo para el propio responsable o jefe) -->
            <div v-if="canManageSubtasksForCharge(section.charge)" class="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <UFormField label="Nombre subtarea">
                  <UInput
                    v-model="newSubtaskName"
                    placeholder="Ej. Revisar documentos"
                  />
                </UFormField>
                <UFormField label="Duración (horas)">
                  <UInput
                    v-model.number="newSubtaskHours"
                    type="number"
                    min="0"
                    placeholder="0"
                  />
                </UFormField>
                <div class="flex gap-2">
                  <USelectMenu
                    v-model="newSubtaskStatus"
                    :items="statusOptionsSubtasks as any"
                    value-attribute="value"
                    size="sm"
                    class="flex-1"
                  />
                  <UButton
                    label="Agregar"
                    color="primary"
                    size="sm"
                    :loading="savingSubtask"
                    @click="() => saveNewSubtask(section.charge)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end w-full gap-2">
          <UButton label="Cerrar" variant="ghost" @click="closeSubtasksModal" />
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
  deleteSubtask
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

// Estado de subtareas
const isSubtasksModalOpen = ref(false)
const subtasksActivity = ref<CalendarEvent | null>(null)
const subtasksCharge = ref<CalendarEventCharge | null>(null)
const newSubtaskName = ref('')
const newSubtaskHours = ref<number | null>(null)
const newSubtaskStatus = ref<CalendarEventStatus>('PENDIENTE')
const savingSubtask = ref(false)

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
const subtasksSections = computed(() => {
  if (!subtasksActivity.value || !subtasksActivity.value.charges) return []
  return subtasksActivity.value.charges.map(charge => ({
    charge,
    subtasks: charge.subtasks ?? []
  }))
})

const openSubtasksModal = (activity: CalendarEvent) => {
  subtasksActivity.value = activity
  subtasksCharge.value = getMyCharge(activity) || null
  newSubtaskName.value = ''
  newSubtaskHours.value = null
  newSubtaskStatus.value = 'PENDIENTE' as CalendarEventStatus
  isSubtasksModalOpen.value = true
}

const closeSubtasksModal = () => {
  isSubtasksModalOpen.value = false
  subtasksActivity.value = null
  subtasksCharge.value = null
  newSubtaskName.value = ''
  newSubtaskHours.value = null
  newSubtaskStatus.value = 'PENDIENTE' as CalendarEventStatus
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

const saveNewSubtask = async (charge: CalendarEventCharge) => {
  if (!newSubtaskName.value.trim()) {
    showError('Error', 'El nombre de la subtarea es obligatorio')
    return
  }
  if (!canManageSubtasksForCharge(charge)) {
    showError('Error', 'No puedes crear subtareas para este responsable')
    return
  }
  savingSubtask.value = true
  try {
    const payload = {
      name: newSubtaskName.value.trim(),
      duration_hours: newSubtaskHours.value != null ? Number(newSubtaskHours.value) : 0,
      status: newSubtaskStatus.value
    }
    const created = await createSubtask(charge.id, payload)
    if (created) {
      showSuccess('Éxito', 'Subtarea creada correctamente')
      newSubtaskName.value = ''
      newSubtaskHours.value = null
      newSubtaskStatus.value = 'PENDIENTE' as CalendarEventStatus
    } else {
      showError('Error', 'No se pudo crear la subtarea')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'No se pudo crear la subtarea')
  } finally {
    savingSubtask.value = false
  }
}

const onSubtaskStatusChange = async (task: any, value: any) => {
  const status = extractValue(value) as CalendarEventStatus
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


// Inicialización
onMounted(async () => {
  await initialize()
  clearFilters()
  if (!isJefeImportaciones.value) {
    nonJefeResponsableModel.value = { label: 'Yo', value: 'yo' }
    filterResponsableIds.value = [Number(currentUserId.value)]
  }
  await applyFilters()
})

definePageMeta({
  middleware: ['auth']
})
</script>
