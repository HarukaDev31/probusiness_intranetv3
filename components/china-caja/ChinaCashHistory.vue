<template>
  <div class="flex flex-col gap-5">
    <UAlert v-if="error" color="error" variant="soft" :title="error" />
    <div class="flex flex-col gap-1.5">
      <span class="text-[13px] text-(--cc-muted)">{{ heading }}</span>
      <div class="cc-kpis-auto"><ChinaKpi v-for="card in cards" :key="card.label" :card="card" /></div>
    </div>
    <div class="cc-row">
      <div class="cc-seg"><button v-for="item in CHINA_CASH_GRAINS" :key="item.value" type="button" :class="{ on: grain === item.value }" @click="grain = item.value">{{ item.label }}</button></div>
      <label class="cc-inline !pr-1">Año<USelect v-model="year" :items="years" variant="none" :ui="{ base: 'cc-input cc-input--bar min-w-24' }" /></label>
      <ChinaInfo topic="gran" />
    </div>

    <section class="cc-card overflow-hidden">
      <div class="cc-between border-b border-(--cc-line) px-5 py-4">
        <span class="cc-title-row"><span class="cc-title">{{ title }}</span><ChinaInfo topic="chT" /></span>
        <span class="cc-sub">% contra el {{ unit }} anterior · ▲▼ verde mejora, rojo empeora</span>
      </div>
      <div ref="scroller" class="overflow-x-auto">
        <div class="cc-matrix" :style="{ minWidth: `${310 + periods.length * 112}px` }">
          <div class="cc-matrix-row cc-matrix-head" :style="columns">
            <div>CONCEPTO</div>
            <div v-for="period in periods" :key="period.label" class="flex flex-col items-end gap-[3px] !py-2" :class="{ open: !period.closed }">
              <span :class="period.closed ? 'font-medium' : 'font-bold text-(--cc-orange-ink)'">{{ period.label.toUpperCase() }}</span>
              <button v-if="period.month" type="button" class="cc-see" @click="emit('view', period.month)">Ver mes</button>
            </div>
            <div class="!text-(--cc-ink)">TOTAL {{ year }}</div>
          </div>
          <div v-for="(row, index) in matrix" :key="index" class="cc-matrix-row" :class="[row.strong ? 'cc-matrix-total' : '', row.small ? '!border-t-0' : '', row.weight]" :style="columns">
            <div :class="row.small ? 'text-xs text-(--cc-muted)' : ''">{{ row.label }}</div>
            <div v-for="(cell, at) in row.cells" :key="at" :class="[cell.tone, row.small ? 'text-xs' : '', cell.open ? 'open' : '']">{{ cell.text }}</div>
            <div :class="row.totalTone">{{ row.total }}</div>
          </div>
          <div class="border-t border-(--cc-line)" />
          <div v-if="!loading && !periods.length" class="px-5 py-7 text-(--cc-muted)">Sin movimientos en {{ year }}.</div>
          <div class="cc-sub sticky left-0 w-fit px-5 py-2.5">Columna naranja = periodo abierto · ✓ cuadra con el banco · % contra el {{ unit }} anterior</div>
        </div>
      </div>
    </section>

    <div class="flex flex-wrap items-stretch gap-5">
      <section class="cc-card flex flex-[1_1_480px] flex-col gap-3 px-5 py-[18px]">
        <div class="cc-between">
          <span class="cc-title-row"><span class="cc-title">Ingresos y egresos por {{ unit }}</span><ChinaInfo topic="chIn" /></span>
          <span class="cc-legend"><span><i class="bg-(--cc-green)" />Ingresos</span><span><i class="bg-(--cc-orange)" />Egresos</span><span><i class="cc-hatch-gray" />Proyectado</span></span>
        </div>
        <div class="cc-cols h-[220px] items-end border-b border-(--cc-line2)">
          <div v-for="bar in bars" :key="bar.label" class="flex h-full flex-col items-center justify-end">
            <span class="flex w-full max-w-14 items-end gap-[3px]">
              <span class="flex flex-1 flex-col justify-end"><span class="cc-hatch-gray" :style="{ height: bar.incomeProjected }" /><span class="bg-(--cc-green)" :style="{ height: bar.incomeReal }" /></span>
              <span class="flex flex-1 flex-col justify-end"><span class="cc-hatch-out" :style="{ height: bar.expenseProjected }" /><span class="bg-(--cc-orange)" :style="{ height: bar.expenseReal }" /></span>
            </span>
          </div>
        </div>
        <div class="cc-cols"><span v-for="bar in bars" :key="bar.label" class="flex flex-col items-center gap-px whitespace-nowrap text-[11px]"><strong>{{ bar.label }}</strong><span>+{{ thousands(bar.income) }}</span><span class="cc-t-orange">−{{ thousands(bar.expense) }}</span></span></div>
      </section>
      <section class="cc-card flex flex-[1_1_480px] flex-col gap-3 px-5 py-[18px]">
        <div class="cc-between">
          <span class="cc-title-row"><span class="cc-title">Histórico de utilidad operativa</span><ChinaInfo topic="uHist" /></span>
          <span class="whitespace-nowrap text-[13px] text-(--cc-muted)">Acumulado {{ year }} <strong :class="totals.profit < 0 ? 'cc-t-red' : 'cc-t-green'">{{ signed(totals.profit) }}</strong> · promedio {{ signed(totals.average) }} por {{ unit }}</span>
        </div>
        <div class="cc-cols h-[200px]">
          <div v-for="bar in bars" :key="bar.label" class="flex h-full flex-col items-center">
            <span class="flex w-full flex-1 flex-col items-center justify-end gap-[3px]"><span class="cc-t-green whitespace-nowrap text-[10px] font-bold">{{ bar.profit >= 0 ? `+${thousands(bar.profit)}` : '' }}</span><span class="w-[70%] max-w-10" :class="bar.projected ? 'cc-hatch-in' : 'bg-(--cc-green)'" :style="{ height: bar.up }" /></span>
            <span class="h-0.5 w-full bg-(--cc-ink)" />
            <span class="flex w-full flex-1 flex-col items-center gap-[3px]"><span class="w-[70%] max-w-10 bg-(--cc-red)" :class="bar.projected ? 'opacity-50' : ''" :style="{ height: bar.down }" /><span class="cc-t-red whitespace-nowrap text-[10px] font-bold">{{ bar.profit < 0 ? `−${thousands(-bar.profit)}` : '' }}</span></span>
          </div>
        </div>
        <div class="cc-cols"><span v-for="bar in bars" :key="bar.label" class="flex flex-col items-center gap-px whitespace-nowrap text-[11px]"><strong>{{ bar.label }}</strong><span class="text-(--cc-muted)">acum.</span><span class="text-(--cc-muted)">{{ bar.accumulated < 0 ? '−' : '' }}{{ thousands(Math.abs(bar.accumulated)) }}</span></span></div>
      </section>
    </div>

    <div class="flex flex-wrap items-start gap-5">
      <div class="grid min-w-0 flex-[1_1_480px] content-start gap-5">
        <ChinaCashClients title="Principales ingresos" :subtitle="`Lo que va de ${year}`" type="in" :rows="incomeClients" :money="money" />
        <ChinaCashClients title="Principales egresos" :subtitle="`Lo que va de ${year}`" type="out" :rows="expenseClients" :money="money" />
      </div>
      <div class="flex min-w-0 max-w-[460px] flex-[1_1_320px] flex-col gap-5"><slot /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import ChinaCashClients from '~/components/china-caja/ChinaCashClients.vue'
