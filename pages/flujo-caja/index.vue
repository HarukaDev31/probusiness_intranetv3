<template>
  <div class="cc cc-page">
    <div class="cc-head">
      <h1 class="cc-h1">Flujo de caja</h1>
      <div class="cc-row">
        <div class="cc-seg"><button v-for="item in TABS" :key="item.value" type="button" :class="{ on: tab === item.value }" @click="tab = item.value">{{ item.label }}</button></div>
        <div class="cc-seg"><button v-for="item in CURRENCIES" :key="item.value" type="button" class="!px-3.5 !font-semibold" :class="{ on: currency === item.value }" @click="currency = item.value">{{ item.label }}</button></div>
      </div>
    </div>
    <UAlert v-if="error" color="error" variant="soft" :title="error" />
    <USkeleton v-if="!data && loading" class="h-60 rounded-[14px]" />

    <ChinaCashHistory v-if="data && tab === CHINA_CASH_TAB.HISTORY" ref="history" :money="money" :signed="signed" @view="viewMonth">
      <ChinaFixedCosts :costs="data.fixed_costs" :money="money" @add="(body) => apply(addFixedCost(body))" @toggle="(id, active) => apply(toggleFixedCost(id, active))" @remove="(id) => apply(removeFixedCost(id))" />
      <ChinaInvestments :investments="data.investments" :year="data.month.slice(0, 4)" :money="money" :pay-investment="(id) => apply(payInvestment(id))" @add="(body) => apply(addInvestment(body))" @remove="(id) => apply(removeInvestment(id))" />
    </ChinaCashHistory>

    <template v-else-if="data && cards">
      <div class="cc-row">
        <label class="cc-inline !pr-1">Mes<USelect v-model="month" :items="months" variant="none" :ui="{ base: 'cc-input cc-input--bar min-w-52' }" /></label>
        <label class="cc-inline">TC general {{ chinaMonthShort(data.month) }}
          <UInputNumber v-model="rate" :min="0" :step="0.0001" variant="none" :ui="{ ...AMOUNT_UI, base: 'cc-input cc-input--tc' }" :disabled="data.closed" @change="onRate" />
          <ChinaInfo topic="tc" />
        </label>
        <label v-if="data.opening_editable" class="cc-inline">Saldo inicial
          <UInputNumber v-model="opening" :step="0.01" variant="none" placeholder="¥" :ui="{ ...AMOUNT_UI, base: 'cc-input cc-input--tc !w-28' }" @change="onOpening" />
        </label>
        <span class="flex-1" />
        <span v-if="data.closed" class="cc-c-gray whitespace-nowrap rounded-[10px] px-3.5 py-2 text-sm font-medium">✓ Mes cerrado · solo lectura</span>
        <span v-else class="flex items-center gap-2">
          <button type="button" class="cc-btn" :disabled="!data.can_close_month" @click="monthOpen = true">Cerrar {{ chinaMonthName(data.month).toLowerCase() }}</button>
          <span v-if="data.close_month_blocker" class="cc-t-deep max-w-[190px] text-xs xl:max-w-[230px]">{{ data.close_month_blocker }}</span>
          <ChinaInfo topic="cerrar" />
        </span>
      </div>
      <UAlert v-if="!data.exchange_rate && !data.closed" color="warning" variant="soft" title="Registra el TC del mes para proyectar los cobros y pagar los fletes en USD." />

      <div class="cc-kpis">
        <div><span class="cc-kpis-label">CAJA · CIERRES SEMANALES</span><ChinaKpi :card="cards.cash" /></div>
        <div><span class="cc-kpis-label">OPERACIÓN DEL {{ period === CHINA_CASH_PERIOD_MONTH ? 'MES' : periodLabel.split(' · ')[0]?.toUpperCase() }}</span><div class="cc-kpis-ops"><ChinaKpi v-for="card in cards.operation" :key="card.label" :card="card" /></div></div>
        <div><span class="cc-kpis-label">REGISTRO</span><ChinaKpi :card="cards.movements" /></div>
      </div>

      <ChinaCashWeeks :month="data.month" :today="data.today" :closed="data.closed" :weeks="data.weeks" :selected="period" :money="money" :signed="signed" @pick="pickWeek" @close-week="(week) => { closingWeek = week }" @screenshot="(week) => { viewing = week }" />

      <div v-if="!data.closed" class="flex flex-wrap items-start gap-5">
        <ChinaCashPending :rows="pending" :money="money" @open="openMovement" />
        <ChinaCashPending :rows="late" late :money="money" @open="openMovement" />
      </div>
      <div class="flex flex-wrap items-start gap-5">
        <ChinaCashRealized class="flex-[1_1_820px]" :rows="real" :origins="origins" :origin="origin" :period-label="periodLabel" :money="money" @origin="(value) => { origin = value }" />
        <div class="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <ChinaCashClients title="Ingresos por cliente" :subtitle="periodLabel" type="in" :rows="incomeClients" :money="money" />
          <ChinaCashClients title="Egresos por cliente" :subtitle="periodLabel" type="out" :rows="expenseClients" :money="money" />
        </div>
      </div>

      <ChinaCashMonthModal :open="monthOpen" :data="data" @close="monthOpen = false" @save="onCloseMonth" />
    </template>

    <ChinaCashWeekModal :week="closingWeek" @close="closingWeek = null" @save="onCloseWeek" @open-payment="(id) => navigateTo(`/operaciones-china?cobro=${id}`)" />
    <VoucherViewerModal :open="!!viewing" :url="viewing?.closing?.screenshot_url || null" :name="viewing?.closing?.screenshot_name || null" :title="viewing ? `Cierre semana ${viewing.index + 1}` : ''" :description="viewing ? `${weekRange(viewing)} · semana cerrada, solo lectura` : null" @close="viewing = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChinaCashClients from '~/components/china-caja/ChinaCashClients.vue'
