<template>
  <UModal :open="open" @update:open="v => { if (!v) handleClose() }" @close="handleClose" class="w-full max-w-2xl">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-queue-list" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Crear Subtareas</h3>
          <p v-if="activityName" class="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {{ activityName }}
          </p>
          <p v-if="activityEndDate" class="text-sm text-gray-500 dark:text-gray-400">
            Fecha fin: {{ activityEndDate }}
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- Lista de subtareas a crear -->
        <div class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          <div
            v-for="(item, index) in subtasks"
            :key="index"
            class="relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
          >
            <!-- Botón eliminar fila -->
            <UButton
              v-if="subtasks.length > 1"
              icon="i-heroicons-x-mark"
              variant="ghost"
              size="xs"
              color="error"
              class="absolute top-2 right-2"
              @click="removeRow(index)"
            />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UFormField
                label="Nombre"
                required
                :error="item.errors.name"
                class="md:col-span-2"
              >
                <UInput
                  v-model="item.name"
                  placeholder="Ej. Revisar documentos"
                  class="w-full"
                  @input="clearError(index, 'name')"
                />
              </UFormField>

              <UFormField
                label="Duración (horas)"
                :error="item.errors.duration_hours"
              >
                <UInput
                  v-model.number="item.duration_hours"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full"
                  @input="clearError(index, 'duration_hours')"
                />
              </UFormField>

              <UFormField
                label="Fecha fin"
                :error="item.errors.end_date"
              >
                <UPopover :open="undefined">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-calendar"
                    class="w-full justify-start"
                    :class="{ 'text-gray-400 dark:text-gray-500': !item.end_date }"
                  >
                    {{ item.end_date ? formatCalendarDate(item.end_date) : 'Seleccionar fecha' }}
                  </UButton>
                  <template #content>
                    <UCalendar v-model="item.end_date" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Botón agregar otra subtarea -->
        <UButton
          icon="i-heroicons-plus"
          label="Agregar otra subtarea"
          variant="outline"
          size="sm"
          block
          @click="addRow"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ subtasks.length }} subtarea{{ subtasks.length !== 1 ? 's' : '' }}
        </span>
        <div class="flex gap-2">
          <UButton
            label="Cancelar"
            variant="ghost"
            :disabled="saving"
            @click="handleClose"
          />
          <UButton
            label="Crear todas"
            color="primary"
            :loading="saving"
            :disabled="subtasks.length === 0"
            @click="handleCreate"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface SubtaskRow {
  name: string
  duration_hours: number | null
  end_date: any
  errors: {
    name: string
    duration_hours: string
    end_date: string
  }
}

interface Props {
  open: boolean
  activityName?: string
  activityEndDate?: string
  chargeName?: string
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
  activityName: '',
  activityEndDate: '',
  chargeName: ''
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', items: { name: string; duration_hours: number; end_date: any }[]): void
}>()

const subtasks = ref<SubtaskRow[]>([])

const createEmptyRow = (): SubtaskRow => ({
  name: '',
  duration_hours: null,
  end_date: null,
  errors: { name: '', duration_hours: '', end_date: '' }
})

const addRow = () => {
  subtasks.value.push(createEmptyRow())
}

const removeRow = (index: number) => {
  subtasks.value.splice(index, 1)
}

const clearError = (index: number, field: keyof SubtaskRow['errors']) => {
  if (subtasks.value[index]) {
    subtasks.value[index].errors[field] = ''
  }
}

const formatCalendarDate = (d: { year: number; month: number; day: number } | null): string => {
  if (!d || d.year == null) return ''
  return `${String(d.day).padStart(2, '0')}/${String(d.month).padStart(2, '0')}/${d.year}`
}

const validate = (): boolean => {
  let valid = true
  for (const item of subtasks.value) {
    item.errors = { name: '', duration_hours: '', end_date: '' }

    if (!item.name.trim()) {
      item.errors.name = 'El nombre es obligatorio'
      valid = false
    } else if (item.name.trim().length < 3) {
      item.errors.name = 'Mínimo 3 caracteres'
      valid = false
    }

    if (item.duration_hours != null && item.duration_hours < 0) {
      item.errors.duration_hours = 'No puede ser negativo'
      valid = false
    }
  }
  return valid
}

const handleCreate = () => {
  if (!validate()) return
  const items = subtasks.value.map(s => ({
    name: s.name.trim(),
    duration_hours: s.duration_hours != null ? Number(s.duration_hours) : 0,
    end_date: s.end_date
  }))
  emit('create', items)
}

const handleClose = () => {
  if (!props.saving) {
    emit('close')
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    subtasks.value = [createEmptyRow()]
  }
})
</script>
