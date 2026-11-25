<template>
  <div class="cc cc-page cc-page--containers">
    <div class="cc-between">
      <h1 class="cc-h1 !text-[28px]">Estado de contenedores</h1>
      <button type="button" class="cc-btn cc-btn--lg" @click="openPay([])"><UIcon name="i-lucide-upload" class="size-[17px]" />Subir pago de flete</button>
    </div>
    <div class="cc-tabs"><button v-for="item in tabs" :key="item.value" type="button" :class="{ on: tab === item.value }" @click="changeTab(item.value)">{{ item.label }}<span>{{ item.count }}</span></button></div>
    <UAlert v-if="error" color="error" variant="soft" :title="error" />
    <div class="cc-kpis-auto"><div v-for="card in cards" :key="card.label" class="cc-kpi-side" :style="{ '--kpi': card.accent }"><span class="text-xs tracking-[.08em] text-(--cc-muted)">{{ card.label }}</span><b :class="card.tone">{{ card.value }}</b><span class="cc-sub">{{ card.sub }}</span></div></div>
    <div class="flex flex-wrap items-end gap-3">
      <label class="cc-field cc-field--filter">País<USelect v-model="country" :items="countryItems" variant="none" :ui="{ base: 'cc-input cc-input--filter min-w-[100px]' }" /></label>
      <label v-if="isOpenTab" class="cc-field cc-field--filter">Estado<USelect v-model="group" :items="groupItems" variant="none" :ui="{ base: 'cc-input cc-input--filter min-w-[188px]' }" /></label>
      <UInput v-model="search" icon="i-lucide-search" variant="none" placeholder="Buscar cliente, BL, naviera…" class="w-[260px]" :ui="{ base: 'cc-input !rounded-lg !py-[11px] !pl-9 !pr-3.5' }" />
      <button v-if="hasFilters" type="button" class="cc-link !px-1 !py-2.5 !text-sm" @click="clearFilters">Limpiar filtros</button>
    </div>
    <div v-if="isOpenTab" class="flex flex-wrap gap-2.5"><button v-for="item in chips" :key="item.key" type="button" class="cc-chip" :class="{ on: chip === item.key }" @click="chip = item.key"><strong>{{ item.count }}</strong>{{ item.label }}</button></div>

    <div class="flex flex-wrap items-start gap-4">
      <ChinaContainersTable :rows="shown" :loading="loading" :selected-id="selectedId" :empty-text="emptyText" @select="(id) => { selectedId = selectedId === id ? null : id }" />
      <ChinaContainerPanel
        v-if="selected"
        :container="selected"
        @close="selectedId = null"
        @update="(values) => selected && update(selected.id, values)"
        @pay="selected && openPay([selected.id])"
        @confirm-manual="selected && payFreight([selected.id], chinaToday(), null)"
        @voucher="voucherOf = selected"
      />
    </div>
    <span class="text-[15px]">{{ footer }}</span>

    <ChinaFreightPayModal :open="payOpen" :rows="payable" :preselected="payIds" @close="payOpen = false" @pay="onPay" />
    <ChinaFreightVoucherModal :container="voucherOf" :rows="rows" @close="voucherOf = null" @cancel="onCancel" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ChinaContainerPanel from '~/components/china-caja/ChinaContainerPanel.vue'
import ChinaContainersTable from '~/components/china-caja/ChinaContainersTable.vue'
import ChinaFreightPayModal from '~/components/china-caja/ChinaFreightPayModal.vue'
import ChinaFreightVoucherModal from '~/components/china-caja/ChinaFreightVoucherModal.vue'
import { useChinaContainers } from '~/composables/china-caja/useChinaContainers'
import type { ChinaContainer } from '~/types/china-caja'
import { chinaToday } from '~/utils/chinaCaja'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const {
  rows, loading, error, tab, tabs, isOpenTab, search, country, group, chip, chips, countryItems, groupItems, hasFilters, shown, footer, cards,
  selectedId, selected, payable, load, update, payFreight, cancelFreight, changeTab, clearFilters, open
} = useChinaContainers()
const payOpen = ref(false)
const payIds = ref<number[]>([])
const voucherOf = ref<ChinaContainer | null>(null)
const emptyText = computed(() => (isOpenTab.value ? 'No hay contenedores con este filtro.' : 'Aún no hay contenedores completados (BL oficial, Telex, cobro y flete pagado).'))

function openPay(ids: number[]) {
  payIds.value = ids
  payOpen.value = true
}

async function onPay(ids: number[], paidOn: string, voucher: File | null) {
  if (await payFreight(ids, paidOn, voucher)) payOpen.value = false
}

async function onCancel(paymentId: number) {
  if (await cancelFreight(paymentId)) voucherOf.value = null
}

watch(() => route.query.contenedor, (id) => { if (id) open(Number(id)) })
onMounted(async () => {
  await load()
  if (route.query.contenedor) open(Number(route.query.contenedor))
})
</script>
