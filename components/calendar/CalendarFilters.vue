<template>
  <div class="flex items-center gap-3 md:gap-4 shrink-0 flex-nowrap">
    <div v-if="usaConsolidado" class="flex items-center gap-2 shrink-0">
      <span class="text-base text-gray-500 dark:text-gray-400 hidden lg:inline shrink-0">Consolidado</span>
      <CalendarMultiSelect
        v-model="contenedorIds"
        :options="contenedorOptions"
        size="md"
        class="w-[160px] sm:w-[180px]"
        :disabled="disabled"
        @update:model-value="emitFilters"
      />
    </div>

    <!-- Responsable: jefe elige varios; los demás solo "Todos" / "Yo" -->
    <div v-if="canFilterByResponsable" class="flex items-center gap-2 shrink-0">
      <span class="text-base text-gray-500 dark:text-gray-400 hidden lg:inline shrink-0">Responsable</span>
      <CalendarMultiSelect
        v-if="multiResponsable"
        v-model="responsableIds"
        :options="responsableOptions"
        size="md"
        class="w-[160px] sm:w-[180px]"
        show-colors
        :disabled="disabled"
        @update:model-value="emitFilters"
      />
      <USelectMenu
        v-else
        :model-value="singleResponsableOption"
        :items="singleResponsableOptions"
        size="md"
        class="w-[160px] sm:w-[180px]"
        :disabled="disabled"
        @update:model-value="onSingleResponsable"
      />
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <span class="text-base text-gray-500 dark:text-gray-400 hidden lg:inline shrink-0">Fecha</span>
      <CalendarDateRangeButton
        v-model:start="startDate"
        v-model:end="endDate"
        size="md"
        button-class="min-w-[160px]"
        :disabled="disabled"
        @apply="emitFilters"
        @clear="emitFilters"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import type { CalendarDate } from '@internationalized/date'
import type { CalendarContenedor, CalendarFilters, CalendarResponsable } from '~/types/calendar'
import { parseIsoDate, toIsoDate } from '~/utils/calendar/dates'
import CalendarMultiSelect from '~/components/calendar/CalendarMultiSelect.vue'
import type { CalendarMultiSelectOption } from '~/components/calendar/CalendarMultiSelect.vue'
import CalendarDateRangeButton from '~/components/calendar/CalendarDateRangeButton.vue'

/** Filtros que emite la barra (sin claves = "Todos"). */
export type CalendarFilterChange = Pick<CalendarFilters, 'responsable_id' | 'responsable_ids' | 'contenedor_ids' | 'start_date' | 'end_date'>

const props = withDefaults(defineProps<{
  responsables: CalendarResponsable[]
  contenedores: CalendarContenedor[]
  usaConsolidado: boolean
  canFilterByResponsable: boolean
  /** Muestra "Yo" en lugar del nombre del usuario actual. */
  currentUserId: number
  filters: CalendarFilters
  getResponsableColor: (userId: number, nombre?: string | null) => string
  disabled?: boolean
}>(), { disabled: false })

const emit = defineEmits<{
  (e: 'filter-change', filters: CalendarFilterChange): void
}>()

const responsableIds = ref<number[]>([])
const contenedorIds = ref<number[]>([])
const startDate = shallowRef<CalendarDate | null>(null)
const endDate = shallowRef<CalendarDate | null>(null)

/** Sincroniza el estado local con los filtros del store (p. ej. "Yo" por defecto para miembros). */
watch(() => props.filters, (filters) => {
  responsableIds.value = filters.responsable_ids?.length
    ? [...filters.responsable_ids]
    : filters.responsable_id != null ? [filters.responsable_id] : []
  contenedorIds.value = filters.contenedor_ids ? [...filters.contenedor_ids] : []
  startDate.value = parseIsoDate(filters.start_date)
  endDate.value = parseIsoDate(filters.end_date)
}, { immediate: true, deep: true })

/** El jefe ve a todo el equipo; un miembro solo se ve a sí mismo. */
const multiResponsable = computed(() => props.responsables.length > 1)

const responsableLabel = (r: CalendarResponsable) => (r.id === props.currentUserId ? 'Yo' : r.nombre)

const responsableOptions = computed<CalendarMultiSelectOption[]>(() =>
  props.responsables.map(r => ({ label: responsableLabel(r), value: r.id, color: props.getResponsableColor(r.id, r.nombre) }))
)

const contenedorOptions = computed<CalendarMultiSelectOption[]>(() =>
  props.contenedores.map(c => ({ label: c.nombre, value: c.id }))
)

const singleResponsableOptions = computed<{ label: string; value: number | null }[]>(() => [
  { label: 'Todos', value: null },
  ...props.responsables.map(r => ({ label: responsableLabel(r), value: r.id }))
])

const singleResponsableOption = computed(() =>
  singleResponsableOptions.value.find(o => o.value === (responsableIds.value[0] ?? null))
)

const onSingleResponsable = (option: { label: string; value: number | null } | undefined) => {
  responsableIds.value = option?.value != null ? [option.value] : []
  emitFilters()
}

const emitFilters = () => {
  const payload: CalendarFilterChange = {
    start_date: startDate.value ? toIsoDate(startDate.value) : undefined,
    end_date: endDate.value ? toIsoDate(endDate.value) : undefined,
    contenedor_ids: contenedorIds.value.length ? [...contenedorIds.value] : undefined
  }
  if (multiResponsable.value) {
    payload.responsable_ids = responsableIds.value.length ? [...responsableIds.value] : undefined
  } else {
    payload.responsable_id = responsableIds.value[0]
  }
  emit('filter-change', payload)
}
</script>
