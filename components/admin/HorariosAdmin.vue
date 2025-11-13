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
                @dblclick="openHorarioModalFor(date.value)"
                @mousedown="startDrag(date)"
                @mouseenter="handleDrag(date)"
                @mouseup="handleMouseUp(date)"
                :class="[
                  'w-10 h-10 rounded-full text-sm font-medium transition-all duration-200',
                  !date.isPast
                    ? 'hover:bg-primary-600 hover:text-white cursor-pointer' 
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
              {{ formatDateTimeToDmy(date) }}
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

          <div v-else-if="schedulesByDayComposable.length === 0" class="text-center py-8 text-gray-500">
            <UIcon name="i-heroicons-clock" class="w-12 h-12 mx-auto mb-2" />
            <p class="text-sm">No hay horarios configurados</p>
            <p class="text-xs">Selecciona fechas y crea horarios</p>
          </div>

          <div v-else class="space-y-3 flex flex-col gap-2">
            <div
              v-for="schedule in schedulesByDayComposable"
              :key="schedule.id"
              class="flex w-full justify-between p-3  flex-col gap-2 rounded-lg"
            >
              <p class="text-sm font-medium ">{{ schedule.name }}</p>
               <div class="flex items-center gap-3" v-for="timeSlotGroup in groupTimeSlots(schedule.timeSlots)" :key="timeSlotGroup.id">
                <div class="w-3 h-3 bg-primary-500 rounded-full"></div>
                <div>
                  <p class="text-sm font-medium ">
                    {{ timeSlotGroup.startTime }} - {{ timeSlotGroup.endTime }}
                  </p>
                  
                </div>
                <div class="flex items-center gap-2">
                <UButton
                  @click="editTimeSlotGroup(timeSlotGroup)"
                  icon="i-heroicons-pencil-square"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                />
                <UButton
                  @click="deleteTimeSlotGroup(timeSlotGroup)"
                  icon="i-heroicons-trash"
                  color="error"
                  variant="ghost"
                  size="sm"
                />
              </div>
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
import { useSpinner } from '~/composables/commons/useSpinner'
interface dayData{
  day:string,
  startTime:string,
  endTime:string,
  maxBookings:number
}
interface HorariosRequest{
  dayData:dayData[]
  idContenedor:number
}
// Composables
const { withSpinner } = useSpinner()
const overlay = useOverlay()
const modalHorario = overlay.create(HorarioFormModal)
const { showSuccess, showError, showConfirmation } = useModal()

// Estado del componente
const loading = ref(false)
const currentDate = ref(new Date())
const selectedDates = ref<Date[]>([])
const isDragging = ref(false)
const dragStartDate = ref<Date | null>(null)
const hasDragged = ref(false)
const today = new Date()
today.setHours(0, 0, 0, 0) // Resetear horas para comparación

// Composable de horarios (backend)
const { getActiveSchedules, loadSchedules, createHorarios, createFechaIfNeeded, deleteRangoOnDate, updateRangoOnDate,
  selectedDaysComposable,
  selectDaysComposable,
  schedulesByDayComposable,
  unselectDaysComposable,
  editHorarios,
  deleteHorarios
 } = useHorariosAdmin()

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
  unselectDaysComposable(selectedDaysComposable.value)
}

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
  clearSelection()
  unselectDaysComposable(selectedDaysComposable.value)
}

const handleDateClick = (date: any) => {
 
  if (date.isPast) {
    
    return
  }
  
  if (hasDragged.value) {
    
    return
  }
  
  
  selectDate(date)
}

const selectDate = (date: any) => {
  
  if (date.isPast) return
  
  // Click normal: seleccionar/deseleccionar una fecha
  const existingIndex = selectedDates.value.findIndex(selectedDate => 
    selectedDate.toDateString() === date.value.toDateString()
  )
  
  if (existingIndex !== -1) {
    selectedDates.value.splice(existingIndex, 1)
    unselectDaysComposable([date.value])
  } else {
    selectedDates.value.push(new Date(date.value))
    selectDaysComposable([date.value])
  }
}

const startDrag = (date: any) => {
  
  if (date.isPast) return
  
  isDragging.value = true
  hasDragged.value = false
  dragStartDate.value = new Date(date.value)
  
  // NO seleccionar automáticamente en mousedown para evitar interferencias
}

