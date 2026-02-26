<template>
  <div class="w-52 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
    <!-- Botones de acción -->
    <div class="p-3 border-b border-gray-200 dark:border-gray-700 space-y-1.5">
      <UButton
        v-if="canCreate"
        icon="i-heroicons-plus"
        color="primary"
        label="Crear Actividad"
        class="w-full justify-center"
        size="sm"
        @click="handleCreate('evento')"
      />
      <UButton
        icon="i-heroicons-chart-bar"
        :color="canCreate ? 'neutral' : 'primary'"
        :variant="canCreate ? 'outline' : 'solid'"
        label="Ver Progreso"
        class="w-full justify-center"
        size="sm"
        @click="$emit('view-progress')"
      />
    </div>

    <!-- Mini Calendario compacto -->
    <div class="p-3 border-b border-gray-200 dark:border-gray-700">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
          {{ miniCalendarMonthYear }}
        </span>
        <div class="flex items-center gap-0.5">
          <UButton icon="i-heroicons-chevron-left" variant="ghost" size="xs" class="!p-1 min-w-0" @click="previousMonth" />
          <UButton icon="i-heroicons-chevron-right" variant="ghost" size="xs" class="!p-1 min-w-0" @click="nextMonth" />
        </div>
      </div>
      <div class="grid grid-cols-7 gap-0.5 text-[11px]">
        <div
          v-for="day in ['D', 'L', 'M', 'X', 'J', 'V', 'S']"
          :key="day"
          class="text-center text-gray-500 dark:text-gray-400 font-medium py-0.5"
        >
          {{ day }}
        </div>
        <div
          v-for="day in miniCalendarDays"
          :key="String(day.date)"
          class="text-center py-0.5 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[22px] flex items-center justify-center"
          :class="{
            'text-gray-400 dark:text-gray-600': !day.isCurrentMonth,
            'text-gray-900 dark:text-white': day.isCurrentMonth && !day.isToday,
            'bg-primary-500 text-white font-bold': day.isToday,
            'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300': day.isSelected && !day.isToday
          }"
          @click="handleMiniCalendarDayClick(day.date)"
          @dblclick="handleMiniCalendarDayDoubleClick(day.date)"
        >
          {{ day.day }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CalendarDate, getLocalTimeZone, today, parseDate, isSameDay } from '@internationalized/date'
import { DateFormatter } from '@internationalized/date'

interface Props {
  selectedDate?: CalendarDate | null
  canCreate?: boolean
  onDateSelect?: (date: CalendarDate) => void
  onDateDoubleClick?: (date: CalendarDate) => void
  onCreate?: (type: 'evento' | 'tarea') => void
}

const props = withDefaults(defineProps<Props>(), {
  selectedDate: null,
  canCreate: false,
  onCreate: undefined,
  onDateDoubleClick: undefined
})

const emit = defineEmits<{
  (e: 'create', type: 'evento' | 'tarea'): void
  (e: 'date-select', date: CalendarDate): void
  (e: 'date-double-click', date: CalendarDate): void
  (e: 'view-progress'): void
}>()

const df = new DateFormatter('es-ES', { month: 'long', year: 'numeric' })
const miniCalendarDate = ref<CalendarDate>(props.selectedDate ?? today(getLocalTimeZone()))

// Sincronizar mini calendario con la fecha seleccionada
watch(() => props.selectedDate, (newDate) => {
  if (newDate) {
    miniCalendarDate.value = newDate
  }
}, { immediate: true })

const miniCalendarMonthYear = computed(() => {
  return df.format(miniCalendarDate.value.toDate(getLocalTimeZone()))
})

const miniCalendarDays = computed(() => {
  const year = miniCalendarDate.value.year
  const month = miniCalendarDate.value.month
  const firstDay = parseDate(`${year}-${String(month).padStart(2, '0')}-01`)
  const lastDay = firstDay.set({ day: firstDay.calendar.getDaysInMonth(firstDay) })
  
  const startDayOfWeek = (firstDay as any).dayOfWeek % 7
  const days: any[] = []
  
  // Días del mes anterior
  const prevMonth = firstDay.subtract({ months: 1 })
  const daysInPrevMonth = prevMonth.calendar.getDaysInMonth(prevMonth)
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonth.set({ day: daysInPrevMonth - i })
    days.push({
      day: day.day,
      date: day,
      isCurrentMonth: false,
      isToday: isSameDay(day, today(getLocalTimeZone())),
      isSelected: props.selectedDate && isSameDay(day, props.selectedDate)
    })
  }
  
  // Días del mes actual
  for (let day = 1; day <= lastDay.day; day++) {
    const date = parseDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    days.push({
      day: day,
      date: date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today(getLocalTimeZone())),
      isSelected: props.selectedDate && isSameDay(date, props.selectedDate)
    })
  }
  
  // Completar hasta 42 días
  const remainingDays = 42 - days.length
  const nextMonth = lastDay.add({ days: 1 })
  for (let day = 1; day <= remainingDays; day++) {
    const date = nextMonth.set({ day: day })
    days.push({
      day: day,
      date: date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today(getLocalTimeZone())),
      isSelected: props.selectedDate && isSameDay(date, props.selectedDate)
    })
  }
  
  return days
})

const handleCreate = (type: 'evento' | 'tarea') => {
  emit('create', type)
  if (props.onCreate) {
    props.onCreate(type)
  }
}

const handleMiniCalendarDayClick = (date: CalendarDate) => {
  emit('date-select', date)
  if (props.onDateSelect) {
    props.onDateSelect(date)
  }
}

const handleMiniCalendarDayDoubleClick = (date: CalendarDate) => {
  emit('date-double-click', date)
  if (props.onDateDoubleClick) {
    props.onDateDoubleClick(date)
  }
}

const previousMonth = () => {
  miniCalendarDate.value = miniCalendarDate.value.subtract({ months: 1 })
}

const nextMonth = () => {
  miniCalendarDate.value = miniCalendarDate.value.add({ months: 1 })
}
</script>

