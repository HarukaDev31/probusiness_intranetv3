<template>
  <div
    class="flex items-center gap-3 md:gap-4 shrink-0"
    :class="inline ? 'flex-nowrap' : 'flex-wrap p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 gap-3 md:gap-4'"
  >
    <!-- Filtro por Consolidado/Contenedor (múltiple, como en vista progreso) -->
    <div v-if="calendarPermissions.canFilterByContenedor" class="flex items-center gap-2 shrink-0">
      <span class="text-base text-gray-500 dark:text-gray-400 hidden lg:inline shrink-0">Consolidado</span>
      <USelectMenu
        :model-value="selectedContenedorOptions"
        :items="contenedorOptionsMulti"
        value-attribute="value"
        :placeholder="selectedContenedorIds.length ? `${selectedContenedorIds.length} seleccionado(s)` : 'Todos'"
        size="md"
        :class="compact ? 'w-[160px] sm:w-[180px]' : 'w-[180px] sm:w-[220px]'"
        multiple
        searchable
        searchable-placeholder="Buscar..."
        @update:model-value="onContenedorIdsChange"
      />
    </div>

    <!-- Filtro por Responsable (solo Jefe) -->
    <div v-if="calendarPermissions.canFilterByResponsable" class="flex items-center gap-2 shrink-0">
      <span class="text-base text-gray-500 dark:text-gray-400 hidden lg:inline shrink-0">Responsable</span>
      <USelectMenu
        :model-value="selectedResponsableOption"
        :items="responsableOptions"
        value-attribute="value"
        placeholder="Todos"
        size="md"
        :class="compact ? 'w-[160px] sm:w-[180px]' : 'w-[180px] sm:w-[220px]'"
        searchable
        searchable-placeholder="Buscar..."
        @update:model-value="onResponsableSelect"
      >
        <template #option="{ option }">
          <div class="flex items-center gap-2">
            <div
              class="w-4 h-4 rounded-full shrink-0"
              :style="{ backgroundColor: option.color || '#6B7280' }"
            />
            <span class="text-base">{{ option.label }}</span>
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
  /** En true, los filtros se muestran en línea (ej. dentro del header) sin barra propia */
  inline?: boolean
  /** Barra resumida: controles más estrechos y una sola fila */
  compact?: boolean
  initialFilters?: {
    responsable_id?: number
    contenedor_id?: number
    contenedor_ids?: number[]
    start_date?: string
    end_date?: string
  }
  getResponsableColor: (userId: number, nombre?: string) => string
}

const props = withDefaults(defineProps<Props>(), { inline: false, compact: false })

const emit = defineEmits<{
  (e: 'filter-change', filters: { responsable_id?: number; contenedor_id?: number; contenedor_ids?: number[]; start_date?: string; end_date?: string }): void
}>()

// Estado local de filtros
const selectedResponsable = ref<number | null>(props.initialFilters?.responsable_id ?? null)
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

// Opciones para selects
const responsableOptions = computed(() => {
  const options: { label: string; value: number | null; color?: string }[] = [{ label: 'Todos', value: null }]
  props.responsables.forEach(r => {
    options.push({
      label: r.nombre,
      value: r.id,
      color: props.getResponsableColor(r.id, r.nombre)
    } as any)
  })
  return options
})

/** Opción completa del responsable seleccionado (para que el USelectMenu marque la selección en el dropdown) */
const selectedResponsableOption = computed(() => {
  const id = selectedResponsable.value
  if (id == null) return responsableOptions.value[0]
  return responsableOptions.value.find(opt => opt.value === id) ?? responsableOptions.value[0]
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

const selectedContenedorOptions = computed(() => {
  const ids = selectedContenedorIds.value
  if (ids.length === 0) return [contenedorOptionsMulti.value[0]]
  return contenedorOptionsMulti.value.filter(opt => opt.value !== CONTENEDOR_TODOS_VALUE && ids.includes(opt.value))
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
  emitFilters()
}

const onContenedorIdsChange = (val: unknown) => {
  const arr = Array.isArray(val) ? val : []
  const ids = arr
    .map((v: unknown) => (typeof v === 'object' && v && 'value' in v ? (v as { value: number }).value : v))
    .filter((id): id is number => typeof id === 'number')
  const hasTodos = ids.includes(CONTENEDOR_TODOS_VALUE)
  selectedContenedorIds.value = hasTodos ? [] : ids.filter(id => id !== CONTENEDOR_TODOS_VALUE)
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
  () => props.initialFilters?.responsable_id,
  (responsableId) => {
    const id = responsableId ?? null
    if (selectedResponsable.value !== id) {
      selectedResponsable.value = id
    }
  }
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
  emit('filter-change', {
    responsable_id: selectedResponsable.value ?? undefined,
    contenedor_ids: selectedContenedorIds.value.length ? selectedContenedorIds.value : undefined,
    start_date: formatDateForApi(startDate.value),
    end_date: formatDateForApi(endDate.value)
  })
}
</script>
