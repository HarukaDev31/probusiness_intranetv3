<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-white">
            {{ isEditing ? 'Editar Configuración' : 'Nueva Configuración de Horarios' }}
          </h3>
            <UButton
              @click="closeModal"
              icon="i-heroicons-x-mark"
              variant="ghost"
              color="neutral"
            />
        </div>
      </template>

      <UForm :state="formState" @submit="handleSubmit" class="space-y-6">
        <!-- Información básica -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="Nombre de la configuración" required>
            <UInput
              v-model="formState.name"
              placeholder="Ej: Horarios de Mañana"
              :disabled="loading"
            />
          </UFormGroup>
          
          <UFormGroup label="Estado">
            <UToggle
              v-model="formState.isActive"
              :disabled="loading"
            />
            <template #help>
              <span class="text-xs text-gray-400">
                {{ formState.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </template>
          </UFormGroup>
        </div>

        <UFormGroup label="Descripción (opcional)">
          <UTextarea
            v-model="formState.description"
            placeholder="Describe esta configuración de horarios..."
            :disabled="loading"
            rows="3"
          />
        </UFormGroup>

        <!-- Sección de horarios -->
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h4 class="text-lg font-medium text-white">Horarios</h4>
            <div class="flex gap-2">
              <UButton
                @click="generateDefaultSlots"
                variant="outline"
                size="sm"
                :disabled="loading"
              >
                Generar por defecto
              </UButton>
              <UButton
                @click="addTimeSlot"
                icon="i-heroicons-plus"
                color="primary"
                size="sm"
                :disabled="loading"
              >
                Agregar horario
              </UButton>
            </div>
          </div>

          <!-- Lista de horarios -->
          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="(slot, index) in formState.timeSlots"
              :key="index"
              class="flex items-center gap-4 p-4 bg-gray-800 rounded-lg"
            >
              <!-- Hora -->
              <div class="flex-1">
                <UInput
                  v-model="slot.time"
                  placeholder="HH:MM"
                  type="time"
                  :disabled="loading"
                />
              </div>

              <!-- Disponibilidad -->
              <div class="flex items-center gap-2">
                <UToggle
                  v-model="slot.isAvailable"
                  :disabled="loading"
                />
                <span class="text-sm text-gray-400">Disponible</span>
              </div>

              <!-- Capacidad máxima -->
              <div class="flex items-center gap-2">
                <UInput
                  v-model.number="slot.maxCapacity"
                  type="number"
                  min="1"
                  placeholder="Capacidad"
                  class="w-24"
                  :disabled="loading"
                />
                <span class="text-sm text-gray-400">Max</span>
              </div>

              <!-- Botón eliminar -->
              <UButton
                @click="removeTimeSlot(index)"
                icon="i-heroicons-trash"
                color="error"
                variant="ghost"
                size="sm"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- Mensaje si no hay horarios -->
          <div v-if="formState.timeSlots.length === 0" class="text-center py-8 text-gray-500">
            <UIcon name="i-heroicons-clock" class="w-12 h-12 mx-auto mb-2" />
            <p>No hay horarios configurados</p>
            <p class="text-sm">Agrega horarios manualmente o usa la opción "Generar por defecto"</p>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <UButton
            @click="closeModal"
            variant="ghost"
            :disabled="loading"
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!isFormValid"
          >
            {{ isEditing ? 'Actualizar' : 'Crear' }} Configuración
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ScheduleConfig, ScheduleFormData, TimeSlotFormData } from '~/types/horarios'
import { useHorariosAdmin } from '~/composables/useHorariosAdmin'
import { useModal } from '~/composables/commons/useModal'

interface Props {
  modelValue: boolean
  schedule?: ScheduleConfig | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const { createSchedule, updateSchedule, generateDefaultTimeSlots } = useHorariosAdmin()
const { showError } = useModal()

// Estado del componente
const loading = ref(false)
const formState = ref<ScheduleFormData>({
  name: '',
  description: '',
  timeSlots: [],
  isActive: true
})

// Computed properties
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditing = computed(() => !!props.schedule)

const isFormValid = computed(() => {
  return formState.value.name.trim() !== '' && 
         formState.value.timeSlots.length > 0 &&
         formState.value.timeSlots.some(slot => slot.time.trim() !== '')
})

// Métodos
const initializeForm = () => {
  if (props.schedule) {
    formState.value = {
      name: props.schedule.name,
      description: props.schedule.description || '',
      isActive: props.schedule.isActive,
      timeSlots: props.schedule.timeSlots.map(slot => ({
        time: slot.time,
        isAvailable: slot.isAvailable,
        maxCapacity: slot.maxCapacity
      }))
    }
  } else {
    formState.value = {
      name: '',
      description: '',
      timeSlots: [],
      isActive: true
    }
  }
}

const addTimeSlot = () => {
  formState.value.timeSlots.push({
    time: '',
    isAvailable: true,
    maxCapacity: 5
  })
}

const removeTimeSlot = (index: number) => {
  formState.value.timeSlots.splice(index, 1)
}

const generateDefaultSlots = () => {
  formState.value.timeSlots = generateDefaultTimeSlots()
}

const closeModal = () => {
  isOpen.value = false
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    loading.value = true

    // Filtrar horarios válidos
    const validTimeSlots = formState.value.timeSlots.filter(slot => 
      slot.time.trim() !== ''
    )

    const submitData = {
      ...formState.value,
      timeSlots: validTimeSlots
    }

    if (isEditing.value && props.schedule) {
      await updateSchedule(props.schedule.id, submitData)
    } else {
      await createSchedule(submitData)
    }

    emit('saved')
  } catch (err: any) {
    showError('Error al guardar', err.message || 'No se pudo guardar la configuración')
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeForm()
  }
})

watch(() => props.schedule, () => {
  if (props.modelValue) {
    initializeForm()
  }
}, { deep: true })
</script>
