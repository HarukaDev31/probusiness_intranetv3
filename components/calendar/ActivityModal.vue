<template>
  <UModal class="w-full sm:max-w-2xl">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {{ isEdit ? 'Editar Actividad' : 'Nueva Actividad' }}
        </h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
          @click="close"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-5">
        <!-- Seleccionar o crear actividad -->
        <UFormField label="Actividad" required :error="errors.name">
          <div class="space-y-2">
            <!-- Dropdown con botón crear -->
            <div class="flex gap-2">
              <USelectMenu
                v-model="selectedActivity"
                :items="activityOptions"
                placeholder="Seleccionar actividad"
                size="lg"
                class="flex-1"
                searchable
                searchable-placeholder="Buscar actividad..."
                @update:model-value="handleActivitySelect"
              />
              <UButton
                icon="i-heroicons-plus"
                color="primary"
                variant="outline"
                size="lg"
                title="Crear nueva actividad"
                @click="openCreateActivityModal"
              />
            </div>

            
          </div>
        </UFormField>

        <!-- Modal para crear nueva actividad -->
        <CreateActivityNameModal
          :open="isCreateActivityModalOpen"
          :loading="isCreatingActivity"
          @close="closeCreateActivityModal"
          @create="handleCreateNewActivity"
        />

        <!-- Fechas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Fecha de inicio" required :error="errors.start_date">
            <UPopover>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-heroicons-calendar"
                class="w-full justify-start"
                size="lg"
              >
                {{ startDate ? formatDisplayDate(startDate) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar v-model="startDate" class="p-2" />
              </template>
            </UPopover>
          </UFormField>

          <UFormField label="Fecha de fin" required :error="errors.end_date">
            <UPopover>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-heroicons-calendar"
                class="w-full justify-start"
                size="lg"
              >
                {{ endDate ? formatDisplayDate(endDate) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar v-model="endDate" class="p-2" />
              </template>
            </UPopover>
          </UFormField>
        </div>

        <!-- Prioridad (solo editable si tiene permiso) -->
        <UFormField v-if="calendarPermissions.canEditPriority" label="Prioridad">
          <div class="flex gap-2">
            <UButton
              v-for="option in priorityOptions"
              :key="option.value"
              :label="option.label"
              :variant="form.priority === option.value ? 'solid' : 'outline'"
              :color="option.color"
              size="md"
              class="flex-1"
              @click="form.priority = option.value"
            />
          </div>
        </UFormField>

        <!-- Consolidado/Contenedor -->
        <UFormField label="Consolidado">
          <USelectMenu
            v-model="form.contenedor_id"
            :items="contenedorOptions"
            value-attribute="value"
            placeholder="Seleccionar consolidado"
            size="lg"
            class="w-full"
            searchable
            searchable-placeholder="Buscar consolidado..."
          />
        </UFormField>

        <!-- Responsables (solo si tiene permiso) -->
        <UFormField v-if="calendarPermissions.canAssignResponsables" label="Responsables" :error="errors.responsables">
          <div class="space-y-3">
            <USelectMenu
              v-model="form.responsable_ids"
              :items="responsableOptions"
              value-attribute="value"
              placeholder="Seleccionar responsables"
              size="lg"
              class="w-full"
              multiple
              searchable
              searchable-placeholder="Buscar responsable..."
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: option.color || '#6B7280' }"
                  />
                  <span>{{ option.label }}</span>
                </div>
              </template>
            </USelectMenu>

            <!-- Mostrar responsables seleccionados -->
            <div v-if="form.responsable_ids.length > 0" class="flex flex-wrap gap-2">
              <UBadge
                v-for="id in form.responsable_ids"
                :key="id"
                variant="soft"
                size="lg"
                class="pr-1"
              >
                <div class="flex items-center gap-1">
                  <div
                    class="w-2 h-2 rounded-full"
                    :style="{ backgroundColor: getResponsableColorById(id) }"
                  />
                  <span>{{ getResponsableNameById(id) }}</span>
                  <UButton
                    icon="i-heroicons-x-mark"
                    variant="ghost"
                    size="xs"
                    class="ml-1"
                    @click="removeResponsable(id)"
                  />
                </div>
              </UBadge>
            </div>

            <p class="text-xs text-gray-500 dark:text-gray-400">
              Máximo 2 responsables por actividad
            </p>
          </div>
        </UFormField>

        <!-- Notas -->
        <UFormField label="Notas">
          <UTextarea
            v-model="form.notes"
            placeholder="Agregar notas..."
            :rows="3"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between items-center w-full">
        <UButton
          v-if="isEdit && calendarPermissions.canDeleteActivity"
          label="Eliminar"
          color="error"
          variant="ghost"
          icon="i-heroicons-trash"
          @click="handleDelete"
        />
        <div class="flex gap-2 ml-auto">
          <UButton
            label="Cancelar"
            variant="ghost"
            @click="close"
          />
          <UButton
            :label="isEdit ? 'Guardar cambios' : 'Crear actividad'"
            color="primary"
            :loading="loading"
            @click="submit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CalendarDate, getLocalTimeZone, today, parseDate, DateFormatter } from '@internationalized/date'
import type {
  CalendarEvent,
  CalendarResponsable,
  CalendarContenedor,
  CalendarEventPriority,
  CreateCalendarEventRequest
} from '~/types/calendar'
import { PRIORITY_OPTIONS, MAX_RESPONSABLES_PER_ACTIVITY } from '~/constants/calendar'
import CreateActivityNameModal from '~/components/calendar/CreateActivityNameModal.vue'

// Actividades predefinidas (catálogo)
interface ActivityOption {
  id: number
  name: string
}

interface Props {
  event?: CalendarEvent | null
  responsables: CalendarResponsable[]
  contenedores: CalendarContenedor[]
  calendarPermissions: any
  getResponsableColor: (userId: number, nombre?: string) => string
  loading?: boolean
  initialDate?: string
  // Catálogo de actividades predefinidas
  actividadesPredefinidas?: ActivityOption[]
  // Callbacks para overlay
  onSave?: (data: CreateCalendarEventRequest) => void | Promise<void>
  onDelete?: () => void | Promise<void>
  onClose?: () => void
  onCreateActivity?: (name: string) => Promise<ActivityOption | null>
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  loading: false,
  initialDate: undefined,
  actividadesPredefinidas: () => [],
  onSave: undefined,
  onDelete: undefined,
  onClose: undefined,
  onCreateActivity: undefined
})

const emit = defineEmits<{
  (e: 'save', data: CreateCalendarEventRequest): void
  (e: 'delete'): void
  (e: 'close'): void
  (e: 'create-activity', name: string): void
}>()

const df = new DateFormatter('es-ES', { dateStyle: 'long' })

// Estado del formulario
const form = ref({
  name: '',
  activity_id: null as number | null,
  priority: 0 as CalendarEventPriority,
  contenedor_id: null as number | null,
  responsable_ids: [] as number[],
  notes: ''
})

const startDate = ref<CalendarDate | null>(null)
const endDate = ref<CalendarDate | null>(null)
const errors = ref<Record<string, string>>({})

// Estado para selección/creación de actividad
const selectedActivity = ref<{ label: string; value: number } | null>(null)
const isCreateActivityModalOpen = ref(false)
const isCreatingActivity = ref(false)
const localActivities = ref<ActivityOption[]>([])

// Computed
const isEdit = computed(() => !!props.event?.id)

const priorityOptions = PRIORITY_OPTIONS

// Combinar actividades predefinidas con las locales (nuevas creadas)
const activityOptions = computed(() => {
  const allActivities = [...props.actividadesPredefinidas, ...localActivities.value]
  return allActivities.map(a => ({
    label: a.name,
    value: a.id
  }))
})

const contenedorOptions = computed(() => {
  const options: any[] = [{ label: 'Sin consolidado', value: null }]
  props.contenedores.forEach(c => {
    options.push({
      label: c.nombre || c.codigo || `#${c.id}`,
      value: c.id
    })
  })
  return options
})

const responsableOptions = computed(() => {
  return props.responsables.map(r => ({
    label: r.nombre,
    value: r.id,
    color: props.getResponsableColor(r.id, r.nombre),
    disabled: form.value.responsable_ids.length >= MAX_RESPONSABLES_PER_ACTIVITY && !form.value.responsable_ids.includes(r.id)
  }))
})

// Funciones para manejo de actividades
const handleActivitySelect = (selected: { label: string; value: number } | null) => {
  if (selected) {
    form.value.name = selected.label
    form.value.activity_id = selected.value
  } else {
    form.value.name = ''
    form.value.activity_id = null
  }
}

const openCreateActivityModal = () => {
  isCreateActivityModalOpen.value = true
}

const closeCreateActivityModal = () => {
  isCreateActivityModalOpen.value = false
}

const handleCreateNewActivity = async (name: string) => {
  isCreatingActivity.value = true

  try {
    // Si hay callback para crear en el backend
    if (props.onCreateActivity) {
      const newActivity = await props.onCreateActivity(name)
      if (newActivity) {
        localActivities.value.push(newActivity)
        form.value.name = newActivity.name
        form.value.activity_id = newActivity.id
        selectedActivity.value = { label: newActivity.name, value: newActivity.id }
        closeCreateActivityModal()
      }
    } else {
      // Crear localmente con ID temporal negativo
      const tempId = -(localActivities.value.length + 1)
      const newActivity: ActivityOption = { id: tempId, name }
      localActivities.value.push(newActivity)
      form.value.name = name
      form.value.activity_id = tempId
      selectedActivity.value = { label: name, value: tempId }
      emit('create-activity', name)
      closeCreateActivityModal()
    }
  } catch (error) {
    console.error('Error al crear actividad:', error)
  } finally {
    isCreatingActivity.value = false
  }
}

const clearActivity = () => {
  form.value.name = ''
  form.value.activity_id = null
  selectedActivity.value = null
}

// Helpers
const formatDisplayDate = (date: CalendarDate): string => {
  return df.format(date.toDate(getLocalTimeZone()))
}

const getResponsableNameById = (id: number): string => {
  const responsable = props.responsables.find(r => r.id === id)
  return responsable?.nombre || 'Desconocido'
}

const getResponsableColorById = (id: number): string => {
  const responsable = props.responsables.find(r => r.id === id)
  return props.getResponsableColor(id, responsable?.nombre)
}

const removeResponsable = (id: number) => {
  form.value.responsable_ids = form.value.responsable_ids.filter(rid => rid !== id)
}

// Validación
const validate = (): boolean => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'El nombre es requerido'
  }

  if (!startDate.value) {
    errors.value.start_date = 'La fecha de inicio es requerida'
  }

  if (!endDate.value) {
    errors.value.end_date = 'La fecha de fin es requerida'
  }

  if (startDate.value && endDate.value) {
    const start = startDate.value.toDate(getLocalTimeZone())
    const end = endDate.value.toDate(getLocalTimeZone())
    if (start > end) {
      errors.value.end_date = 'La fecha de fin debe ser posterior a la de inicio'
    }
  }

  if (props.calendarPermissions.canAssignResponsables && form.value.responsable_ids.length === 0) {
    errors.value.responsables = 'Debe asignar al menos un responsable'
  }

  return Object.keys(errors.value).length === 0
}

