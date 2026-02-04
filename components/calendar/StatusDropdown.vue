<template>
  <div>
    <!-- Vista de Jefe: Estado general calculado (solo lectura) -->
    <div v-if="isJefe" class="flex flex-col gap-1">
      <!-- Estado general -->
      <span
        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
        :class="generalStatusClasses"
      >
        {{ generalStatusLabel }}
      </span>
      
      <!-- Desglose por responsable (expandible) -->
      <UPopover v-if="activity.charges && activity.charges.length > 1">
        <button class="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1">
          <UIcon name="i-heroicons-eye" class="w-3 h-3" />
          Ver detalle
        </button>
        <template #content>
          <div class="p-3 space-y-2 min-w-[200px]">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Estado por responsable:</p>
            <div
              v-for="charge in activity.charges"
              :key="charge.id"
              class="flex items-center justify-between gap-3 py-1"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ charge.user?.nombre || 'N/A' }}
              </span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClasses(charge.status || 'PENDIENTE')"
              >
                {{ getStatusLabel(charge.status || 'PENDIENTE') }}
              </span>
            </div>
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Vista de Responsable: Solo su propio estado -->
    <template v-else>
      <!-- Editable (solo su propio charge) -->
      <UDropdownMenu v-if="canEditOwnStatus" :items="statusItems">
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
          :class="myStatusClasses"
        >
          {{ myStatusLabel }}
          <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 ml-1" />
        </span>
      </UDropdownMenu>

      <!-- Solo lectura (no es responsable de esta actividad) -->
      <span
        v-else
        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
        :class="myStatusClasses"
      >
        {{ myStatusLabel }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent, CalendarEventStatus } from '~/types/calendar'
import { STATUS_OPTIONS } from '~/constants/calendar'

interface Props {
  activity: CalendarEvent
  canEdit: boolean
  currentUserId?: number | string
  isJefe?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: 0,
  isJefe: false
})

const emit = defineEmits<{
  (e: 'update', chargeId: number, status: CalendarEventStatus): void
}>()

// ============================================
// LÓGICA PARA RESPONSABLES
// ============================================

// Encontrar el charge del usuario actual
const myCharge = computed(() => {
  if (!props.activity.charges || !props.currentUserId) return null
  return props.activity.charges.find(c => c.user_id === Number(props.currentUserId))
})

// El usuario puede editar si es responsable de esta actividad
const canEditOwnStatus = computed(() => {
  return props.canEdit && myCharge.value !== null
})

// Estado del usuario actual
const myStatus = computed((): CalendarEventStatus => {
  return myCharge.value?.status || 'PENDIENTE'
})

const myStatusLabel = computed(() => {
  return getStatusLabel(myStatus.value)
})

const myStatusClasses = computed(() => {
  return getStatusClasses(myStatus.value)
})

// ============================================
// LÓGICA PARA JEFE (Estado General)
// ============================================

// Calcular estado general basado en todos los charges
const generalStatus = computed((): CalendarEventStatus => {
  const charges = props.activity.charges || []
  
  if (charges.length === 0) {
    return 'PENDIENTE'
  }
  
  const statuses = charges.map(c => c.status || 'PENDIENTE')
  
  // Si todos están completados → COMPLETADO
  const allCompleted = statuses.every(s => s === 'COMPLETADO')
  if (allCompleted) {
    return 'COMPLETADO'
  }
  
  // Si al menos uno está en progreso o completado → PROGRESO
  const hasProgress = statuses.some(s => s === 'PROGRESO' || s === 'COMPLETADO')
  if (hasProgress) {
    return 'PROGRESO'
  }
  
  // De lo contrario → PENDIENTE
  return 'PENDIENTE'
})

const generalStatusLabel = computed(() => {
  return getStatusLabel(generalStatus.value)
})

const generalStatusClasses = computed(() => {
  return getStatusClasses(generalStatus.value)
})

// ============================================
// HELPERS
// ============================================

function getStatusLabel(status: CalendarEventStatus): string {
  const option = STATUS_OPTIONS.find(o => o.value === status)
  return option?.label || 'Pendiente'
}

function getStatusClasses(status: CalendarEventStatus): string {
  switch (status) {
    case 'PENDIENTE':
      return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
    case 'PROGRESO':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'COMPLETADO':
      return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

// Items para el dropdown (solo para responsables)
// UDropdownMenu espera un array de arrays (grupos de items)
const statusItems = computed(() => {
  const items = STATUS_OPTIONS.map(option => ({
    label: option.label,
    icon: option.value === myStatus.value ? 'i-heroicons-check' : undefined,
    onSelect: () => {
      if (myCharge.value && option.value !== myStatus.value) {
        emit('update', myCharge.value.id, option.value)
      }
    }
  }))
  return [items] // Envolver en array para formar un grupo
})
</script>
