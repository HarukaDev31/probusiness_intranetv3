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
          @click="router.back()"
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
                size="xs"
                variant="ghost"
                @click.stop="startEditGroup(group)"
              />
              <UButton
                icon="i-heroicons-trash"
                size="xs"
                variant="ghost"
                color="error"
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
                  size="xs"
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
                    :search-input="{ placeholder: 'Escribe para buscar en toda la intranet' }"
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
                    size="xs"
                    variant="ghost"
                    color="error"
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
                  size="xs"
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
                  <USwitch v-model="groupConfigForm.usa_consolidado" />
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
import { onMounted, ref } from 'vue'
import draggable from 'vuedraggable'
import { CalendarService } from '~/services/calendar/calendarService'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import type {
  CalendarColorSource,
  CalendarMyRoleGroup,
  CalendarRoleGroupMember,
  CalendarRoleGroupPayload,
  CalendarRoleType
} from '~/types/calendar'
import { COLOR_SOURCE_LABELS, DEFAULT_JEFE_COLOR_ORDER, DEFAULT_MIEMBRO_COLOR_ORDER } from '~/constants/calendar'

interface ColorSourceItem {
  key: CalendarColorSource
  label: string
}

const router = useRouter()
const { invalidateConfig } = useCalendarStore()
const { showSuccess, showError, showConfirmation } = useModal()

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

// ============================================
// GRUPOS
// ============================================

/** Solo los grupos donde el usuario es jefe. */
const groups = ref<CalendarMyRoleGroup[]>([])
const loadingGroups = ref(false)
const savingGroup = ref(false)
const selectedGroupId = ref<number | null>(null)
const editingGroupId = ref<number | null>(null)

const emptyGroupForm = () => ({ name: '', code: '', usa_consolidado: true, is_active: true })
const groupForm = ref(emptyGroupForm())

const startCreateGroup = () => {
  editingGroupId.value = null
  groupForm.value = emptyGroupForm()
}

const startEditGroup = (group: CalendarMyRoleGroup) => {
  editingGroupId.value = group.id
  groupForm.value = { name: group.name, code: group.code ?? '', usa_consolidado: group.usa_consolidado, is_active: group.is_active }
}

const resetGroupForm = () => {
  const selected = groups.value.find(g => g.id === selectedGroupId.value)
  if (selected) startEditGroup(selected)
  else startCreateGroup()
}

const loadGroups = async () => {
  loadingGroups.value = true
  try {
    const data = await CalendarService.getMyRoleGroups()
    groups.value = data.filter(g => g.role_type === 'JEFE')
    if (!selectedGroupId.value && groups.value.length) selectGroup(groups.value[0])
  } catch (err) {
    showError('Error', errorText(err, 'No se pudieron cargar los grupos'))
  } finally {
    loadingGroups.value = false
  }
}

const selectGroup = (group: CalendarMyRoleGroup) => {
  selectedGroupId.value = group.id
  startEditGroup(group)
  loadMembers()
  loadGroupConfig()
  loadIntranetUsers()
}

const saveGroup = async () => {
  const name = groupForm.value.name.trim()
  if (!name) {
    showError('Validación', 'El nombre del grupo es obligatorio')
    return
  }
  const payload: CalendarRoleGroupPayload = {
    name,
    code: groupForm.value.code.trim() || null,
    usa_consolidado: groupForm.value.usa_consolidado,
    is_active: groupForm.value.is_active
  }
  savingGroup.value = true
  try {
    if (editingGroupId.value) {
      await CalendarService.updateRoleGroup(editingGroupId.value, payload)
      showSuccess('Grupo actualizado', 'El grupo se actualizó correctamente')
    } else {
      await CalendarService.createRoleGroup(payload)
      showSuccess('Grupo creado', 'El grupo se creó correctamente')
    }
    invalidateConfig()
    await loadGroups()
  } catch (err) {
    showError('Error', errorText(err, 'Ocurrió un error al guardar el grupo'))
  } finally {
    savingGroup.value = false
  }
}

const confirmDeleteGroup = (group: CalendarMyRoleGroup) => {
  showConfirmation('Eliminar grupo', `¿Eliminar el grupo "${group.name}"? Esta acción no se puede deshacer.`, async () => {
    try {
      const response = await CalendarService.deleteRoleGroup(group.id)
      if (!response.success) {
        showError('Error', response.message ?? 'No se pudo eliminar el grupo')
        return
      }
      showSuccess('Grupo eliminado', response.message ?? 'El grupo se eliminó correctamente')
      if (selectedGroupId.value === group.id) {
        selectedGroupId.value = null
        editingGroupId.value = null
      }
      invalidateConfig()
      await loadGroups()
    } catch (err) {
      showError('Error', errorText(err, 'Ocurrió un error al eliminar el grupo'))
    }
  })
}

// ============================================
// MIEMBROS
// ============================================

const members = ref<CalendarRoleGroupMember[]>([])
const loadingMembers = ref(false)
const savingMember = ref(false)
const userOptions = ref<{ label: string; value: number }[]>([])
const loadingUsers = ref(false)
const memberForm = ref<{ user_id: number | undefined; role_type: CalendarRoleType | undefined }>({ user_id: undefined, role_type: undefined })

const roleTypeOptions: { label: string; value: CalendarRoleType }[] = [
  { label: 'Jefe del grupo', value: 'JEFE' },
  { label: 'Miembro', value: 'MIEMBRO' }
]

