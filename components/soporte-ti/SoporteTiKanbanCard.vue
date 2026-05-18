<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-1">
      <span class="font-mono text-[9px] text-slate-400">{{ row.codigo }}</span>
      <SoporteTiBadge :etiqueta="row.tipo === 'A' ? 'A' : row.subtipoB || 'B'" />
    </div>
    <p class="text-[11px] font-medium leading-snug text-slate-800 dark:text-gray-100">
      {{ row.titulo }}
    </p>

    <template v-if="effectiveVariant === 'solicitante'">
      <div class="space-y-1 text-[9px] text-slate-500 dark:text-slate-400">
        <p>
          <span class="font-medium text-slate-600 dark:text-slate-300">Registro:</span>
          {{ fechaRegistroFmt }}
        </p>
        <p>
          <span class="font-medium text-slate-600 dark:text-slate-300">Término estimado:</span>
          {{ fechaFinFmt }}
        </p>
      </div>
      <SoporteTiBadge :estado-codigo="row.estadoCodigo" :etiqueta="estadoEtiqueta" />
    </template>
    <template v-else>
      <SoporteTiProgressStepper :solicitud="row" tam="sm" />
      <div class="flex items-center justify-between text-[9px] text-slate-400">
        <span>{{ row.area }}</span>
        <span>{{ row.fechaRegistro }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SoporteTiSolicitud } from '~/types/soporteTi'
import SoporteTiBadge from '~/components/soporte-ti/SoporteTiBadge.vue'
import SoporteTiProgressStepper from '~/components/soporte-ti/SoporteTiProgressStepper.vue'

const props = withDefaults(
  defineProps<{
    row: SoporteTiSolicitud
    variant?: 'solicitante' | 'staff'
  }>(),
  { variant: 'staff' }
)

const effectiveVariant = computed(() => props.variant ?? 'staff')

function formatoFecha(val: string | null | undefined): string {
  if (val == null || val === '') return '—'
  const d = new Date(val)
  if (!Number.isNaN(d.getTime())) {
    return formatDate(val, { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return val
}

const fechaRegistroFmt = computed(() => formatoFecha(props.row.fechaRegistro))
const fechaFinFmt = computed(() => props.row.gestion.terminoEstimado)
const estadoEtiqueta = computed(() => props.row.estado || props.row.estadoCodigo)
</script>
