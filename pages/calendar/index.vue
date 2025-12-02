<template>
  <div class="flex h-screen bg-white dark:bg-gray-900">
    <!-- Sidebar -->
    <CalendarSidebar
      :selected-date="currentDate as CalendarDate"
      @date-select="handleSidebarDateSelect"
      @date-double-click="handleSidebarDateDoubleClick"
      @create="handleSidebarCreate"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
        <div class="flex items-center justify-between">
          <!-- Left: Logo and Navigation -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 bg-primary-500 rounded flex items-center justify-center text-white font-bold">
                C
              </div>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Calendario</h1>
            </div>
            
            <div class="flex items-center gap-2">
              <UButton
                label="Hoy"
                variant="outline"
                size="sm"
                @click="goToToday"
              />
              <UButton
                icon="i-heroicons-chevron-left"
                variant="ghost"
                size="sm"
                @click="previousPeriod"
              />
              <UButton
                icon="i-heroicons-chevron-right"
                variant="ghost"
                size="sm"
                @click="nextPeriod"
              />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px]">
                {{ currentPeriodTitle }}
              </h2>
            </div>
          </div>

          <!-- Right: View Selector -->
          <div class="flex items-center gap-2">
            <UPopover>
              <UButton
                :label="viewMode === 'month' ? 'Mes' : viewMode === 'week' ? 'Semana' : 'Día'"
                variant="outline"
                size="sm"
                trailing-icon="i-heroicons-chevron-down"
              />
              <template #content>
                <div class="p-2 space-y-1">
                  <UButton
                    label="Día"
                    variant="ghost"
                    class="w-full justify-start"
                    :class="{ 'bg-gray-100 dark:bg-gray-700': viewMode === 'day' }"
                    @click="() => { viewMode = 'day'; updateUrl(); pendingLoadEvents = true }"
                  />
                  <UButton
                    label="Semana"
                    variant="ghost"
                    class="w-full justify-start"
                    :class="{ 'bg-gray-100 dark:bg-gray-700': viewMode === 'week' }"
                    @click="() => { viewMode = 'week'; updateUrl(); pendingLoadEvents = true }"
                  />
                  <UButton
                    label="Mes"
                    variant="ghost"
                    class="w-full justify-start"
                    :class="{ 'bg-gray-100 dark:bg-gray-700': viewMode === 'month' }"
                    @click="() => { viewMode = 'month'; updateUrl(); pendingLoadEvents = true }"
                  />
                </div>
              </template>
            </UPopover>
          </div>
        </div>
      </div>

      <!-- Calendar Content -->
      <div class="flex-1 overflow-auto relative">
        <div v-if="error && !loading" class="text-center py-12">
          <p class="text-red-500">{{ error }}</p>
          <UButton label="Reintentar" @click="loadEvents" class="mt-4" />
        </div>

        <!-- Transición para todas las vistas -->
        <Transition
          name="slide-fade"
          mode="out-in"
          @after-enter="onTransitionComplete"
        >
          <!-- Vista de Mes -->
          <div v-if="viewMode === 'month'" :key="`month-${currentDate.year}-${currentDate.month}`" class="h-full bg-white dark:bg-gray-800 relative">
            <!-- Skeleton mientras carga -->
            <div v-if="loading" class="absolute inset-0 z-20 bg-white dark:bg-gray-900">
              <CalendarSkeleton :view-mode="viewMode" />
            </div>
            <!-- Contenido del calendario -->
            <div v-show="!loading">
      <!-- Días de la semana -->
      <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        <div
          v-for="day in weekDays"
          :key="day"
          class="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"
        >
          {{ day }}
        </div>
      </div>

      <!-- Días del mes -->
      <div class="grid grid-cols-7">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700 p-1.5"
          :class="{
            'bg-gray-50/50 dark:bg-gray-900/50': !day.isCurrentMonth,
            'bg-white dark:bg-gray-800': day.isCurrentMonth,
            'bg-blue-50 dark:bg-blue-900/10': day.isToday
          }"
        >
          <div class="flex justify-between items-start mb-1">
            <span
              class="text-sm font-medium"
              :class="{
                'text-gray-400 dark:text-gray-600': !day.isCurrentMonth,
                'text-gray-900 dark:text-white': day.isCurrentMonth && !day.isToday,
                'text-primary-600 dark:text-primary-400 font-bold': day.isToday
              }"
            >
              {{ day.day }}
            </span>
          </div>
          <div 
            class="space-y-0.5 max-h-[80px] overflow-y-auto min-h-[60px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors"
            @click="handleDayClick(day.date)"
          >
            <div
              v-for="event in day.events"
              :key="event.id"
              class="text-xs px-1.5 py-0.5 rounded cursor-pointer hover:opacity-90 transition-opacity mb-0.5 text-left"
              :style="{ 
                backgroundColor: event.color || '#3b82f6', 
                color: '#ffffff',
                borderLeft: `3px solid ${event.color || '#3b82f6'}`
              }"
              @click.stop="openEditModal(event)"
              @dblclick.stop="openEditModal(event)"
            >
              <div class="truncate font-medium leading-tight">{{ event.title }}</div>
              <div v-if="!event.is_all_day && event.start_time" class="text-[10px] opacity-90 leading-tight">
                {{ formatTime(event.start_time) }}
              </div>
            </div>
          </div>
        </div>
      </div>
            </div>
    </div>

          <!-- Vista de Semana -->
          <div v-else-if="viewMode === 'week'" :key="`week-${currentDate.year}-${currentDate.month}-${currentDate.day}`" class="h-full bg-white dark:bg-gray-800 relative">
            <!-- Skeleton mientras carga -->
            <div v-if="loading" class="absolute inset-0 z-20 bg-white dark:bg-gray-900">
              <CalendarSkeleton :view-mode="viewMode" />
            </div>
            <!-- Contenido del calendario -->
            <div v-show="!loading">
      <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <div class="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"></div>
        <div
          v-for="day in weekDaysData"
          :key="day.date"
          class="p-3 text-center border-l border-gray-200 dark:border-gray-700"
          :class="{
            'bg-primary-50 dark:bg-primary-900/20': day.isToday,
            'bg-gray-50 dark:bg-gray-900': !day.isToday
          }"
        >
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ day.dayName }}</div>
          <div
            class="text-lg font-semibold"
            :class="{
              'text-primary-600 dark:text-primary-400': day.isToday,
              'text-gray-900 dark:text-white': !day.isToday
            }"
          >
            {{ day.day }}
          </div>
        </div>
      </div>
      <div class="grid grid-cols-8">
        <div class="border-r border-gray-200 dark:border-gray-700">
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-16 border-b border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500 dark:text-gray-400"
          >
            {{ hour }}
          </div>
        </div>
        <div
          v-for="day in weekDaysData"
          :key="day.date"
          class="border-r border-b border-gray-200 dark:border-gray-700 relative"
        >
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-16 border-b border-gray-200 dark:border-gray-700"
          ></div>
          <div
            v-for="event in day.events"
            :key="event.id"
            class="absolute left-1 right-1 text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
            :style="{
              backgroundColor: event.color || '#3b82f6',
              color: '#ffffff',
              top: getEventTopPosition(event),
              height: getEventHeight(event)
            }"
            @click="openEditModal(event)"
            @dblclick="openEditModal(event)"
          >
            <div class="truncate font-medium">{{ event.title }}</div>
            <div v-if="event.start_time" class="text-xs opacity-90">
              {{ formatTime(event.start_time) }}
            </div>
          </div>
        </div>
      </div>
            </div>
        </div>

          <!-- Vista de Día -->
          <div v-else-if="viewMode === 'day'" :key="`day-${currentDate.year}-${currentDate.month}-${currentDate.day}`" class="h-full bg-white dark:bg-gray-800 flex flex-col relative">
            <!-- Skeleton mientras carga -->
            <div v-if="loading" class="absolute inset-0 z-20 bg-white dark:bg-gray-900">
              <CalendarSkeleton :view-mode="viewMode" />
            </div>
            <!-- Contenido del calendario -->
            <div v-show="!loading" class="h-full flex flex-col">
          <!-- Header del día -->
          <div class="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                  {{ formatDayHeader(currentDate as CalendarDate) }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ formatDaySubheader(currentDate as CalendarDate) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Horas del día -->
          <div class="flex-1 overflow-y-auto">
            <div class="grid grid-cols-12">
              <!-- Columna de horas -->
              <div class="col-span-1 border-r border-gray-200 dark:border-gray-700">
                <div
                  v-for="hour in hours"
                  :key="hour"
                  class="h-16 border-b border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ hour }}
                </div>
              </div>

              <!-- Columna de eventos -->
              <div class="col-span-11 relative">
                <!-- Grid de horas -->
                <div
                  v-for="hour in hours"
                  :key="hour"
                  class="h-16 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  @click="handleHourClick(hour)"
                ></div>

                <!-- Eventos del día -->
                <div
                  v-for="event in dayEvents"
                  :key="event.id"
                  class="absolute left-2 right-2 text-xs px-2 py-1 rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                  :style="{
                    backgroundColor: event.color || '#3b82f6',
                    color: '#ffffff',
                    top: getEventTopPosition(event),
                    height: getEventHeight(event)
                  }"
                  @click="openEditModal(event)"
                  @dblclick="openEditModal(event)"
                >
                  <div class="font-medium truncate">{{ event.title }}</div>
                  <div v-if="event.start_time && event.end_time" class="text-[10px] opacity-90">
                    {{ formatTime(event.start_time) }} - {{ formatTime(event.end_time) }}
                  </div>
                  <div v-else-if="event.start_time" class="text-[10px] opacity-90">
                    {{ formatTime(event.start_time) }}
                  </div>
              </div>
            </div>
          </div>
            </div>
        </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <UModal v-model="isDeleteModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold">Confirmar eliminación</h3>
      </template>
      <template #body>
        <p>¿Estás seguro de que deseas eliminar el evento "{{ selectedEvent?.title }}"?</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Cancelar" variant="ghost" @click="isDeleteModalOpen = false" />
          <UButton label="Eliminar" color="error" @click="confirmDelete" :loading="loading" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { CalendarDate, getLocalTimeZone, today, parseDate, isSameDay } from '@internationalized/date'