const loadIntranetUsers = async () => {
  loadingUsers.value = true
  try {
    const users = await CalendarService.getIntranetUsers()
    userOptions.value = users.map(u => ({ label: u.email ? `${u.nombre} (${u.email})` : u.nombre, value: u.id }))
  } catch {
    showError('Error', 'No se pudieron cargar los usuarios de la intranet')
    userOptions.value = []
  } finally {
    loadingUsers.value = false
  }
}

const loadMembers = async () => {
  if (!selectedGroupId.value) return
  loadingMembers.value = true
  try {
    members.value = await CalendarService.getRoleGroupMembers(selectedGroupId.value)
  } catch (err) {
    showError('Error', errorText(err, 'Ocurrió un error al cargar los miembros'))
  } finally {
    loadingMembers.value = false
  }
}

const saveMember = async () => {
  const groupId = selectedGroupId.value
  const { user_id, role_type } = memberForm.value
  if (!groupId) return
  if (!user_id || !role_type) {
    showError('Validación', 'Debes seleccionar un usuario y un tipo de rol')
    return
  }
  savingMember.value = true
  try {
    await CalendarService.addRoleGroupMember(groupId, { user_id, role_type })
    showSuccess('Miembro guardado', 'El miembro se agregó/actualizó correctamente')
    invalidateConfig()
    await loadMembers()
  } catch (err) {
    showError('Error', errorText(err, 'Ocurrió un error al guardar el miembro'))
  } finally {
    savingMember.value = false
  }
}

const removeMember = (member: CalendarRoleGroupMember) => {
  const groupId = selectedGroupId.value
  if (!groupId) return
  const who = member.user?.nombre ?? `usuario #${member.user_id}`
  showConfirmation('Quitar miembro', `¿Quitar a "${who}" del grupo?`, async () => {
    try {
      const response = await CalendarService.removeRoleGroupMember(groupId, member.id)
      if (!response.success) {
        showError('Error', response.message ?? 'No se pudo eliminar el miembro')
        return
      }
      showSuccess('Miembro eliminado', response.message ?? 'El miembro se eliminó correctamente')
      invalidateConfig()
      await loadMembers()
    } catch (err) {
      showError('Error', errorText(err, 'Ocurrió un error al eliminar el miembro'))
    }
  })
}

// ============================================
// PRIORIDAD DE COLORES Y OPCIONES DEL GRUPO
// ============================================

const ALL_SOURCES = Object.keys(COLOR_SOURCE_LABELS) as CalendarColorSource[]
const isColorSource = (key: string): key is CalendarColorSource => (ALL_SOURCES as string[]).includes(key)
const toItems = (keys: CalendarColorSource[]): ColorSourceItem[] => keys.map(key => ({ key, label: COLOR_SOURCE_LABELS[key] }))

/** CSV guardado → orden completo (las fuentes que falten se agregan al final). */
const parseOrder = (csv: string | null, fallback: CalendarColorSource[]): ColorSourceItem[] => {
  const keys = (csv ?? '').split(',').map(s => s.trim()).filter(isColorSource)
  const ordered = keys.length ? keys : fallback
  return toItems([...ordered, ...ALL_SOURCES.filter(k => !ordered.includes(k))])
}

const jefeOrder = ref<ColorSourceItem[]>(toItems(DEFAULT_JEFE_COLOR_ORDER))
const miembroOrder = ref<ColorSourceItem[]>(toItems(DEFAULT_MIEMBRO_COLOR_ORDER))
const groupConfigForm = ref({ usa_consolidado: true, show_event_details: false })
const savingConfig = ref(false)

const loadGroupConfig = async () => {
  const groupId = selectedGroupId.value
  if (!groupId) return
  try {
    const config = await CalendarService.getRoleGroupConfig(groupId)
    groupConfigForm.value = {
      usa_consolidado: groups.value.find(g => g.id === groupId)?.usa_consolidado ?? true,
      show_event_details: config?.show_event_details ?? false
    }
    jefeOrder.value = parseOrder(config?.jefe_color_priority_order ?? null, DEFAULT_JEFE_COLOR_ORDER)
    miembroOrder.value = parseOrder(config?.miembro_color_priority_order ?? null, DEFAULT_MIEMBRO_COLOR_ORDER)
  } catch (err) {
    showError('Error', errorText(err, 'Ocurrió un error al obtener la configuración'))
  }
}

const saveGroupConfig = async () => {
  const groupId = selectedGroupId.value
  if (!groupId) return
  savingConfig.value = true
  try {
    await CalendarService.updateRoleGroupConfig(groupId, {
      jefe_color_priority_order: jefeOrder.value.map(i => i.key).join(','),
      miembro_color_priority_order: miembroOrder.value.map(i => i.key).join(','),
      usa_consolidado: groupConfigForm.value.usa_consolidado,
      show_event_details: groupConfigForm.value.show_event_details
    })
    showSuccess('Configuración guardada', 'La configuración se guardó correctamente')
    invalidateConfig()
    await loadGroups()
  } catch (err) {
    showError('Error', errorText(err, 'Ocurrió un error al guardar la configuración'))
  } finally {
    savingConfig.value = false
  }
}

onMounted(loadGroups)

definePageMeta({
  middleware: ['auth', 'calendar-jefe']
})
</script>
