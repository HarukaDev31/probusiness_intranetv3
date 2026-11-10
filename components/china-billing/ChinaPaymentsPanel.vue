<template>
  <div>
    <div class="mb-4 grid grid-cols-2 overflow-hidden rounded-lg bg-default ring ring-default lg:grid-cols-4">
      <button
        v-for="state in states"
        :key="state.key"
        type="button"
        class="flex flex-col gap-1 border-b-[3px] border-r border-r-default px-4 py-3 text-left transition-colors hover:bg-primary/5"
        :class="status === state.key ? 'border-b-primary bg-primary/10' : 'border-b-transparent'"
        @click="changeStatus(state.key)"
      >
        <span class="flex items-center gap-2 text-sm text-toned"><span class="size-2.5 rounded-full" :class="state.dot" />{{ state.label }}</span>
        <span class="text-xl font-bold text-highlighted">{{ state.count }}</span>
      </button>
    </div>

    <DataTable
      sticky-last-column
      keep-spanish-headers
      filters-layout="inline"
      :data="rows"
      :columns="columns"
      :loading="loading"
      :current-page="pagination.current_page"
      :total-pages="pagination.last_page"
      :total-records="pagination.total"
      :items-per-page="pagination.per_page"
      :primary-search-value="search"
      :show-primary-search="true"
      :show-primary-search-label="false"
      primary-search-placeholder="Buscar por N° de pago o cliente"
      :show-filters="false"
      :show-export="false"
      empty-state-message="No hay pagos que coincidan."
      @update:primary-search="onSearch"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />

    <ChinaPaymentDrawer :payment="selected" @close="selectedId = null" @changed="refresh" @edit="openEdit" />
    <ChinaPaymentForm :open="!!editing" mode="china" :payment="editing" @close="editing = null" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import ChinaPaymentDrawer from '~/components/china-billing/ChinaPaymentDrawer.vue'
import ChinaPaymentForm from '~/components/china-billing/ChinaPaymentForm.vue'
import { CHINA_STATUS_COLOR, CHINA_STATUS_LABEL } from '~/constants/chinaBilling'
import { useChinaPayments } from '~/composables/china-billing/useChinaPayments'
import type { ChinaPayment } from '~/types/china-billing'
import { UBadge, UButton } from '#components'

const emit = defineEmits<{ changed: [] }>()
const { status, search, rows, pagination, loading, states, load, reload, changeStatus } = useChinaPayments()

const selectedId = ref<number | null>(null)
const selected = computed(() => rows.value.find((row) => row.id === selectedId.value) || null)
const editing = ref<ChinaPayment | null>(null)

const columns: TableColumn<ChinaPayment>[] = [
  { accessorKey: 'code', header: 'N. pago', cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
    h('span', { class: 'font-bold' }, row.original.code),
    h('span', { class: 'text-xs text-muted' }, `${dayLabel(row.original.paid_on)} · ${monthLabel(row.original.paid_on)}`)
  ]) },
  { accessorKey: 'organization', header: 'Cliente', cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
    h('span', { class: 'font-semibold' }, row.original.organization.name),
    h('span', { class: 'text-xs text-muted' }, row.original.registered_by === 'partner' ? 'Registrado por el socio' : 'Registrado por China')
  ]) },
  { id: 'operations', header: 'Operaciones', cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.allocations.map((a) => a.code).join(', ') || 'Sin asignar') },
  { accessorKey: 'amount_sent', header: 'Enviado', cell: ({ row }) => h('span', { class: 'font-semibold' }, usd(row.original.amount_sent)) },
  { accessorKey: 'amount_received', header: 'Recibido', cell: ({ row }) => h('span', row.original.amount_received === null ? '—' : usd(row.original.amount_received)) },
  { accessorKey: 'yuan_amount', header: 'RMB', cell: ({ row }) => h('span', row.original.yuan_amount ? rmb(row.original.yuan_amount) : '—') },
  { accessorKey: 'status', header: 'Estado', cell: ({ row }) => h(UBadge, { color: CHINA_STATUS_COLOR[row.original.status], variant: 'soft', label: CHINA_STATUS_LABEL[row.original.status] }) },
  { id: 'actions', header: '', cell: ({ row }) => h(UButton, {
    size: 'sm', color: 'primary', variant: 'outline', trailingIcon: 'i-heroicons-chevron-right', onClick: () => { selectedId.value = row.original.id }
  }, () => 'Gestionar') }
]

function openEdit(payment: ChinaPayment) {
  selectedId.value = null
  editing.value = payment
}

async function refresh() {
  await load()
  emit('changed')
}

function onSaved() {
  editing.value = null
  refresh()
}

function onSearch(value: string) {
  search.value = value
  reload()
}

function onPage(page: number) {
  pagination.value.current_page = page
  load()
}

function onPageSize(size: number) {
  pagination.value.per_page = size
  reload()
}

onMounted(load)
</script>
