<template>
  <UModal  class="w-full sm:max-w-2xl">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {{ isEdit ? (form.type === 'tarea' ? 'Editar Tarea' : 'Editar Evento') : (form.type === 'tarea' ? 'Crear Tarea' : 'Crear Evento') }}
        </h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-5">
        <!-- Tipo (solo al crear) -->
        <div v-if="!isEdit" class="flex gap-2">
          <UButton
            :variant="form.type === 'evento' ? 'solid' : 'outline'"
            :color="form.type === 'evento' ? 'primary' : 'neutral'"
            label="Evento"
            size="lg"
            class="flex-1"
            @click="form.type = 'evento'"
          />
          <UButton
            :variant="form.type === 'tarea' ? 'solid' : 'outline'"
            :color="form.type === 'tarea' ? 'success' : 'neutral'"
            label="Tarea"
            size="lg"
            class="flex-1"
            @click="form.type = 'tarea'"
          />
        </div>

        <!-- Título -->
        <UFormField label="Título" required :error="errors.title">
          <UInput
            v-model="form.title"
            placeholder="Ingrese el título del evento"
            :disabled="loading"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Descripción -->
        <UFormField label="Descripción" :error="errors.description">
          <UTextarea
            v-model="form.description"
            placeholder="Ingrese la descripción del evento"
            :rows="4"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <!-- Fecha de inicio y fin -->
        <!-- Para tareas siempre mostrar selectores, para eventos solo si no hay initialDate o es edición -->
        <!-- Si es evento y hay initialDate, NO mostrar los selectores de fecha -->
        <div v-if="(isEdit || form.type === 'tarea' || !props.initialDate) && !(form.type === 'evento' && props.initialDate && !isEdit)" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Fecha de inicio" required :error="errors.start_date">
            <UPopover>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-heroicons-calendar"
                class="w-full justify-start"
                size="lg"
                :disabled="loading"
              >
                {{ startDate ? df.format(startDate.toDate(getLocalTimeZone())) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar v-model="startDate" class="p-2" />
              </template>
            </UPopover>
          </UFormField>

          <UFormField label="Fecha de fin" required :error="errors.end_date">
            <UPopover>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-heroicons-calendar"
                class="w-full justify-start"
                size="lg"
                :disabled="loading"
              >
                {{ endDate ? df.format(endDate.toDate(getLocalTimeZone())) : 'Seleccionar fecha' }}
              </UButton>
              <template #content>
                <UCalendar v-model="endDate" class="p-2" />
              </template>
            </UPopover>
          </UFormField>
        </div>

        <!-- Mostrar fecha seleccionada cuando se crea un evento desde un día específico (no editable) -->
        <div v-if="props.initialDate && !isEdit && form.type === 'evento'" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-primary-500" />
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha seleccionada</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ startDate ? df.format(startDate.toDate(getLocalTimeZone())) : '' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Todo el día -->
        <UFormField>
          <UCheckbox
            v-model="form.isAllDay"
            label="Todo el día"
            :disabled="loading"
            size="lg"
          />
        </UFormField>

        <!-- Hora de inicio y fin (si no es todo el día) -->
        <div v-if="!form.isAllDay" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Hora de inicio" :error="errors.start_time">
            <UInput
              v-model="form.startTime"
              type="time"
              :disabled="loading"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Hora de fin" :error="errors.end_time">
            <UInput
              v-model="form.endTime"
              type="time"
              :disabled="loading"
              size="lg"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Opciones de visibilidad -->
        <div class="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <UFormField>
            <UCheckbox
              v-model="form.isForMe"
              label="Solo para mí"
              :disabled="loading"
              size="lg"
              @update:model-value="handleForMeChange"
            />
          </UFormField>

          <!-- Para mi rol (si no es solo para mí) -->
          <UFormField v-if="!form.isForMe">
            <UCheckbox
              v-model="form.isForMyRole"
              label="Compartir con mi rol"
              :disabled="loading"
              size="lg"
            />
          </UFormField>

          <!-- Público -->
          <UFormField>
            <UCheckbox
              v-model="form.isPublic"
              label="Visible para todos"
              :disabled="loading"
              size="lg"
              @update:model-value="handlePublicChange"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          variant="ghost"
          @click="close"
          :disabled="loading"
        />
        <UButton
          :label="isEdit ? 'Actualizar' : 'Crear'"
          color="primary"
          @click="() => handleSave(close)"
          :disabled="loading || !canSave"
          :loading="loading"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import { CalendarDate, getLocalTimeZone, parseDate, DateFormatter } from '@internationalized/date'
import type { CalendarEvent, CreateEventRequest, UpdateEventRequest } from '~/types/calendar'

interface Props {
  event?: CalendarEvent | null
  loading?: boolean
  type?: 'evento' | 'tarea'
  initialDate?: string
  initialTime?: string
  onSave?: (data: CreateEventRequest | UpdateEventRequest) => void | Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  event: null,
  type: 'evento',
  initialDate: undefined,
  initialTime: undefined,
  onSave: undefined
})

const df = new DateFormatter('es-ES', { dateStyle: 'short' })

const isEdit = computed(() => !!props.event?.id)

const form = ref({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  isAllDay: true,
  isForMe: false,
  isForMyRole: false,
  isPublic: false,
  type: 'evento' as 'evento' | 'tarea'
})

const startDate = shallowRef<CalendarDate | null>(null)
const endDate = shallowRef<CalendarDate | null>(null)

const errors = ref<Record<string, string>>({})

// Cargar datos del evento si está en modo edición


// Función helper para extraer solo la fecha de un string ISO
const extractDateFromISO = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null
  // Si ya es formato YYYY-MM-DD, retornarlo directamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  // Si es formato ISO, extraer solo la parte de fecha
  const dateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/)
  return dateMatch ? dateMatch[1] : null
}

