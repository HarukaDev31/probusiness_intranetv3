<template>
  <SupplierPaymentPage title="Operaciones" subtitle="Servicios facturados a socios e importadores, cobros y caja.">
    <template #actions>
      <UButton color="neutral" variant="outline" icon="i-heroicons-building-library" @click="operationsPanel?.openBank()">Datos bancarios</UButton>
      <UButton color="neutral" variant="outline" icon="i-heroicons-credit-card" @click="operationsPanel?.openPayment()">Registrar pago</UButton>
      <UButton color="primary" icon="i-heroicons-plus" @click="operationsPanel?.openNew()">Nueva operación</UButton>
    </template>

    <ChinaBillingSummary :cards="summary.cards.value" :range-label="summary.rangeLabel.value" :loading="summary.loading.value" />

    <SupplierPaymentTabs v-model="tab" :items="tabs" class="mb-4" />
    <ChinaOperationsPanel
      v-show="tab === CHINA_BILLING_TAB.OPERATIONS"
      ref="operationsPanel"
      :range="range"
      @range-change="onRangeChange"
      @changed="onChanged"
    />
    <ChinaPaymentsPanel
      v-if="tab === CHINA_BILLING_TAB.PAYMENTS"
      :range="range"
      :credits="summary.credits.value"
      @range-change="onRangeChange"
      @changed="onChanged"
    />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ChinaBillingSummary from '~/components/china-billing/ChinaBillingSummary.vue'
import ChinaOperationsPanel from '~/components/china-billing/ChinaOperationsPanel.vue'
import ChinaPaymentsPanel from '~/components/china-billing/ChinaPaymentsPanel.vue'
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import { useChinaSummary } from '~/composables/china-billing/useChinaSummary'
import { CHINA_BILLING_TAB } from '~/constants/chinaBilling'
import { ChinaBillingService } from '~/services/chinaBillingService'

const tab = ref<string>(CHINA_BILLING_TAB.OPERATIONS)
const operationsPanel = ref<InstanceType<typeof ChinaOperationsPanel> | null>(null)
const paymentsCount = ref(0)
const summary = useChinaSummary()
// El rango de fechas es compartido: filtra ambas listas y los KPIs del encabezado.
const range = ref({ from: '', to: '' })

const tabs = computed(() => [
  { label: 'Operaciones', value: CHINA_BILLING_TAB.OPERATIONS, count: operationsPanel.value?.operationsCount ?? 0 },
  { label: 'Cobros', value: CHINA_BILLING_TAB.PAYMENTS, count: paymentsCount.value }
])

/** Contador de la pestaña Cobros: todos los pagos, sin importar el rango. */
async function loadPaymentsCount() {
  try {
    paymentsCount.value = (await ChinaBillingService.listPayments({ per_page: 1 })).counts?.overall ?? 0
  } catch {
    paymentsCount.value = 0
  }
}

function onRangeChange(value: { from: string; to: string }) {
  range.value = value
  summary.from.value = value.from
  summary.to.value = value.to
  summary.load()
}

function onChanged() {
  summary.load()
  loadPaymentsCount()
}

// Al volver a Operaciones se recarga: los cobros confirmados desde la otra pestaña cambian estados y saldos.
watch(tab, (value) => {
  if (value === CHINA_BILLING_TAB.OPERATIONS) operationsPanel.value?.refresh()
})

onMounted(() => {
  summary.load()
  loadPaymentsCount()
})
</script>
