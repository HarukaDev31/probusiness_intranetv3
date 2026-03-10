<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
      <div class="max-w-6xl mx-auto flex items-center gap-4">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="sm"
          label="Regresar"
          @click="navigateTo(getCalendarRoute('/calendar/config'))"
        />
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-user-group" class="w-6 h-6 text-primary-500" />
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Grupos de Roles del Calendario
          </h1>
        </div>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Lista de grupos -->
      <UCard class="lg:col-span-1">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Grupos</h2>
            <UButton
              icon="i-heroicons-plus"
              size="xs"
              color="primary"
              label="Nuevo"
              @click="startCreateGroup"
            />
          </div>
        </template>

        <div v-if="loadingGroups" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-10 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>

        <div v-else-if="groups.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay grupos definidos aún. Crea uno nuevo.
        </div>

        <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <li
            v-for="group in groups"
            :key="group.id"
            class="flex items-center justify-between gap-3 py-2.5 px-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
            :class="group.id === selectedGroupId ? 'bg-primary-50/70 dark:bg-primary-900/30' : ''"
            @click="selectGroup(group)"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ group.name }}
                <span
                  v-if="!group.is_active"
                  class="ml-1 text-[11px] font-normal text-gray-500 dark:text-gray-400"
                >
                  (inactivo)
                </span>
              </span>
              <span v-if="group.code" class="text-xs text-gray-500 dark:text-gray-400">
                Código: {{ group.code }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Consolidado: {{ group.usa_consolidado ? 'Sí' : 'No' }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <UButton
                icon="i-heroicons-pencil-square"
                size="2xs"
                variant="ghost"
                @click.stop="startEditGroup(group)"
              />
              <UButton
                icon="i-heroicons-trash"
                size="2xs"
                variant="ghost"
                color="red"
                @click.stop="confirmDeleteGroup(group)"
              />
            </div>
          </li>
        </ul>
      </UCard>

      <!-- Detalle: edición de grupo y miembros / colores -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Formulario de grupo -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ editingGroupId ? 'Editar grupo' : 'Nuevo grupo' }}
              </h2>
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="saveGroup">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <UInput v-model="groupForm.name" placeholder="Ej: Importaciones Lima" required />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código (opcional)
                </label>
                <UInput v-model="groupForm.code" placeholder="Ej: IMP_LIMA" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <USwitch
                v-model="groupForm.usa_consolidado"
                label="Usar consolidado en este grupo"
              />
              <USwitch
                v-model="groupForm.is_active"
                label="Grupo activo"
              />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                v-if="editingGroupId"
                variant="ghost"
                label="Cancelar"
                @click="resetGroupForm"
              />
              <UButton
                type="submit"
                color="primary"
                :label="editingGroupId ? 'Guardar cambios' : 'Crear grupo'"
                :loading="savingGroup"
              />
            </div>
          </form>
        </UCard>

        <!-- Tabs de detalle solo si hay grupo seleccionado -->
        <div v-if="selectedGroupId" class="space-y-6">
          <!-- Miembros -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-users" class="w-5 h-5 text-primary-500" />
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                    Miembros del grupo
                  </h3>
                </div>
                <UButton
                  icon="i-heroicons-arrow-path"
                  size="2xs"
                  variant="ghost"
                  title="Recargar"
                  @click="loadMembers"
                />
              </div>
            </template>

            <div class="space-y-4">
              <!-- Form agregar miembro -->
              <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Usuario
                  </label>
                  <USelectMenu
                    v-model="memberForm.user_id"
                    :items="userOptions"
                    value-key="value"
                    placeholder="Buscar por nombre o email..."
                    searchable
                    searchable-placeholder="Escribe para buscar en toda la intranet"
                    :loading="loadingUsers"
                  />
                </div>
                <div class="w-full md:w-48">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol en el grupo
                  </label>
                  <USelect
                    v-model="memberForm.role_type"
                    :items="roleTypeOptions"
                    placeholder="Tipo de rol"
                  />
                </div>
                <div class="flex-shrink-0">
                  <UButton
                    label="Agregar / actualizar"
                    color="primary"
                    :loading="savingMember"
                    @click="saveMember"
                  />
                </div>
              </div>

              <!-- Lista de miembros -->
              <div v-if="loadingMembers" class="space-y-2">
                <div v-for="i in 4" :key="i" class="h-9 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
              </div>
              <div v-else-if="members.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
                No hay miembros asignados a este grupo.
              </div>
              <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
                <li
                  v-for="m in members"
                  :key="m.id"
                  class="flex items-center justify-between py-2"
                >
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ m.user?.nombre || 'Usuario #' + m.user_id }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      Rol: {{ m.role_type }}
                    </span>
                  </div>
                  <UButton
                    icon="i-heroicons-trash"
                    size="2xs"
                    variant="ghost"
                    color="red"
                    @click="removeMember(m)"
                  />
                </li>
              </ul>
            </div>
          </UCard>

          <!-- Orden de colores por grupo -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-paint-brush" class="w-5 h-5 text-primary-500" />
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                    Prioridad de colores
                  </h3>
                </div>
                <UButton
                  icon="i-heroicons-arrow-path"
                  size="2xs"
                  variant="ghost"
                  title="Recargar"
                  @click="loadGroupConfig"
                />
              </div>
            </template>

            <form class="space-y-4" @submit.prevent="saveGroupConfig">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Orden para Jefe
                  </h4>
                  <draggable
                    v-model="jefeOrder"
                    item-key="key"
                    handle=".drag-handle"
                    class="space-y-2"
                  >
                    <template #item="{ element }">
                      <div
                        class="flex items-center justify-between px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-move"
                      >
                        <div class="flex items-center gap-2">
                          <UIcon name="i-heroicons-bars-3" class="w-4 h-4 text-gray-400 drag-handle" />
                          <span class="text-sm text-gray-800 dark:text-gray-100">
                            {{ element.label }}
                          </span>
                        </div>
                        <span class="text-xs text-gray-400 dark:text-gray-500">
                          {{ jefeOrder.indexOf(element) + 1 }}°
                        </span>
                      </div>
                    </template>
                  </draggable>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Orden para resto del grupo
                  </h4>
                  <draggable
                    v-model="miembroOrder"
                    item-key="key"
                    handle=".drag-handle"
                    class="space-y-2"
                  >
                    <template #item="{ element }">
                      <div
                        class="flex items-center justify-between px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-move"
                      >
                        <div class="flex items-center gap-2">
                          <UIcon name="i-heroicons-bars-3" class="w-4 h-4 text-gray-400 drag-handle" />
                          <span class="text-sm text-gray-800 dark:text-gray-100">
                            {{ element.label }}
                          </span>
                        </div>
                        <span class="text-xs text-gray-400 dark:text-gray-500">
                          {{ miembroOrder.indexOf(element) + 1 }}°
                        </span>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>

              <div class="flex flex-col gap-3 pt-2">
                <div class="flex items-center gap-2">
                  <UToggle v-model="groupConfigForm.usa_consolidado" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    Este grupo usa consolidado en el calendario
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <USwitch
                    v-model="groupConfigForm.show_event_details"
                    unchecked-icon="i-lucide-x"
                    checked-icon="i-lucide-check"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    Ver detalles (nombre del responsable principal) en los eventos del calendario
                  </span>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <UButton
                  type="submit"
                  color="primary"
                  label="Guardar configuración"
                  :loading="savingConfig"
                />
              </div>
            </form>
          </UCard>
        </div>

        <div v-else class="text-sm text-gray-500 dark:text-gray-400">
          Selecciona un grupo de la lista para administrar sus miembros y colores.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CalendarService, type CalendarRoleGroup, type CalendarRoleGroupMember, type CalendarRoleGroupConfig } from '~/services/calendar/calendarService'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import draggable from 'vuedraggable'

