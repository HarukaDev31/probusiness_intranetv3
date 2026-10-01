<template>
  <UModal
    class="w-full sm:max-w-2xl"
    :close="{ onClick: handleClose }"
    @close="handleClose"
  >
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ isEdit ? 'Editar Actividad' : 'Nueva Actividad' }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-5">
        <!-- Consolidado (solo si el grupo usa consolidado) -->
        <UFormField v-if="usaConsolidado" label="Consolidado" required>
          <USelectMenu
            :model-value="selectedContenedorOption ?? undefined"
            :items="contenedorOptions"
            placeholder="Seleccionar consolidado"
            size="lg"
            class="w-full"
            :search-input="{ placeholder: 'Buscar consolidado...' }"
            @update:model-value="onContenedorChange"
          />
        </UFormField>

        <!-- Actividad del catálogo -->
        <UFormField label="Actividad" required :error="errors.name">
          <div class="space-y-2">
            <div class="flex gap-2 items-center">
              <USelectMenu
                :model-value="selectedActivity ?? undefined"
                :items="activityOptions"
                :placeholder="loadingUsedActivities ? 'Cargando actividades...' : 'Seleccionar actividad'"
                size="lg"
                class="flex-1"
                :search-input="{ placeholder: 'Buscar actividad...' }"
                :disabled="activityLocked"
                :loading="loadingUsedActivities"
                @update:model-value="handleActivitySelect"
              />
              <UButton
                icon="i-heroicons-plus"
                color="primary"
                variant="outline"
                size="lg"
                title="Crear nueva actividad"
                :disabled="activityLocked"
                @click="isCreateActivityModalOpen = true"
              />
              <template v-if="form.activity_id != null && calendarPermissions.canDeleteActivity">
                <UTooltip text="Editar nombre de esta actividad">
                  <UButton icon="i-heroicons-pencil-square" color="primary" variant="ghost" size="lg" class="!p-2" @click.stop.prevent="isEditActivityModalOpen = true" />
                </UTooltip>
                <UTooltip text="Eliminar esta actividad del catálogo">
                  <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="lg" class="!p-2" @click.stop.prevent="confirmDeleteFromCatalog" />
                </UTooltip>
              </template>
            </div>
            <p v-if="usaConsolidado && form.contenedor_id == null" class="text-xs text-amber-500">Selecciona un consolidado primero</p>
          </div>
        </UFormField>

        <CreateActivityNameModal
          :open="isCreateActivityModalOpen"
          :loading="isCreatingActivity"
          @close="isCreateActivityModalOpen = false"
          @create="handleCreateNewActivity"
        />

        <EditActivityNameModal
          v-model:open="isEditActivityModalOpen"
          :activity-id="form.activity_id"
          :activity-name="selectedActivity?.label ?? ''"
          :loading="isUpdatingActivity"
          @save="handleEditActivity"
        />

        <!-- Fechas (habilitadas tras elegir actividad) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Fecha de inicio" required :error="errors.start_date">
            <UPopover :disabled="!selectedActivity">
              <UButton color="neutral" variant="outline" icon="i-heroicons-calendar" class="w-full justify-start" size="lg" :disabled="!selectedActivity">
                {{ startDate ? formatLongDate(startDate) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar
                  :model-value="startDate ?? undefined"
                  class="p-2"
                  :is-date-disabled="isDateDisabledForActivity"
                  @update:model-value="(v) => (startDate = asCalendarDate(v))"
                />
              </template>
            </UPopover>
          </UFormField>

          <UFormField label="Fecha de fin" required :error="errors.end_date">
            <UPopover :disabled="!selectedActivity">
              <UButton color="neutral" variant="outline" icon="i-heroicons-calendar" class="w-full justify-start" size="lg" :disabled="!selectedActivity">
                {{ endDate ? formatLongDate(endDate) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar
                  :model-value="endDate ?? undefined"
                  class="p-2"
                  :is-date-disabled="isDateDisabledForActivity"
                  @update:model-value="(v) => (endDate = asCalendarDate(v))"
                />
              </template>
            </UPopover>
          </UFormField>
          <p v-if="!selectedActivity && !isEdit" class="text-xs text-amber-500 col-span-full">Selecciona una actividad primero</p>
        </div>

        <!-- Prioridad -->
        <UFormField v-if="calendarPermissions.canEditPriority" label="Prioridad">
          <div class="flex gap-2">
            <UButton
              v-for="option in PRIORITY_OPTIONS"
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

        <!-- Responsables -->
        <UFormField v-if="calendarPermissions.canAssignResponsables" label="Responsables" :error="errors.responsables">
          <div class="space-y-3">
            <USelectMenu
              v-model="responsableSelection"
              :items="responsableOptions"
              placeholder="Seleccionar responsables"
              size="lg"
              class="w-full"
              multiple
              :search-input="{ placeholder: 'Buscar responsable...' }"
            >
              <template #item="{ item }">
                <div class="flex items-center gap-2 w-full">
                  <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: item.color }" />
                  <span class="flex-1">{{ item.label }}</span>
                  <UIcon v-if="isResponsableSelected(item)" name="i-heroicons-check" class="w-5 h-5 text-primary-500 shrink-0" />
                </div>
              </template>
            </USelectMenu>

            <div class="flex flex-wrap gap-2">
              <template v-if="form.responsable_ids.length > 0">
                <UBadge v-for="id in form.responsable_ids" :key="id" variant="soft" size="lg" class="pr-1">
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: responsableColor(id) }" />
                    <span>{{ responsableName(id) }}</span>
                    <UButton icon="i-heroicons-x-mark" variant="ghost" size="xs" class="ml-1" @click="removeResponsable(id)" />
                  </div>
                </UBadge>
              </template>
              <UBadge v-else variant="soft" size="lg" class="text-gray-500">
                <span>Sin responsable</span>
              </UBadge>
            </div>
          </div>
        </UFormField>

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
          @click="onDelete"
        />
        <div class="flex gap-2 ml-auto">
          <UButton label="Cancelar" variant="ghost" @click="handleClose" />
          <UButton :label="isEdit ? 'Guardar cambios' : 'Crear actividad'" color="primary" :loading="saving" @click="submit" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import type {
  CalendarActivityCatalogItem,
  CalendarContenedor,
  CalendarEvent,
  CalendarEventPriority,
  CalendarPermissions,
  CalendarResponsable,
  CreateCalendarEventRequest,
  IsoDate
} from '~/types/calendar'
import { PRIORITY_OPTIONS } from '~/constants/calendar'
import { CalendarService } from '~/services/calendar/calendarService'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { isWeekend, parseIsoDate, toCalendarDate, toIsoDate } from '~/utils/calendar/dates'
import CreateActivityNameModal from '~/components/calendar/CreateActivityNameModal.vue'
import EditActivityNameModal from '~/components/calendar/EditActivityNameModal.vue'

interface SelectOption {
  label: string
  value: number
}

interface ResponsableOption extends SelectOption {
  color: string
}

const props = withDefaults(defineProps<{
  /** Cambia en cada open() del overlay para reinicializar el formulario. */
  openKey: number
  event?: CalendarEvent | null
  initialDate?: IsoDate
  responsables: CalendarResponsable[]
  contenedores: CalendarContenedor[]
  calendarPermissions: CalendarPermissions
  getResponsableColor: (userId: number, nombre?: string | null) => string
  /** Si es false no se muestra ni se envía contenedor_id. */
  usaConsolidado: boolean
  actividadesPredefinidas: CalendarActivityCatalogItem[]
  /** Devuelve true si se guardó (el caller cierra el modal). */
  onSave: (data: CreateCalendarEventRequest) => Promise<boolean>
  onDelete?: () => void
  onCreateActivity: (name: string) => Promise<CalendarActivityCatalogItem | null>
  onUpdateActivity: (id: number, name: string) => Promise<boolean>
  onDeleteFromCatalog: (catalogActivityId: number) => Promise<void>
  onClose: () => void
}>(), {
  event: null,
  initialDate: undefined,
  onDelete: undefined
})

const { showConfirmation } = useModal()
const { withSpinner } = useSpinner()

/** Valor especial "Sin responsable" (no es un user_id real). */
const SIN_RESPONSABLE = 0

const longDate = new DateFormatter('es-ES', { dateStyle: 'long' })
const formatLongDate = (date: CalendarDate) => longDate.format(date.toDate(getLocalTimeZone()))
const asCalendarDate = (value: DateValue | DateValue[] | unknown): CalendarDate | null =>
  value && typeof value === 'object' && 'day' in value ? toCalendarDate(value as DateValue) : null

// ============================================
// ESTADO DEL FORMULARIO
// ============================================

const form = ref({
  name: '',
  activity_id: null as number | null,
  priority: 0 as CalendarEventPriority,
  contenedor_id: null as number | null,
  responsable_ids: [] as number[],
  notes: ''
})
const startDate = shallowRef<CalendarDate | null>(null)
const endDate = shallowRef<CalendarDate | null>(null)
const errors = ref<Partial<Record<'name' | 'start_date' | 'end_date' | 'responsables', string>>>({})
const saving = ref(false)

const selectedActivity = ref<SelectOption | null>(null)
const createdActivities = ref<CalendarActivityCatalogItem[]>([])
const isCreateActivityModalOpen = ref(false)
const isCreatingActivity = ref(false)
const isEditActivityModalOpen = ref(false)
const isUpdatingActivity = ref(false)

const isEdit = computed(() => props.event !== null)

// ============================================
// CONSOLIDADO
// ============================================

const contenedorOptions = computed<{ label: string; value: number | null }[]>(() => {
  const options: { label: string; value: number | null }[] = [{ label: 'Sin consolidado', value: null }]
  options.push(...props.contenedores.map(c => ({ label: c.nombre, value: c.id })))
  // Al editar, el consolidado del evento puede no estar en la lista (p. ej. ya cerrado)
  const own = props.event?.contenedor
  if (own && !props.contenedores.some(c => c.id === own.id)) options.push({ label: own.nombre, value: own.id })
  return options
})

const selectedContenedorOption = computed(() => contenedorOptions.value.find(o => o.value === form.value.contenedor_id) ?? null)

// Actividades ya usadas en el consolidado elegido (no se pueden repetir)
const usedActivityIds = ref<Set<number>>(new Set())
const loadingUsedActivities = ref(false)

const fetchUsedActivities = async (contenedorId: number | null) => {
  if (!props.usaConsolidado || contenedorId == null) {
    usedActivityIds.value = new Set()
    return
  }
  loadingUsedActivities.value = true
  try {
    const response = await CalendarService.getEvents({ contenedor_ids: [contenedorId] })
    const editingId = props.event?.id ?? null
    usedActivityIds.value = new Set(
      response.data
        .filter(ev => ev.id !== editingId && ev.activity_id != null)
        .map(ev => ev.activity_id as number)
    )
  } catch {
    usedActivityIds.value = new Set()
  } finally {
    loadingUsedActivities.value = false
  }
}

const onContenedorChange = async (option: { label: string; value: number | null } | undefined) => {
  form.value.contenedor_id = option?.value ?? null
  selectedActivity.value = null
  form.value.name = ''
  form.value.activity_id = null
  await fetchUsedActivities(form.value.contenedor_id)
}

/** Sin consolidado no se puede elegir actividad (cuando el grupo usa consolidado). */
const activityLocked = computed(() => (props.usaConsolidado && form.value.contenedor_id == null) || loadingUsedActivities.value)

// ============================================
// ACTIVIDAD (CATÁLOGO)
// ============================================

const catalog = computed(() => {
  const known = new Set(props.actividadesPredefinidas.map(a => a.id))
  return [...props.actividadesPredefinidas, ...createdActivities.value.filter(a => !known.has(a.id))]
})

const activityOptions = computed<SelectOption[]>(() =>
  catalog.value
    .filter(a => !usedActivityIds.value.has(a.id))
    .map(a => ({ label: a.name, value: a.id }))
)

const selectedCatalogItem = computed(() =>
  form.value.activity_id == null ? null : catalog.value.find(a => a.id === form.value.activity_id) ?? null
)

/** Sábados/domingos solo si la actividad del catálogo lo permite. */
const isDateDisabledForActivity = (date: DateValue): boolean => {
  if (!isWeekend(date)) return false
  const isSunday = new Date(date.year, date.month - 1, date.day).getDay() === 0
  const item = selectedCatalogItem.value
  return isSunday ? !item?.allow_sunday : !item?.allow_saturday
}

const selectActivity = (item: { id: number; name: string }) => {
  selectedActivity.value = { label: item.name, value: item.id }
  form.value.name = item.name
  form.value.activity_id = item.id
}

const handleActivitySelect = (option: SelectOption | undefined) => {
  if (!option) {
    selectedActivity.value = null
    form.value.name = ''
    form.value.activity_id = null
    return
  }
  selectActivity({ id: option.value, name: option.label })
  const item = catalog.value.find(a => a.id === option.value)
  if (item) form.value.priority = item.default_priority
}

const handleCreateNewActivity = async (name: string) => {
  isCreatingActivity.value = true
  try {
    const created = await props.onCreateActivity(name)
    if (created) {
      createdActivities.value.push(created)
      selectActivity(created)
      isCreateActivityModalOpen.value = false
    }
  } finally {
    isCreatingActivity.value = false
  }
}

const handleEditActivity = async ({ id, name }: { id: number; name: string }) => {
  isUpdatingActivity.value = true
  try {
    if (await props.onUpdateActivity(id, name)) {
      selectActivity({ id, name })
      isEditActivityModalOpen.value = false
    }
  } finally {
    isUpdatingActivity.value = false
  }
}

const confirmDeleteFromCatalog = () => {
  const id = form.value.activity_id
  if (id == null) return
  showConfirmation(
    'Eliminar del catálogo',
    '¿Está seguro de que desea eliminar esta actividad del catálogo? Los eventos ya creados con esta actividad no se modifican.',
    async () => {
      await withSpinner(async () => {
        await props.onDeleteFromCatalog(id)
        selectedActivity.value = null
        form.value.activity_id = null
        form.value.name = ''
      }, 'Eliminando del catálogo...')
    },
    undefined,
    { persistent: true }
  )
}

// ============================================
// RESPONSABLES
// ============================================

const responsableOptions = computed<ResponsableOption[]>(() => [
  { label: 'Sin responsable', value: SIN_RESPONSABLE, color: '#9ca3af' },
  ...props.responsables.map(r => ({ label: r.nombre, value: r.id, color: props.getResponsableColor(r.id, r.nombre) }))
])

const responsableSelection = ref<ResponsableOption[]>([])
/** Última selección aplicada, para saber qué eligió el usuario en el último cambio. */
const lastAppliedIds = ref<number[]>([])

const isResponsableSelected = (item: ResponsableOption) => responsableSelection.value.some(s => s.value === item.value)
const responsableName = (id: number) => props.responsables.find(r => r.id === id)?.nombre ?? 'Desconocido'
const responsableColor = (id: number) => props.getResponsableColor(id, props.responsables.find(r => r.id === id)?.nombre)

const setResponsables = (ids: number[]) => {
  form.value.responsable_ids = ids
  lastAppliedIds.value = ids.length ? [...ids] : [SIN_RESPONSABLE]
  responsableSelection.value = ids.length
    ? responsableOptions.value.filter(o => ids.includes(o.value))
    : [responsableOptions.value[0]]
}

/**
 * "Sin responsable" y responsables reales son excluyentes: si conviven, gana lo último que
 * eligió el usuario (comparando con la selección anterior).
 */
watch(responsableSelection, (selection) => {
  const ids = selection.map(o => o.value)
  const hasNone = ids.includes(SIN_RESPONSABLE)
  const realIds = ids.filter(id => id !== SIN_RESPONSABLE)
  const prevOnlyReal = !lastAppliedIds.value.includes(SIN_RESPONSABLE) && lastAppliedIds.value.length > 0

  if (hasNone && realIds.length) {
    setResponsables(prevOnlyReal ? [] : realIds)
    return
  }
  if (realIds.length) {
    form.value.responsable_ids = realIds
    lastAppliedIds.value = realIds
    return
  }
  form.value.responsable_ids = []
  lastAppliedIds.value = [SIN_RESPONSABLE]
  if (selection.length === 0) responsableSelection.value = [responsableOptions.value[0]]
}, { deep: true })

const removeResponsable = (id: number) => setResponsables(form.value.responsable_ids.filter(rid => rid !== id))

// ============================================
// INICIALIZACIÓN, VALIDACIÓN Y ENVÍO
// ============================================

const initializeForm = async () => {
  errors.value = {}
  isCreateActivityModalOpen.value = false
  createdActivities.value = []
  const event = props.event

  if (!event) {
    form.value = { name: '', activity_id: null, priority: 0, contenedor_id: null, responsable_ids: [], notes: '' }
    selectedActivity.value = null
    setResponsables([])
    usedActivityIds.value = new Set()
    const initial = parseIsoDate(props.initialDate) ?? today(getLocalTimeZone())
    startDate.value = initial
    endDate.value = initial
    return
  }

  form.value = {
    name: event.name,
    activity_id: event.activity_id,
    priority: event.priority,
    contenedor_id: props.usaConsolidado ? event.contenedor_id : null,
    responsable_ids: [],
    notes: event.notes ?? ''
  }
  setResponsables(event.charges.map(c => c.user_id))
  const item = props.actividadesPredefinidas.find(a => a.id === event.activity_id || a.name === event.name)
  selectedActivity.value = item ? { label: item.name, value: item.id } : null
  startDate.value = parseIsoDate(event.start_date) ?? today(getLocalTimeZone())
  endDate.value = parseIsoDate(event.end_date) ?? startDate.value
  await fetchUsedActivities(form.value.contenedor_id)
}

watch(() => props.openKey, initializeForm, { immediate: true })

const validate = (): boolean => {
  const next: typeof errors.value = {}
  if (!form.value.name.trim()) next.name = 'El nombre es requerido'
  if (!startDate.value) next.start_date = 'La fecha de inicio es requerida'
  if (!endDate.value) next.end_date = 'La fecha de fin es requerida'
  if (startDate.value && endDate.value && startDate.value.compare(endDate.value) > 0) {
    next.end_date = 'La fecha de fin debe ser posterior a la de inicio'
  }
  errors.value = next
  return Object.keys(next).length === 0
}

const submit = async () => {
  if (!validate() || !startDate.value || !endDate.value) return
  const data: CreateCalendarEventRequest = {
    name: form.value.name.trim(),
    activity_id: form.value.activity_id,
    priority: form.value.priority,
    contenedor_id: props.usaConsolidado ? form.value.contenedor_id : null,
    notes: form.value.notes.trim() || null,
    start_date: toIsoDate(startDate.value),
    end_date: toIsoDate(endDate.value),
    responsable_ids: form.value.responsable_ids.filter(id => id !== SIN_RESPONSABLE)
  }
  saving.value = true
  try {
    await props.onSave(data)
  } finally {
    saving.value = false
  }
}

const handleClose = () => props.onClose()
</script>