import { useCalendar } from '~/composables/useCalendar'
import { useModal } from '~/composables/commons/useModal'
import type { CalendarEvent, CreateEventRequest, UpdateEventRequest } from '~/types/calendar'
import EventModal from '~/components/calendar/EventModal.vue'
import QuickCreateModal from '~/components/calendar/QuickCreateModal.vue'
import CalendarSidebar from '~/components/calendar/CalendarSidebar.vue'
import CalendarSkeleton from '~/components/calendar/CalendarSkeleton.vue'
import { useOverlay } from '#imports'

const { visibleEvents, loading, error, getEvents, createEvent, updateEvent, deleteEvent } = useCalendar()
const { showSuccess, showError } = useModal()

const route = useRoute()
const router = useRouter()

// Inicializar desde la ruta o valores por defecto
const initializeFromRoute = () => {
  // Intentar leer de params primero (rutas dinámicas)
  const yearParam = route.params.year ? parseInt(route.params.year as string) : (route.query.year ? parseInt(route.query.year as string) : null)
  const monthParam = route.params.month ? parseInt(route.params.month as string) : (route.query.month ? parseInt(route.query.month as string) : null)
  const dayParam = route.params.day ? parseInt(route.params.day as string) : (route.query.day ? parseInt(route.query.day as string) : null)
  const viewParam = route.query.view as string

  if (yearParam && monthParam && !isNaN(yearParam) && !isNaN(monthParam) && monthParam >= 1 && monthParam <= 12) {
    if (dayParam && !isNaN(dayParam) && dayParam >= 1 && dayParam <= 31) {
      // Vista de día
      try {
        currentDate.value = parseDate(`${yearParam}-${String(monthParam).padStart(2, '0')}-${String(dayParam).padStart(2, '0')}`) as CalendarDate
        viewMode.value = 'day'
      } catch {
        currentDate.value = today(getLocalTimeZone())
        viewMode.value = 'month'
      }
    } else {
      // Vista de mes o semana
      try {
        currentDate.value = parseDate(`${yearParam}-${String(monthParam).padStart(2, '0')}-01`) as CalendarDate
        viewMode.value = (viewParam === 'week' ? 'week' : 'month') as 'month' | 'week' | 'day'
      } catch {
        currentDate.value = today(getLocalTimeZone())
        viewMode.value = 'month'
      }
    }
  } else {
    // Valores por defecto
    currentDate.value = today(getLocalTimeZone())
    viewMode.value = 'month'
  }
}

