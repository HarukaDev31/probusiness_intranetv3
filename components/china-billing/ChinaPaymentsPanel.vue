<template>
  <div>
    <DataTable
      sticky-last-column
      keep-spanish-headers
      filters-layout="inline"
      :fill-viewport="false"
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
      primary-search-placeholder="Buscar por N° de pago, cliente u operación"
      :show-filters="true"
      :filter-config="filterConfig"
      :filters-value="filters"
      :inline-count-text="`${pagination.total} de ${counts.overall ?? pagination.total}`"
      :show-export="false"
      empty-state-message="No hay pagos que coincidan con la búsqueda o el filtro."
      @update:primary-search="onSearch"
      @filter-change="onFilter"
      @clear-filters="onClearFilters"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    >
      <template #inline-extra>
        <div v-if="credits.length" class="flex flex-wrap items-center gap-2.5 border-b border-[#d3eedd] bg-[#eef8f2] px-4 py-3 text-sm">
          <span class="font-semibold text-success">Saldo a favor de clientes</span>
          <span v-for="credit in credits" :key="credit.organization_id" class="rounded-full border border-[#c9e6d4] bg-default px-2.5 py-0.5">
            {{ credit.name }} · <strong>{{ usd(credit.balance) }}</strong>
          </span>
        </div>
      </template>
    </DataTable>

    <ChinaPaymentDrawer :payment="selected" @close="selectedId = null" @changed="refresh" @edit="openEdit" />
    <ChinaPaymentForm :open="!!editing" mode="china" :payment="editing" @close="editing = null" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import ChinaPaymentDrawer from '~/components/china-billing/ChinaPaymentDrawer.vue'
import ChinaPaymentForm from '~/components/china-billing/ChinaPaymentForm.vue'
import { CHINA_STATUS, CHINA_STATUS_LABEL, CHINA_STATUS_PILL } from '~/constants/chinaBilling'
import { useChinaPayments } from '~/composables/china-billing/useChinaPayments'
import type { ChinaCredit, ChinaPayment } from '~/types/china-billing'
import { UIcon } from '#components'

const props = defineProps<{ range: { from: string; to: string }; credits: ChinaCredit[] }>()
const emit = defineEmits<{ changed: []; 'range-change': [range: { from: string; to: string }] }>()

const { status, search, from, to, rows, counts, pagination, loading, load, reload, changeStatus } = useChinaPayments()

const selectedId = ref<number | null>(null)
const selected = computed(() => rows.value.find((row) => row.id === selectedId.value) || null)
const editing = ref<ChinaPayment | null>(null)
const filters = ref<Record<string, string>>({ status: CHINA_STATUS.ALL, date_from: props.range.from, date_to: props.range.to })

const filterConfig = [
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    placeholder: 'Estado',
    options: [
      { value: CHINA_STATUS.ALL, label: 'Todos los estados' },
      ...[CHINA_STATUS.TO_CONFIRM, CHINA_STATUS.CONFIRMED, CHINA_STATUS.IN_CASH].map((key) => ({ value: key, label: CHINA_STATUS_LABEL[key] }))
    ]
  },
  { key: 'date_from', label: 'Desde', type: 'date', placeholder: 'Desde', separatorAfter: 'a' },
  { key: 'date_to', label: 'Hasta', type: 'date', placeholder: 'Hasta' }
]

// El rango de fechas es el mismo de la pestaña Operaciones y de los KPIs del encabezado.
watch(() => props.range, (value) => {
  if (value.from === from.value && value.to === to.value) return
  from.value = value.from
  to.value = value.to
  filters.value = { ...filters.value, date_from: value.from, date_to: value.to }
  reload()
}, { deep: true })

const right = { th: 'text-right', td: 'text-right' }
const ACTION: Record<string, string> = { [CHINA_STATUS.TO_CONFIRM]: 'Confirmar ingreso', [CHINA_STATUS.CONFIRMED]: 'Pasar a RMB' }