import ChinaInfo from '~/components/china-caja/ChinaInfo.vue'
import ChinaKpi from '~/components/china-caja/ChinaKpi.vue'
import { useChinaCashHistory } from '~/composables/china-caja/useChinaCashHistory'
import { CHINA_CASH_GRAINS } from '~/constants/chinaCaja'

const props = defineProps<{ money: (value: number) => string; signed: (value: number) => string }>()
const emit = defineEmits<{ view: [month: string] }>()
const { years, year, grain, unit, title, heading, loading, error, periods, matrix, bars, totals, cards, incomeClients, expenseClients, load } = useChinaCashHistory(
  (value) => props.money(value), (value) => props.signed(value)
)
const scroller = ref<HTMLElement | null>(null)
const columns = computed(() => ({ gridTemplateColumns: `150px repeat(${Math.max(1, periods.value.length)}, minmax(104px, 1fr)) 120px` }))

/** «¥87k» para que entre debajo de cada barra. */
function thousands(value: number) {
  const text = props.money(value)
  const amount = Math.round(Number(text.replace(/[^\d]/g, '')) / 1000)
  return `${text.charAt(0)}${amount}k`
}

// La tabla arranca en el periodo más reciente.
watch(periods, async () => {
  await nextTick()
  if (scroller.value) scroller.value.scrollLeft = scroller.value.scrollWidth
})

defineExpose({ reload: load })
</script>