const handleDrag = (date: any) => {
  if (!isDragging.value || !dragStartDate.value || date.isPast) return
  
  // Solo marcar como drag si hay movimiento real
  if (date.value.getTime() !== dragStartDate.value.getTime()) {
    hasDragged.value = true
    
  }
  
  // Seleccionar todas las fechas entre la fecha inicial y la actual
  let startDate = new Date(dragStartDate.value)
  let endDate = new Date(date.value)
  
  // Asegurar que startDate sea menor que endDate
  if (startDate > endDate) {
    const temp = startDate
    startDate = endDate
    endDate = temp
  }
  
  // Crear array de fechas del rango de drag
  const dragRangeDates: Date[] = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    if (currentDate >= today) { // Solo fechas futuras
      dragRangeDates.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Agregar las fechas del rango de drag al composable (sin limpiar selección previa)
  selectDaysComposable(dragRangeDates)
  
  // Sincronizar selectedDates.value con el composable
  selectedDates.value = [...selectedDaysComposable.value]
}

const handleMouseUp = (date: any) => {
  
  
  // Si no hubo drag, ejecutar click
  if (!hasDragged.value && !date.isPast) {
    
    selectDate(date)
  }
  
  // Reset flags inmediatamente
  
  isDragging.value = false
  dragStartDate.value = null
  hasDragged.value = false
}


// Función para agrupar timeSlots consecutivos de 30 minutos
const groupTimeSlots = (timeSlots: any[]) => {
  if (!timeSlots || timeSlots.length === 0) return []
  
  // Ordenar por tiempo de inicio
  const sortedSlots = [...timeSlots].sort((a, b) => a.time.localeCompare(b.time))
  
  const groups: any[] = []
  let currentGroup: any = null
  
  for (const slot of sortedSlots) {
    if (!currentGroup) {
      // Crear nuevo grupo
      currentGroup = {
        id: `group-${slot.id}`,
        startTime: slot.time,
        endTime: slot.endTime || slot.time,
        totalBookings: slot.currentBookings || 0,
        totalCapacity: slot.maxCapacity || 0,
        slots: [slot]
      }
    } else {
      // Verificar si el slot actual es consecutivo (30 min después del último)
      const lastEndTime = currentGroup.endTime
      const currentStartTime = slot.time
      
      if (isConsecutiveTime(lastEndTime, currentStartTime)) {
        // Agregar al grupo actual
        currentGroup.endTime = slot.endTime || slot.time
        currentGroup.totalBookings += slot.currentBookings || 0
        currentGroup.totalCapacity += slot.maxCapacity || 0
        currentGroup.slots.push(slot)
      } else {
        // Finalizar grupo actual y crear nuevo
        groups.push(currentGroup)
        currentGroup = {
          id: `group-${slot.id}`,
          startTime: slot.time,
          endTime: slot.endTime || slot.time,
          totalBookings: slot.currentBookings || 0,
          totalCapacity: slot.maxCapacity || 0,
          slots: [slot]
        }
      }
    }
  }
  
  // Agregar el último grupo
  if (currentGroup) {
    groups.push(currentGroup)
  }
  
  return groups
}

// Función auxiliar para verificar si dos tiempos son consecutivos (30 min)
const isConsecutiveTime = (endTime: string, startTime: string): boolean => {
  const [endHour, endMin] = endTime.split(':').map(Number)
  const [startHour, startMin] = startTime.split(':').map(Number)
  
  const endMinutes = endHour * 60 + endMin
  const startMinutes = startHour * 60 + startMin
  
  return startMinutes === endMinutes
}

const removeSelectedDate = (date: Date) => {
  const index = selectedDates.value.findIndex(selectedDate => 
    selectedDate.toDateString() === date.toDateString()
  )
  if (index !== -1) {
    selectedDates.value.splice(index, 1)
    unselectDaysComposable([date])
  }
}

const clearSelection = () => {
  selectedDates.value = []
  unselectDaysComposable([])
}

const getDateClass = (date: any) => {
  if (date.isPast) {
    return 'text-secondary-300'
  } else if (date.isSelected) {
    return 'bg-primary-400 text-white'
  } else if (date.hasSchedule) {
    return 'bg-green-400 text-white'
  } else {
    return 'text-secondary-500'
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
      handleSaveHorarioForSelectedDates(data)
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
    
    
    const dataToSend={
      dayData:[],
      idContenedor:contId
    }
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0]
      
      const dayData:dayData={
        day:dateKey,
        startTime:data.startTime,
        endTime:data.endTime,
        maxBookings:data.maxBookings
      }
      dataToSend.dayData.push(dayData)
    }
    return dataToSend
  } catch (error: any) {
    const msg = error?.data?.message || error?.message || 'No se pudieron crear los horarios'
    showError('No se pudo crear el horario', msg)
  }
}

