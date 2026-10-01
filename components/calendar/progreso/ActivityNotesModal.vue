<template>
  <UModal :open="activity !== null" class="w-full max-w-md" @update:open="(open) => !open && emit('close')">
    <template #header>
      <h3 class="text-lg font-semibold">{{ charge ? 'Mis notas' : 'Notas de la actividad' }}</h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p class="text-sm text-gray-500">Actividad:</p>
          <p class="font-medium">{{ activity?.name }}</p>
        </div>
        <UFormField :label="charge ? 'Mis notas' : 'Notas'">
          <UTextarea v-model="text" placeholder="Agregar notas..." :rows="4" class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <UButton v-if="originalNotes" label="Borrar" color="error" variant="ghost" @click="save('')" />
        <div class="flex gap-2 ml-auto">
          <UButton label="Cancelar" variant="ghost" @click="emit('close')" />
          <UButton label="Guardar" color="primary" :loading="saving" @click="save(text)" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CalendarEvent, CalendarEventCharge } from '~/types/calendar'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{
  /** null = cerrado. */
  activity: CalendarEvent | null
  /** Con charge se editan las notas de ese responsable; sin él, las de la actividad (jefe). */
  charge: CalendarEventCharge | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { updateChargeNotes, updateEventNotes } = useCalendarStore()
const { showSuccess, showError } = useModal()

const originalNotes = computed(() => (props.charge ? props.charge.notes : props.activity?.notes) ?? '')
const text = ref('')
const saving = ref(false)

watch(() => [props.activity, props.charge], () => { text.value = originalNotes.value }, { immediate: true })

const save = async (notes: string) => {
  if (!props.activity) return
  saving.value = true
  try {
    const ok = props.charge
      ? await updateChargeNotes(props.charge.id, notes)
      : await updateEventNotes(props.activity.id, notes)
    if (ok) {
      showSuccess('Éxito', 'Notas guardadas correctamente')
      emit('close')
    } else {
      showError('Error', 'No se pudieron guardar las notas')
    }
  } finally {
    saving.value = false
  }
}
</script>
