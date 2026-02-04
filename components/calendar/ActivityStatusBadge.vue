<template>
  <div>
    <!-- Vista de Jefe: Estado general calculado (solo lectura) -->
    <div v-if="isJefe" class="flex flex-col gap-1">
      <!-- Estado general -->
      <UBadge :color="generalStatusColor" variant="soft" size="sm">
        {{ generalStatusLabel }}
      </UBadge>
      
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
              <UBadge :color="getStatusColor(charge.status || 'PENDIENTE')" variant="soft" size="xs">
                {{ getStatusLabel(charge.status || 'PENDIENTE') }}
              </UBadge>
            </div>
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Vista de Responsable: Solo su propio estado -->
    <template v-else>
      <!-- Editable: dropdown (solo su propio charge) -->
      <UDropdownMenu v-if="canEditOwnStatus" :items="statusItems">
        <UButton
          :label="myStatusLabel"
          :color="myStatusColor"
          variant="soft"
          size="xs"
          trailing-icon="i-heroicons-chevron-down"
        />
      </UDropdownMenu>

      <!-- Read-only: badge simple -->
      <UBadge v-else :color="myStatusColor" variant="soft" size="sm">
        {{ myStatusLabel }}
      </UBadge>
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
  (e: 'update-status', chargeId: number, status: CalendarEventStatus): void
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

const myStatusColor = computed(() => {
  return getStatusColor(myStatus.value)
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

const generalStatusColor = computed(() => {
  return getStatusColor(generalStatus.value)
})

// ============================================
// HELPERS
// ============================================

function getStatusLabel(status: CalendarEventStatus): string {
  const option = STATUS_OPTIONS.find(o => o.value === status)
  return option?.label || 'Pendiente'
}

function getStatusColor(status: CalendarEventStatus): string {
  const option = STATUS_OPTIONS.find(o => o.value === status)
  return option?.color || 'warning'
}

// Items para el dropdown (solo para responsables)
const statusItems = computed(() => {
  return STATUS_OPTIONS.map(option => ({
    label: option.label,
    icon: option.value === myStatus.value ? 'i-heroicons-check' : undefined,
    click: () => {
      if (myCharge.value && option.value !== myStatus.value) {
        emit('update-status', myCharge.value.id, option.value)
      }
    }
  }))
})
</script>