const { getCalendarRoute } = useCalendarStore()
const { showSuccess, showError } = useModal()

const groups = ref<RoleGroup[]>([])
const loadingGroups = ref(false)
const savingGroup = ref(false)
const selectedGroupId = ref<number | null>(null)
const editingGroupId = ref<number | null>(null)

const groupForm = ref({
  name: '',
  code: '',
  usa_consolidado: true,
  is_active: true
})

const members = ref<RoleGroupMember[]>([])
const loadingMembers = ref(false)
const savingMember = ref(false)

const groupConfigForm = ref<{
  color_prioridad: string | null
  color_actividad: string | null
  color_consolidado: string | null
  color_completado: string | null
  usa_consolidado: boolean
  show_event_details: boolean
}>({
  color_prioridad: null,
  color_actividad: null,
  color_consolidado: null,
  color_completado: null,
  usa_consolidado: true,
  show_event_details: false
})

const savingConfig = ref(false)

// Usuarios de la intranet para el selector de miembros (autocomplete)
const userOptions = ref<{ label: string; value: number }[]>([])
const loadingUsers = ref(false)
const userSearchQuery = ref('')

const memberForm = ref<{ user_id: number | null; role_type: string | null }>({
  user_id: null,
  role_type: null
})

// Rol dentro del grupo de calendario: solo Jefe o Miembro
const roleTypeOptions = [
  { label: 'Jefe del grupo', value: 'JEFE' },
  { label: 'Miembro', value: 'MIEMBRO' }
]

