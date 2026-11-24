<template>
  <SupplierPaymentPage wide-tables title="Estado de contenedores" subtitle="BL oficial, telex, flete y cobro de cada contenedor." icon="i-lucide-container">
    <template #actions>
      <UButton color="primary" icon="i-heroicons-banknotes" :disabled="!payable.length" @click="openPay([])">Pagar fletes</UButton>
    </template>

    <ChinaSummaryCards :cards="cards" />
    <SupplierPaymentTabs v-model="tab" :items="tabs" class="mb-4" />
    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-3" />
    <ChinaContainersTable
      :rows="shown"
      :loading="loading"
      :search="search"
      :filter-config="filterConfig"
      :filters="filters"
      @search="(value) => { search = value }"
      @filter="(key, value) => { filters = { ...filters, [key]: value } }"
      @clear="clearFilters"
      @select="(id) => { selectedId = id }"
    />

    <ChinaContainerDrawer
      :container="selected"
      :container-types="options.container_types"
      @close="selectedId = null"
      @update="(values) => selected && update(selected.id, values)"
      @pay="selected && openPay([selected.id])"
      @confirm-manual="selected && payFreight([selected.id], chinaToday(), null)"
      @cancel-freight="selected?.freight.payment_id && cancelFreight(selected.freight.payment_id)"
    />
    <ChinaFreightPayModal :open="payOpen" :rows="payable" :preselected="payIds" @close="payOpen = false" @pay="onPay" />
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import ChinaContainerDrawer from '~/components/china-caja/ChinaContainerDrawer.vue'
import ChinaContainersTable from '~/components/china-caja/ChinaContainersTable.vue'
import ChinaFreightPayModal from '~/components/china-caja/ChinaFreightPayModal.vue'
import ChinaSummaryCards from '~/components/china-caja/ChinaSummaryCards.vue'
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import { useChinaContainers } from '~/composables/china-caja/useChinaContainers'
import { chinaToday } from '~/utils/chinaCaja'

const route = useRoute()
const {
  options, loading, error, tab, tabs, search, filters, filterConfig, shown, cards, selectedId, selected, payable,
  load, update, payFreight, cancelFreight, clearFilters, open
} = useChinaContainers()
const payOpen = ref(false)
const payIds = ref<number[]>([])

function openPay(ids: number[]) {
  payIds.value = ids
  payOpen.value = true
}

async function onPay(ids: number[], paidOn: string, voucher: File) {
  if (await payFreight(ids, paidOn, voucher)) payOpen.value = false
}

watch(() => route.query.contenedor, (id) => { if (id) open(Number(id)) })
onMounted(async () => {
  await load()
  if (route.query.contenedor) open(Number(route.query.contenedor))
})
</script>