watch(() => props.event, (event) => {
  if (event && isEdit.value) {
    form.value.title = event.title || ''
    form.value.description = event.description || ''
    form.value.type = event.type || 'evento'
    
    const startDateStr = extractDateFromISO(event.start_date)
    const endDateStr = extractDateFromISO(event.end_date)
    
    startDate.value = startDateStr ? parseDate(startDateStr) : null
    endDate.value = endDateStr ? parseDate(endDateStr) : null
    form.value.startTime = event.start_time || ''
    form.value.endTime = event.end_time || ''
    form.value.isAllDay = event.is_all_day ?? true
    form.value.isForMe = event.is_for_me ?? false
    form.value.isForMyRole = !!event.role_id
    form.value.isPublic = event.is_public ?? false
  } else if (!isEdit.value) {
    // Si es creación, usar props.type y initialDate
    form.value.type = props.type || 'evento'
    if (props.initialDate) {
      startDate.value = parseDate(props.initialDate)
      endDate.value = parseDate(props.initialDate)
    }
    // Si hay initialTime, establecerlo y desactivar "todo el día"
    if (props.initialTime) {
      form.value.startTime = props.initialTime
      // Establecer hora de fin 1 hora después
      const [hours, minutes] = props.initialTime.split(':')
      const endHour = (parseInt(hours) + 1) % 24
      form.value.endTime = `${String(endHour).padStart(2, '0')}:${minutes}`
      form.value.isAllDay = false
    }
  }
}, { immediate: true })
const handleForMeChange = (value: boolean) => {
  if (value) {
    form.value.isForMyRole = false
    form.value.isPublic = false
  }
}

const handlePublicChange = (value: boolean) => {
  if (value) {
    form.value.isForMe = false
    form.value.isForMyRole = false
  }
}

const canSave = computed(() => {
  return !!(
    form.value.title.trim() &&
    startDate.value &&
    endDate.value
  )
})

const formatDateForAPI = (date: CalendarDate | null): string => {
  if (!date) return ''
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

const handleSave = async (close: () => void) => {
  errors.value = {}

  if (!form.value.title.trim()) {
    errors.value.title = 'El título es requerido'
    return
  }

  if (!startDate.value) {
    errors.value.start_date = 'La fecha de inicio es requerida'
    return
  }

  if (!endDate.value) {
    errors.value.end_date = 'La fecha de fin es requerida'
    return
  }

  // Validar tiempos si no es todo el día
  if (!form.value.isAllDay) {
    if (!form.value.startTime || !form.value.startTime.trim()) {
      errors.value.start_time = 'La hora de inicio es requerida cuando no es todo el día'
      return
    }
    if (!form.value.endTime || !form.value.endTime.trim()) {
      errors.value.end_time = 'La hora de fin es requerida cuando no es todo el día'
      return
    }
  }

  const data: CreateEventRequest | UpdateEventRequest = {
    ...(isEdit.value && props.event?.id ? { id: props.event.id } : {}),
    title: form.value.title.trim(),
    description: form.value.description.trim() || undefined,
    start_date: formatDateForAPI(startDate.value),
    end_date: formatDateForAPI(endDate.value),
    is_all_day: form.value.isAllDay,
    is_for_me: form.value.isForMe,
    is_for_my_role: form.value.isForMyRole,
    is_public: form.value.isPublic,
    type: form.value.type
  }

  // Si es edición de un día de tarea, agregar task_day_id
  if (isEdit.value && props.event?.task_day_id && 'task_day_id' in data) {
    (data as UpdateEventRequest).task_day_id = props.event.task_day_id
  }

  // Solo agregar tiempos si no es todo el día y tienen valor
  if (!form.value.isAllDay && form.value.startTime && form.value.startTime.trim()) {
    data.start_time = form.value.startTime.trim()
  }
  if (!form.value.isAllDay && form.value.endTime && form.value.endTime.trim()) {
    data.end_time = form.value.endTime.trim()
  }

  if (props.onSave) {
    await props.onSave(data)
  }
  
  close()
}
</script>

