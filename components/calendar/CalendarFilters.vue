<template>
  <div
    class="flex items-center gap-3 md:gap-4 shrink-0"
    :class="inline ? 'flex-nowrap' : 'flex-wrap p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 gap-3 md:gap-4'"
  >
    <!-- Filtro por Consolidado/Contenedor (múltiple, como en vista progreso) -->
    <div v-if="calendarPermissions.canFilterByContenedor" class="flex items-center gap-2 shrink-0">
      <span class="text-base text-gray-500 dark:text-gray-400 hidden lg:inline shrink-0">Consolidado</span>
      <USelectMenu
        v-model="contenedorModelValue"
        :items="contenedorOptionsMulti"
        value-key="value"
        :placeholder="selectedContenedorIds.length ? `${selectedContenedorIds.length} seleccionado(s)` : 'Todos'"
        size="md"
        :class="compact ? 'w-[160px] sm:w-[180px]' : 'w-[180px] sm:w-[220px]'"
        multiple
        :search-input="{ placeholder: 'Buscar...' }"
      />
    </div>

    <!-- Filtro por Responsable (Jefe: múltiple; otros: solo "Todos" / "Yo") -->
    <div v-if="calendarPermissions.canFilterByResponsable" class="flex items-center gap-2 shrink-0">
      <span class="text-base text-gray-500 dark:text-gray-400 hidden lg:inline shrink-0">Responsable</span>
      <USelectMenu
        v-if="isJefeMultiResponsable"
        v-model="responsableModelValueMulti"
        :items="responsableOptionsForSelect"
        value-key="value"
        :placeholder="selectedResponsableIds.length ? `${selectedResponsableIds.length} seleccionado(s)` : 'Todos'"
        size="md"
        :class="compact ? 'w-[160px] sm:w-[180px]' : 'w-[180px] sm:w-[220px]'"
        multiple
        :search-input="{ placeholder: 'Buscar...' }"
      >
        
      </USelectMenu>
      <USelectMenu
        v-else
        :model-value="selectedResponsable"
        :items="responsableOptionsSingle"
        value-key="value"
        placeholder="Todos"
        size="md"
        :class="compact ? 'w-[160px] sm:w-[180px]' : 'w-[180px] sm:w-[220px]'"
        :search-input="{ placeholder: 'Buscar...' }"
        @update:model-value="onResponsableSelect"
      >
        <template #item="{ item }">
          <div class="flex items-center gap-2">
            <div
              v-if="(item?.value ?? null) != null && item?.value !== RESPONSABLE_TODOS_VALUE"
              class="w-4 h-4 rounded-full shrink-0"
              :style="{ backgroundColor: (item as any)?.color || '#6B7280' }"
            />
            <span class="text-base">{{ (item as any)?.label }}</span>
          </div>
        </template>
      </USelectMenu>
    </div>

    <!-- Filtro por Fecha (rango) -->
    <div class="flex items-center gap-2 shrink-0">
      <span class="text-base text-gray-500 dark:text-gray-400 hidden lg:inline shrink-0">Fecha</span>
      <UPopover>
        <UButton
          :label="dateRangeLabel"
          icon="i-heroicons-calendar"
          variant="outline"
          size="md"
          :class="compact ? 'min-w-[160px]' : 'min-w-[180px]'"
        />
        <template #content>
          <div class="p-4 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div class="flex flex-row gap-5 items-start">
              <div class="flex flex-col">
                <label class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Desde</label>
                <UCalendar v-model="startDate" />
              </div>
              <div class="flex flex-col">
                <label class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Hasta</label>
                <UCalendar v-model="endDate" :placeholder="endDatePlaceholder" />
              </div>
            </div>
            <div class="flex gap-2 pt-1 border-t border-gray-200 dark:border-gray-700 pt-4">
              <UButton label="Aplicar" color="primary" size="md" class="flex-1" @click="applyDateRange" />
              <UButton label="Limpiar" variant="outline" size="md" class="flex-1" @click="clearDateRange" />
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CalendarDate, getLocalTimeZone, today, parseDate } from '@internationalized/date'
import type { CalendarResponsable, CalendarContenedor } from '~/types/calendar'
import { MONTHS_SHORT } from '~/constants/calendar'

interface Props {
  responsables: CalendarResponsable[]
  contenedores: CalendarContenedor[]
  calendarPermissions: any
  /** ID del usuario actual: si el responsable es este usuario, se muestra "Yo" en lugar del nombre (para no jefe) */
  currentUserId?: number | null
  /** En true, los filtros se muestran en línea (ej. dentro del header) sin barra propia */
  inline?: boolean
  /** Barra resumida: controles más estrechos y una sola fila */
  compact?: boolean
  initialFilters?: {
    responsable_id?: number
    responsable_ids?: number[]
    contenedor_id?: number
    contenedor_ids?: number[]
    start_date?: string
    end_date?: string
  }
  getResponsableColor: (userId: number, nombre?: string) => string
}

