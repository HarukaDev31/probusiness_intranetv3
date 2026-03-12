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
        <!-- Consolidado/Contenedor (solo si el grupo usa consolidado) -->
        <UFormField v-if="usaConsolidado" label="Consolidado" required>
          <USelectMenu :model-value="selectedContenedorOption" :items="contenedorOptions" value-attribute="value"
            placeholder="Seleccionar consolidado" size="lg" class="w-full" searchable
            searchable-placeholder="Buscar consolidado..." @update:model-value="onContenedorChange" />
        </UFormField>

        <!-- Seleccionar o crear actividad -->
        <UFormField label="Actividad" required :error="errors.name">
          <div class="space-y-2">
            <div class="flex gap-2 items-center">
              <USelectMenu v-model="selectedActivity" :items="activityOptions" :placeholder="loadingUsedActivities ? 'Cargando actividades...' : 'Seleccionar actividad'"
                size="lg" class="flex-1" searchable searchable-placeholder="Buscar actividad..."
                :disabled="(usaConsolidado && form.contenedor_id == null) || loadingUsedActivities"
                :loading="loadingUsedActivities"
                @update:model-value="handleActivitySelect" />
              <UButton icon="i-heroicons-plus" color="primary" variant="outline" size="lg" title="Crear nueva actividad"
                :disabled="(usaConsolidado && form.contenedor_id == null) || loadingUsedActivities"
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
            <p v-if="usaConsolidado && form.contenedor_id == null" class="text-xs text-amber-500">Selecciona un consolidado primero</p>
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

        <!-- Fechas (deshabilitadas hasta seleccionar actividad) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Fecha de inicio" required :error="errors.start_date">
            <UPopover :disabled="!selectedActivity">
              <UButton color="neutral" variant="outline" icon="i-heroicons-calendar" class="w-full justify-start"
                size="lg" :disabled="!selectedActivity">
                {{ startDate ? formatDisplayDate(startDate) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar v-model="startDate" class="p-2" :is-date-disabled="isDateDisabledForActivity" />
              </template>
            </UPopover>
          </UFormField>

          <UFormField label="Fecha de fin" required :error="errors.end_date">
            <UPopover :disabled="!selectedActivity">
              <UButton color="neutral" variant="outline" icon="i-heroicons-calendar" class="w-full justify-start"
                size="lg" :disabled="!selectedActivity">
                {{ endDate ? formatDisplayDate(endDate) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar v-model="endDate" class="p-2" :is-date-disabled="isDateDisabledForActivity" />
              </template>
            </UPopover>
          </UFormField>
          <p v-if="!selectedActivity && !isEdit" class="text-xs text-amber-500 col-span-full">Selecciona una actividad primero</p>
        </div>

        <!-- Prioridad (solo editable si tiene permiso) -->
        <UFormField v-if="calendarPermissions.canEditPriority" label="Prioridad">
          <div class="flex gap-2">
            <UButton v-for="option in priorityOptions" :key="option.value" :label="option.label"
              :variant="form.priority === option.value ? 'solid' : 'outline'" :color="option.color" size="md"
              class="flex-1" @click="form.priority = option.value" />
          </div>
        </UFormField>

        <!-- Responsables (solo si tiene permiso) -->
        <UFormField v-if="calendarPermissions.canAssignResponsables" label="Responsables" :error="errors.responsables">
          <div class="space-y-3">
            <USelectMenu v-model="responsableSelection" :items="responsableOptions"
              placeholder="Seleccionar responsables" size="lg" class="w-full" multiple searchable
              searchable-placeholder="Buscar responsable...">
              <template #item="{ item }">
                <div class="flex items-center gap-2 w-full">
                  <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: item.color || '#6B7280' }" />
                  <span class="flex-1">{{ item.label }}</span>
                  <UIcon v-if="isResponsableSelected(item)" name="i-heroicons-check" class="w-5 h-5 text-primary-500 shrink-0" />
                </div>
              </template>
            </USelectMenu>

            <!-- Mostrar responsables seleccionados o "Sin responsable" -->
            <div class="flex flex-wrap gap-2">
              <template v-if="form.responsable_ids.length > 0">
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
              </template>
              <UBadge v-else variant="soft" size="lg" class="text-gray-500">
                <span>Sin responsable</span>
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
      <div class="flex items-center justify-between gap-2 w-full flex-wrap">
        <UButton
          v-if="isEdit && onDelete"
          label="Eliminar"
          color="error"
          variant="ghost"
          icon="i-heroicons-trash"
          @click="handleDelete"
        />
        <div class="flex gap-2 ml-auto">
          <UButton label="Cancelar" variant="ghost" @click="handleClose" />
          <UButton :label="isEdit ? 'Guardar cambios' : 'Crear actividad'" color="primary" :loading="loading"
            @click="submit" />
        </div>
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
import { CalendarService } from '~/services/calendar/calendarService'
import CreateActivityNameModal from '~/components/calendar/CreateActivityNameModal.vue'
import EditActivityNameModal from '~/components/calendar/EditActivityNameModal.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'

// Actividades predefinidas (catálogo)
interface ActivityOption {
  id: number
  name: string
  allow_saturday?: boolean
  allow_sunday?: boolean
  default_priority?: number
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
  /** Si el grupo de calendario usa consolidado; si es false no se muestra ni se envía contenedor_id */
  usaConsolidado?: boolean
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
  usaConsolidado: true,
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

// Item completo del catálogo para la actividad seleccionada
const selectedCatalogItem = computed(() => {
  const id = selectedActivity.value?.value ?? form.value.activity_id
  if (id == null) return null
  return props.actividadesPredefinidas.find(a => a.id === id) ?? null
})

/** Deshabilita fechas según la configuración de la actividad seleccionada (sáb/dom). */
const isDateDisabledForActivity = (date: DateValue): boolean => {
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
    const catalog = selectedCatalogItem.value
    if (dayOfWeek === 6) return !(catalog?.allow_saturday)
    if (dayOfWeek === 0) return !(catalog?.allow_sunday)
    return false
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

// IDs de actividades ya usadas para el contenedor seleccionado (obtenidas del backend)
const usedActivityIds = ref<Set<number>>(new Set())
const loadingUsedActivities = ref(false)

const fetchUsedActivities = async (contenedorId: number | null) => {
  if (props.usaConsolidado === false || contenedorId == null) {
    usedActivityIds.value = new Set()
    return
  }
  loadingUsedActivities.value = true
  try {
    const response = await CalendarService.getEvents({ contenedor_ids: [contenedorId] })
    const events = response?.data ?? response ?? []
    const editingEventId = props.event?.id ?? null
    const ids = new Set<number>()
    for (const ev of (Array.isArray(events) ? events : [])) {
      if (ev.id === editingEventId) continue
      if (ev.activity_id != null) ids.add(ev.activity_id)
    }
    usedActivityIds.value = ids
  } catch {
    usedActivityIds.value = new Set()
  } finally {
    loadingUsedActivities.value = false
  }
}

// Combinar actividades predefinidas con las locales, filtrar las ya usadas en el contenedor
const activityOptions = computed(() => {
  const allActivities = [...props.actividadesPredefinidas, ...localActivities.value]
  const used = usedActivityIds.value
  return allActivities
    .filter(a => !used.has(a.id))
    .map(a => ({
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
const onContenedorChange = async (payload: ContenedorOption | number | null) => {
  if (payload == null) {
    form.value.contenedor_id = null
  } else {
    form.value.contenedor_id = typeof payload === 'object' && 'value' in payload ? payload.value : (typeof payload === 'number' ? payload : null)
  }
  // Limpiar actividad seleccionada al cambiar de contenedor
  selectedActivity.value = null
  form.value.name = ''
  form.value.activity_id = null
  // Obtener actividades ya usadas para el nuevo contenedor
  await fetchUsedActivities(form.value.contenedor_id)
}

/** Valor especial para "Sin responsable" (no es un user_id real). */
const SIN_RESPONSABLE_VALUE = 0

const responsableOptions = computed(() => {
  const list = props.responsables.map(r => ({
    label: r.nombre,
    value: r.id,
    color: props.getResponsableColor(r.id, r.nombre)
  }))
  return [{ label: 'Sin responsable', value: SIN_RESPONSABLE_VALUE, color: '#9ca3af' }, ...list]
})

type ResponsableOption = { label: string; value: number; color: string }

/** Selección actual: array de opciones (objetos). Sin value-key para que USelectMenu compare por objeto. */
const responsableSelection = ref<ResponsableOption[]>([])

/** Última selección aplicada (ids), para saber si el usuario acaba de elegir "Sin responsable" o un responsable real. */
const lastAppliedResponsableIds = ref<number[]>([])

function isResponsableSelected(item: ResponsableOption): boolean {
  return responsableSelection.value.some(s => s.value === item.value)
}

/** Exclusión mutua: "Sin responsable" y responsables reales no pueden estar a la vez.
 * - Si hay ambos: si antes solo había responsables reales → el usuario acaba de elegir "Sin responsable" → dejamos solo "Sin responsable".
 * - Si hay ambos: si antes había "Sin responsable" o vacío → el usuario acaba de elegir un responsable → dejamos solo los reales.
 * - Si solo "Sin responsable" o vacío → form = []. */
watch(responsableSelection, (val) => {
  const raw = Array.isArray(val) ? val : []
  const ids = raw.map((o: ResponsableOption) => o.value).filter((id): id is number => typeof id === 'number')
  const hasSinResponsable = ids.includes(SIN_RESPONSABLE_VALUE)
  const realIds = ids.filter(id => id !== SIN_RESPONSABLE_VALUE)
  const opts = responsableOptions.value
  const prevHadOnlyReal = lastAppliedResponsableIds.value.length > 0 && !lastAppliedResponsableIds.value.includes(SIN_RESPONSABLE_VALUE)

  if (hasSinResponsable && realIds.length > 0) {
    if (prevHadOnlyReal) {
      responsableSelection.value = [opts[0]]
      form.value.responsable_ids = []
      lastAppliedResponsableIds.value = [SIN_RESPONSABLE_VALUE]
    } else {
      responsableSelection.value = opts.filter(o => realIds.includes(o.value))
      form.value.responsable_ids = realIds
      lastAppliedResponsableIds.value = realIds
    }
    return
  }
  if (realIds.length > 0) {
    form.value.responsable_ids = realIds
    lastAppliedResponsableIds.value = realIds
    if (hasSinResponsable) {
      responsableSelection.value = opts.filter(o => realIds.includes(o.value))
    }
  } else {
    form.value.responsable_ids = []
    lastAppliedResponsableIds.value = [SIN_RESPONSABLE_VALUE]
    if (raw.length === 0) {
      responsableSelection.value = [opts[0]]
    }
  }
}, { deep: true })

// Funciones para manejo de actividades
const handleActivitySelect = (selected: { label: string; value: number } | null) => {
  if (selected) {
    form.value.name = selected.label
    form.value.activity_id = selected.value
    const catalog = props.actividadesPredefinidas.find(a => a.id === selected.value)
    if (catalog?.default_priority != null) {
      form.value.priority = catalog.default_priority as CalendarEventPriority
    }
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
        localActivities.value.push({
          id: newActivity.id,
          name: newActivity.name,
          allow_saturday: newActivity.allow_saturday,
          allow_sunday: newActivity.allow_sunday,
          default_priority: newActivity.default_priority
        })
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
  if (id === SIN_RESPONSABLE_VALUE) return 'Sin responsable'
  const responsable = props.responsables.find(r => r.id === id)
  return responsable?.nombre || 'Desconocido'
}

const getResponsableColorById = (id: number): string => {
  if (id === SIN_RESPONSABLE_VALUE) return '#9ca3af'
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
    const raw = vals.map(v => {
      if (typeof v === 'number') return v
      if (typeof v === 'object' && 'value' in v) return v.value
      return v
    }).filter((v): v is number => typeof v === 'number')
    return raw.filter(id => id !== SIN_RESPONSABLE_VALUE)
  }

  const activityId = form.value.activity_id ?? selectedActivity.value?.value ?? null
  const data: CreateCalendarEventRequest = {
    name: form.value.name.trim(),
    activity_id: activityId != null ? Number(activityId) : null,
    priority: form.value.priority,
    contenedor_id: props.usaConsolidado !== false ? extractValue(form.value.contenedor_id) : null,
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
const initializeForm = async () => {
  errors.value = {}
  isCreateActivityModalOpen.value = false
  isCreatingActivity.value = false

  if (props.event) {
    form.value.name = props.event.name || props.event.title || ''
    form.value.activity_id = props.event.activity_id ?? null
    form.value.priority = props.event.priority ?? 0
    const rawContenedorId = props.usaConsolidado !== false
      ? (props.event.contenedor_id ?? props.event.contenedor?.id ?? null)
      : null
    form.value.contenedor_id = rawContenedorId != null ? Number(rawContenedorId) : null
    form.value.notes = props.event.notes || ''
    form.value.responsable_ids = props.event.charges?.map(c => c.user_id) || []
    const opts = responsableOptions.value
    responsableSelection.value = form.value.responsable_ids.length
      ? opts.filter(o => form.value.responsable_ids.includes(o.value))
      : [opts[0]]
    lastAppliedResponsableIds.value = form.value.responsable_ids.length ? [...form.value.responsable_ids] : [SIN_RESPONSABLE_VALUE]

    // Cargar actividades usadas para el contenedor del evento
    await fetchUsedActivities(form.value.contenedor_id)

    // Buscar si la actividad existe en las predefinidas (por nombre o por id de catálogo)
    const existingActivity = props.actividadesPredefinidas.find(
      a => a.name === form.value.name || a.id === props.event?.activity_id
    )
    if (existingActivity) {
      selectedActivity.value = { label: existingActivity.name, value: existingActivity.id }
    } else if (form.value.name) {
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
    responsableSelection.value = [responsableOptions.value[0]]
    lastAppliedResponsableIds.value = [SIN_RESPONSABLE_VALUE]
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
