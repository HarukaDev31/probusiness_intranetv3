<template>
  <div class="flex flex-wrap items-center gap-2 md:gap-3 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
    <!-- Filtro por Consolidado/Contenedor -->
    <div v-if="calendarPermissions.canFilterByContenedor" class="flex items-center gap-2">
      <span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Consolidado:</span>
      <USelectMenu
        v-model="selectedContenedor"
        :items="contenedorOptions"
        value-attribute="value"
        placeholder="Todos"
        size="xs"
        class="w-[140px] sm:w-[180px]"
        searchable
        searchable-placeholder="Buscar..."
        @update:model-value="handleContenedorChange"
      />
    </div>

    <!-- Filtro por Responsable (solo Jefe) -->
    <div v-if="calendarPermissions.canFilterByResponsable" class="flex items-center gap-2">
      <span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Responsable:</span>
      <USelectMenu
        v-model="selectedResponsable"
        :items="responsableOptions"
        value-attribute="value"
        placeholder="Todos"
        size="xs"
        class="w-[140px] sm:w-[180px]"
        searchable
        searchable-placeholder="Buscar..."
        @update:model-value="handleResponsableChange"
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
    </div>

    <!-- Filtro por Fecha (rango) -->
    <div class="flex items-center gap-2">
      <span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Fecha:</span>
      <UPopover>
        <UButton
          :label="dateRangeLabel"
          icon="i-heroicons-calendar"
          variant="outline"
          size="xs"
          class="min-w-[160px]"
        />
        <template #content>
          <div class="p-3 space-y-3">
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Desde:</label>
              <UCalendar v-model="startDate" class="w-full" />
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Hasta:</label>
              <UCalendar v-model="endDate" class="w-full" />
            </div>
            <div class="flex gap-2">
              <UButton
                label="Aplicar"
                color="primary"
                size="xs"
                class="flex-1"
                @click="applyDateRange"
              />
              <UButton
                label="Limpiar"
                variant="outline"
                size="xs"
                class="flex-1"
                @click="clearDateRange"
              />
            </div>
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Botón Configuración (solo Jefe) -->
    <div v-if="calendarPermissions.canAccessConfig" class="ml-auto">
      <UButton
        icon="i-heroicons-cog-6-tooth"
        label="Configuración"
        variant="ghost"
        size="xs"
        @click="$emit('open-config')"
      />
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
  initialFilters?: {
    responsable_id?: number
    contenedor_id?: number
    start_date?: string
    end_date?: string
  }
  getResponsableColor: (userId: number, nombre?: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'filter-change', filters: { responsable_id?: number; contenedor_id?: number; start_date?: string; end_date?: string }): void
  (e: 'open-config'): void
}>()

// Estado local de filtros
const selectedResponsable = ref<number | null>(props.initialFilters?.responsable_id || null)
const selectedContenedor = ref<number | null>(props.initialFilters?.contenedor_id || null)
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

// Opciones para selects
const responsableOptions = computed(() => {
  const options = [{ label: 'Todos', value: null }]
  props.responsables.forEach(r => {
    options.push({
      label: r.nombre,
      value: r.id,
      color: props.getResponsableColor(r.id, r.nombre)
    } as any)
  })
  return options
})

const contenedorOptions = computed(() => {
  const options = [{ label: 'Todos', value: null }]
  props.contenedores.forEach(c => {
    options.push({
      label: c.nombre || c.codigo || `#${c.id}`,
      value: c.id
    } as any)
  })
  return options
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
const handleResponsableChange = () => {
  emitFilters()
}

const handleContenedorChange = () => {
  emitFilters()
}

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
    responsable_id: extractValue(selectedResponsable.value) || undefined,
    contenedor_id: extractValue(selectedContenedor.value) || undefined,
    start_date: formatDateForApi(startDate.value),
    end_date: formatDateForApi(endDate.value)
  })
}
</script>