const viewMode = ref<'month' | 'week' | 'day'>('month')
const currentDate = ref<CalendarDate>(today(getLocalTimeZone()))
const isDeleteModalOpen = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const pendingLoadEvents = ref(false)

// Inicializar desde la ruta
initializeFromRoute()

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const overlay = useOverlay()
const eventModal = overlay.create(EventModal)
const quickCreateModal = overlay.create(QuickCreateModal)
const currentMonthYear = computed(() => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return `${months[currentDate.value.month - 1]} ${currentDate.value.year}`
})

const currentPeriodTitle = computed(() => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  
  if (viewMode.value === 'day') {
    try {
      // Calcular el día de la semana usando una fecha JavaScript
      const jsDate = new Date(currentDate.value.year, currentDate.value.month - 1, currentDate.value.day)
      const dayOfWeek = jsDate.getDay() // 0 = Domingo, 1 = Lunes, etc.
      const dayName = days[dayOfWeek] || days[0] // Fallback a Domingo si hay error
      return `${dayName}, ${currentDate.value.day} de ${months[currentDate.value.month - 1]}`
    } catch {
      return `${currentDate.value.day} de ${months[currentDate.value.month - 1]}`
    }
  } else if (viewMode.value === 'week') {
    // Obtener el lunes de la semana actual
    const currentDay = parseDate(`${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`)
    const dayOfWeek = (currentDay as any).dayOfWeek % 7
    const monday = currentDay.subtract({ days: dayOfWeek === 0 ? 6 : dayOfWeek - 1 })
    const sunday = monday.add({ days: 6 })
    
    if (monday.month === sunday.month) {
      return `${monday.day} - ${sunday.day} de ${months[monday.month - 1]} ${monday.year}`
    } else {
      return `${monday.day} de ${months[monday.month - 1]} - ${sunday.day} de ${months[sunday.month - 1]} ${monday.year}`
    }
  } else {
    return `${months[currentDate.value.month - 1]} ${currentDate.value.year}`
  }
})

