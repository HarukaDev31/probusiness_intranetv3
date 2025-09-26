<template>
  <UCard class="h-auto" variant="soft">
    <div class="max-w-6xl mx-auto p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div class="space-y-6">
          <div class="rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <UButton 
                @click="previousMonth"
                icon="i-heroicons-chevron-left"
                variant="ghost"
                color="neutral"
                size="sm"
              />
              <h3 class="text-lg font-semibold text-white">
                {{ currentMonthYear }}
              </h3>
              <UButton 
                @click="nextMonth"
                icon="i-heroicons-chevron-right"
                variant="ghost"
                color="neutral"
                size="sm"
              />
            </div>

            <!-- Días de la semana -->
            <div class="grid grid-cols-7 gap-2 mb-3">
              <div 
                v-for="day in daysOfWeek" 
                :key="day"
                class="text-center text-xs text-gray-400 py-2"
              >
                {{ day }}
              </div>
            </div>

            <!-- Días del mes -->
            <div class="grid grid-cols-7 gap-2">
              <button
                v-for="date in calendarDays"
                :key="date.value"
                @click="selectDate(date)"
                :class="[
                  'w-10 h-10 rounded-full text-sm font-medium transition-all duration-200',
                  date.isCurrentMonth 
                    ? 'hover:bg-gray-600' 
                    : 'text-neutral-500',
                  date.isSelected 
                    ? 'bg-primary-600 text-white' 
                    : '',
                  date.isAvailable && date.isCurrentMonth
                    ? 'hover:bg-gray-700'
                    : 'text-neutral-500'
                ]"
                :disabled="!date.isCurrentMonth || !date.isAvailable"
              >
                {{ date.day }}
              </button>
            </div>
          </div>
        </div>

        <!-- Sección Derecha: Selección de Horario -->
        <div class="space-y-6">
          
          <div class="rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">
              Escoge tu horario:
            </h3>

            <!-- Loading state para horarios -->
            <div v-if="loadingTimeSlots" class="flex justify-center py-8">
              <LoadingSpinner />
            </div>

            <!-- Error state para horarios -->
            <div v-else-if="timeSlotsError" class="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p class="text-red-400 text-sm">{{ timeSlotsError }}</p>
            </div>

            <!-- Horarios Disponibles -->
            <div v-else-if="availableTimeSlots.length > 0" class="space-y-3 grid grid-cols-3 gap-2">
              <button
                v-for="timeSlot in availableTimeSlots"
                :key="timeSlot.id"
                @click="selectTimeSlot(timeSlot)"
                :class="[
                  'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 h-20 flex flex-col items-center justify-center',
                  selectedTimeSlot?.id === timeSlot.id 
                    ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                    : timeSlot.isAvailable
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                ]"
                :disabled="!timeSlot.isAvailable"
              >
                <span class="text-sm font-medium">{{ timeSlot.time }}</span>
                <span v-if="timeSlot.maxCapacity && timeSlot.currentBookings" class="text-xs opacity-75">
                  ({{ timeSlot.currentBookings }}/{{ timeSlot.maxCapacity }})
                </span>
              </button>
            </div>

            <!-- Empty state para horarios -->
            <div v-else class="text-center py-8 text-gray-500">
              <UIcon name="i-heroicons-clock" class="w-12 h-12 mx-auto mb-2" />
              <p class="text-sm">No hay horarios disponibles</p>
              <p class="text-xs">Contacta al administrador para configurar horarios</p>
            </div>

            <!-- Mensaje de Error/Instrucción -->
            <div 
              v-if="!selectedDate || !selectedTimeSlot"
              class="mt-6 p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
            >
              <p class="text-red-400 text-sm text-center">
                Seleccione una fecha y hora
              </p>
            </div>

            <!-- Botón de Confirmación -->
            <UButton
              v-if="selectedDate && selectedTimeSlot"
              @click="confirmAppointment"
              color="primary"
              size="lg"
              block
              class="mt-6"
              :loading="confirmingAppointment"
            >
              Confirmar Recogida
            </UButton>
          </div>

          <!-- Resumen de la Cita -->
          <div 
            v-if="selectedDate && selectedTimeSlot"
            class="rounded-lg p-6"
          >
            <h4 class="text-lg font-semibold mb-4">
              Resumen de tu recogida
            </h4>
            
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Especialista:</span>
                <span class="text-white">Kevin Yarlequé</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Fecha:</span>
                <span class="text-white">{{ formatSelectedDate }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Hora:</span>
                <span class="text-white">{{ selectedTimeSlot.time }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Duración:</span>
                <span class="text-white">30 minutos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { TimeSlot } from '~/types/horarios'
import { useHorariosAdmin } from '~/composables/useHorariosAdmin'
import { useModal } from '~/composables/commons/useModal'

interface Props {
  specialistId?: string
  specialistName?: string
}

const props = withDefaults(defineProps<Props>(), {
  specialistId: '',
  specialistName: 'Kevin Yarlequé'
})

// Composables
const { getActiveSchedules, loadSchedules } = useHorariosAdmin()
const { showSuccess, showError } = useModal()

// Estado del componente
const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)
const selectedTimeSlot = ref<TimeSlot | null>(null)
const confirmingAppointment = ref(false)
const loadingTimeSlots = ref(false)
const timeSlotsError = ref<string | null>(null)

// Días de la semana en español
const daysOfWeek = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

// Meses en español
const months = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

// Computed properties
const currentMonthYear = computed(() => {
  const month = months[currentDate.value.getMonth()]
  const year = currentDate.value.getFullYear()
  return `${month} de ${year}`
})

const availableTimeSlots = computed(() => {
  const activeSchedules = getActiveSchedules.value
  if (activeSchedules.length === 0) return []
  
  // Por ahora tomamos el primer horario activo
  // En el futuro se podría implementar lógica para seleccionar el horario apropiado
  const schedule = activeSchedules[0]
  return schedule.timeSlots
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // Primer día del mes
  const firstDay = new Date(year, month, 1)
  // Último día del mes
  const lastDay = new Date(year, month + 1, 0)
  
  // Día de la semana del primer día (0 = Domingo)
  const startDay = firstDay.getDay()
  
  // Número de días del mes
  const daysInMonth = lastDay.getDate()
  
  // Días del mes anterior para completar la primera semana
  const prevMonth = new Date(year, month - 1, 0)
  const daysInPrevMonth = prevMonth.getDate()
  
  const days = []
  
  // Días del mes anterior
  for (let i = startDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    days.push({
      day,
      value: new Date(year, month - 1, day),
      isCurrentMonth: false,
      isSelected: false,
      isAvailable: false
    })
  }
  
  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isSelected = selectedDate.value?.toDateString() === date.toDateString()
    
    days.push({
      day,
      value: date,
      isCurrentMonth: true,
      isSelected,
      isAvailable: isDateAvailable(date)
    })
  }
  
  // Completar con días del mes siguiente
  const remainingDays = 42 - days.length // 6 semanas * 7 días
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      day,
      value: new Date(year, month + 1, day),
      isCurrentMonth: false,
      isSelected: false,
      isAvailable: false
    })
  }
  
  return days
})

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  
  const day = selectedDate.value.getDate()
  const month = months[selectedDate.value.getMonth()]
  const year = selectedDate.value.getFullYear()
  
  return `${day} de ${month} de ${year}`
})

