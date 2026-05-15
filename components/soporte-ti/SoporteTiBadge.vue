<template>
  <span
    class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
    :class="clase"
  >
    {{ etiqueta }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ etiqueta: string }>()

const MAPA: Record<string, string> = {
  Pendiente: 'bg-slate-100 text-slate-600 border-slate-200',
  'En maqueta': 'bg-violet-50 text-violet-700 border-violet-200',
  'En progreso': 'bg-blue-50 text-blue-700 border-blue-200',
  Hecho: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Desplegado: 'bg-amber-50 text-amber-700 border-amber-200',
  Observado: 'bg-red-50 text-red-700 border-red-200',
  Operativo: 'bg-green-50 text-green-800 border-green-200',
  A: 'bg-violet-50 text-violet-700 border-violet-200',
  B1: 'bg-red-50 text-red-700 border-red-200',
  B2: 'bg-amber-50 text-amber-700 border-amber-200',
  Alta: 'bg-red-50 text-red-700 border-red-200',
  Máxima: 'bg-rose-50 text-rose-800 border-rose-200',
  Media: 'bg-amber-50 text-amber-700 border-amber-200',
  Baja: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Crítica: 'bg-pink-50 text-pink-700 border-pink-200',
  'Por definir': 'bg-slate-50 text-slate-500 border-slate-200'
}

const clase = computed(
  () => MAPA[props.etiqueta] ?? 'bg-slate-100 text-slate-600 border-slate-200'
)
</script>
