<template>
  <SupplierPaymentPage title="Operaciones" subtitle="Servicios facturados a socios e importadores, cobros y caja.">
    <template #actions>
      <UButton color="neutral" variant="outline" icon="i-heroicons-building-library" @click="operationsPanel?.openBank()">Datos bancarios</UButton>
      <UButton color="neutral" variant="outline" icon="i-heroicons-credit-card" @click="operationsPanel?.openPayment()">Registrar pago</UButton>
      <UButton color="primary" icon="i-heroicons-plus" @click="operationsPanel?.openNew()">Nueva operación</UButton>
    </template>

    <SupplierPaymentTabs v-model="tab" :items="tabs" class="mb-4" />
    <ChinaOperationsPanel v-show="tab === CHINA_BILLING_TAB.OPERATIONS" ref="operationsPanel" @changed="loadPaymentsCount" />
    <ChinaPaymentsPanel v-if="tab === CHINA_BILLING_TAB.PAYMENTS" @changed="loadPaymentsCount" />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ChinaOperationsPanel from '~/components/china-billing/ChinaOperationsPanel.vue'
import ChinaPaymentsPanel from '~/components/china-billing/ChinaPaymentsPanel.vue'
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import { CHINA_BILLING_TAB } from '~/constants/chinaBilling'
import { ChinaBillingService } from '~/services/chinaBillingService'

const tab = ref<string>(CHINA_BILLING_TAB.OPERATIONS)
const operationsPanel = ref<InstanceType<typeof ChinaOperationsPanel> | null>(null)
const paymentsCount = ref(0)

const tabs = computed(() => [
  { label: 'Operaciones', value: CHINA_BILLING_TAB.OPERATIONS, count: operationsPanel.value?.operationsCount ?? 0 },
  { label: 'Cobros', value: CHINA_BILLING_TAB.PAYMENTS, count: paymentsCount.value }
])

/** Solo el total de cobros para el contador de la pestaña; la lista la carga su propio panel. */
async function loadPaymentsCount() {
  try {
    paymentsCount.value = (await ChinaBillingService.listPayments({ per_page: 1 })).counts?.all ?? 0
  } catch {
    paymentsCount.value = 0
  }
}

// Al volver a Operaciones se recarga: los cobros confirmados desde la otra pestaña cambian estados y saldos.
watch(tab, (value) => {
  if (value === CHINA_BILLING_TAB.OPERATIONS) operationsPanel.value?.refresh()
})

onMounted(loadPaymentsCount)
</script>
