<template>
  <UPopover>
    <UButton
      icon="i-heroicons-calendar"
      :label="label"
      variant="outline"
      :size="size"
      :class="buttonClass"
      :disabled="disabled"
    />
    <template #content>
      <div class="p-3 flex flex-col gap-3 max-h-[85vh] overflow-y-auto max-w-[95vw]">
        <div class="flex flex-wrap items-start gap-4">
          <div class="flex flex-col">
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1">Desde</label>
            <UCalendar :model-value="start ?? undefined" @update:model-value="onStartChange" />
          </div>
          <div class="flex flex-col">
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
            <!-- Abre en el mes siguiente al "Desde" para elegir rangos de dos meses rápido -->
            <UCalendar
              :key="`end-${endPlaceholder.year}-${endPlaceholder.month}`"
              :model-value="end ?? undefined"
              :placeholder="endPlaceholder"
              @update:model-value="onEndChange"
            />
          </div>
        </div>
        <div class="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <UButton label="Aplicar" color="primary" :size="size" class="flex-1" @click="emit('apply')" />
          <UButton label="Limpiar" variant="outline" :size="size" class="flex-1" @click="clear" />
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { MONTHS_SHORT } from '~/constants/calendar'
import { toCalendarDate } from '~/utils/calendar/dates'

const props = withDefaults(defineProps<{
  start: CalendarDate | null
  end: CalendarDate | null
  size?: 'xs' | 'sm' | 'md'
  buttonClass?: string
  disabled?: boolean
  emptyLabel?: string
}>(), {
  size: 'sm',
  buttonClass: '',
  disabled: false,
  emptyLabel: 'Buscar fecha'
})

const emit = defineEmits<{
  (e: 'update:start', value: CalendarDate | null): void
  (e: 'update:end', value: CalendarDate | null): void
  /** Aplicar el rango elegido. */
  (e: 'apply'): void
  /** Se limpió el rango (ya emitido como null en start/end). */
  (e: 'clear'): void
}>()

const shortDate = (d: CalendarDate) => `${d.day} ${MONTHS_SHORT[d.month - 1]}`

const label = computed(() => {
  if (props.start && props.end) return `${shortDate(props.start)} - ${shortDate(props.end)}`
  if (props.start) return `Desde ${shortDate(props.start)}`
  return props.emptyLabel
})

const endPlaceholder = computed(() => {
  const next = (props.start ?? today(getLocalTimeZone())).add({ months: 1 })
  return new CalendarDate(next.year, next.month, 1)
})

/** UCalendar en modo simple emite un DateValue (o undefined al deseleccionar). */
const asDate = (value: unknown): CalendarDate | null =>
  value && typeof value === 'object' && 'day' in value ? toCalendarDate(value as DateValue) : null

const onStartChange = (value: unknown) => emit('update:start', asDate(value))
const onEndChange = (value: unknown) => emit('update:end', asDate(value))

const clear = () => {
  emit('update:start', null)
  emit('update:end', null)
  emit('clear')
}
</script>
