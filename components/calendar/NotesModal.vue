<template>
  <UModal class="w-full sm:max-w-md">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Notas de la actividad</h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
          @click="close"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- Nombre de la actividad -->
        <div class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-gray-400">Actividad:</p>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ activity?.name || activity?.title || 'Sin nombre' }}
          </p>
        </div>

        <!-- Notas de la actividad (generales) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notas generales
          </label>
          <UTextarea
            v-model="activityNotes"
            placeholder="Agregar notas de la actividad..."
            :rows="3"
            class="w-full"
          />
        </div>

        <!-- Notas por responsable (si hay charges) -->
        <div v-if="activity?.charges && activity.charges.length > 0">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notas por responsable
          </label>
          <div class="space-y-3">
            <div
              v-for="charge in activity.charges"
              :key="charge.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <div class="flex items-center gap-2 mb-2">
                <UAvatar
                  :alt="charge.user?.nombre || 'U'"
                  size="xs"
                  :style="{
                    backgroundColor: getResponsableColor(charge.user_id, charge.user?.nombre),
                    color: '#fff'
                  }"
                />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ charge.user?.nombre || 'Responsable' }}
                </span>
              </div>
              <UTextarea
                v-model="chargeNotes[charge.id]"
                placeholder="Agregar nota..."
                :rows="2"
                size="sm"
                class="w-full"
                :disabled="!canEditChargeNotes(charge)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          variant="ghost"
          @click="close"
        />
        <UButton
          label="Guardar"
          color="primary"
          :loading="loading"
          @click="save"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { CalendarEvent, CalendarEventCharge } from '~/types/calendar'

interface Props {
  activity: CalendarEvent | null
  currentUserId: number
  calendarPermissions: any
  getResponsableColor: (userId: number, nombre?: string) => string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (e: 'save', data: { activityNotes: string; chargeNotes: Record<number, string> }): void
  (e: 'close'): void
}>()

const activityNotes = ref('')
const chargeNotes = ref<Record<number, string>>({})

// Verificar si puede editar las notas de un charge
const canEditChargeNotes = (charge: CalendarEventCharge): boolean => {
  // Jefe puede editar todas
  if (props.calendarPermissions.canEditAnyStatus) {
    return true
  }
  // Solo puede editar sus propias notas
  return charge.user_id === props.currentUserId
}

// Guardar
const save = () => {
  emit('save', {
    activityNotes: activityNotes.value,
    chargeNotes: chargeNotes.value
  })
}

const close = () => {
  emit('close')
}

// Inicializar
const initialize = () => {
  if (props.activity) {
    activityNotes.value = props.activity.notes || ''
    chargeNotes.value = {}
    props.activity.charges?.forEach(charge => {
      chargeNotes.value[charge.id] = charge.notes || ''
    })
  }
}

watch(() => props.activity, () => {
  initialize()
}, { immediate: true })

onMounted(() => {
  initialize()
})
</script>
