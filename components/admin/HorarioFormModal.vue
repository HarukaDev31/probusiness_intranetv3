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
              :items="timeOptions"
              placeholder="Seleccionar hora"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Hora de fin" required class="w-full">
            <USelect
              v-model="formState.endTime"
              :items="timeOptions"
              placeholder="Seleccionar hora"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>
        </div>
    
        <UFormField label="Cantidad de reservas" required class="w-full">
          <UInput
            v-model.number="formState.maxBookings"
            class="w-full"
            type="number"
            min="1"
            placeholder="5"
            :disabled="loading"
          />
        </UFormField>
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
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      options.push({
        label: timeString,
        value: timeString
      })
    }
  }
  return options
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
      maxBookings: formState.value.maxBookings
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
</script>
