<template>
  <section class="cc-card flex flex-col gap-4 px-[22px] py-5">
    <div class="cc-between">
      <span class="cc-title-row"><span class="cc-title">Semanas de {{ monthName }}</span><ChinaInfo topic="weeks" /></span>
      <span class="cc-legend">
        <span><i class="bg-(--cc-green)" />Verde: ingresos</span>
        <span><i class="bg-(--cc-orange)" />Naranja: egresos</span>
        <span><i class="cc-hatch-in" />Rayado: aún por pasar</span>
      </span>
    </div>
    <div class="cc-weeks">
      <div v-for="week in weeks" :key="week.starts_on" class="cc-week" :class="{ on: selected === week.starts_on, today: isToday(week) }" role="button" tabindex="0" @click="emit('pick', week.starts_on)" @keydown.enter="emit('pick', week.starts_on)">
        <span class="flex items-baseline justify-between gap-1.5"><span class="whitespace-nowrap text-sm font-semibold">Semana {{ week.index + 1 }}</span><span class="cc-sub whitespace-nowrap">{{ rangeLabel(week) }}</span></span>
        <span class="cc-week-bars">
          <span><span class="cc-hatch-in" :style="{ height: px(projected(week, 'income')) }" /><span class="bg-(--cc-green)" :style="{ height: px(week.totals.income) }" /></span>
          <span><span class="cc-hatch-out" :style="{ height: px(projected(week, 'expense')) }" /><span class="bg-(--cc-orange)" :style="{ height: px(week.totals.expense) }" /></span>
        </span>
        <span class="flex justify-between gap-2 text-xs">
          <span class="flex flex-col whitespace-nowrap"><span class="flex items-center gap-[5px] text-(--cc-muted)"><i class="size-[9px] bg-(--cc-green)" />Ingresos</span><strong>+{{ money(week.totals.income + projected(week, 'income')) }}</strong></span>
          <span class="flex flex-col items-end whitespace-nowrap"><span class="flex items-center gap-[5px] text-(--cc-muted)"><i class="size-[9px] bg-(--cc-orange)" />Egresos</span><strong class="cc-t-orange">−{{ money(week.totals.expense + projected(week, 'expense')) }}</strong></span>
        </span>
        <span class="flex items-baseline justify-between gap-1.5 text-xs"><span class="whitespace-nowrap text-(--cc-muted)">Utilidad op.</span><strong class="whitespace-nowrap" :class="week.totals.profit_projected < 0 ? 'cc-t-red' : 'cc-t-green'">{{ signed(week.totals.profit_projected) }}{{ hasProjected(week) ? ' proy.' : '' }}</strong></span>
        <span class="cc-week-box" :class="week.closing ? (week.closing.balance < 0 ? 'cc-c-red' : 'cc-c-green') : 'bg-(--cc-softer) text-(--cc-faint)'">
          <span class="text-[11px] tracking-[.06em]">{{ week.closing ? (week.closing.balance < 0 ? 'CAJA NEGATIVA' : 'CAJA POSITIVA') : 'CAJA' }}</span>
          <span class="text-[17px] font-bold leading-tight">{{ week.closing ? signed(week.closing.balance) : 'Sin cierre' }}</span>
        </span>
        <button v-if="week.closing" type="button" class="cc-week-shot" @click.stop="emit('screenshot', week)">
          <span class="whitespace-nowrap text-(--cc-body)">{{ week.closing.usd_pending ? `USD por cambiar $${week.closing.usd_pending.toLocaleString('en-US')}` : 'Sin USD por cambiar' }}</span>
          <span class="whitespace-nowrap text-(--cc-muted) underline">Ver pantallazo</span>
        </button>
        <button v-else-if="week.can_close" type="button" class="cc-btn cc-btn--soft !rounded-lg !px-2.5 !py-2 !text-[13px]" @click.stop="emit('close-week', week)">Cerrar semana</button>
        <span v-else-if="!closed" class="whitespace-nowrap px-2.5 py-2 text-xs text-(--cc-faint)">Se cierra el {{ dueLabel(week) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChinaInfo from '~/components/china-caja/ChinaInfo.vue'
import type { ChinaCashWeek } from '~/types/china-caja'
import { chinaMonthName, dmy, weekRange } from '~/utils/chinaCaja'

const props = defineProps<{ month: string; today: string; closed: boolean; weeks: ChinaCashWeek[]; selected: string; money: (value: number) => string; signed: (value: number) => string }>()
const emit = defineEmits<{ pick: [startsOn: string]; 'close-week': [week: ChinaCashWeek]; screenshot: [week: ChinaCashWeek] }>()

const BAR_HEIGHT = 140
const monthName = computed(() => chinaMonthName(props.month).toLowerCase())
const top = computed(() => Math.max(1, ...props.weeks.flatMap(({ totals }) => [totals.income + totals.income_projected, totals.expense + totals.expense_projected])))
const rangeLabel = weekRange

// Una semana cerrada ya no muestra lo proyectado.
function projected(week: ChinaCashWeek, key: 'income' | 'expense') {
  return week.closing ? 0 : week.totals[`${key}_projected`]
}

function hasProjected(week: ChinaCashWeek) {
  return week.totals.income_projected + week.totals.expense_projected > 0
}

function px(value: number) {
  return `${Math.round(value / top.value * BAR_HEIGHT)}px`
}

function isToday(week: ChinaCashWeek) {
  return !props.closed && props.today >= week.starts_on && props.today <= week.ends_on
}

function dueLabel(week: ChinaCashWeek) {
  return `${week.due_on === week.ends_on ? 'último día del mes' : 'lunes'} ${dmy(week.due_on).slice(0, 5)}`
}
</script>
