<template>
  <div>
    <div class="mb-4 flex justify-end">
      <UButton color="primary" icon="i-heroicons-plus" @click="openForm(null)">Nueva solicitud</UButton>
    </div>
    <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <UCard v-for="card in cards" :key="card.label">
        <p class="text-xs uppercase tracking-wider text-muted">{{ card.label }}</p>
        <USkeleton v-if="loading && !rows.length" class="mt-2 h-8 w-28" />
        <p v-else class="mt-1 text-2xl font-bold" :class="card.danger ? 'text-error' : 'text-highlighted'">{{ card.value }}</p>
        <p v-if="card.sub" class="text-xs text-muted">{{ card.sub }}</p>
      </UCard>
    </div>
    <div class="mb-4 grid grid-cols-2 overflow-hidden rounded-lg bg-default ring ring-default lg:grid-cols-4">
      <button
        v-for="state in states"
        :key="state.key"
        type="button"
        class="flex flex-col gap-1 border-b-[3px] border-r border-r-default px-5 py-4 text-left transition-colors hover:bg-primary/5"
        :class="bucket === state.key ? 'border-b-primary bg-primary/10' : 'border-b-transparent'"
        @click="changeBucket(state.key)"
      >
        <span class="flex items-center gap-2 text-sm text-toned"><span class="size-2.5 rounded-full" :class="state.dot" />{{ state.label }}</span>
        <span class="text-2xl font-bold text-highlighted">{{ state.count }}</span>
      </button>
    </div>
    <DataTable
      sticky-last-column
      keep-spanish-headers
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
      primary-search-placeholder="Buscar por N° de solicitud, proveedor o WeChat ID"
      :show-filters="true"
      :filter-config="filterConfig"
      :filters-value="filters"
      :show-export="false"
      empty-state-message="No hay solicitudes que coincidan."
      @update:primary-search="onSearch"
      @filter-change="onFilter"
      @clear-filters="onClearFilters"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />

    <YuanRequestDrawer
      :request="selected"
      @close="selectedId = null"
      @changed="load"
      @edit="openForm"
    />
    <YuanRequestForm
      :open="formOpen"
      :request="editing"
      :countries="countries"
      :partners-by-country="partnersByCountry"
      :clients-by-country="clientsByCountry"
      @close="formOpen = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import YuanRequestDrawer from '~/components/pago-proveedor/YuanRequestDrawer.vue'
import YuanRequestForm from '~/components/pago-proveedor/YuanRequestForm.vue'
import { useSupplierPaymentYuan } from '~/composables/pago-proveedor/useSupplierPaymentYuan'
import { YUAN_STATUS } from '~/constants/supplierPayment'
import type { SupplierPaymentYuanRequest } from '~/types/pago-proveedor'
import { UBadge, UButton } from '#components'

const {
  bucket, search, country, dateFrom, dateTo, rows, countries, partnersByCountry, clientsByCountry, pagination, loading,
  selectedId, selected, cards, states, load, reload, changeBucket
} = useSupplierPaymentYuan()

const formOpen = ref(false)
const editing = ref<SupplierPaymentYuanRequest | null>(null)
const filters = ref<Record<string, string>>({ country: 'todos', date_from: '', date_to: '' })

const filterConfig = computed(() => [
  {
    key: 'country',
    label: 'País',
    type: 'select',
    placeholder: 'País',
    options: [
      { value: 'todos', label: 'Todos los países' },
      ...countries.value.map((item) => ({ value: item, label: item }))
    ]
  },
  { key: 'date_from', label: 'Desde', type: 'date', placeholder: 'Desde' },
  { key: 'date_to', label: 'Hasta', type: 'date', placeholder: 'Hasta' }
])

function statusColor(status: string): 'primary' | 'error' | 'success' {
  if (status === YUAN_STATUS.PAID) return 'success'
  return status === YUAN_STATUS.OBSERVED ? 'error' : 'primary'
}

function differenceText(row: SupplierPaymentYuanRequest): string {
  if (!row.incomes.length) return ''
  if (row.difference_status === 'collect') return 'Por cobrar al socio'
  if (row.difference_status === 'missing') return 'Falta recibir'
  return row.difference_status === 'favor' ? 'A favor del socio' : ''
}

function differenceColor(row: SupplierPaymentYuanRequest): string {
  if (!row.incomes.length || !row.difference) return 'text-highlighted'
  return row.difference < 0 ? 'text-error' : 'text-success'
}

