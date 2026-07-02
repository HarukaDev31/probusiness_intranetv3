<template>
  <div class="flex items-center gap-1">
    <div class="flex items-center gap-0.5">
      <div
        v-for="(step, i) in pasos"
        :key="step.label"
        :title="step.full"
        class="flex shrink-0 items-center justify-center rounded-full border font-bold"
        :class="[tamClase, clasePaso(i)]"
      >
        {{ i < actual ? '✓' : step.label }}
      </div>
    </div>
    <span class="ml-1 shrink-0 text-[10px] text-slate-400">{{ actual + 1 }}/{{ pasos.length }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SoporteTiSolicitud } from '~/types/soporteTi'

const props = defineProps<{
  solicitud: SoporteTiSolicitud
  tam?: 'sm' | 'md'
}>()

const FASES_A = [
  { label: 'LV', full: 'Levantamiento' },
  { label: 'MQ', full: 'Maqueta' },
  { label: 'CF', full: 'Configuración' },
  { label: 'PR', full: 'Pruebas' },
  { label: 'CP', full: 'Capacitación' }
]

const ESTADOS_B = [
  { label: 'PE', full: 'Pendiente' },
  { label: 'EP', full: 'En progreso' },
  { label: 'HE', full: 'Hecho' },
  { label: 'DE', full: 'Desplegado' },
  { label: 'OP', full: 'Operativo' }
]

function indicePaso(t: SoporteTiSolicitud): number {
  if (t.tipo === 'A') return t.faseIndex || 0
  const map: Record<string, number> = {
    pendiente: 0,
    en_progreso: 1,
    hecho: 2,
    desplegado: 3,
    operativo: 4,
    observado: 1
  }
  return map[t.estadoCodigo] ?? 0
}

const pasos = computed(() =>
  props.solicitud.tipo === 'A' ? FASES_A : ESTADOS_B
)

const actual = computed(() => indicePaso(props.solicitud))

const esObservado = computed(() => props.solicitud.estadoCodigo === 'observado')

const tamClase = computed(() =>
  props.tam === 'md' ? 'h-6 w-6 text-[8px]' : 'h-5 w-5 text-[7px]'
)

function clasePaso(i: number) {
  const cur = actual.value
  const obs = esObservado.value
  if (i < cur) return 'border-emerald-600 bg-emerald-600 text-white'
  if (i === cur) {
    if (obs) return 'border-red-500 bg-red-500 text-white'
    return 'border-blue-600 bg-blue-600 text-white'
  }
  return 'border-slate-200 bg-slate-100 text-slate-400'
}
</script>
