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
                @dblclick="openHorarioModalFor(date.value)"
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
                  @click="editSchedule(schedule)"
                  icon="i-heroicons-pencil-square"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                />
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useOverlay, useRoute } from '#imports'
import HorarioFormModal from '~/components/admin/HorarioFormModal.vue'
import { useModal } from '~/composables/commons/useModal'
import { useHorariosAdmin } from '~/composables/useHorariosAdmin'

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

// Composable de horarios (backend)
const { getActiveSchedules, loadSchedules, createRangoOnDate, createFechaIfNeeded, deleteRangoOnDate, updateRangoOnDate } = useHorariosAdmin()

// Lista de horarios (UI)
const scheduleList = ref<any[]>([])

// Helper para sumar 30 minutos a HH:mm
const addMinutes = (hhmm: string, minutes: number) => {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(2000, 0, 1, h || 0, m || 0, 0)
  d.setMinutes(d.getMinutes() + (Number.isFinite(minutes) ? minutes : 30))
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

// Mapear schedules del composable a scheduleList plano
const refreshScheduleListFromComposable = () => {
  const flattened: any[] = []
  for (const sch of getActiveSchedules.value) {
    const date = String(sch.id).replace(/^sch-/, '')
    for (const slot of sch.timeSlots) {
      const parsedRangeId = Number(slot.id)
      flattened.push({
        id: `${sch.id}-${slot.id}`,
        date,
        rangeId: Number.isFinite(parsedRangeId) ? parsedRangeId : undefined,
        startTime: slot.time,
        endTime: slot.endTime ? slot.endTime : addMinutes(slot.time, 30),
        maxBookings: slot.maxCapacity ?? 0,
        currentBookings: slot.currentBookings ?? 0
      })
    }
  }
  // Orden por fecha + hora
  scheduleList.value = flattened.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
}

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
    return 'text-secondary-500'
  } else if (date.isSelected) {
    return 'bg-primary-400 text-white'
  } else if (date.hasSchedule) {
    return 'bg-green-400 text-white'
  } else {
    return 'text-secondary-300'
  }
}

const formatDate = (date: Date) => {
  const day = date.getDate()
  const month = months[date.getMonth()]
  return `${day} ${month}`
}

// Abre el modal usando la primera fecha seleccionada (botón "Nuevo Horario")
const openHorarioModal = () => {
  if (selectedDates.value.length === 0) return
  modalHorario.open({
    selectedDate: selectedDates.value[0],
    onSave: (data: any) => {
      handleSaveHorarioForSelectedDates(data)
    }
  })
}

// Abre el modal directo al hacer click en un día específico
const openHorarioModalFor = (date: Date) => {
  modalHorario.open({
    selectedDate: date,
    onSave: (data: any) => {
      handleSaveHorarioForDate(date, data)
    }
  })
}

// Genera entradas de horarios para un conjunto de fechas según el rango indicado en el modal
const getContenedorId = (): number | undefined => {
  const routeAny: any = route
  const rawId = routeAny?.query?.contenedor ?? routeAny?.params?.id
  const n = Number(rawId)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

const generateSchedulesForDates = async (dates: Date[], data: any) => {
  try {
    const contId = getContenedorId()
    if (!contId) {
      showError('Falta contenedor', 'No se encontró el ID de contenedor en la ruta.')
      return
    }
    // Crear un único rango por fecha indicada en backend (sin segmentar)
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0]
      await createRangoOnDate(contId, dateKey, {
        start_time: String(data.startTime),
        end_time: String(data.endTime),
        delivery_count: Number(data.maxBookings) || 1
      })
    }
    // Recargar desde backend
    await loadSchedules(contId)
    refreshScheduleListFromComposable()
    showSuccess('Horarios creados', `Se han creado horarios para ${dates.length} fecha(s).`)
  } catch (error: any) {
    const msg = error?.data?.message || error?.message || 'No se pudieron crear los horarios'
    showError('No se pudo crear el horario', msg)
  }
}

// Handler para crear horarios sobre las fechas seleccionadas (botón)
const handleSaveHorarioForSelectedDates = async (data: any) => {
  if (selectedDates.value.length === 0) return
  await generateSchedulesForDates(selectedDates.value, data)
  clearSelection()
}

