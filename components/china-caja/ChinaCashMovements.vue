<template>
  <section class="rounded-xl border p-4" :class="variant === 'late' ? 'border-error/40 bg-error/5' : 'border-default bg-default'">
    <h2 class="mb-2 text-lg font-bold" :class="variant === 'late' ? 'text-error' : 'text-highlighted'">{{ title }}</h2>
    <p v-if="!rows.length" class="text-sm text-muted">{{ empty }}</p>
    <div class="max-h-[440px] overflow-y-auto">
      <div v-for="(row, index) in rows" :key="index" class="flex flex-wrap items-center gap-3 border-t border-default py-2 text-sm">
        <UBadge :color="tagColor(row)" :variant="variant === 'late' ? 'solid' : 'soft'">{{ tag(row) }}</UBadge>
        <UBadge v-if="variant === 'real'" color="neutral" variant="soft">{{ row.origin }}</UBadge>
        <span class="min-w-48 flex-1">
          <strong class="text-highlighted">{{ variant !== 'real' && row.type === 'out' ? 'Por pagar · ' : '' }}{{ row.title }}</strong>
          <span class="text-muted"> {{ row.detail }}</span>
        </span>
        <strong :class="row.type === 'in' ? 'text-success' : 'text-highlighted'">{{ movementAmount(row) }}</strong>
        <UButton v-if="variant !== 'real' && movementLink(row)" size="xs" color="primary" variant="link" :to="movementLink(row)">Abrir →</UButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ChinaColor } from '~/constants/chinaCaja'
import type { ChinaCashMovement } from '~/types/china-caja'
import { movementAmount, movementLink } from '~/utils/chinaCaja'
import { dayLabel } from '~/utils/yuanFormat'

const props = defineProps<{ title: string; rows: ChinaCashMovement[]; variant: 'late' | 'pending' | 'real'; empty?: string }>()

function tag(row: ChinaCashMovement) {
  if (props.variant === 'real') return dayLabel(row.date)
  if (row.days === null || row.days === undefined) return 'Sin fecha'
  if (row.days < 0) return `${Math.abs(row.days)} d · venció ${dayLabel(row.due_on)}`
  return row.days === 0 ? 'Vence hoy' : `Vence en ${row.days} d`
}

function tagColor(row: ChinaCashMovement): ChinaColor {
  if (props.variant === 'late') return 'error'
  return props.variant === 'pending' && row.days !== null && row.days !== undefined && row.days <= 3 ? 'primary' : 'neutral'
}
</script>