// Acciones
const submit = async () => {
  if (!validate()) return

  const formatDate = (date: CalendarDate): string => {
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  }

  // Extraer valores correctamente (por si vienen como objetos)
  const extractValue = (val: any): number | null => {
    if (val === null || val === undefined) return null
    if (typeof val === 'number') return val
    if (typeof val === 'object' && 'value' in val) return val.value
    return null
  }

  const extractIds = (vals: any[]): number[] => {
    return vals.map(v => {
      if (typeof v === 'number') return v
      if (typeof v === 'object' && 'value' in v) return v.value
      return v
    }).filter((v): v is number => typeof v === 'number')
  }

  const data: CreateCalendarEventRequest = {
    name: form.value.name.trim(),
    priority: form.value.priority,
    contenedor_id: extractValue(form.value.contenedor_id),
    notes: form.value.notes.trim() || null,
    start_date: formatDate(startDate.value!),
    end_date: formatDate(endDate.value!),
    responsable_ids: extractIds(form.value.responsable_ids)
  }

  // Usar callback si existe, si no usar emit
  if (props.onSave) {
    await props.onSave(data)
  } else {
    emit('save', data)
  }
}

const close = () => {
  // Usar callback si existe, si no usar emit
  if (props.onClose) {
    props.onClose()
  } else {
    emit('close')
  }
}