// Métodos
const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
}

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
}

const selectDate = (date: any) => {
  if (date.isCurrentMonth && date.isAvailable) {
    selectedDate.value = date.value
    // Resetear horario seleccionado cuando cambia la fecha
    selectedTimeSlot.value = null
    date.isSelected = true
  }
}

const selectTimeSlot = (timeSlot: TimeSlot) => {
  if (timeSlot.isAvailable) {
    selectedTimeSlot.value = timeSlot
  }
}

const isDateAvailable = (date: Date) => {
  // Simular fechas disponibles (solo algunos días del mes)
  const day = date.getDate()
  const unavailableDays = [26, 30] // Días disponibles según la imagen
  return !unavailableDays.includes(day)
}

const confirmAppointment = async () => {
  if (!selectedDate.value || !selectedTimeSlot.value) return
  
  try {
    confirmingAppointment.value = true
    
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showSuccess(
      '¡Cita confirmada!',
      `Tu cita con ${props.specialistName} ha sido programada para el ${formatSelectedDate.value} a las ${selectedTimeSlot.value.time}. Recibirás un recordatorio por correo electrónico.`
    )
    
    // Resetear selecciones
    selectedDate.value = null
    selectedTimeSlot.value = null
    
  } catch (error: any) {
    console.error('Error al confirmar cita:', error)
    showError('Error al confirmar cita', error.message || 'No se pudo confirmar la cita')
  } finally {
    confirmingAppointment.value = false
  }
}

const loadTimeSlots = async () => {
  try {
    loadingTimeSlots.value = true
    timeSlotsError.value = null
    await loadSchedules()
  } catch (error: any) {
    timeSlotsError.value = error.message || 'Error al cargar horarios'
  } finally {
    loadingTimeSlots.value = false
  }
}

// Cargar horarios al montar el componente
onMounted(() => {
  loadTimeSlots()
  // Configurar fecha inicial (septiembre 2025 como en la imagen)
  currentDate.value = new Date(2025, 8, 1) // Septiembre 2025
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
.grid {
  display: grid;
}
</style>
