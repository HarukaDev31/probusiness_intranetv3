<template>
  <div
    class="absolute h-full flex items-center gap-1 cursor-pointer hover:opacity-90 text-xs md:text-sm text-white font-medium overflow-hidden pointer-events-auto rounded shadow-sm px-1.5 py-0.5 transition-transform duration-150 ease-out"
    :class="{
      'rounded-l-md': span.isStart,
      'rounded-r-md': span.isEnd,
      'opacity-60 scale-95': dragging
    }"
    :style="positionStyle"
    :draggable="draggable"
    @click.stop="emit('open', span.event)"
    @dragstart="emit('drag-start', span.event)"
    @dragenter.prevent="emit('drag-enter', span.event)"
    @dragover.prevent
    @drop.prevent="emit('drop', span.event)"
    @dragend="emit('drag-end')"
  >
    <UTooltip :text="tooltip" :content="{ side: 'top', sideOffset: 6 }" class="contents">
      <span v-if="!span.isStart" class="flex items-center justify-center w-5 h-5 rounded bg-white/20 text-[10px] font-bold shrink-0">…</span>
      <span v-else class="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
        <span class="flex flex-col gap-0.5 min-w-0 flex-1 overflow-hidden min-h-0">
          <span class="truncate block">{{ span.event.name }}</span>
          <span
            v-for="(line, i) in noteLines"
            :key="i"
            class="truncate block text-[11px] md:text-xs opacity-90 leading-tight"
          >{{ line }}</span>
        </span>
        <span v-if="showConsolidado && span.event.contenedor" class="shrink-0 opacity-90 text-[11px] md:text-xs">
          / {{ shortConsolidadoName(span.event.contenedor.nombre) }}
        </span>
      </span>

      <div v-if="span.isEnd" class="flex items-center gap-0.5 shrink-0 ml-auto">
        <UTooltip v-if="span.event.status !== 'PENDIENTE'" :text="statusOption.label" :content="{ align: 'center', side: 'top', sideOffset: 8 }">
          <UIcon :name="statusOption.icon" class="w-3.5 h-3.5 shrink-0 opacity-90" aria-hidden />
        </UTooltip>
        <UTooltip
          v-for="resp in responsables.slice(0, 2)"
          :key="resp.id"
          :text="resp.nombre"
          :content="{ align: 'center', side: 'top', sideOffset: 8 }"
        >
          <UAvatar
            :src="resp.avatar ?? undefined"
            :alt="resp.nombre"
            size="3xs"
            class="ring-1 ring-white/30 shrink-0"
            :style="{ backgroundColor: getResponsableColor(resp.id, resp.nombre), color: '#fff' }"
          />
        </UTooltip>
        <span v-if="responsables.length > 2" class="text-[9px] font-bold opacity-80">+{{ responsables.length - 2 }}</span>
      </div>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '~/types/calendar'
import type { EventSpan } from '~/utils/calendar/monthLayout'
import { getStatusOption } from '~/constants/calendar'
import { colorsToBackground, getEventResponsables, getNoteLines, shortConsolidadoName } from '~/utils/calendar/events'

const props = defineProps<{
  span: EventSpan
  /** Colores del evento según la prioridad de colores del grupo. */
  colors: string[]
  showConsolidado: boolean
  draggable: boolean
  /** Este evento es el que se está arrastrando. */
  dragging: boolean
  getResponsableColor: (userId: number, nombre?: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'open', event: CalendarEvent): void
  (e: 'drag-start', event: CalendarEvent): void
  (e: 'drag-enter', event: CalendarEvent): void
  (e: 'drop', event: CalendarEvent): void
  (e: 'drag-end'): void
}>()

const COLUMN_WIDTH = 100 / 7

const positionStyle = computed(() => ({
  background: colorsToBackground(props.colors),
  left: `calc(${props.span.startCol * COLUMN_WIDTH}% + 2px)`,
  width: `calc(${(props.span.endCol - props.span.startCol + 1) * COLUMN_WIDTH}% - 4px)`
}))

const noteLines = computed(() => getNoteLines(props.span.event.notes))
const responsables = computed(() => getEventResponsables(props.span.event))
const statusOption = computed(() => getStatusOption(props.span.event.status))

const tooltip = computed(() => {
  const { name, contenedor, notes } = props.span.event
  let text = contenedor ? `${name} — ${contenedor.nombre}` : name
  if (notes?.trim()) text += `\n${notes.trim()}`
  return props.span.isStart ? text : `Continúa desde la semana anterior. ${text}`
})
</script>