const handleDelete = async () => {
  if (props.onDelete) {
    await props.onDelete()
  } else {
    emit('delete')
  }
}

// Inicializar formulario
const initializeForm = () => {
  // Reset estado de creación de actividad
  isCreateActivityModalOpen.value = false
  isCreatingActivity.value = false

  if (props.event) {
    form.value.name = props.event.name || props.event.title || ''
    form.value.activity_id = props.event.id || null
    form.value.priority = props.event.priority || 0
    form.value.contenedor_id = props.event.contenedor_id || null
    form.value.notes = props.event.notes || ''
    form.value.responsable_ids = props.event.charges?.map(c => c.user_id) || []

    // Buscar si la actividad existe en las predefinidas
    const existingActivity = props.actividadesPredefinidas.find(
      a => a.name === form.value.name || a.id === props.event?.id
    )
    if (existingActivity) {
      selectedActivity.value = { label: existingActivity.name, value: existingActivity.id }
    } else if (form.value.name) {
      // Si tiene nombre pero no está en las predefinidas, mostrar el nombre
      selectedActivity.value = null
    } else {
      selectedActivity.value = null
    }

    // Fechas
    const startDateStr = props.event.start_date || (props.event.days?.[0]?.date)
    const endDateStr = props.event.end_date || (props.event.days?.[props.event.days.length - 1]?.date)

    if (startDateStr) {
      try {
        startDate.value = parseDate(startDateStr) as CalendarDate
      } catch {
        startDate.value = today(getLocalTimeZone())
      }
    }

    if (endDateStr) {
      try {
        endDate.value = parseDate(endDateStr) as CalendarDate
      } catch {
        endDate.value = today(getLocalTimeZone())
      }
    }
  } else {
    // Nuevo evento
    form.value = {
      name: '',
      activity_id: null,
      priority: 0,
      contenedor_id: null,
      responsable_ids: [],
      notes: ''
    }
    selectedActivity.value = null

    if (props.initialDate) {
      try {
        startDate.value = parseDate(props.initialDate) as CalendarDate
        endDate.value = parseDate(props.initialDate) as CalendarDate
      } catch {
        startDate.value = today(getLocalTimeZone())
        endDate.value = today(getLocalTimeZone())
      }
    } else {
      startDate.value = today(getLocalTimeZone())
      endDate.value = today(getLocalTimeZone())
    }
  }
}

// Watch para reinicializar cuando cambia el evento
watch(() => props.event, () => {
  initializeForm()
}, { immediate: true })

// Limitar responsables a MAX_RESPONSABLES_PER_ACTIVITY
watch(() => form.value.responsable_ids, (newIds) => {
  if (newIds.length > MAX_RESPONSABLES_PER_ACTIVITY) {
    form.value.responsable_ids = newIds.slice(0, MAX_RESPONSABLES_PER_ACTIVITY)
  }
})

onMounted(() => {
  initializeForm()
})
</script>