const columns: TableColumn<ChinaPayment>[] = [
  { accessorKey: 'code', header: 'N° pago', cell: ({ row }) => h('span', { class: 'font-semibold' }, row.original.code) },
  { accessorKey: 'paid_on', header: 'Fecha', cell: ({ row }) => h('div', { class: 'flex flex-col whitespace-nowrap' }, [
    h('span', dayLabel(row.original.paid_on)),
    h('span', { class: 'text-xs text-muted' }, monthLabel(row.original.paid_on))
  ]) },
  { accessorKey: 'organization', header: 'Cliente', cell: ({ row }) => h('div', { class: 'flex min-w-36 flex-col' }, [
    h('span', row.original.organization.name),
    h('span', { class: 'text-xs text-muted' }, row.original.organization.country || '—')
  ]) },
  { id: 'operations', header: 'Operaciones', cell: ({ row }) => h('div', { class: 'flex min-w-40 flex-wrap gap-1.5' }, (row.original.allocations.length ? row.original.allocations.map((a) => a.code) : ['Sin asignar'])
    .map((code) => h('span', { class: 'rounded-md bg-[#eef1f6] px-2 py-0.5 text-xs text-toned' }, code))) },
  { accessorKey: 'amount_sent', header: 'Enviado', meta: { class: right }, cell: ({ row }) => h('span', { class: 'font-semibold' }, usd(row.original.amount_sent)) },
  { accessorKey: 'amount_received', header: 'Recibido USD', meta: { class: right }, cell: ({ row }) => h('span', row.original.amount_received === null ? '—' : usd(row.original.amount_received)) },
  { id: 'credit', header: 'Saldo a favor', meta: { class: right }, cell: ({ row }) => row.original.credit_generated > 0
    ? h('span', { class: 'font-medium text-success' }, usd(row.original.credit_generated))
    : h('span', { class: 'text-muted' }, '—') },
  { accessorKey: 'yuan_amount', header: 'RMB', meta: { class: right }, cell: ({ row }) => h('span', row.original.yuan_amount ? rmb(row.original.yuan_amount) : '—') },
  { accessorKey: 'status', header: 'Estado', cell: ({ row }) => h('div', { class: 'flex min-w-36 flex-col items-start gap-1.5' }, [
    h('button', {
      type: 'button',
      title: 'Gestionar pago',
      class: `flex items-center gap-1 whitespace-nowrap rounded-full py-1 pl-3 pr-2 text-[13px] font-medium transition hover:brightness-95 ${CHINA_STATUS_PILL[row.original.status]}`,
      onClick: () => { selectedId.value = row.original.id }
    }, [CHINA_STATUS_LABEL[row.original.status], h(UIcon, { name: 'i-heroicons-chevron-right', class: 'size-3.5' })]),
    ACTION[row.original.status]
      ? h('button', { type: 'button', class: 'text-xs font-medium text-primary hover:underline', onClick: () => { selectedId.value = row.original.id } }, `${ACTION[row.original.status]} →`)
      : null
  ]) }
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

function onFilter(key: string, value: unknown) {
  const normalized = value && typeof value === 'object' && 'value' in (value as Record<string, unknown>)
    ? (value as Record<string, unknown>).value
    : value
  const next = String(normalized ?? '')
  filters.value = { ...filters.value, [key]: next }
  if (key === 'status') return changeStatus(next || CHINA_STATUS.ALL)
  if (key === 'date_from') from.value = next
  if (key === 'date_to') to.value = next
  emit('range-change', { from: from.value, to: to.value })
  return reload()
}

function onClearFilters() {
  filters.value = { status: CHINA_STATUS.ALL, date_from: '', date_to: '' }
  status.value = CHINA_STATUS.ALL
  from.value = ''
  to.value = ''
  emit('range-change', { from: '', to: '' })
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

onMounted(() => {
  from.value = props.range.from
  to.value = props.range.to
  load()
})
</script>
