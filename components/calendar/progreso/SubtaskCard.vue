<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2">
    <template v-if="!editing">
      <p class="text-sm font-semibold text-gray-900 dark:text-white truncate" :title="task.name">{{ task.name }}</p>
      <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span class="flex items-center gap-1">
          <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
          {{ task.duration_hours }}h
        </span>
        <span v-if="task.end_date" class="flex items-center gap-1">
          <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5" />
          {{ formatIsoDate(task.end_date) }}
        </span>
      </div>
      <div class="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
        <USelectMenu
          :model-value="statusItem(task.status)"
          :items="statusItems"
          size="xs"
          class="w-32"
          @update:model-value="(item) => item && changeStatus(item.value)"
        />
        <div class="flex items-center gap-1">
          <UButton v-if="canEdit" icon="i-heroicons-pencil-square" variant="ghost" size="xs" color="primary" @click="startEdit" />
          <UButton icon="i-heroicons-trash" variant="ghost" size="xs" color="error" @click="remove" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="space-y-2">
        <UFormField label="Nombre">
          <UInput v-model="draft.name" placeholder="Nombre" size="sm" />
        </UFormField>
        <UFormField label="Duración (h)">
          <UInput v-model.number="draft.duration_hours" type="number" min="0" size="sm" />
        </UFormField>
        <UFormField label="Fecha fin">
          <UPopover>
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-calendar"
              class="w-full justify-start"
              :class="{ 'text-gray-400 dark:text-gray-500': !draftEndDate }"
            >
              {{ draftEndDate ? formatIsoDate(toIsoDate(draftEndDate)) : 'Seleccionar fecha' }}
            </UButton>
            <template #content>
              <UCalendar
                :model-value="draftEndDate ?? undefined"
                class="p-2"
                @update:model-value="(v) => (draftEndDate = v && 'day' in v ? toCalendarDate(v) : null)"
              />
            </template>
          </UPopover>
        </UFormField>
        <UFormField label="Estado">
          <USelectMenu
            :model-value="statusItem(draft.status)"
            :items="statusItems"
            size="sm"
            class="w-full"
            @update:model-value="(item) => item && (draft.status = item.value)"
          />
        </UFormField>
      </div>
      <div class="flex gap-2 mt-2">
        <UButton label="Guardar" color="primary" size="xs" :loading="saving" @click="save" />
        <UButton label="Cancelar" variant="outline" size="xs" @click="editing = false" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { CalendarDate } from '@internationalized/date'
import type { CalendarEventStatus, CalendarSubtask } from '~/types/calendar'
import { STATUS_OPTIONS } from '~/constants/calendar'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import { formatIsoDate, parseIsoDate, toCalendarDate, toIsoDate } from '~/utils/calendar/dates'

const props = defineProps<{
  task: CalendarSubtask
  /** Puede editar nombre/duración/fecha (jefe o el propio responsable). */
  canEdit: boolean
}>()

const { updateSubtask, deleteSubtask } = useCalendarStore()
const { showSuccess, showError } = useModal()

const statusItems = STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value }))
const statusItem = (status: CalendarEventStatus) => statusItems.find(i => i.value === status) ?? statusItems[0]

const editing = ref(false)
const saving = ref(false)
const draft = ref({ name: '', duration_hours: 0, status: 'PENDIENTE' as CalendarEventStatus })
const draftEndDate = shallowRef<CalendarDate | null>(null)

const startEdit = () => {
  draft.value = { name: props.task.name, duration_hours: props.task.duration_hours, status: props.task.status }
  draftEndDate.value = parseIsoDate(props.task.end_date)
  editing.value = true
}

const save = async () => {
  const name = draft.value.name.trim()
  if (!name) {
    showError('Error', 'El nombre es obligatorio')
    return
  }
  saving.value = true
  try {
    const ok = await updateSubtask(props.task.id, {
      name,
      duration_hours: Number(draft.value.duration_hours) || 0,
      status: draft.value.status,
      end_date: draftEndDate.value ? toIsoDate(draftEndDate.value) : null
    })
    if (ok) {
      showSuccess('Éxito', 'Subtarea actualizada correctamente')
      editing.value = false
    } else {
      showError('Error', 'No se pudo actualizar la subtarea')
    }
  } finally {
    saving.value = false
  }
}

const changeStatus = async (status: CalendarEventStatus) => {
  if (status === props.task.status) return
  if (!(await updateSubtask(props.task.id, { status }))) showError('Error', 'No se pudo actualizar la subtarea')
}

const remove = async () => {
  if (await deleteSubtask(props.task.id)) showSuccess('Éxito', 'Subtarea eliminada correctamente')
  else showError('Error', 'No se pudo eliminar la subtarea')
}
</script>
