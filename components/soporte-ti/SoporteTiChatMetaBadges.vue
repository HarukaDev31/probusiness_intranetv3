<template>
  <div v-if="mostrar" class="flex flex-wrap items-center gap-1.5">
    <SoporteTiBadge :estado-codigo="estadoCodigo" :etiqueta="estadoNombre" />
    <SoporteTiBadge
      v-if="mostrarPrioridad && prioridad != null"
      :prioridad="prioridad"
      :etiqueta="etiquetaPrioridad(prioridad)"
    />
    <SoporteTiBadge
      v-if="complejidadPm"
      :complejidad="complejidadPm"
      :etiqueta="`PM: ${complejidadPm}`"
    />
    <SoporteTiBadge
      v-if="complejidadAnalista"
      :complejidad="complejidadAnalista"
      :etiqueta="etiquetaComplejidadAnalista"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { etiquetaPrioridad } from '~/constants/soporteTiPrioridad'
import SoporteTiBadge from '~/components/soporte-ti/SoporteTiBadge.vue'

const props = withDefaults(
  defineProps<{
    estadoCodigo: string
    estadoNombre: string
    prioridad?: number | null
    complejidadPm?: string | null
    complejidadAnalista?: string | null
    tipo?: 'A' | 'B'
    mostrarPrioridad?: boolean
    mostrarComplejidad?: boolean
  }>(),
  {
    prioridad: null,
    complejidadPm: null,
    complejidadAnalista: null,
    tipo: 'B',
    mostrarPrioridad: false,
    mostrarComplejidad: false
  }
)

const mostrar = computed(() => Boolean(props.estadoCodigo))

const etiquetaComplejidadAnalista = computed(() => {
  const c = props.complejidadAnalista?.trim()
  if (!c) return ''
  return props.tipo === 'A' ? `Analista: ${c}` : c
})
</script>
