<script setup lang="ts">
import { computed } from 'vue'
import { SOPORTE_TI_FASES_A } from '~/constants/soporteTi'

const props = withDefaults(
  defineProps<{
    faseIndex?: number
    /** Texto secundario bajo la barra (p. ej. término estimado) */
    subtitulo?: string | null
    compacto?: boolean
  }>(),
  { faseIndex: 0, subtitulo: null, compacto: false }
)

const faseActualNombre = computed(() => SOPORTE_TI_FASES_A[props.faseIndex] ?? SOPORTE_TI_FASES_A[0])

function claseFase(i: number) {
  const fi = props.faseIndex
  if (i < fi) {
    return 'border-success font-medium text-success'
  }
  if (i === fi) {
    return 'border-primary font-semibold text-primary'
  }
  return 'border-default font-normal text-muted'
}

function prefijoFase(i: number) {
  const fi = props.faseIndex
  if (i < fi) return '✓ '
  if (i === fi) return '● '
  return ''
}
</script>

<template>
  <div class="min-w-0">
    <p
      v-if="!compacto"
      class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted"
    >
      Fases del proyecto
    </p>
    <div class="flex min-w-0">
      <div
        v-for="(f, i) in SOPORTE_TI_FASES_A"
        :key="f"
        class="min-w-0 flex-1 border-t-[3px] text-center leading-tight"
        :class="[compacto ? 'px-0.5 py-1 text-[9px]' : 'py-1.5 text-[10px]', claseFase(i)]"
      >
        <span class="line-clamp-2 break-words">{{ prefijoFase(i) }}{{ f }}</span>
      </div>
    </div>
    <div
      v-if="!compacto && (subtitulo || faseActualNombre)"
      class="mt-3 rounded-lg border border-default bg-muted/40 p-3"
    >
      <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Fase actual
      </p>
      <p class="text-[13px] font-semibold text-highlighted">{{ faseActualNombre }}</p>
      <p v-if="subtitulo" class="mt-0.5 text-[11px] text-muted">
        Término estimado: {{ subtitulo }}
      </p>
    </div>
  </div>
</template>
