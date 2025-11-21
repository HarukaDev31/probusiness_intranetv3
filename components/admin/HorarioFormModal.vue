<template>
  <UModal>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">{{ headerTitle }}</h3>
      </div>
    </template>
    
    <template #body>
      <UForm :state="formState" @submit="handleSubmit" class="space-y-4">
       

        <div class="flex flex-row gap-2 w-full">
          <UFormField label="Hora de inicio" required class="w-full">
            <USelect
              v-model="formState.startTime"
              :items="startTimeOptions"
              placeholder="Seleccionar hora"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Hora de fin" required class="w-full">
            <USelect
              v-model="formState.endTime"
              :items="endTimeOptions"
              placeholder="Seleccionar hora"
              :disabled="loading || !formState.startTime"
              class="w-full"
            />
          </UFormField>
        </div>
  
        
      </UForm>
    </template>
    
    <template #footer="{ close }">
      <div class="flex justify-end gap-3 w-full">
        <UButton
          @click="close"
          variant="ghost"
          :disabled="loading"
        >
          Cancelar
        </UButton>
        <UButton
          @click="handleSubmit"
          color="primary"
          :loading="loading"
          :disabled="loading || !isFormValid"
        >
          {{ submitText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  selectedDate: Date | null
  loading?: boolean
  initialStartTime?: string
  initialEndTime?: string
  initialMaxBookings?: number
  mode?: 'create' | 'edit'
  submitLabel?: string
  existingSlots?: Array<{ startTime: string; endTime: string }>
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Estado del componente
const loading = ref(false)

// Estado del formulario
const formState = ref({
  startTime: '',
  endTime: '',
  maxBookings: 5
})

// Generar opciones de tiempo cada 15 minutos
const timeOptions = computed(() => {
  const options = []
  for (let hour = 7; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      options.push({
        label: timeString,
        value: timeString
      })
    }
  }
  return options
})

// Helpers to work with times
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const intervalsOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd)
}

// Filtered start options: exclude times that are inside or equal to any existing slot
const startTimeOptions = computed(() => {
  const existing = props.existingSlots ?? []
  return timeOptions.value.filter(option => {
    const optionMinutes = toMinutes(option.value)

    // allow current initialStartTime when editing
    if (props.mode === 'edit' && props.initialStartTime === option.value) return true

    // if any existing slot contains this minute (start <= option < end) hide it
    for (const slot of existing) {
      const s = toMinutes(slot.startTime)
      const e = toMinutes(slot.endTime)
      if (optionMinutes >= s && optionMinutes < e) return false
    }
    return true
  })
})

// Opciones de hora de fin filtradas según la hora de inicio seleccionada
const endTimeOptions = computed(() => {
  if (!formState.value.startTime) {
    // if no start selected, show all options except those fully inside existing slots
    const existing = props.existingSlots ?? []
    return timeOptions.value.filter(option => {
      const m = toMinutes(option.value)
      for (const slot of existing) {
        const s = toMinutes(slot.startTime)
        const e = toMinutes(slot.endTime)
        if (m > s && m <= e) return false
      }
      return true
    })
  }

  const startMinutes = toMinutes(formState.value.startTime)
  const existing = props.existingSlots ?? []

  return timeOptions.value.filter(option => {
    const optionMinutes = toMinutes(option.value)

    // must be after start
    if (optionMinutes <= startMinutes) return false

    // allow current initialEndTime when editing
    if (props.mode === 'edit' && props.initialEndTime === option.value) return true

    // new interval [startMinutes, optionMinutes) must not overlap existing slots
    for (const slot of existing) {
      const s = toMinutes(slot.startTime)
      const e = toMinutes(slot.endTime)
      if (intervalsOverlap(startMinutes, optionMinutes, s, e)) return false
    }

    return true
  })
})

// Computed properties
const isOpen = computed({
  get: () => props.selectedDate !== null,
  set: (value) => emit('update:modelValue', value)
})

const headerTitle = computed(() => props.mode === 'edit' ? 'Editar Horario' : 'Nuevo Horario')
const submitText = computed(() => props.submitLabel || (props.mode === 'edit' ? 'Guardar Cambios' : 'Crear Horario'))

const formatSelectedDate = computed(() => {
  if (!props.selectedDate) return ''
  
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  
  const day = props.selectedDate.getDate()
  const month = months[props.selectedDate.getMonth()]
  const year = props.selectedDate.getFullYear()
  const dayName = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][props.selectedDate.getDay()]
  
  return `${dayName}, ${day} de ${month} de ${year}`
})

const isFormValid = computed(() => {
  return props.selectedDate && 
         formState.value.startTime.trim() !== '' && 
         formState.value.endTime.trim() !== '' &&
         formState.value.maxBookings > 0
})

// Métodos
const closeModal = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  formState.value = {
    startTime: props.initialStartTime || '',
    endTime: props.initialEndTime || '',
    maxBookings: props.initialMaxBookings ?? 5
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    loading.value = true
    
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const data = {
      date: props.selectedDate!.toISOString().split('T')[0],
      startTime: formState.value.startTime,
      endTime: formState.value.endTime,
      maxBookings:1,
    }
    
    emit('save', data)
    closeModal()
    
  } catch (error: any) {
    console.error('Error al crear horario:', error)
  } finally {
    loading.value = false
  }
}

// Watchers
watch(
  () => [props.selectedDate, props.initialStartTime, props.initialEndTime, props.initialMaxBookings, props.mode],
  () => {
    if (props.selectedDate) {
      resetForm()
    }
  }
)

// Limpiar hora de fin si es menor o igual a la hora de inicio
watch(
  () => formState.value.startTime,
  (newStartTime) => {
    if (newStartTime && formState.value.endTime) {
      const [startHour, startMinute] = newStartTime.split(':').map(Number)
      const [endHour, endMinute] = formState.value.endTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute
      
      if (endMinutes <= startMinutes) {
        formState.value.endTime = ''
      }
    }
  }
)
</script>
