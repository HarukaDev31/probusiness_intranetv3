<template>
  <SupplierPaymentPage wide-tables title="Flujo de caja" subtitle="Todo en RMB. El saldo sale de los cierres semanales." icon="i-lucide-wallet">
    <template v-if="tab === CHINA_CASH_TAB.FLOW" #actions>
      <UInput v-model="month" type="month" :max="chinaToday().slice(0, 7)" class="w-44" />
      <UButton v-if="data && !data.closed" color="primary" :disabled="!data.can_close_month" :title="data.close_month_blocker || ''" @click="() => { monthOpen = true }">Cerrar mes</UButton>
    </template>

    <SupplierPaymentTabs v-model="tab" :items="TABS" class="mb-4" />
    <ChinaCashHistory v-if="tab === CHINA_CASH_TAB.HISTORY" @view="viewMonth" />
    <template v-else>
      <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-3" />
      <USkeleton v-if="!data && loading" class="h-40" />
      <div v-if="data" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-end gap-3">
          <UFormField label="TC general del mes (RMB por USD)">
            <div class="flex gap-2">
              <UInputNumber v-model="rate" :min="0" :step="0.0001" :ui="AMOUNT_UI" :disabled="data.closed" class="w-32" />
              <UButton v-if="!data.closed && rate && rate !== data.exchange_rate" size="sm" @click="() => { saveRate(rate) }">Guardar</UButton>
            </div>
          </UFormField>
          <UFormField v-if="data.opening_editable" label="Saldo inicial">
            <div class="flex gap-2">
              <UInputNumber v-model="opening" :step="0.01" :ui="AMOUNT_UI" class="w-36" />
              <UButton v-if="opening !== null && opening !== data.opening_balance" size="sm" @click="() => { saveOpening(opening) }">Guardar</UButton>
            </div>
          </UFormField>
          <USelect v-model="period" :items="periodItems" class="w-56" />
          <UBadge v-if="data.closed" color="neutral">Mes cerrado · solo lectura</UBadge>
        </div>
        <UAlert v-if="!data.exchange_rate && !data.closed" color="warning" variant="soft" title="Registra el TC del mes para proyectar los cobros y pagar los fletes en USD." />

        <ChinaSummaryCards :cards="cards" />
        <ChinaCashWeeks :month="data.month" :weeks="data.weeks" :selected="period" @pick="pickWeek" @close-week="(week) => { closingWeek = week }" @screenshot="(week) => { viewer = week.closing }" />
        <ChinaCashMovements v-if="data.late.length" title="Cobros y pagos atrasados" variant="late" :rows="data.late" />
        <USelect v-model="origin" :items="CHINA_CASH_ORIGINS" class="w-56" />
        <ChinaCashMovements v-if="!data.closed" title="Por realizar" variant="pending" :rows="pending" empty="Nada por realizar en el periodo." />
        <ChinaCashMovements :title="`Realizados · ${real.length}`" variant="real" :rows="real" empty="Sin movimientos reales en el periodo." />
        <div class="grid gap-4 lg:grid-cols-2">
          <ChinaFixedCosts :costs="data.fixed_costs" @add="addFixedCost" @toggle="toggleFixedCost" @remove="removeFixedCost" />
          <ChinaInvestments :investments="data.investments" @add="addInvestment" @pay="payInvestment" @remove="removeInvestment" />
        </div>
      </div>
    </template>

    <ChinaCashCloseModals :week="closingWeek" :month-open="monthOpen" @close="closeModals" @week="onCloseWeek" @month="onCloseMonth" />
    <VoucherViewerModal :open="!!viewer" :url="viewer?.screenshot_url || null" :name="viewer?.screenshot_name || null" @close="viewer = null" />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ChinaCashCloseModals from '~/components/china-caja/ChinaCashCloseModals.vue'
import ChinaCashHistory from '~/components/china-caja/ChinaCashHistory.vue'
import ChinaCashMovements from '~/components/china-caja/ChinaCashMovements.vue'
import ChinaCashWeeks from '~/components/china-caja/ChinaCashWeeks.vue'
import ChinaFixedCosts from '~/components/china-caja/ChinaFixedCosts.vue'
import ChinaInvestments from '~/components/china-caja/ChinaInvestments.vue'
import ChinaSummaryCards from '~/components/china-caja/ChinaSummaryCards.vue'
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import { useChinaCash } from '~/composables/china-caja/useChinaCash'
import { AMOUNT_UI, CHINA_CASH_ORIGINS, CHINA_CASH_PERIOD_MONTH, CHINA_CASH_TAB } from '~/constants/chinaCaja'
import type { ChinaCashWeek } from '~/types/china-caja'
import { chinaToday } from '~/utils/chinaCaja'

const TABS = [{ label: 'Flujo', value: CHINA_CASH_TAB.FLOW }, { label: 'Cierres mensuales', value: CHINA_CASH_TAB.HISTORY }]
const MONTH_PATTERN = /^20\d\d-(0[1-9]|1[0-2])$/

const route = useRoute()
const queryMonth = String(route.query.mes || '')
const {
  month, data, loading, error, period, origin, periodItems, pending, real, cards, load, saveRate, saveOpening, closeWeek, closeMonth,
  addFixedCost, toggleFixedCost, removeFixedCost, addInvestment, payInvestment, removeInvestment
} = useChinaCash(MONTH_PATTERN.test(queryMonth) ? queryMonth : chinaToday().slice(0, 7))

const tab = ref<string>(CHINA_CASH_TAB.FLOW)
const rate = ref<number | null>(null)
const opening = ref<number | null>(null)
const closingWeek = ref<ChinaCashWeek | null>(null)
const monthOpen = ref(false)
const viewer = ref<ChinaCashWeek['closing']>(null)

watch(data, (value) => {
  rate.value = value?.exchange_rate ?? null
  opening.value = value?.opening_balance ?? null
})

function pickWeek(startsOn: string) {
  period.value = period.value === startsOn ? CHINA_CASH_PERIOD_MONTH : startsOn
}

function closeModals() {
  closingWeek.value = null
  monthOpen.value = false
}

async function onCloseWeek(startsOn: string, balance: number, screenshot: File) {
  if (await closeWeek(startsOn, balance, screenshot)) closeModals()
}

async function onCloseMonth(balance: number) {
  if (await closeMonth(balance)) closeModals()
}

function viewMonth(value: string) {
  tab.value = CHINA_CASH_TAB.FLOW
  month.value = value
}

watch(month, async (value) => {
  if (!value) return
  period.value = CHINA_CASH_PERIOD_MONTH
  await load()
  // «Ir →» del Inicio abre el cierre de esa semana.
  closingWeek.value = data.value?.weeks.find((week) => week.can_close && week.starts_on === route.query.semana) || null
}, { immediate: true })
</script>
