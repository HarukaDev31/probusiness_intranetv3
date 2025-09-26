<template>
  <UCard class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold ">Administración de Horarios</h2>
        <p class=" mt-1">Gestiona los horarios disponibles para las citas</p>
      </div>
      <UButton
        @click="openHorarioModal"
        icon="i-heroicons-plus"
        color="primary"
        size="lg"
        :disabled="selectedDates.length === 0"
      >
        Nuevo Horario ({{ selectedDates.length }})
      </UButton>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Calendario -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold ">Calendario</h3>
        <UCard class="">
          <div class="p-4">
            <!-- Navegación del calendario -->
            <div class="flex items-center justify-between mb-4">
              <UButton 
                @click="previousMonth"
                icon="i-heroicons-chevron-left"
                variant="ghost"
                color="neutral"
                size="sm"
              />
              <h4 class="text-lg font-semibold ">
                {{ currentMonthYear }}
              </h4>
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
                class="text-center text-xs py-2"
              >
                {{ day }}
              </div>
            </div>

            <!-- Días del mes -->
            <div class="grid grid-cols-7 gap-2">
              <!-- Días vacíos al inicio para alinear el primer día -->
              <div
                v-for="emptyDay in getEmptyDaysAtStart()"
                :key="`empty-${emptyDay}`"
                class="w-10 h-10"
              ></div>
              
              <!-- Días del mes -->
              <button
                v-for="date in calendarDays"
                :key="date.value"
                @click="selectDate(date)"
                @mousedown="startDrag(date)"
                @mouseenter="handleDrag(date)"
                @mouseup="endDrag"
                :class="[
                  'w-10 h-10 rounded-full text-sm font-medium transition-all duration-200',
                  !date.isPast
                    ? 'hover:bg-primary-600' 
                    : 'text-neutral-500',
                  getDateClass(date)
                ]"
                :disabled="date.isPast"
              >
                {{ date.day }}
              </button>
            </div>
          </div>
        </UCard>

        <!-- Fechas seleccionadas -->
        <UCard v-if="selectedDates.length > 0" class="">
          <template #header>
            <h4 class="text-lg font-semibold ">Fechas Seleccionadas</h4>
          </template>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="date in selectedDates"
              :key="date.toISOString()"
              color="primary"
              variant="soft"
              class="cursor-pointer"
              @click="removeSelectedDate(date)"
            >
              {{ formatDate(date) }}
              <UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1" />
            </UBadge>
          </div>
        </UCard>
      </div>

      <!-- Lista de horarios existentes -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold ">Horarios Configurados</h3>
        
        <UCard class="">
          <div v-if="loading" class="flex justify-center py-8">
            <LoadingSpinner />
          </div>

          <div v-else-if="scheduleList.length === 0" class="text-center py-8 text-gray-500">
            <UIcon name="i-heroicons-clock" class="w-12 h-12 mx-auto mb-2" />
            <p class="text-sm">No hay horarios configurados</p>
            <p class="text-xs">Selecciona fechas y crea horarios</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="schedule in scheduleList"
              :key="schedule.id"
              class="flex items-center justify-between p-3  rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-primary-500 rounded-full"></div>
                <div>
                  <p class="text-sm font-medium ">
                    {{ schedule.startTime }} - {{ schedule.endTime }}
                  </p>
                  <p class="text-xs ">
                    {{ schedule.date }} - {{ schedule.currentBookings }}/{{ schedule.maxBookings }} reservas
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  @click="deleteSchedule(schedule.id)"
                  icon="i-heroicons-trash"
                  color="error"
                  variant="ghost"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useOverlay } from '#imports'
import HorarioFormModal from '~/components/admin/HorarioFormModal.vue'
import { useModal } from '~/composables/commons/useModal'

// Composables
const overlay = useOverlay()
const modalHorario = overlay.create(HorarioFormModal)
const { showSuccess, showError, showConfirmation } = useModal()

// Estado del componente
const loading = ref(false)
const currentDate = ref(new Date())
const selectedDates = ref<Date[]>([])
const isDragging = ref(false)
const dragStartDate = ref<Date | null>(null)
const today = new Date()
today.setHours(0, 0, 0, 0) // Resetear horas para comparación

// Lista de horarios (simulada - reemplazar con datos reales)
const scheduleList = ref([
  {
    id: '1',
    date: '2025-09-16',
    startTime: '09:00',
    endTime: '10:00',
    maxBookings: 5,
    currentBookings: 3
  },
  {
    id: '2',
    date: '2025-09-16',
    startTime: '10:30',
    endTime: '11:30',
    maxBookings: 3,
    currentBookings: 1
  },
  {
    id: '3',
    date: '2025-09-17',
    startTime: '14:00',
    endTime: '15:00',
    maxBookings: 4,
    currentBookings: 2
  }
])

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

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // Último día del mes
  const lastDay = new Date(year, month + 1, 0)
  
  // Número de días del mes
  const daysInMonth = lastDay.getDate()
  
  const days = []
  
  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateString = date.toISOString().split('T')[0]
    const hasSchedule = scheduleList.value.some(schedule => schedule.date === dateString)
    const isSelected = selectedDates.value.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    )
    const isPast = date < today
    
    days.push({
      day,
      value: date,
      hasSchedule,
      isSelected,
      isPast
    })
  }
  
  return days
})