const props = withDefaults(defineProps<Props>(), { inline: false, compact: false })

const emit = defineEmits<{
  (e: 'filter-change', filters: { responsable_id?: number; responsable_ids?: number[]; contenedor_id?: number; contenedor_ids?: number[]; start_date?: string; end_date?: string }): void
}>()

// Estado local de filtros
const selectedResponsable = ref<number | null>(props.initialFilters?.responsable_id ?? null)
const selectedResponsableIds = ref<number[]>(
  props.initialFilters?.responsable_ids?.length
    ? [...props.initialFilters.responsable_ids]
    : (props.initialFilters?.responsable_id != null ? [props.initialFilters.responsable_id] : [])
)
const selectedContenedorIds = ref<number[]>(
  props.initialFilters?.contenedor_ids?.length
    ? [...props.initialFilters.contenedor_ids]
    : (props.initialFilters?.contenedor_id != null ? [props.initialFilters.contenedor_id] : [])
)
const startDate = ref<CalendarDate | null>(
  props.initialFilters?.start_date
    ? parseDate(props.initialFilters.start_date) as CalendarDate
    : null
)
const endDate = ref<CalendarDate | null>(
  props.initialFilters?.end_date
    ? parseDate(props.initialFilters.end_date) as CalendarDate
    : null
)

/** Mes que muestra el 2.º calendario (Hasta): el mes siguiente al "Desde" o al actual si no hay Desde */
const endDatePlaceholder = computed(() => {
  const base = startDate.value ?? today(getLocalTimeZone())
  const nextMonth = base.add({ months: 1 })
  return new CalendarDate(nextMonth.year, nextMonth.month, 1)
})

/** Jefe puede elegir varios responsables (cuando hay más de uno en la lista) */
const isJefeMultiResponsable = computed(() => props.responsables.length > 1)

const RESPONSABLE_TODOS_VALUE = -1

// Opciones para select múltiple (Jefe): "Todos" + lista con color
const responsableOptionsForSelect = computed(() => {
  const options: { label: string; value: number; color?: string }[] = [
    { label: 'Todos', value: RESPONSABLE_TODOS_VALUE }
  ]
  const uid = props.currentUserId != null ? Number(props.currentUserId) : null
  props.responsables.forEach(r => {
    options.push({
      label: uid !== null && r.id === uid ? 'Yo' : r.nombre,
      value: r.id,
      color: props.getResponsableColor(r.id, r.nombre)
    })
  })
  return options
})

// Opciones para select simple (no jefe): "Todos" (null) + "Yo" (id)
const responsableOptionsSingle = computed(() => {
  const options: { label: string; value: number | null; color?: string }[] = [{ label: 'Todos', value: null }]
  const uid = props.currentUserId != null ? Number(props.currentUserId) : null
  props.responsables.forEach(r => {
    options.push({
      label: uid !== null && r.id === uid ? 'Yo' : r.nombre,
      value: r.id,
      color: props.getResponsableColor(r.id, r.nombre)
    })
  })
  return options
})

/** Modelo para USelectMenu Responsable múltiple (value-key): get/set para v-model con normalización "Todos" */
const responsableModelValueMulti = computed({
  get: () => {
    const ids = selectedResponsableIds.value
    return ids.length ? [...ids] : [RESPONSABLE_TODOS_VALUE]
  },
  set: (val: unknown) => {
    onResponsableIdsChange(val)
  }
})

/** Valor especial para la opción "Todos" (no es un id real de contenedor) */
const CONTENEDOR_TODOS_VALUE = -1

const contenedorOptionsMulti = computed(() => {
  const options: { label: string; value: number }[] = [
    { label: 'Todos', value: CONTENEDOR_TODOS_VALUE }
  ]
  props.contenedores.forEach(c => {
    options.push({
      label: c.nombre || c.codigo || `#${c.id}`,
      value: c.id
    })
  })
  return options
})

/** Modelo para USelectMenu Consolidado (value-key): get/set para v-model con normalización "Todos" */
const contenedorModelValue = computed({
  get: () => {
    const ids = selectedContenedorIds.value
    return ids.length ? [...ids] : [CONTENEDOR_TODOS_VALUE]
  },
  set: (val: unknown) => {
    onContenedorIdsChange(val)
  }
})

