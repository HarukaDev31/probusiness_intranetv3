<template>
  <UModal>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Crear Campaña</h3>
        <UButton 
          icon="i-heroicons-x-mark" 
          variant="ghost" 
          size="sm"
          @click="closeModal"
        />
      </div>
    </template>
    <template #body>
      <div class="space-y-6">
        <!-- Selección de meses -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Seleccionar Meses
          </h4>
          <div class="grid grid-cols-6 gap-2">
            <UButton
              v-for="mes in meses"
              :key="mes.value"
              :variant="selectedMonths.includes(mes.value) ? 'solid' : 'outline'"
              :color="selectedMonths.includes(mes.value) ? 'primary' : 'neutral'"
              size="sm"
              :label="mes.label"
              @click="toggleMonth(mes.value)"
            />
          </div>
        </div>

        <!-- Calendarios -->
        <div v-if="selectedMonths.length > 0" class="space-y-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Seleccionar Días (Máximo {{ maxDays }} días)
          </h4>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div v-for="month in selectedMonths" :key="month" class="space-y-2">
              <h5 class="text-sm font-medium text-center">
                {{ getMonthName(month) }} {{ currentYear }}
              </h5>
              <UCalendar
                v-model="selectedDates[month]"
                :multiple="true"
                :max="maxDays"
                :color="'primary'"
                :size="'md'"
                @update:model-value="(dates) => handleDateSelection(month, dates)"
              />
            </div>
          </div>
        </div>

        <!-- Resumen de fechas seleccionadas -->
        <div v-if="allSelectedDates.length > 0" class="space-y-3">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fechas Seleccionadas ({{ allSelectedDates.length }} días)
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">
                Fecha Inicio:
              </label>
              <UInput 
                :model-value="formatDateForDisplay(fechaInicio)"
                readonly
                variant="outline"
                size="sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">
                Fecha Fin:
              </label>
              <UInput 
                :model-value="formatDateForDisplay(fechaFin)"
                readonly
                variant="outline"
                size="sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">
              Días Seleccionados:
            </label>
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="date in allSelectedDates"
                :key="date"
                :label="formatDateForDisplay(date)"
                color="primary"
                variant="subtle"
                size="sm"
              />
            </div>
          </div>
        </div>

        <!-- Validación -->
        <div v-if="validationError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p class="text-sm text-red-600 dark:text-red-400">
            {{ validationError }}
          </p>
        </div>
      </div>
    </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton 
            label="Cancelar" 
            variant="ghost" 
            @click="closeModal"
          />
          <UButton 
            label="Guardar" 
            color="primary"
            :disabled="!canSave"
            @click="handleSave"
          />
        </div>
      </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarDate } from '@internationalized/date'

// Props
interface Props {
  maxDays?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxDays: 6
})

// Emits
const emit = defineEmits<{
  'save': [data: CampaignData]
}>()

// Tipos
interface CampaignData {
  Fe_Inicio: string
  Fe_Fin: string
  Dias_Seleccionados: string[]
}

// Estado reactivo
const currentYear = new Date().getFullYear()
const selectedMonths = ref<string[]>([])
const selectedDates = ref<Record<string, CalendarDate[]>>({})
const validationError = ref('')

// Meses disponibles
const meses = [
  { label: 'Enero', value: 'enero' },
  { label: 'Febrero', value: 'febrero' },
  { label: 'Marzo', value: 'marzo' },
  { label: 'Abril', value: 'abril' },
  { label: 'Mayo', value: 'mayo' },
  { label: 'Junio', value: 'junio' },
  { label: 'Julio', value: 'julio' },
  { label: 'Agosto', value: 'agosto' },
  { label: 'Septiembre', value: 'septiembre' },
  { label: 'Octubre', value: 'octubre' },
  { label: 'Noviembre', value: 'noviembre' },
  { label: 'Diciembre', value: 'diciembre' }
]

// Computed properties
const allSelectedDates = computed(() => {
  const dates: string[] = []
  Object.values(selectedDates.value).forEach(monthDates => {
    monthDates.forEach(date => {
      dates.push(formatDateForAPI(date))
    })
  })
  return dates.sort()
})

const fechaInicio = computed(() => {
  return allSelectedDates.value[0] || ''
})

const fechaFin = computed(() => {
  return allSelectedDates.value[allSelectedDates.value.length - 1] || ''
})

const canSave = computed(() => {
  return allSelectedDates.value.length > 0 && 
         allSelectedDates.value.length <= props.maxDays &&
         !validationError.value
})

// Métodos
const toggleMonth = (month: string) => {
  const index = selectedMonths.value.indexOf(month)
  if (index > -1) {
    selectedMonths.value.splice(index, 1)
    delete selectedDates.value[month]
  } else {
    if (selectedMonths.value.length < 2) {
      selectedMonths.value.push(month)
      selectedDates.value[month] = []
    }
  }
}

const getMonthName = (month: string) => {
  return meses.find(m => m.value === month)?.label || month
}

const handleDateSelection = (month: string, dates: any) => {
  // Convertir a array de CalendarDate si es necesario
  const dateArray = Array.isArray(dates) ? dates : []
  
  // Limitar el número total de días seleccionados
  const currentTotal = allSelectedDates.value.length - (selectedDates.value[month]?.length || 0)
  const newTotal = currentTotal + dateArray.length
  
  if (newTotal > props.maxDays) {
    validationError.value = `No puedes seleccionar más de ${props.maxDays} días en total.`
    return
  }
  
  validationError.value = ''
  selectedDates.value[month] = dateArray
}

const formatDateForAPI = (date: CalendarDate) => {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

const closeModal = () => {
  // El overlay se encarga de cerrar el modal
}

const handleSave = () => {
  if (!canSave.value) return
  
  const campaignData: CampaignData = {
    Fe_Inicio: fechaInicio.value,
    Fe_Fin: fechaFin.value,
    Dias_Seleccionados: allSelectedDates.value
  }
  
  emit('save', campaignData)
}
</script>
