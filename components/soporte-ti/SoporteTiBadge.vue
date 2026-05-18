<template>
  <span
    class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
    :class="clase"
  >
    {{ texto }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { estadoPorNombre } from '~/constants/soporteTiEstados'
import {
  clasesBadgeComplejidad,
  clasesBadgeEstado,
  clasesBadgePrioridad
} from '~/constants/soporteTiColores'

const props = defineProps<{
  /** Texto visible (nombre estado, complejidad, etc.) */
  etiqueta?: string
  /** Atajo por código de estado */
  estadoCodigo?: string
  /** Prioridad numérica 1–3 */
  prioridad?: number
  /** Complejidad / criticidad */
  complejidad?: string | null
}>()

const texto = computed(
  () => props.etiqueta?.trim() || props.complejidad?.trim() || '—'
)

const clase = computed(() => {
  if (props.estadoCodigo) return clasesBadgeEstado(props.estadoCodigo)
  if (props.prioridad != null) return clasesBadgePrioridad(props.prioridad)
  if (props.complejidad != null) return clasesBadgeComplejidad(props.complejidad)
  if (props.etiqueta) {
    const est = estadoPorNombre(props.etiqueta)
    if (est) return clasesBadgeEstado(est.codigo)
    return clasesBadgeComplejidad(props.etiqueta)
  }
  return clasesBadgeComplejidad('Por definir')
})
</script>
