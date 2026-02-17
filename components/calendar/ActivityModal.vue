<template>

  <UModal
    class="w-full sm:max-w-2xl"
    :dismissible="false"
    :close="{ onClick: handleClose }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {{ isEdit ? 'Editar Actividad' : 'Nueva Actividad' }}
        </h3>

      </div>
    </template>

    <template #body>
      <div class="space-y-5">
        <!-- Seleccionar o crear actividad -->
        <UFormField label="Actividad" required :error="errors.name">
          <div class="space-y-2">
            <!-- Dropdown con botón crear -->
            <div class="flex gap-2 items-center">
              <USelectMenu v-model="selectedActivity" :items="activityOptions" placeholder="Seleccionar actividad"
                size="lg" class="flex-1" searchable searchable-placeholder="Buscar actividad..."
                @update:model-value="handleActivitySelect" />
              <UButton icon="i-heroicons-plus" color="primary" variant="outline" size="lg" title="Crear nueva actividad"
                @click="openCreateActivityModal" />
              <UTooltip v-if="hasCatalogActivityId && (calendarPermissions?.canDeleteActivity ?? false)"
                text="Editar nombre de esta actividad">
                <UButton icon="i-heroicons-pencil-square" color="primary" variant="ghost" size="lg" class="!p-2"
                  @click.stop.prevent="openEditActivityModal" />
              </UTooltip>
              <UTooltip v-if="hasCatalogActivityId && (calendarPermissions?.canDeleteActivity ?? false)"
                text="Eliminar esta actividad del catálogo">
                <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="lg" class="!p-2"
                  title="Eliminar del catálogo" @click.stop.prevent="openDeleteConfirmModal" />
              </UTooltip>
            </div>


          </div>
        </UFormField>

        <!-- Modal para crear nueva actividad -->
        <CreateActivityNameModal :open="isCreateActivityModalOpen" :loading="isCreatingActivity"
          @close="closeCreateActivityModal" @create="handleCreateNewActivity" />

        <!-- Modal para editar nombre de actividad -->
        <EditActivityNameModal
          v-model:open="isEditActivityModalOpen"
          :activity-id="form.activity_id ?? selectedActivity?.value ?? null"
          :activity-name="selectedActivity?.label ?? ''"
          :loading="isUpdatingActivity"
          @save="handleEditActivity"
        />

        <!-- Fechas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Fecha de inicio" required :error="errors.start_date">
            <UPopover>
              <UButton color="neutral" variant="outline" icon="i-heroicons-calendar" class="w-full justify-start"
                size="lg">
                {{ startDate ? formatDisplayDate(startDate) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar v-model="startDate" class="p-2" :is-date-disabled="isWeekendDisabled" />
              </template>
            </UPopover>
          </UFormField>

          <UFormField label="Fecha de fin" required :error="errors.end_date">
            <UPopover>
              <UButton color="neutral" variant="outline" icon="i-heroicons-calendar" class="w-full justify-start"
                size="lg">
                {{ endDate ? formatDisplayDate(endDate) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar v-model="endDate" class="p-2" :is-date-disabled="isWeekendDisabled" />
              </template>
            </UPopover>
          </UFormField>
        </div>

        <!-- Prioridad (solo editable si tiene permiso) -->
        <UFormField v-if="calendarPermissions.canEditPriority" label="Prioridad">
          <div class="flex gap-2">
            <UButton v-for="option in priorityOptions" :key="option.value" :label="option.label"
              :variant="form.priority === option.value ? 'solid' : 'outline'" :color="option.color" size="md"
              class="flex-1" @click="form.priority = option.value" />
          </div>
        </UFormField>

        <!-- Consolidado/Contenedor -->
        <UFormField label="Consolidado">
          <USelectMenu :model-value="selectedContenedorOption" :items="contenedorOptions" value-attribute="value"
            placeholder="Seleccionar consolidado" size="lg" class="w-full" searchable
            searchable-placeholder="Buscar consolidado..." @update:model-value="onContenedorChange" />
        </UFormField>

        <!-- Responsables (solo si tiene permiso) -->
        <UFormField v-if="calendarPermissions.canAssignResponsables" label="Responsables" :error="errors.responsables">
          <div class="space-y-3">
            <USelectMenu :model-value="selectedResponsableOptions" :items="responsableOptions" value-attribute="value"
              placeholder="Seleccionar responsables" size="lg" class="w-full" multiple searchable
              searchable-placeholder="Buscar responsable..." @update:model-value="onResponsablesChange">
              <template #item="{ item }">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: item.color || '#6B7280' }" />
                  <span>{{ item.label }}</span>
                </div>
              </template>
            </USelectMenu>

            <!-- Mostrar responsables seleccionados (id puede ser número u objeto según USelectMenu) -->
            <div v-if="form.responsable_ids.length > 0" class="flex flex-wrap gap-2">
              <UBadge v-for="(item, index) in form.responsable_ids" :key="toResponsableId(item) ?? index" variant="soft"
                size="lg" class="pr-1">
                <div class="flex items-center gap-1">
                  <div class="w-2 h-2 rounded-full"
                    :style="{ backgroundColor: getResponsableColorById(toResponsableId(item)) }" />
                  <span>{{ getResponsableNameById(toResponsableId(item)) }}</span>
                  <UButton icon="i-heroicons-x-mark" variant="ghost" size="xs" class="ml-1"
                    @click="removeResponsable(item)" />
                </div>
              </UBadge>
            </div>


          </div>
        </UFormField>

        <!-- Notas -->
        <UFormField label="Notas">
          <UTextarea v-model="form.notes" placeholder="Agregar notas..." :rows="3" class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton label="Cancelar" variant="ghost" @click="handleClose" />
        <UButton :label="isEdit ? 'Guardar cambios' : 'Crear actividad'" color="primary" :loading="loading"
          @click="submit" />
      </div>
    </template>
  </UModal>


</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CalendarDate, getLocalTimeZone, today, parseDate, DateFormatter } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import type {
  CalendarEvent,
  CalendarResponsable,
  CalendarContenedor,
  CalendarEventPriority,
  CreateCalendarEventRequest
} from '~/types/calendar'
import { PRIORITY_OPTIONS } from '~/constants/calendar'
import CreateActivityNameModal from '~/components/calendar/CreateActivityNameModal.vue'
import EditActivityNameModal from '~/components/calendar/EditActivityNameModal.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'

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
  /** Clave que cambia en cada open() del overlay para poder reabrir el modal (misma instancia) */
  openKey?: number | string
  // Catálogo de actividades predefinidas
  actividadesPredefinidas?: ActivityOption[]
  // Callbacks para overlay (onClose puede venir como función o como array desde useOverlay)
  onSave?: (data: CreateCalendarEventRequest) => void | Promise<void>
  onDelete?: () => void | Promise<void>
  onDeleteFromCatalog?: (catalogActivityId: number) => void | Promise<void>
  onClose?: (() => void) | (() => void)[]
  onCreateActivity?: (name: string) => Promise<ActivityOption | null>
  onUpdateActivity?: (id: number, name: string) => Promise<boolean>
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  loading: false,
  initialDate: undefined,
  actividadesPredefinidas: () => [],
  onSave: undefined,
  onDelete: undefined,
  onClose: undefined,
  onCreateActivity: undefined,
  onUpdateActivity: undefined
})

const emit = defineEmits<{
  (e: 'save', data: CreateCalendarEventRequest): void
  (e: 'delete'): void
  (e: 'delete-from-catalog', catalogActivityId: number): void
  (e: 'close'): void
  (e: 'create-activity', name: string): void
}>()

// Sincronizado con el overlay: al montar o al recibir nuevas props (reopen) el modal debe estar abierto
const modalOpen = ref(true)

const handleClose = () => {
  initializeForm()
  modalOpen.value = false
  emit('close')
  const fn = Array.isArray(props.onClose) ? props.onClose[0] : props.onClose
  if (typeof fn === 'function') {
    fn()
  }
}

const onOpenChange = (open: boolean) => {
  if (!open) handleClose()
}

onMounted(() => {
  modalOpen.value = true
})

watch(
  () => [props.openKey, props.event?.id ?? null, props.initialDate],
  () => {
    modalOpen.value = true
  },
  { flush: 'sync' }
)

const df = new DateFormatter('es-ES', { dateStyle: 'long' })

/** Deshabilita sábado (6) y domingo (0) en el calendario (días no laborables). */
const isWeekendDisabled = (date: DateValue): boolean => {
  if (!date) return false
  try {
    const d =
      typeof (date as { toDate?: (zone: string) => Date }).toDate === 'function'
        ? (date as { toDate: (zone: string) => Date }).toDate(getLocalTimeZone())
        : new Date(
          (date as { year: number }).year,
          ((date as { month: number }).month ?? 1) - 1,
          (date as { day: number }).day
        )
    const dayOfWeek = d.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  } catch {
    return false
  }
}

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

/** Hay una actividad del catálogo seleccionada (para mostrar "Eliminar del catálogo") */
const hasCatalogActivityId = computed(() => {
  const formId = form.value.activity_id
  if (formId != null && typeof formId === 'number') return true
  const sel = selectedActivity.value
  if (sel == null) return false
  if (typeof sel === 'number') return true
  if (typeof sel === 'object' && sel && 'value' in sel && typeof (sel as { value: number }).value === 'number') return true
  return false
})

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
  const options: { label: string; value: number | null }[] = [{ label: 'Sin consolidado', value: null }]
  const addedIds = new Set<number>()
  props.contenedores.forEach(c => {
    options.push({
      label: c.nombre || c.codigo || `#${c.id}`,
      value: c.id
    })
    addedIds.add(c.id)
  })
  // Si estamos editando y el evento tiene contenedor que no está en la lista, añadirlo para que se muestre
  const eventContenedor = props.event?.contenedor
  if (eventContenedor?.id != null && !addedIds.has(Number(eventContenedor.id))) {
    options.push({
      label: eventContenedor.nombre || eventContenedor.codigo || `#${eventContenedor.id}`,
      value: Number(eventContenedor.id)
    })
  }
  return options
})