// Calcular días del mes para la vista mensual
const calendarDays = computed(() => {
  const year = currentDate.value.year
  const month = currentDate.value.month
  const firstDay = parseDate(`${year}-${String(month).padStart(2, '0')}-01`)
  const lastDay = firstDay.set({ day: firstDay.calendar.getDaysInMonth(firstDay) })
  
  // Obtener el primer día de la semana del mes (domingo = 0)
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
      events: getEventsForDate(day)
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
      events: getEventsForDate(date)
    })
  }
  
  // Completar hasta 42 días (6 semanas)
  const remainingDays = 42 - days.length
  const nextMonth = lastDay.add({ days: 1 })
  for (let day = 1; day <= remainingDays; day++) {
    const date = nextMonth.set({ day: day })
    days.push({
      day: day,
      date: date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today(getLocalTimeZone())),
      events: getEventsForDate(date)
    })
  }
  
  return days
})

// Calcular días de la semana para la vista semanal
const weekDaysData = computed(() => {
  const year = currentDate.value.year
  const month = currentDate.value.month
  const day = currentDate.value.day
  
  // Obtener el lunes de la semana actual
  const currentDay = parseDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  const dayOfWeek = (currentDay as any).dayOfWeek % 7
  const monday = currentDay.subtract({ days: dayOfWeek === 0 ? 6 : dayOfWeek - 1 })
  
  const days: any[] = []
  for (let i = 0; i < 7; i++) {
    const date = monday.add({ days: i })
    days.push({
      day: date.day,
      date: date,
      dayName: weekDays[(date as any).dayOfWeek % 7],
      isToday: isSameDay(date, today(getLocalTimeZone())),
      events: getEventsForDate(date)
    })
  }
  return days
})