// Fuentes de color para prioridad visual en el calendario (qué color gana al pintar cada evento).
// No interviene en la carga de eventos: los eventos se cargan en la vista del calendario vía API
// (GET /api/calendar/events). El Jefe recibe todos los eventos; los miembros solo los suyos o "Todos" si eligen ese filtro.
const allSources = [
  { key: 'PRIORIDAD', label: 'Prioridad' },
  { key: 'ACTIVIDAD', label: 'Actividad' },
  { key: 'CONSOLIDADO', label: 'Consolidado' },
  { key: 'USUARIO', label: 'Por perfil' },
  { key: 'COMPLETADO', label: 'Completado' }
]

const jefeOrder = ref(allSources.map(s => ({ ...s })))
const miembroOrder = ref(allSources.map(s => ({ ...s })))

const startCreateGroup = () => {
  editingGroupId.value = null
  groupForm.value = {
    name: '',
    code: '',
    usa_consolidado: true,
    is_active: true
  }
}

const startEditGroup = (group: RoleGroup) => {
  editingGroupId.value = group.id
  groupForm.value = {
    name: group.name,
    code: group.code || '',
    usa_consolidado: group.usa_consolidado,
    is_active: group.is_active
  }
}

const resetGroupForm = () => {
  editingGroupId.value = null
  if (selectedGroupId.value) {
    const g = groups.value.find(gr => gr.id === selectedGroupId.value)
    if (g) {
      startEditGroup(g)
      return
    }
  }
  startCreateGroup()
}

const loadGroups = async () => {
  try {
    loadingGroups.value = true
    const data = await CalendarService.getMyRoleGroups()
    groups.value = data.filter((g: CalendarRoleGroup) => g.role_type === 'JEFE')
    if (!selectedGroupId.value && groups.value.length > 0) {
      selectGroup(groups.value[0])
    }
  } catch (err: any) {
    console.error('Error al cargar grupos de roles:', err)
    showError('Error', err?.message || 'No se pudieron cargar los grupos')
  } finally {
    loadingGroups.value = false
  }
}

const selectGroup = (group: RoleGroup) => {
  selectedGroupId.value = group.id
  startEditGroup(group)
  loadMembers()
  loadGroupConfig()
  loadIntranetUsers()
}

const saveGroup = async () => {
  if (!groupForm.value.name.trim()) {
    showError('Validación', 'El nombre del grupo es obligatorio')
    return
  }
  try {
    savingGroup.value = true
    const payload = {
      name: groupForm.value.name.trim(),
      code: groupForm.value.code?.trim() || null,
      usa_consolidado: groupForm.value.usa_consolidado,
      is_active: groupForm.value.is_active
    }

    if (editingGroupId.value) {
      await CalendarService.updateRoleGroup(editingGroupId.value, payload)
      showSuccess('Grupo actualizado', 'El grupo se actualizó correctamente')
      await loadGroups()
    } else {
      await CalendarService.createRoleGroup(payload)
      showSuccess('Grupo creado', 'El grupo se creó correctamente')
      await loadGroups()
    }
  } catch (err: any) {
    console.error('Error al guardar grupo:', err)
    showError('Error', err?.message || 'Ocurrió un error al guardar el grupo')
  } finally {
    savingGroup.value = false
  }
}

const confirmDeleteGroup = async (group: RoleGroup) => {
  if (!confirm(`¿Eliminar el grupo "${group.name}"? Esta acción no se puede deshacer.`)) {
    return
  }
  try {
    const response = await CalendarService.deleteRoleGroup(group.id)
    if (response.success) {
      showSuccess('Grupo eliminado', response.message || 'El grupo se eliminó correctamente')
      if (selectedGroupId.value === group.id) {
        selectedGroupId.value = null
        editingGroupId.value = null
      }
      await loadGroups()
    } else {
      showError('Error', response.message || 'No se pudo eliminar el grupo')
    }
  } catch (err: any) {
    console.error('Error al eliminar grupo:', err)
    showError('Error', err?.message || 'Ocurrió un error al eliminar el grupo')
  }
}

/** Carga usuarios de la intranet para el selector de miembros (todos los usuarios activos). */
const loadIntranetUsers = async (search: string = '') => {
  try {
    loadingUsers.value = true
    const data = await CalendarService.getIntranetUsers(search)
    userOptions.value = data.map(u => ({
      label: u.email ? `${u.nombre} (${u.email})` : u.nombre,
      value: u.id
    }))
  } catch (err) {
    console.error('Error al cargar usuarios para grupos:', err)
    showError('Error', 'No se pudieron cargar los usuarios de la intranet')
    userOptions.value = []
  } finally {
    loadingUsers.value = false
  }
}