type ContenedorOption = { label: string; value: number | null }
const selectedContenedorOption = computed(() => {
  const id = form.value.contenedor_id
  return contenedorOptions.value.find((o: ContenedorOption) => o.value === id) ?? null
})
const onContenedorChange = (payload: ContenedorOption | number | null) => {
  if (payload == null) {
    form.value.contenedor_id = null
    return
  }
  form.value.contenedor_id = typeof payload === 'object' && 'value' in payload ? payload.value : (typeof payload === 'number' ? payload : null)
}

const responsableOptions = computed(() => {
  return props.responsables.map(r => ({
    label: r.nombre,
    value: r.id,
    color: props.getResponsableColor(r.id, r.nombre)
  }))
})

type ResponsableOption = { label: string; value: number; color: string }
const selectedResponsableOptions = computed(() => {
  const ids = form.value.responsable_ids
  return responsableOptions.value.filter((o: ResponsableOption) =>
    ids.some((id: number | unknown) => toResponsableId(id) === o.value)
  )
})
const onResponsablesChange = (payload: ResponsableOption[] | number[] | unknown) => {
  const arr = Array.isArray(payload) ? payload : []
  form.value.responsable_ids = arr.map((item: unknown) => toResponsableId(item)).filter((id): id is number => typeof id === 'number')
}

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
    // Si hay callback para crear en el backend (catálogo): no pushear a localActivities
    // porque el store ya actualiza activityCatalog y viene como actividadesPredefinidas.
    if (props.onCreateActivity) {
      const newActivity = await props.onCreateActivity(name)
      if (newActivity) {
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

// Editar actividad del catálogo
const isEditActivityModalOpen = ref(false)
const isUpdatingActivity = ref(false)

const openEditActivityModal = () => {
  isEditActivityModalOpen.value = true
}

const handleEditActivity = async ({ id, name }: { id: number; name: string }) => {
  isUpdatingActivity.value = true
  try {
    if (props.onUpdateActivity) {
      const ok = await props.onUpdateActivity(id, name)
      if (ok) {
        // Actualizar el item seleccionado localmente
        form.value.name = name
        if (selectedActivity.value) {
          selectedActivity.value = { label: name, value: selectedActivity.value.value }
        }
        isEditActivityModalOpen.value = false
      }
    } else {
      isEditActivityModalOpen.value = false
    }
  } finally {
    isUpdatingActivity.value = false
  }
}

// Helpers
const formatDisplayDate = (date: CalendarDate): string => {
  return df.format(date.toDate(getLocalTimeZone()))
}

// Normalizar id: USelectMenu multiple puede guardar número o objeto { value }
const toResponsableId = (item: number | { value?: number } | unknown): number => {
  if (typeof item === 'number') return item
  if (item && typeof item === 'object' && 'value' in item && typeof (item as { value: number }).value === 'number') {
    return (item as { value: number }).value
  }
  return Number(item)
}

const getResponsableNameById = (id: number): string => {
  const responsable = props.responsables.find(r => r.id === id)
  return responsable?.nombre || 'Desconocido'
}

const getResponsableColorById = (id: number): string => {
  const responsable = props.responsables.find(r => r.id === id)
  return props.getResponsableColor(id, responsable?.nombre)
}

const removeResponsable = (item: number | { value?: number }) => {
  const id = toResponsableId(item)
  form.value.responsable_ids = form.value.responsable_ids.filter(rid => toResponsableId(rid) !== id)
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

  try {
    if (props.onSave) {
      await props.onSave(data)
    } else {
      emit('save', data)
    }
    handleClose()
  } catch {
    // El padre ya muestra el error; no cerrar el modal
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

const { showConfirmation } = useModal()
const { withSpinner } = useSpinner()

const handleDelete = async () => {
  if (props.onDelete) {
    await props.onDelete()
  } else {
    emit('delete')
  }
}

const openDeleteConfirmModal = () => {
  const id = form.value.activity_id ?? selectedActivity.value?.value ?? null
  if (id == null) return
  showConfirmation(
    'Eliminar del catálogo',
    '¿Está seguro de que desea eliminar esta actividad del catálogo? Los eventos ya creados con esta actividad no se modifican.',
    async () => {
      await withSpinner(async () => {
        if (props.onDeleteFromCatalog) {
          await props.onDeleteFromCatalog(id)
        } else {
          emit('delete-from-catalog', id)
        }
        selectedActivity.value = null
        form.value.activity_id = null
        form.value.name = ''
      }, 'Eliminando del catálogo...')
    },
    undefined,
    { persistent: true }
  )
}

// Inicializar formulario
const initializeForm = () => {
  errors.value = {}
  isCreateActivityModalOpen.value = false
  isCreatingActivity.value = false

  if (props.event) {
    form.value.name = props.event.name || props.event.title || ''
    form.value.activity_id = props.event.activity_id ?? null
    form.value.priority = props.event.priority ?? 0
    const rawContenedorId = props.event.contenedor_id ?? props.event.contenedor?.id ?? null
    form.value.contenedor_id = rawContenedorId != null ? Number(rawContenedorId) : null
    form.value.notes = props.event.notes || ''
    form.value.responsable_ids = props.event.charges?.map(c => c.user_id) || []

    // Buscar si la actividad existe en las predefinidas (por nombre o por id de catálogo)
    const existingActivity = props.actividadesPredefinidas.find(
      a => a.name === form.value.name || a.id === props.event?.activity_id
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

    // Fecha inicial: la pasada (ej. día clicado) o hoy
    if (props.initialDate) {
      try {
        const parsed = parseDate(props.initialDate) as CalendarDate
        startDate.value = parsed
        endDate.value = parsed
      } catch {
        const todayDate = today(getLocalTimeZone())
        startDate.value = todayDate
        endDate.value = todayDate
      }
    } else {
      const todayDate = today(getLocalTimeZone())
      startDate.value = todayDate
      endDate.value = todayDate
    }
  }
}

// Watch para reinicializar cuando cambia el evento
watch(() => props.event, () => {
  initializeForm()
}, { immediate: true })

// Al reabrir con otro día (mismo event null, distinto initialDate) reinicializar fechas
watch(
  () => [props.openKey, props.initialDate],
  () => {
    if (!props.event && props.initialDate) {
      try {
        const parsed = parseDate(props.initialDate) as CalendarDate
        startDate.value = parsed
        endDate.value = parsed
      } catch {
        //
      }
    }
  }
)

onMounted(() => {
  initializeForm()
})
</script>
