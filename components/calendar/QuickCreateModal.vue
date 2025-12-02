<template>
  <UModal class="w-full sm:max-w-md">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Crear nuevo</h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Selecciona el tipo de elemento que deseas crear para el {{ formattedDate }}
        </p>
        
        <div class="grid grid-cols-2 gap-3">
          <UCard
            class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            :class="{ 'ring-2 ring-primary-500': selectedType === 'evento' }"
            @click="selectedType = 'evento'"
          >
            <div class="flex flex-col items-center gap-2 p-4">
              <UIcon name="i-heroicons-calendar-days" class="w-8 h-8 text-primary-500" />
              <span class="font-medium text-sm">Evento</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 text-center">
                Evento de un día o rango de días
              </span>
            </div>
          </UCard>

          <UCard
            class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            :class="{ 'ring-2 ring-primary-500': selectedType === 'tarea' }"
            @click="selectedType = 'tarea'"
          >
            <div class="flex flex-col items-center gap-2 p-4">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-green-500" />
              <span class="font-medium text-sm">Tarea</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 text-center">
                Tarea que puede durar varios días
              </span>
            </div>
          </UCard>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          variant="ghost"
          @click="close"
        />
        <UButton
          label="Continuar"
          color="primary"
          @click="handleContinue"
          :disabled="!selectedType"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import { DateFormatter } from '@internationalized/date'

interface Props {
  selectedDate: CalendarDate
  onSelect: (type: 'evento' | 'tarea') => void
}

const props = defineProps<Props>()

const df = new DateFormatter('es-ES', { 
  weekday: 'long',
  day: 'numeric',
  month: 'long'
})

const selectedType = ref<'evento' | 'tarea' | null>(null)

const formattedDate = computed(() => {
  return df.format(props.selectedDate.toDate(getLocalTimeZone()))
})

const handleContinue = () => {
  if (selectedType.value) {
    props.onSelect(selectedType.value)
  }
  close()
}
</script>