const getEmptyDaysAtStart = () => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay() // 0 = Domingo, 1 = Lunes, etc.
  return Array(startDay).fill(0)
}

// Métodos
const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
  clearSelection()
}

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
  clearSelection()
}

const selectDate = (date: any) => {
  if (date.isPast || isDragging.value) return
  
  // Click normal: seleccionar/deseleccionar una fecha
  const existingIndex = selectedDates.value.findIndex(selectedDate => 
    selectedDate.toDateString() === date.value.toDateString()
  )
  
  if (existingIndex !== -1) {
    selectedDates.value.splice(existingIndex, 1)
  } else {
    selectedDates.value.push(new Date(date.value))
  }
}

const startDrag = (date: any) => {
  if (date.isPast) return
  
  isDragging.value = true
  dragStartDate.value = new Date(date.value)
  
  // Seleccionar la fecha inicial si no está seleccionada
  const existingIndex = selectedDates.value.findIndex(selectedDate => 
    selectedDate.toDateString() === date.value.toDateString()
  )
  
  if (existingIndex === -1) {
    selectedDates.value.push(new Date(date.value))
  }
}

const handleDrag = (date: any) => {
  if (!isDragging.value || !dragStartDate.value || date.isPast) return
  
  // Seleccionar todas las fechas entre la fecha inicial y la actual
  let startDate = new Date(dragStartDate.value)
  let endDate = new Date(date.value)
  
  // Asegurar que startDate sea menor que endDate
  if (startDate > endDate) {
    const temp = startDate
    startDate = endDate
    endDate = temp
  }
  
  // Limpiar selección actual
  selectedDates.value = []
  
  // Agregar todas las fechas en el rango
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    if (currentDate >= today) { // Solo fechas futuras
      selectedDates.value.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
}

const endDrag = () => {
  isDragging.value = false
  dragStartDate.value = null
}

const removeSelectedDate = (date: Date) => {
  const index = selectedDates.value.findIndex(selectedDate => 
    selectedDate.toDateString() === date.toDateString()
  )
  if (index !== -1) {
    selectedDates.value.splice(index, 1)
  }
}

const clearSelection = () => {
  selectedDates.value = []
}

const getDateClass = (date: any) => {
  if (date.isPast) {
    return 'text-secondary-300'
  } else if (date.isSelected) {
    return 'bg-primary-500 text-white'
  } else if (date.hasSchedule) {
    return 'bg-green-500 text-white'
  } else {
    return 'text-secondary-500'
  }
}

const formatDate = (date: Date) => {
  const day = date.getDate()
  const month = months[date.getMonth()]
  return `${day} ${month}`
}

const openHorarioModal = () => {
  if (selectedDates.value.length === 0) return
  
  modalHorario.open({
    selectedDate: selectedDates.value[0], // Usar la primera fecha seleccionada
    onSave: (data: any) => {
      handleSaveHorario(data)
    }
  })
}

const handleSaveHorario = (data: any) => {
  try {
    // Función para convertir HH:MM a minutos
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    // Función para convertir minutos a HH:MM
    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    // Crear horarios para todas las fechas seleccionadas
    selectedDates.value.forEach(date => {
      const startMinutes = timeToMinutes(data.startTime)
      const endMinutes = timeToMinutes(data.endTime)
      
      // Crear horarios cada 30 minutos
      let currentMinutes = startMinutes
      while (currentMinutes < endMinutes) {
        const nextMinutes = Math.min(currentMinutes + 30, endMinutes)
        
        const newSchedule = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date: date.toISOString().split('T')[0],
          startTime: minutesToTime(currentMinutes),
          endTime: minutesToTime(nextMinutes),
          maxBookings: data.maxBookings,
          currentBookings: 0
        }
        
        scheduleList.value.push(newSchedule)
        currentMinutes += 30
      }
    })
    console.log(scheduleList.value)
    showSuccess('Horarios creados', `Se han creado horarios para ${selectedDates.value.length} fecha(s).`)
    clearSelection()
    
  } catch (error: any) {
    showError('Error al crear horarios', error.message || 'No se pudieron crear los horarios')
  }
}



// Cargar datos al montar el componente
onMounted(() => {
  // Configurar fecha inicial (septiembre 2025 como en la imagen)
  currentDate.value = new Date(2025, 8, 1) // Septiembre 2025
  
  // Agregar eventos globales para drag & drop
  document.addEventListener('mouseup', endDrag)
})



const deleteSchedule = (scheduleId: string) => {
  showConfirmation(
    'Confirmar eliminación',
    '¿Está seguro de que desea eliminar este horario? Esta acción no se puede deshacer.',
    async () => {
      try {
        // Simular llamada a API
        await new Promise(resolve => setTimeout(resolve, 500))
        
        scheduleList.value = scheduleList.value.filter(s => s.id !== scheduleId)
        showSuccess('Horario eliminado', 'El horario ha sido eliminado correctamente.')
      } catch (error: any) {
        showError('Error al eliminar', error.message || 'No se pudo eliminar el horario')
      }
    }
  )
}


</script>