// Handler para crear horarios sobre las fechas seleccionadas (botón)
const handleSaveHorarioForSelectedDates = async (data: any) => {
  if (selectedDates.value.length === 0) return
  
  const dataToSend = await generateSchedulesForDates(selectedDates.value, data)
  
  if (dataToSend) {
    await withSpinner(async () => {
      const response = await createHorarios(dataToSend)
      if (response.success) {
        clearSelection()
        unselectDaysComposable(selectedDaysComposable.value)
        await loadSchedules(dataToSend.idContenedor)
        showSuccess('Horarios creados', 'Los horarios se han creado correctamente')
      }
    })    
  }
}



// Editar un grupo de timeSlots
const editTimeSlotGroup = (timeSlotGroup: any) => {
  
  const contId = getContenedorId()
  if (!contId) {
    showError('Falta contenedor', 'No se encontró el ID de contenedor en la ruta.')
    return
  }
  
  // Usar el primer slot para obtener la fecha
  const firstSlot = timeSlotGroup.slots[0]
  if (!firstSlot) {
    showError('Error', 'No se encontró información del horario.')
    return
  }
  
  // Obtener fecha del schedule (asumiendo que está en el contexto del schedule)
  const schedule = schedulesByDayComposable.value.find(s => 
    s.timeSlots.some(ts => ts.id === firstSlot.id)
  )
  
  if (!schedule) {
    showError('Error', 'No se encontró el schedule correspondiente.')
    return
  }
  
  // Extraer fecha del ID del schedule (formato: sch-YYYY-MM-DD)
  const dateStr = schedule.id.replace('sch-', '')
  const [year, month, day] = dateStr.split('-').map((n: string) => Number(n))
  const selDate = new Date(year, (month - 1), day)

  modalHorario.open({
    selectedDate: selDate,
    initialStartTime: timeSlotGroup.startTime,
    initialEndTime: timeSlotGroup.endTime,
    initialMaxBookings: timeSlotGroup.totalCapacity,
    mode: 'edit',
    submitLabel: 'Guardar Cambios',
    onSave: async (data: any) => {
      try {
        //send all slots of timeSlotGroup and generate schedules for dates
        const dataToSend = await generateSchedulesForDates(selectedDates.value, data)
        
        if (dataToSend) {
          await withSpinner(async () => {
            const response = await editHorarios(dataToSend,timeSlotGroup.slots)
            if (response.success) {
            clearSelection()
            await loadSchedules(dataToSend.idContenedor)
            showSuccess('Horarios creados', 'Los horarios se han creado correctamente')
          }
          }, 'Guardando...')
         
        }
        showSuccess('Horario actualizado', 'Los cambios se guardaron correctamente.')
      } catch (err: any) {
        const msg = err?.data?.message || err?.message || 'No se pudo actualizar el horario'
        showError('Error al actualizar', msg)
      }
    }
  })
}

// Eliminar un grupo de timeSlots
const deleteTimeSlotGroup = (timeSlotGroup: any) => {
  showConfirmation(
    'Confirmar eliminación',
    `¿Está seguro de eliminar el horario ${timeSlotGroup.startTime} - ${timeSlotGroup.endTime}?`,
    async () => {
      try {
       //send container id and time slots to delete
       const dataToSend = {
        idContenedor: getContenedorId(),  
        timeSlots: timeSlotGroup.slots
       }
       const response = await deleteHorarios(dataToSend)
       if (response.success) {
        clearSelection()
        await loadSchedules(dataToSend.idContenedor)
       }
        showSuccess('Horario eliminado', 'El horario fue eliminado correctamente.')
      } catch (err: any) {
        showError('Error', err?.message || 'No se pudo eliminar el horario.')
      }
    }
  )
}



// Cargar datos al montar el componente
const route = useRoute()

onMounted(async () => {
  // Configurar fecha inicial al mes actual
  const now = new Date()
  currentDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
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

  // Eventos globales removidos - se manejan en el botón
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