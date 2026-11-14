<template>
  <div>
    <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <UCard v-for="card in cards" :key="card.label">
        <p class="text-xs uppercase tracking-wider text-muted">{{ card.label }}</p>
        <USkeleton v-if="loading && !rows.length" class="mt-2 h-8 w-28" />
        <p v-else class="mt-1 text-2xl font-bold" :class="card.danger ? 'text-error' : 'text-highlighted'">{{ card.value }}</p>
        <p v-if="card.sub" class="text-xs text-muted">{{ card.sub }}</p>
      </UCard>
    </div>
    <SupplierPaymentTabs
      class="mb-4"
      :model-value="bucket"
      :items="tabs"
      @update:model-value="changeBucket"
    />
    <DataTable
      class="pp-tabla"
      sticky-last-column
      keep-spanish-headers
      :data="rows"
      :columns="columns"
      :loading="loading"
      :current-page="pagination.current_page"
      :total-pages="pagination.last_page"
      :total-records="pagination.total"
      :items-per-page="pagination.per_page"
      :show-export="false"
      empty-state-message="No hay solicitudes que coincidan."
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    >
      <!-- Maqueta (Pago a proveedores): barra abierta con búsqueda, país, rango de fechas y conteo. -->
      <template #filters>
        <div class="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-default bg-default p-3">
          <UInput
            :model-value="searchText"
            placeholder="Buscar por N° de solicitud, proveedor o WeChat ID"
            icon="i-heroicons-magnifying-glass"
            class="min-w-60 flex-1"
            @update:model-value="onSearchInput"
          />
          <USelect
            :model-value="filters.country"
            :items="countryOptions"
            value-key="value"
            label-key="label"
            aria-label="País"
            class="w-full sm:w-44"
            @update:model-value="(value) => onFilter('country', value)"
          />
          <div class="flex items-center gap-2">
            <UInput type="date" :model-value="filters.date_from" aria-label="Desde" @update:model-value="(value) => onFilter('date_from', value)" />
            <span class="text-xs text-muted">a</span>
            <UInput type="date" :model-value="filters.date_to" aria-label="Hasta" @update:model-value="(value) => onFilter('date_to', value)" />
          </div>
          <span class="whitespace-nowrap text-xs text-muted">{{ rows.length }} de {{ pagination.total }}</span>
        </div>
      </template>
    </DataTable>

    <YuanRequestDrawer
      :request="selected"
      @close="selectedId = null"
      @changed="load"
      @edit="openForm"
    />
    <YuanRequestForm
      :open="formOpen"
      :request="editing"
      :organizations="organizations"
      :suggestions="suggestions"
      @close="formOpen = false"
      @saved="onSaved"
      @organization-created="load"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import YuanRequestDrawer from '~/components/pago-proveedor/YuanRequestDrawer.vue'
import YuanRequestForm from '~/components/pago-proveedor/YuanRequestForm.vue'
import { useSupplierPaymentYuan } from '~/composables/pago-proveedor/useSupplierPaymentYuan'
import { YUAN_STATUS } from '~/constants/supplierPayment'
import type { SupplierPaymentYuanRequest } from '~/types/pago-proveedor'
import { UBadge, UButton } from '#components'

const {
  bucket, search, country, dateFrom, dateTo, rows, countries, organizations, suggestions, pagination, loading,
  selectedId, selected, cards, tabs, load, reload, changeBucket
} = useSupplierPaymentYuan()

const formOpen = ref(false)
const editing = ref<SupplierPaymentYuanRequest | null>(null)
const filters = ref<Record<string, string>>({ country: 'todos', date_from: '', date_to: '' })

const countryOptions = computed(() => [
  { value: 'todos', label: 'Todos los países' },
  ...countries.value.map((item) => ({ value: item, label: item }))
])

const searchText = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput(value: string | number) {
  searchText.value = String(value ?? '')
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => onSearch(searchText.value), 350)
}
onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer) })

function statusColor(status: string): 'primary' | 'error' | 'success' {
  if (status === YUAN_STATUS.PAID) return 'success'
  return status === YUAN_STATUS.OBSERVED ? 'error' : 'primary'
}

/** Socio que envía los dólares: lo manda el back; si falta, la organización o Pro Business. */
function partnerName(row: SupplierPaymentYuanRequest): string {
  return row.partner_name || row.organization || (row.manual ? row.partner : 'Pro Business')
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
  { accessorKey: 'country', header: 'País', cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
    h('span', row.original.country || '—'),
    row.original.organization ? h('span', { class: 'text-xs text-muted' }, row.original.organization) : null
  ]) },
  // #1747: nombre del socio de China (ej. Pro Business) y, debajo, el cliente.
  { accessorKey: 'partner', header: 'Socio', cell: ({ row }) => h('div', { class: 'flex w-32 flex-col whitespace-normal' }, [
    h('span', { class: 'font-semibold' }, partnerName(row.original)),
    row.original.client ? h('span', { class: 'text-xs text-muted' }, row.original.client) : null
  ]) },
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
      h('span', { class: 'truncate text-xs text-muted' }, provider.supplier_name || '—')
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

function onPage(page: number) {
  pagination.value.current_page = page
  load()
}

function onPageSize(size: number) {
  pagination.value.per_page = size
  reload()
}
</script>
