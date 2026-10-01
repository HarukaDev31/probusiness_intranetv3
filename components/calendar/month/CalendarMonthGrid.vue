<template>
  <section>
    <h2 class="py-3 md:py-4 text-xl md:text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-wide text-center">
      {{ month.title }}
    </h2>

    <div class="grid grid-cols-7 border-b-2 border-gray-300 dark:border-gray-600 bg-gray-800 dark:bg-gray-900">
      <div v-for="day in WEEK_DAYS_SHORT" :key="day" class="py-2.5 md:py-3 px-1 text-center text-xs md:text-sm font-bold text-white">
        <span class="hidden sm:inline">{{ day }}</span>
        <span class="sm:hidden">{{ day.charAt(0) }}</span>
      </div>
    </div>

    <div v-for="(week, weekIndex) in month.weeks" :key="weekIndex" class="relative">
      <!-- Celdas: la altura crece con la cantidad de filas de eventos de la semana -->
      <div class="grid grid-cols-7 border-r-2 border-gray-300 dark:border-gray-600">
        <div
          v-for="cell in week.days"
          :key="cell.dateStr"
          class="min-h-0 overflow-hidden transition-all duration-300 flex flex-col relative border-r-2 border-b-2 border-gray-300 dark:border-gray-600"
          :style="{ minHeight: `calc(3rem + ${Math.max(1, week.eventRows.length) * 3.25}rem)` }"
          :class="[cellClass(cell), reorderingDate === cell.dateStr ? 'ring-2 ring-inset ring-primary-400 dark:ring-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : '']"
          @click="cell.isCurrentMonth && emit('day-click', cell)"
        >
          <div class="p-2 md:p-2.5 relative flex items-center gap-1">
            <span
              class="text-sm font-medium"
              :class="{
                'text-gray-900 dark:text-white': cell.isCurrentMonth && !cell.isToday,
                'text-primary-600 dark:text-primary-400 font-bold': cell.isCurrentMonth && cell.isToday,
                'text-gray-400 dark:text-gray-600': !cell.isCurrentMonth
              }"
            >
              {{ cell.day }}
            </span>
            <span
              v-if="reorderingDate === cell.dateStr"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-3 h-3 animate-spin" />
              <span class="text-[10px] font-medium">Guardando</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Capa de eventos multi-día -->
      <div class="absolute top-6 md:top-7 left-0 right-0 pointer-events-none z-20">
        <div v-for="(row, rowIndex) in week.eventRows" :key="rowIndex" class="relative h-10 md:h-12 mb-1">
          <template v-for="span in row" :key="`${span.event.id}-${span.startCol}`">
            <!-- Vista previa del evento arrastrado, justo antes del destino -->
            <div
              v-if="dragOverEventId === span.event.id && draggingEvent && draggingEvent.id !== span.event.id"
              class="absolute h-full flex items-center gap-1 text-xs md:text-sm text-white font-medium overflow-hidden pointer-events-none rounded shadow-lg px-1.5 py-0.5 border-2 border-dashed border-white/80 bg-white/10 backdrop-blur-sm"
              :style="previewStyle(span)"
            >
              <UIcon name="i-heroicons-arrows-up-down" class="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span class="truncate">{{ draggingEvent.name }}</span>
            </div>

            <CalendarEventBar
              :span="span"
              :colors="getEventColors(span.event)"
              :show-consolidado="showConsolidado"
              :draggable="canReorder"
              :dragging="draggingEvent?.id === span.event.id"
              :get-responsable-color="getResponsableColor"
              @open="(event) => emit('event-click', event)"
              @drag-start="(event) => emit('drag-start', event)"
              @drag-enter="(event) => emit('drag-enter', event)"
              @drop="(event) => emit('drop', event)"
              @drag-end="emit('drag-end')"
            />
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CalendarEvent, IsoDate } from '~/types/calendar'
import type { CalendarDayCell, CalendarMonth, EventSpan } from '~/utils/calendar/monthLayout'
import { WEEK_DAYS_SHORT } from '~/constants/calendar'
import { colorsToBackground } from '~/utils/calendar/events'
import CalendarEventBar from '~/components/calendar/month/CalendarEventBar.vue'

const props = defineProps<{
  month: CalendarMonth
  showConsolidado: boolean
  /** Solo el jefe puede reordenar arrastrando. */
  canReorder: boolean
  draggingEvent: CalendarEvent | null
  dragOverEventId: number | null
  /** Día que se está guardando tras reordenar. */
  reorderingDate: IsoDate | null
  getEventColors: (event: CalendarEvent) => string[]
  getResponsableColor: (userId: number, nombre?: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'day-click', cell: CalendarDayCell): void
  (e: 'event-click', event: CalendarEvent): void
  (e: 'drag-start', event: CalendarEvent): void
  (e: 'drag-enter', event: CalendarEvent): void
  (e: 'drop', event: CalendarEvent): void
  (e: 'drag-end'): void
}>()

const COLUMN_WIDTH = 100 / 7

const cellClass = (cell: CalendarDayCell): string => {
  if (!cell.isCurrentMonth) return 'bg-gray-50/80 dark:bg-gray-800/50 pointer-events-none'
  if (cell.isWeekend) return 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 bg-gray-100 dark:bg-gray-800/70'
  return `cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 bg-white dark:bg-gray-800${cell.isToday ? ' bg-blue-50 dark:bg-blue-900/10' : ''}`
}

const previewStyle = (span: EventSpan) => ({
  background: colorsToBackground(props.getEventColors(span.event)),
  left: `calc(${span.startCol * COLUMN_WIDTH}% + 2px)`,
  width: `calc(${(span.endCol - span.startCol + 1) * COLUMN_WIDTH}% - 4px)`
})
</script>