const getEventsForDate = (date: CalendarDate) => {
  const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  return visibleEvents.value.filter(event => {
    const startDate = event.start_date
    const endDate = event.end_date
    return dateStr >= startDate && dateStr <= endDate
  })
}

// Eventos del día actual para la vista de día
const dayEvents = computed(() => {
  return getEventsForDate(currentDate.value as CalendarDate)
})

const formatDayHeader = (date: CalendarDate) => {
  if (!date) return ''
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  try {
    // Calcular el día de la semana usando una fecha JavaScript
    const jsDate = new Date(date.year, date.month - 1, date.day)
    const dayOfWeek = jsDate.getDay() // 0 = Domingo, 1 = Lunes, etc.
    const dayName = days[dayOfWeek] || days[0] // Fallback a Domingo si hay error
    return `${dayName}, ${date.day} de ${months[date.month - 1]}`
  } catch (error) {
    // Fallback si hay error
    console.error('Error formatting day header:', error)
    return `${date.day} de ${months[date.month - 1]}`
  }
}

const formatDaySubheader = (date: CalendarDate) => {
  if (!date) return ''
  const todayDate = today(getLocalTimeZone()) as CalendarDate
  if (isSameDay(date as CalendarDate, todayDate)) {
    return 'Hoy'
  }
  return ''
}

const handleHourClick = (hour: string) => {
  const [hours, minutes] = hour.split(':')
  const dateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
  
  quickCreateModal.open({
    selectedDate: currentDate.value as CalendarDate,
    onSelect: (type: 'evento' | 'tarea') => {
      eventModal.open({
        event: null,
        initialDate: dateStr,
        initialTime: hour,
        type: type,
        onSave: async (data: CreateEventRequest | UpdateEventRequest) => {
          await handleSaveEvent(data)
        }
      })
    }
  })
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const getEventTopPosition = (event: CalendarEvent) => {
  if (!event.start_time) return '0px'
  const [hours, minutes] = event.start_time.split(':')
  const hour = parseInt(hours)
  const minute = parseInt(minutes)
  return `${(hour * 64) + (minute / 60 * 64)}px`
}

const getEventHeight = (event: CalendarEvent) => {
  if (!event.start_time || !event.end_time) return '64px'
  const [startHours, startMinutes] = event.start_time.split(':')
  const [endHours, endMinutes] = event.end_time.split(':')
  const start = parseInt(startHours) * 60 + parseInt(startMinutes)
  const end = parseInt(endHours) * 60 + parseInt(endMinutes)
  const duration = end - start
  return `${(duration / 60) * 64}px`
}

const updateUrl = () => {
  const year = currentDate.value.year
  const month = currentDate.value.month
  const day = currentDate.value.day
  
  let url = '/calendar'
  const params = new URLSearchParams()
  
  if (viewMode.value === 'day') {
    params.set('year', year.toString())
    params.set('month', month.toString())
    params.set('day', day.toString())
    params.set('view', 'day')
  } else if (viewMode.value === 'week') {
    params.set('year', year.toString())
    params.set('month', month.toString())
    params.set('view', 'week')
  } else {
    params.set('year', year.toString())
    params.set('month', month.toString())
    params.set('view', 'month')
  }
  
  url = `/calendar?${params.toString()}`
  router.replace(url)
}

const previousPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.subtract({ months: 1 })
  } else if (viewMode.value === 'week') {
    currentDate.value = currentDate.value.subtract({ weeks: 1 })
  } else if (viewMode.value === 'day') {
    currentDate.value = currentDate.value.subtract({ days: 1 })
  }
  updateUrl()
  pendingLoadEvents.value = true
  // La petición se hará después de la animación
}

const nextPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.add({ months: 1 })
  } else if (viewMode.value === 'week') {
    currentDate.value = currentDate.value.add({ weeks: 1 })
  } else if (viewMode.value === 'day') {
    currentDate.value = currentDate.value.add({ days: 1 })
  }
  updateUrl()
  pendingLoadEvents.value = true
  // La petición se hará después de la animación
}

const goToToday = () => {
  currentDate.value = today(getLocalTimeZone())
  updateUrl()
  pendingLoadEvents.value = true
  // La petición se hará después de la animación
}

const loadEvents = async () => {
  let startDate: string
  let endDate: string
  
  if (viewMode.value === 'day') {
    // Cargar solo el día actual
    const dateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
    startDate = dateStr
    endDate = dateStr
  } else if (viewMode.value === 'week') {
    // Obtener el lunes y domingo de la semana
    const currentDay = parseDate(`${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`)
    const dayOfWeek = (currentDay as any).dayOfWeek % 7
    const monday = currentDay.subtract({ days: dayOfWeek === 0 ? 6 : dayOfWeek - 1 })
    const sunday = monday.add({ days: 6 })
    
    startDate = `${monday.year}-${String(monday.month).padStart(2, '0')}-${String(monday.day).padStart(2, '0')}`
    endDate = `${sunday.year}-${String(sunday.month).padStart(2, '0')}-${String(sunday.day).padStart(2, '0')}`
  } else {
    // Modo mes: cargar todo el mes
    const year = currentDate.value.year
    const month = currentDate.value.month
    startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = parseDate(startDate).set({ day: parseDate(startDate).calendar.getDaysInMonth(parseDate(startDate)) })
    endDate = `${lastDay.year}-${String(lastDay.month).padStart(2, '0')}-${String(lastDay.day).padStart(2, '0')}`
  }
  
  await getEvents({
    start_date: startDate,
    end_date: endDate
  })
}

const handleDayClick = (date: CalendarDate) => {
  quickCreateModal.open({
    selectedDate: date,
    onSelect: (type: 'evento' | 'tarea') => {
      // Cerrar el modal rápido y abrir el modal de evento/tarea
      const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
      eventModal.open({
        event: null,
        initialDate: dateStr,
        type: type,
        onSave: async (data: CreateEventRequest | UpdateEventRequest) => {
          await handleSaveEvent(data)
        }
      })
    }
  })
}

const handleSidebarDateSelect = (date: CalendarDate) => {
  currentDate.value = date as CalendarDate
  // Mantener la vista actual (no cambiar automáticamente a mes)
  updateUrl()
  pendingLoadEvents.value = true
  // La petición se hará después de la animación
}

const handleSidebarDateDoubleClick = (date: CalendarDate) => {
  currentDate.value = date as CalendarDate
  viewMode.value = 'day'
  updateUrl()
  pendingLoadEvents.value = true
  // La petición se hará después de la animación
}

const handleSidebarCreate = (type: 'evento' | 'tarea') => {
  // Usar la fecha seleccionada actual (currentDate) para prellenar el modal
  const dateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
  eventModal.open({
    event: null,
    type: type,
    initialDate: dateStr, // Pasar la fecha seleccionada
    onSave: async (data: CreateEventRequest | UpdateEventRequest) => {
      await handleSaveEvent(data)
    }
  })
}

const openCreateModal = () => {
  eventModal.open({
    event: null,
    type: 'evento',
    onSave: async (data: CreateEventRequest | UpdateEventRequest) => {
      await handleSaveEvent(data)
    }
  })
}

const openEditModal = (event: CalendarEvent) => {
  eventModal.open({
    event: event,
    type: event.type || 'evento',
    onSave: async (data: CreateEventRequest | UpdateEventRequest) => {
      await handleSaveEvent(data)
    }
  })
}

