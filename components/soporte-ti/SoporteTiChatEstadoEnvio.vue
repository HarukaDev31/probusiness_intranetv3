<template>
  <span
    v-if="estado"
    class="inline-flex shrink-0 items-center"
    :class="claseIcono"
    :title="titulo"
  >
    <UIcon
      v-if="estado === 'pendiente' || estado === 'enviando'"
      name="i-heroicons-clock"
      class="size-3.5 animate-pulse"
    />
    <UIcon
      v-else-if="estado === 'error'"
      name="i-heroicons-exclamation-circle"
      class="size-3.5 text-error"
    />
    <UIcon
      v-else-if="estado === 'entregado'"
      name="i-heroicons-check"
      class="size-3.5"
    />
    <span v-else-if="estado === 'leido'" class="inline-flex -space-x-1.5">
      <UIcon name="i-heroicons-check" class="size-3.5 text-sky-300" />
      <UIcon name="i-heroicons-check" class="size-3.5 -ms-1.5 text-sky-300" />
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SoporteTiEstadoEnvio } from '~/types/soporteTi'

const props = defineProps<{
  estado?: SoporteTiEstadoEnvio
  inverted?: boolean
}>()

const titulo = computed(() => {
  switch (props.estado) {
    case 'pendiente':
      return 'Enviando…'
    case 'enviando':
      return 'Procesando adjunto…'
    case 'entregado':
      return 'Enviado'
    case 'leido':
      return 'Leído'
    case 'error':
      return 'Error al enviar'
    default:
      return ''
  }
})

const claseIcono = computed(() => {
  if (props.estado === 'leido') return ''
  if (props.inverted) return 'text-inverted/75'
  return 'text-muted'
})
</script>
