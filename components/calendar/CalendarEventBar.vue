<template>
  <div
    class="absolute h-5 md:h-6 flex items-center cursor-pointer hover:opacity-90 transition-opacity text-[10px] md:text-xs text-white font-medium overflow-hidden"
    :class="[
      position === 'start' ? 'rounded-l-md pl-1 md:pl-2' : 'pl-0.5',
      position === 'end' ? 'rounded-r-md pr-1 md:pr-2' : 'pr-0.5',
      position === 'middle' ? '' : '',
      position === 'single' ? 'rounded-md px-1 md:px-2' : ''
    ]"
    :style="barStyle"
    :title="event.title || event.name"
    @click.stop="$emit('click', event)"
  >
    <!-- Mostrar título solo al inicio o si es evento de un día -->
    <span 
      v-if="position === 'start' || position === 'single'" 
      class="truncate"
    >
      {{ event.title || event.name }}
    </span>
    
    <!-- Indicador de continuación -->
    <span v-else-if="position === 'middle'" class="opacity-50">
      ···
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '~/types/calendar'

interface Props {
  event: CalendarEvent
  position: 'start' | 'middle' | 'end' | 'single'
  colors: string[]
  top?: number
}

const props = withDefaults(defineProps<Props>(), {
  top: 0
})

defineEmits<{
  (e: 'click', event: CalendarEvent): void
}>()

const barStyle = computed(() => {
  const colors = props.colors.length > 0 ? props.colors : ['#3b82f6']
  
  let background: string
  
  if (colors.length === 1) {
    // Un solo color
    background = colors[0]
  } else if (colors.length === 2) {
    // Dos colores - gradiente diagonal
    background = `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`
  } else {
    // Múltiples colores - dividir en diagonal
    const stops = colors.map((color, i) => {
      const start = (i / colors.length) * 100
      const end = ((i + 1) / colors.length) * 100
      return `${color} ${start}%, ${color} ${end}%`
    }).join(', ')
    background = `linear-gradient(135deg, ${stops})`
  }
  
  return {
    background,
    top: `${props.top}px`,
    left: props.position === 'start' || props.position === 'single' ? '2px' : '0',
    right: props.position === 'end' || props.position === 'single' ? '2px' : '0',
  }
})
</script>