const loadMembers = async () => {
  if (!selectedGroupId.value) return
  try {
    loadingMembers.value = true
    members.value = await CalendarService.getRoleGroupMembers(selectedGroupId.value)
  } catch (err: any) {
    console.error('Error al cargar miembros:', err)
    showError('Error', err?.message || 'Ocurrió un error al cargar los miembros')
  } finally {
    loadingMembers.value = false
  }
}

const saveMember = async () => {
  if (!selectedGroupId.value) return
  if (!memberForm.value.user_id || !memberForm.value.role_type) {
    showError('Validación', 'Debes seleccionar un usuario y un tipo de rol')
    return
  }
  try {
    savingMember.value = true
    await CalendarService.addRoleGroupMember(selectedGroupId.value, {
      user_id: memberForm.value.user_id as number,
      role_type: memberForm.value.role_type as string
    })
    showSuccess('Miembro guardado', 'El miembro se agregó/actualizó correctamente')
    await loadMembers()
  } catch (err: any) {
    console.error('Error al guardar miembro:', err)
    showError('Error', err?.message || 'Ocurrió un error al guardar el miembro')
  } finally {
    savingMember.value = false
  }
}

const removeMember = async (member: RoleGroupMember) => {
  if (!selectedGroupId.value) return
  if (!confirm(`¿Quitar a "${member.user?.nombre || 'usuario #' + member.user_id}" del grupo?`)) {
    return
  }
  try {
    const response = await CalendarService.removeRoleGroupMember(selectedGroupId.value, member.id)
    if (response.success) {
      showSuccess('Miembro eliminado', response.message || 'El miembro se eliminó correctamente')
      await loadMembers()
    } else {
      showError('Error', response.message || 'No se pudo eliminar el miembro')
    }
  } catch (err: any) {
    console.error('Error al eliminar miembro:', err)
    showError('Error', err?.message || 'Ocurrió un error al eliminar el miembro')
  }
}

const loadGroupConfig = async () => {
  if (!selectedGroupId.value) return
  try {
    const cfg = await CalendarService.getRoleGroupConfig(selectedGroupId.value)
    const group = groups.value.find(g => g.id === selectedGroupId.value)
    groupConfigForm.value.usa_consolidado = group?.usa_consolidado ?? true
    groupConfigForm.value.show_event_details = cfg?.show_event_details ?? false

    const jefeCsv = cfg?.jefe_color_priority_order || 'ACTIVIDAD,CONSOLIDADO,USUARIO,PRIORIDAD,COMPLETADO'
    const miembroCsv = cfg?.miembro_color_priority_order || 'USUARIO,PRIORIDAD,ACTIVIDAD,CONSOLIDADO,COMPLETADO'

    const jefeKeys = jefeCsv.split(',').map(s => s.trim()).filter(Boolean)
    const miembroKeys = miembroCsv.split(',').map(s => s.trim()).filter(Boolean)

    const mapOrder = (keys: string[]) => {
      const ordered = keys
        .map(k => allSources.find(s => s.key === k))
        .filter((s): s is { key: string; label: string } => !!s)
      const orderedKeys = new Set(ordered.map(s => s.key))
      const missing = allSources.filter(s => !orderedKeys.has(s.key))
      return [...ordered, ...missing]
    }

    const defaultJefe = ['ACTIVIDAD', 'CONSOLIDADO', 'USUARIO', 'PRIORIDAD', 'COMPLETADO']
    const defaultMiembro = ['USUARIO', 'PRIORIDAD', 'ACTIVIDAD', 'CONSOLIDADO', 'COMPLETADO']
    jefeOrder.value = mapOrder(jefeKeys.length ? jefeKeys : defaultJefe)
    miembroOrder.value = mapOrder(miembroKeys.length ? miembroKeys : defaultMiembro)
  } catch (err: any) {
    console.error('Error al obtener configuración de grupo:', err)
    showError('Error', err?.message || 'Ocurrió un error al obtener la configuración')
  }
}

const saveGroupConfig = async () => {
  if (!selectedGroupId.value) return
  try {
    savingConfig.value = true
    const jefeCsv = jefeOrder.value.map(i => i.key).join(',')
    const miembroCsv = miembroOrder.value.map(i => i.key).join(',')
    await CalendarService.updateRoleGroupConfig(selectedGroupId.value, {
      jefe_color_priority_order: jefeCsv,
      miembro_color_priority_order: miembroCsv,
      usa_consolidado: groupConfigForm.value.usa_consolidado,
      show_event_details: groupConfigForm.value.show_event_details
    })
    showSuccess('Configuración guardada', 'La configuración se guardó correctamente')
    await loadGroups()
  } catch (err: any) {
    console.error('Error al guardar configuración de grupo:', err)
    showError('Error', err?.message || 'Ocurrió un error al guardar la configuración')
  } finally {
    savingConfig.value = false
  }
}

onMounted(async () => {
  await loadGroups()
})

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>