// Label del rango de fechas
const dateRangeLabel = computed(() => {
  if (startDate.value && endDate.value) {
    const start = `${startDate.value.day} ${MONTHS_SHORT[startDate.value.month - 1]}`
    const end = `${endDate.value.day} ${MONTHS_SHORT[endDate.value.month - 1]}`
    return `${start} - ${end}`
  }
  if (startDate.value) {
    return `Desde ${startDate.value.day} ${MONTHS_SHORT[startDate.value.month - 1]}`
  }
  return 'Buscar fecha'
})

// Handlers
const onResponsableSelect = (val: unknown) => {
  const id = extractValue(val) ?? null
  selectedResponsable.value = typeof id === 'number' ? id : null
  selectedResponsableIds.value = id != null ? [id] : []
  emitFilters()
}

const onResponsableIdsChange = (val: unknown) => {
  const arr = Array.isArray(val) ? val : val != null ? [val] : []
  const ids = arr
    .map((v: unknown) => (typeof v === 'object' && v && 'value' in v ? (v as { value: number }).value : v))
    .filter((id): id is number => typeof id === 'number')
  const hasTodos = ids.includes(RESPONSABLE_TODOS_VALUE)
  const hadOtherSelected = selectedResponsableIds.value.length > 0
  // Si se eligió "Todos" (solo o junto con otros) y había otros → deseleccionar todo (quedar en "Todos")
  if (hasTodos && (ids.length === 1 || hadOtherSelected)) {
    selectedResponsableIds.value = []
  } else {
    selectedResponsableIds.value = ids.filter(id => id !== RESPONSABLE_TODOS_VALUE)
  }
  selectedResponsable.value = selectedResponsableIds.value.length === 1 ? selectedResponsableIds.value[0] : null
  emitFilters()
}

const onContenedorIdsChange = (val: unknown) => {
  const arr = Array.isArray(val) ? val : val != null ? [val] : []
  const ids = arr
    .map((v: unknown) => (typeof v === 'object' && v && 'value' in v ? (v as { value: number }).value : v))
    .filter((id): id is number => typeof id === 'number')
  const hasTodos = ids.includes(CONTENEDOR_TODOS_VALUE)
  const hadOtherSelected = selectedContenedorIds.value.length > 0
  // Si se eligió "Todos" (solo o junto con otros) y había otros → deseleccionar todo (quedar en "Todos")
  if (hasTodos && (ids.length === 1 || hadOtherSelected)) {
    selectedContenedorIds.value = []
  } else {
    selectedContenedorIds.value = ids.filter(id => id !== CONTENEDOR_TODOS_VALUE)
  }
  emitFilters()
}

watch(
  () => ({ ids: props.initialFilters?.contenedor_ids, single: props.initialFilters?.contenedor_id }),
  ({ ids, single }) => {
    if (ids && ids.length) {
      selectedContenedorIds.value = [...ids]
    } else if (single != null) {
      selectedContenedorIds.value = [single]
    } else {
      selectedContenedorIds.value = []
    }
  },
  { deep: true }
)

watch(
  () => ({ ids: props.initialFilters?.responsable_ids, single: props.initialFilters?.responsable_id }),
  ({ ids, single }) => {
    if (ids && ids.length) {
      selectedResponsableIds.value = [...ids]
      selectedResponsable.value = ids.length === 1 ? ids[0] : null
    } else if (single != null) {
      selectedResponsableIds.value = [single]
      selectedResponsable.value = single
    } else {
      selectedResponsableIds.value = []
      selectedResponsable.value = null
    }
  },
  { deep: true }
)

const applyDateRange = () => {
  emitFilters()
}

const clearDateRange = () => {
  startDate.value = null
  endDate.value = null
  emitFilters()
}

const formatDateForApi = (date: CalendarDate | null): string | undefined => {
  if (!date) return undefined
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

// Helper para extraer valor de un select (puede venir como objeto o primitivo)
const extractValue = (val: any): any => {
  if (val === null || val === undefined) return null
  if (typeof val === 'object' && 'value' in val) return val.value
  return val
}

const emitFilters = () => {
  const payload: {
    responsable_id?: number
    responsable_ids?: number[]
    contenedor_ids?: number[]
    start_date?: string
    end_date?: string
  } = {
    start_date: formatDateForApi(startDate.value),
    end_date: formatDateForApi(endDate.value)
  }
  if (isJefeMultiResponsable.value) {
    payload.responsable_ids = selectedResponsableIds.value.length ? selectedResponsableIds.value : undefined
  } else {
    payload.responsable_id = selectedResponsable.value ?? undefined
  }
  payload.contenedor_ids = selectedContenedorIds.value.length ? selectedContenedorIds.value : undefined
  emit('filter-change', payload)
}
</script>
