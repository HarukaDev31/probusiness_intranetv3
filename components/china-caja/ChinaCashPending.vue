<template>
  <div v-if="rows.length" class="cc-card cc-list" :class="late ? 'cc-list--late' : ''">
    <div class="cc-list-head">
      <span class="flex items-center gap-2.5">
        <span class="cc-bang">!</span>
        <span class="cc-title">{{ late ? `Cobros y pagos atrasados · ${rows.length}` : `Por realizar · ${rows.length} ${rows.length === 1 ? 'pendiente' : 'pendientes'}` }}</span>
        <ChinaInfo :topic="late ? 'late' : 'pend'" />
      </span>
      <span v-if="late" class="whitespace-nowrap text-sm text-(--cc-red-deep)"><strong>{{ lateTotals }}</strong></span>
      <span v-else class="flex flex-wrap gap-3.5 text-sm"><span class="cc-t-green whitespace-nowrap">Por ingresar <strong>+{{ money(sum('in')) }}</strong></span><span class="cc-t-orange whitespace-nowrap">Por salir <strong>−{{ money(sum('out')) }}</strong></span></span>
    </div>
    <div class="max-h-[430px] overflow-y-auto">
      <div v-for="(row, index) in rows" :key="index" class="cc-list-row" :class="rowBg(row)">
        <span class="cc-list-text">
          <span class="flex flex-wrap items-center gap-1.5">
            <span class="cc-pill" :class="badge(row)">{{ when(row) }}</span>
            <template v-if="!late">
              <span class="cc-tag !text-[11px] font-medium" :class="CHINA_ORIGIN_TONE[row.origin]">{{ row.origin }}</span>
              <span class="cc-sub">{{ dateText(row) }}</span>
            </template>
          </span>
          <span class="cc-list-title">{{ row.type === 'out' ? 'Por pagar · ' : '' }}{{ row.title }}</span>
          <span class="cc-sub cc-cut">{{ late ? `${row.detail} · arribo ${short(row.arrival_on)} · venció ${short(row.due_on)}` : row.detail }}</span>
        </span>
        <span class="cc-list-side">
          <span class="cc-list-amount" :class="row.type === 'in' ? 'cc-t-green' : 'cc-t-orange'">{{ row.type === 'in' ? '+' : '−' }}{{ money(row.amount) }}</span>
          <button type="button" class="cc-btn" :class="late ? 'cc-btn--red' : ''" :title="goTitle(row)" @click="emit('open', row)">Abrir →</button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChinaInfo from '~/components/china-caja/ChinaInfo.vue'
import { CHINA_ORIGIN_GO, CHINA_ORIGIN_TONE } from '~/constants/chinaCaja'
import type { ChinaCashMovement } from '~/types/china-caja'
import { dmy } from '~/utils/chinaCaja'

const props = defineProps<{ rows: ChinaCashMovement[]; late?: boolean; money: (value: number) => string }>()
const emit = defineEmits<{ open: [row: ChinaCashMovement] }>()

const LONG_OVERDUE_DAYS = 14
const SOON_DAYS = 3
const sum = (type: 'in' | 'out') => props.rows.filter((row) => row.type === type).reduce((total, row) => total + row.amount, 0)
const lateTotals = computed(() => [sum('in') ? `Por cobrar +${props.money(sum('in'))}` : '', sum('out') ? `Por pagar −${props.money(sum('out'))}` : ''].filter(Boolean).join(' · '))
const daysOf = (row: ChinaCashMovement) => row.days ?? null
const short = (date: string | null | undefined) => dmy(date).slice(0, 5)

function when(row: ChinaCashMovement) {
  const days = daysOf(row)
  if (props.late) return `${Math.abs(days || 0)} ${Math.abs(days || 0) === 1 ? 'día' : 'días'} de atraso`
  if (days === null) return 'Sin fecha'
  if (row.arrival_on) return days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `Vence en ${days} días`
  if (days < 0) return `Vencido ${-days}d`
  return days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `En ${days} días`
}

function dateText(row: ChinaCashMovement) {
  if (row.arrival_on) return `Arribo ${short(row.arrival_on)} · vence ${short(row.due_on)}`
  return row.due_on ? dmy(row.due_on, true) : ''
}

function badge(row: ChinaCashMovement) {
  const days = daysOf(row)
  if (props.late) return Math.abs(days || 0) > LONG_OVERDUE_DAYS ? 'cc-b-darkred' : 'cc-b-red'
  if (days === null || days > SOON_DAYS) return 'cc-b-fade'
  return days <= 0 ? 'cc-b-red' : 'cc-b-orange'
}

function rowBg(row: ChinaCashMovement) {
  const days = daysOf(row)
  if (props.late) return Math.abs(days || 0) > LONG_OVERDUE_DAYS ? 'bg-(--cc-red-soft)' : ''
  return days !== null && days <= SOON_DAYS ? 'bg-(--cc-orange-soft)' : ''
}

function goTitle(row: ChinaCashMovement) {
  return CHINA_ORIGIN_GO[row.origin] || 'Abrir'
}
</script>