import ChinaCashHistory from '~/components/china-caja/ChinaCashHistory.vue'
import ChinaCashMonthModal from '~/components/china-caja/ChinaCashMonthModal.vue'
import ChinaCashPending from '~/components/china-caja/ChinaCashPending.vue'
import ChinaCashRealized from '~/components/china-caja/ChinaCashRealized.vue'
import ChinaCashWeekModal from '~/components/china-caja/ChinaCashWeekModal.vue'
import ChinaCashWeeks from '~/components/china-caja/ChinaCashWeeks.vue'
import ChinaFixedCosts from '~/components/china-caja/ChinaFixedCosts.vue'
import ChinaInfo from '~/components/china-caja/ChinaInfo.vue'
import ChinaInvestments from '~/components/china-caja/ChinaInvestments.vue'
import ChinaKpi from '~/components/china-caja/ChinaKpi.vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import { useChinaCash } from '~/composables/china-caja/useChinaCash'
import { AMOUNT_UI, CHINA_CASH_PERIOD_MONTH, CHINA_CASH_TAB, CHINA_CURRENCY } from '~/constants/chinaCaja'
import type { ChinaCashMovement, ChinaCashWeek } from '~/types/china-caja'
import { chinaMonthName, chinaMonthShort, chinaToday, movementLink, weekRange } from '~/utils/chinaCaja'

definePageMeta({ middleware: 'auth' })

const TABS = [{ label: 'Flujo', value: CHINA_CASH_TAB.FLOW }, { label: 'Cierres mensuales', value: CHINA_CASH_TAB.HISTORY }]
const CURRENCIES = [{ label: '¥ RMB', value: CHINA_CURRENCY.RMB }, { label: '$ USD', value: CHINA_CURRENCY.USD }]
const MONTH_PATTERN = /^20\d\d-(0[1-9]|1[0-2])$/
const MONTHS_BACK = 12

const route = useRoute()
const queryMonth = String(route.query.mes || '')
const {
  month, data, loading, error, period, origin, currency, origins, periodLabel, pending, late, real, cards, money, signed, load, incomeClients, expenseClients,
  saveRate, saveOpening, closeWeek, closeMonth, addFixedCost, toggleFixedCost, removeFixedCost, addInvestment, payInvestment, removeInvestment
} = useChinaCash(MONTH_PATTERN.test(queryMonth) ? queryMonth : chinaToday().slice(0, 7))

const tab = ref<string>(CHINA_CASH_TAB.FLOW)
const rate = ref<number | null>(null)
const opening = ref<number | null>(null)
const closingWeek = ref<ChinaCashWeek | null>(null)
const viewing = ref<ChinaCashWeek | null>(null)
const monthOpen = ref(false)
const history = ref<InstanceType<typeof ChinaCashHistory> | null>(null)

const months = computed(() => {
  const [year, number] = chinaToday().split('-').map(Number)
  const list = Array.from({ length: MONTHS_BACK }, (_, back) => {
    const date = new Date(Date.UTC(year!, number! - 1 - back, 1))
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  })
  if (!list.includes(month.value)) list.push(month.value)
  return list.sort().map((value) => ({ value, label: `${chinaMonthName(value)} ${value.slice(0, 4)}${data.value?.month === value ? (data.value.closed ? ' · cerrado' : ' · abierto') : ''}` }))
})

watch(data, (value) => {
  rate.value = value?.exchange_rate ?? null
  opening.value = value?.opening_balance ?? null
})

function onRate() {
  if (rate.value && rate.value !== data.value?.exchange_rate) saveRate(rate.value)
}

function onOpening() {
  if (opening.value !== null && opening.value !== data.value?.opening_balance) saveOpening(opening.value)
}

function pickWeek(startsOn: string) {
  period.value = period.value === startsOn ? CHINA_CASH_PERIOD_MONTH : startsOn
}

function openMovement(row: ChinaCashMovement) {
  const link = movementLink(row)
  if (link) navigateTo(link)
  // Costos fijos e inversiones se manejan en Cierres mensuales.
  else tab.value = CHINA_CASH_TAB.HISTORY
}

/** Tras un cambio en costos o inversiones también se recalculan los cierres. */
async function apply(action: Promise<boolean>) {
  const ok = await action
  if (ok) await history.value?.reload()
  return ok
}

async function onCloseWeek(startsOn: string, balance: number, screenshot: File) {
  if (await closeWeek(startsOn, balance, screenshot)) closingWeek.value = null
}

async function onCloseMonth(balance: number) {
  if (await closeMonth(balance)) monthOpen.value = false
}

function viewMonth(value: string) {
  tab.value = CHINA_CASH_TAB.FLOW
  month.value = value
}

watch(month, async (value) => {
  if (!value) return
  period.value = CHINA_CASH_PERIOD_MONTH
  origin.value = 'Todos'
  await load()
  // «Ir →» del Inicio abre el cierre de esa semana.
  closingWeek.value = data.value?.weeks.find((week) => week.can_close && week.starts_on === route.query.semana) || null
}, { immediate: true })
</script>