// Handler para crear horarios sobre una fecha específica (click en día)
const handleSaveHorarioForDate = async (date: Date, data: any) => {
  await generateSchedulesForDates([date], data)
}

// Editar un horario existente
const editSchedule = (schedule: any) => {
  const contId = getContenedorId()
  if (!contId) {
    showError('Falta contenedor', 'No se encontró el ID de contenedor en la ruta.')
    return
  }
  if (!schedule?.rangeId) {
    showError('Edición no disponible', 'No se encontró el identificador del rango a editar.')
    return
  }
  // Fecha del schedule
  const [year, month, day] = schedule.date.split('-').map((n: string) => Number(n))
  const selDate = new Date(year, (month - 1), day)

  modalHorario.open({
    selectedDate: selDate,
    initialStartTime: schedule.startTime,
    initialEndTime: schedule.endTime,
    initialMaxBookings: schedule.maxBookings,
    mode: 'edit',
    submitLabel: 'Guardar Cambios',
    onSave: async (data: any) => {
      try {
        // Asegurar idFecha para esta fecha
        const idFecha = await createFechaIfNeeded(contId, schedule.date)
        await updateRangoOnDate(contId, idFecha, Number(schedule.rangeId), {
          start_time: String(data.startTime),
          end_time: String(data.endTime),
          delivery_count: Number(data.maxBookings) || 1
        })
        await loadSchedules(contId)
        refreshScheduleListFromComposable()
        showSuccess('Horario actualizado', 'Los cambios se guardaron correctamente.')
      } catch (err: any) {
        const msg = err?.data?.message || err?.message || 'No se pudo actualizar el horario'
        showError('Error al actualizar', msg)
      }
    }
  })
}



// Cargar datos al montar el componente
const route = useRoute()

onMounted(async () => {
  // Configurar fecha inicial (septiembre 2025 como en la imagen)
  currentDate.value = new Date(2025, 8, 1) // Septiembre 2025
  // Cargar horarios desde backend si se proporciona ?contenedor=ID o /:id
  const rawId = (route.query && (route.query as any).contenedor) ?? (route.params as any)?.id
  const contId = Number(rawId)
  if (Number.isFinite(contId) && contId > 0) {
    try {
      loading.value = true
      await loadSchedules(contId)
      refreshScheduleListFromComposable()
    } finally {
      loading.value = false
    }
  }

  // Agregar eventos globales para drag & drop
  document.addEventListener('mouseup', endDrag)
})

// Si cambia la fuente (por ejemplo, recarga), actualizamos la lista plana
watch(getActiveSchedules, () => refreshScheduleListFromComposable())

// Si cambia el query/param del contenedor, recargar
watch(
  () => [(route.query as any)?.contenedor, (route.params as any)?.id],
  async ([qId, pId]) => {
    const idNum = Number(qId ?? pId)
    if (Number.isFinite(idNum) && idNum > 0) {
      try {
        loading.value = true
        await loadSchedules(idNum)
        refreshScheduleListFromComposable()
      } finally {
        loading.value = false
      }
    } else {
      scheduleList.value = []
    }
  }
)



const deleteSchedule = (scheduleId: string) => {
  showConfirmation(
    'Confirmar eliminación',
    '¿Está seguro de que desea eliminar este horario? Esta acción no se puede deshacer.',
    async () => {
      try {
        const contId = getContenedorId()
        if (!contId) {
          showError('Falta contenedor', 'No se encontró el ID de contenedor en la ruta.')
          return
        }
        const item = scheduleList.value.find(s => s.id === scheduleId)
        if (!item || !item.rangeId) {
          showError('No se puede eliminar', 'No se encontró el identificador del rango en el elemento seleccionado.')
          return
        }
        // Asegurar idFecha (creará o devolverá existente)
        const idFecha = await createFechaIfNeeded(contId, item.date)
        await deleteRangoOnDate(contId, idFecha, Number(item.rangeId))
        // Recargar
        await loadSchedules(contId)
        refreshScheduleListFromComposable()
        showSuccess('Horario eliminado', 'El horario ha sido eliminado correctamente.')
      } catch (error: any) {
        showError('Error al eliminar', error.message || 'No se pudo eliminar el horario')
      }
    }
  )
}


</script>