<template>
  <UModal :open="open" @close="handleClose" class="w-full max-w-2xl">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ activity?.name || 'Sin título' }}
          </h3>
          <p class="text-sm text-gray-500">
            {{ activity?.contenedor?.nombre || activity?.contenedor?.codigo || 'Sin consolidado' }}
          </p>
        </div>
        <span
          class="px-2.5 py-1 rounded-full text-xs font-medium"
          :class="generalStatusClasses"
        >
          {{ generalStatusLabel }}
        </span>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
      

      

        <!-- Historial -->
        <div v-if="trackingHistory.length > 0" class="border-t border-gray-200 dark:border-gray-700 pt-3">
          <button
            class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
            @click="showHistory = !showHistory"
          >
            <UIcon :name="showHistory ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'" class="w-4 h-4" />
            Historial ({{ trackingHistory.length }})
          </button>
          <div v-if="showHistory" class="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
            <div
              v-for="record in trackingHistory"
              :key="record.id"
              class="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div class="flex items-center gap-2">
                <span v-if="record.from_status" class="px-1.5 py-0.5 rounded text-[10px]" :class="getStatusClasses(record.from_status)">
                  {{ getStatusLabel(record.from_status) }}
                </span>
                <span v-else class="text-gray-400">-</span>
                <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-gray-400" />
                <span class="px-1.5 py-0.5 rounded text-[10px]" :class="getStatusClasses(record.to_status)">
                  {{ getStatusLabel(record.to_status) }}
                </span>
                <span class="text-gray-500">{{ record.charge?.user?.nombre || '' }}</span>
              </div>
              <span class="text-gray-400">{{ formatDateTime(record.changed_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton label="Cerrar" variant="ghost" @click="handleClose" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CalendarEvent, CalendarEventStatus, CalendarEventCharge, CalendarEventChargeTracking } from '~/types/calendar'
import { STATUS_OPTIONS } from '~/constants/calendar'
import { useCalendarStore } from '~/composables/useCalendarStore'

interface Props {
  open: boolean
  activity: CalendarEvent | null
  currentUserId?: number | string
  isJefe?: boolean
  getResponsableColor: (userId: number, nombre?: string) => string
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: 0,
  isJefe: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-status', chargeId: number, status: CalendarEventStatus): void
}>()

const { getActivityTracking } = useCalendarStore()

// State
const trackingHistory = ref<CalendarEventChargeTracking[]>([])
const showHistory = ref(false)

// Cargar historial al abrir
watch(() => props.open, async (isOpen) => {
  if (isOpen && props.activity?.id) {
    trackingHistory.value = await getActivityTracking(props.activity.id)
  } else {
    trackingHistory.value = []
    showHistory.value = false
  }
})

// Estado general calculado
const generalStatus = computed((): CalendarEventStatus => {
  const charges = props.activity?.charges || []
  if (charges.length === 0) return 'PENDIENTE'
  const statuses = charges.map(c => c.status || 'PENDIENTE')
  if (statuses.every(s => s === 'COMPLETADO')) return 'COMPLETADO'
  if (statuses.some(s => s === 'PROGRESO' || s === 'COMPLETADO')) return 'PROGRESO'
  return 'PENDIENTE'
})

const generalStatusLabel = computed(() => getStatusLabel(generalStatus.value))
const generalStatusClasses = computed(() => getStatusClasses(generalStatus.value))

// Conteo y progreso
const statusCounts = computed(() => {
  const charges = props.activity?.charges || []
  return {
    PENDIENTE: charges.filter(c => !c.status || c.status === 'PENDIENTE').length,
    PROGRESO: charges.filter(c => c.status === 'PROGRESO').length,
    COMPLETADO: charges.filter(c => c.status === 'COMPLETADO').length
  }
})

const progressPercentage = computed(() => {
  const total = props.activity?.charges?.length || 0
  return total === 0 ? 0 : Math.round((statusCounts.value.COMPLETADO / total) * 100)
})

// Permisos
const canEditChargeStatus = (charge: CalendarEventCharge): boolean => {
  if (props.isJefe) return false
  return charge.user_id === Number(props.currentUserId)
}

// Helpers
function getStatusLabel(status: CalendarEventStatus): string {
  return STATUS_OPTIONS.find(o => o.value === status)?.label || 'Pendiente'
}

function getStatusClasses(status: CalendarEventStatus): string {
  const classes: Record<CalendarEventStatus, string> = {
    'PENDIENTE': 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    'PROGRESO': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'COMPLETADO': 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

const getStatusItems = (charge: CalendarEventCharge) => {
  return [STATUS_OPTIONS.map(option => ({
    label: option.label,
    icon: option.value === charge.status ? 'i-heroicons-check' : undefined,
    onSelect: () => {
      if (option.value !== charge.status) {
        emit('update-status', charge.id, option.value)
      }
    }
  }))]
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

const handleClose = () => {
  emit('close')
}
</script>