const handleSaveEvent = async (data: CreateEventRequest | UpdateEventRequest) => {
  try {
    if ('id' in data) {
      // Actualizar
      const result = await updateEvent(data as UpdateEventRequest)
      if (result) {
        showSuccess('Evento actualizado', 'El evento se ha actualizado correctamente.')
        await loadEvents()
      } else {
        showError('Error', 'No se pudo actualizar el evento.')
      }
    } else {
      // Crear
      const result = await createEvent(data)
      if (result) {
        showSuccess('Evento creado', 'El evento se ha creado correctamente.')
        await loadEvents()
      } else {
        showError('Error', 'No se pudo crear el evento.')
      }
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al guardar el evento.')
  }
}

const confirmDelete = async () => {
  if (!selectedEvent.value?.id) return
  
  try {
    const taskDayId = selectedEvent.value.task_day_id
    const success = await deleteEvent(selectedEvent.value.id, taskDayId)
    if (success) {
      showSuccess('Evento eliminado', taskDayId ? 'El día de la tarea se ha eliminado correctamente.' : 'El evento se ha eliminado correctamente.')
      isDeleteModalOpen.value = false
      selectedEvent.value = null
      await loadEvents()
    } else {
      showError('Error', 'No se pudo eliminar el evento.')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al eliminar el evento.')
  }
}

// Cargar eventos al montar
onMounted(() => {
  loadEvents()
  // Actualizar URL inicial si no hay parámetros
  if (!route.query.year && !route.query.month) {
    updateUrl()
  }
})

// Función que se ejecuta cuando la transición completa
const onTransitionComplete = () => {
  if (pendingLoadEvents.value) {
    pendingLoadEvents.value = false
    loadEvents()
  }
}

// Recargar eventos cuando cambia la fecha o el modo de vista (solo si no hay transición pendiente)
watch([currentDate, viewMode], () => {
  // Si no hay una transición pendiente, cargar inmediatamente (para cambios que no activan animación)
  if (!pendingLoadEvents.value) {
    loadEvents()
  }
})

// Observar cambios en la ruta para sincronizar el estado
watch(() => route.query, (newQuery) => {
  const yearParam = newQuery.year ? parseInt(newQuery.year as string) : null
  const monthParam = newQuery.month ? parseInt(newQuery.month as string) : null
  const dayParam = newQuery.day ? parseInt(newQuery.day as string) : null
  const viewParam = newQuery.view as string

  if (yearParam && monthParam && !isNaN(yearParam) && !isNaN(monthParam) && monthParam >= 1 && monthParam <= 12) {
    if (dayParam && !isNaN(dayParam) && dayParam >= 1 && dayParam <= 31) {
      // Vista de día
      try {
        const newDate = parseDate(`${yearParam}-${String(monthParam).padStart(2, '0')}-${String(dayParam).padStart(2, '0')}`) as CalendarDate
        const newDateStr = `${newDate.year}-${String(newDate.month).padStart(2, '0')}-${String(newDate.day).padStart(2, '0')}`
        const currentDateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
        if (newDateStr !== currentDateStr) {
          currentDate.value = newDate
        }
        if (viewMode.value !== 'day') {
          viewMode.value = 'day'
        }
      } catch {
        // Ignorar errores de parsing
      }
    } else {
      // Vista de mes o semana
      try {
        const newDate = parseDate(`${yearParam}-${String(monthParam).padStart(2, '0')}-01`) as CalendarDate
        if (newDate.year !== currentDate.value.year || newDate.month !== currentDate.value.month) {
          currentDate.value = newDate
        }
        const newViewMode = (viewParam === 'week' ? 'week' : 'month') as 'month' | 'week' | 'day'
        if (viewMode.value !== newViewMode) {
          viewMode.value = newViewMode
        }
      } catch {
        // Ignorar errores de parsing
      }
    }
  }
}, { immediate: false })
</script>

<style scoped>
/* Animación de pase de página */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>