const stacked = (top: string, bottom: string, topClass = '') => h('div', { class: 'flex flex-col items-end text-right' }, [
  h('span', { class: topClass }, top),
  bottom ? h('span', { class: 'text-xs text-muted' }, bottom) : null
])

const columns: TableColumn<SupplierPaymentYuanRequest>[] = [
  { accessorKey: 'number', header: 'N.', cell: ({ row }) => h('span', { class: 'text-muted' }, String(row.original.number ?? '')) },
  { accessorKey: 'date', header: 'Fecha', cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
    h('span', dayLabel(row.original.date)),
    h('span', { class: 'text-xs text-muted' }, monthLabel(row.original.date))
  ]) },
  { accessorKey: 'country', header: 'País' },
  { accessorKey: 'partner', header: 'Cliente', cell: ({ row }) => h('span', { class: 'font-semibold' }, row.original.partner) },
  { accessorKey: 'code', header: 'N. orden', cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
    h('span', { class: 'text-sm font-bold' }, row.original.code),
    h('span', { class: 'text-xs text-muted whitespace-nowrap' }, `${row.original.provider_count} ${row.original.provider_count === 1 ? 'proveedor' : 'proveedores'}`)
  ]) },
  { id: 'providers', header: 'Proveedores', cell: ({ row }) => h('div', { class: 'flex min-w-60 flex-col' }, row.original.providers.map((provider) => h('div', {
    key: provider.provider_id,
    class: 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 border-t border-dashed border-default py-1.5'
  }, [
    h('div', { class: 'flex min-w-0 flex-col' }, [
      h('span', { class: 'font-bold' }, provider.supplier_code || 'Sin código'),
      h('span', { class: 'truncate text-xs text-muted' }, provider.client || '—')
    ]),
    h('div', { class: 'flex flex-col items-end gap-0.5' }, [
      h(UBadge, { color: statusColor(provider.status), variant: 'soft', label: provider.status_label }),
      h('span', { class: 'text-xs text-toned whitespace-nowrap' }, rmb(provider.yuan_amount))
    ])
  ]))) },
  { accessorKey: 'usd_total', header: 'Monto USD', cell: ({ row }) => stacked(usd(row.original.usd_total), `${rmb(row.original.yuan_total)} · TC ${row.original.exchange_rate}`, 'font-semibold') },
  { accessorKey: 'usd_received', header: 'Recibido USD', cell: ({ row }) => stacked(row.original.usd_received ? usd(row.original.usd_received) : '—', '') },
  { accessorKey: 'yuan_obtained', header: 'Cambiado RMB', cell: ({ row }) => stacked(
    row.original.yuan_obtained ? rmb(row.original.yuan_obtained) : '—',
    row.original.income_rates.length ? `TC ${row.original.income_rates.join(' / ')}` : ''
  ) },
  { accessorKey: 'yuan_paid', header: 'Pagado RMB', cell: ({ row }) => stacked(row.original.yuan_paid ? rmb(row.original.yuan_paid) : '—', '') },
  { accessorKey: 'difference', header: 'Diferencia RMB', cell: ({ row }) => {
    if (!row.original.incomes.length) return stacked('—', '')
    const color = differenceColor(row.original)
    return h('div', { class: `flex flex-col items-end text-right ${color}` }, [
      h('span', { class: 'font-semibold' }, `${row.original.difference < 0 ? '−' : ''}${rmb(Math.abs(row.original.difference))}`),
      h('span', { class: 'text-xs' }, differenceText(row.original))
    ])
  } },
  { id: 'progress', header: 'Avance', cell: ({ row }) => h('div', { class: 'flex flex-col items-start gap-1' }, [
    h(UButton, {
      size: 'sm',
      color: 'primary',
      variant: 'outline',
      trailingIcon: 'i-heroicons-chevron-right',
      onClick: () => { selectedId.value = row.original.request_id }
    }, () => 'Gestionar'),
    h('span', { class: 'text-xs text-muted whitespace-nowrap' }, `${row.original.paid_count} de ${row.original.provider_count} ${row.original.provider_count === 1 ? 'pagado' : 'pagados'}`)
  ]) }
]

function openForm(request: SupplierPaymentYuanRequest | null) {
  editing.value = request
  formOpen.value = true
}

function onSaved() {
  formOpen.value = false
  load()
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
  if (key === 'country') country.value = next === 'todos' ? '' : next
  if (key === 'date_from') dateFrom.value = next
  if (key === 'date_to') dateTo.value = next
  reload()
}

function onClearFilters() {
  filters.value = { country: 'todos', date_from: '', date_to: '' }
  country.value = ''
  dateFrom.value = ''
  dateTo.value = ''
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
</script>
