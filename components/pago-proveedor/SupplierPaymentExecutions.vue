<template>
  <div>
    <div class="mb-3 flex gap-1.5 border-b border-gray-200">
      <button
        type="button"
        class="border-b-2 px-3.5 py-2 text-sm font-semibold"
        :class="bucket === EXECUTION_BUCKET.PENDING ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'"
        @click="changeBucket(EXECUTION_BUCKET.PENDING)"
      >
        En proceso <span v-if="pendingCount" class="ml-1 rounded-full bg-primary-500 px-1.5 text-[11px] text-white">{{ pendingCount }}</span>
      </button>
      <button
        type="button"
        class="border-b-2 px-3.5 py-2 text-sm font-semibold"
        :class="bucket === EXECUTION_BUCKET.PAID ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'"
        @click="changeBucket(EXECUTION_BUCKET.PAID)"
      >
        Pagados
      </button>
    </div>

    <div v-if="bucket === EXECUTION_BUCKET.PAID" class="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <article v-for="card in cards" :key="card.label" class="rounded-2xl border border-gray-200 bg-white px-4 py-4">
        <p class="text-[11px] font-bold uppercase tracking-wider text-gray-500">{{ card.label }}</p>
        <p class="mt-1 text-xl font-bold" :class="card.className">{{ card.value }}</p>
      </article>
    </div>

    <DataTable
      title="Pagos en dólares"
      subtitle="Listos para transferir"
      icon="i-heroicons-banknotes"
      :show-title="true"
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
      primary-search-placeholder="Cliente, proveedor, consolidado o código"
      :show-filters="bucket === EXECUTION_BUCKET.PAID"
      :filter-config="filterConfig"
      :filters-value="filters"
      :show-export="false"
      empty-state-message="No hay pagos en dólares en esta bandeja."
      @update:primary-search="onSearch"
      @filter-change="onFilter"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />

    <UsdExecutionModal :payment="selected" @close="selected = null" @saved="load" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import UsdExecutionModal from '~/components/pago-proveedor/UsdExecutionModal.vue'
import { EXECUTION_BUCKET, EXECUTION_STATUS } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { PagoProveedorPaginacion, SupplierPaymentExecution, SupplierPaymentExecutionTotals } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import { UButton } from '#components'

const { showError } = useModal()
const rows = ref<SupplierPaymentExecution[]>([])
const selected = ref<SupplierPaymentExecution | null>(null)
const loading = ref(false)
const search = ref('')
const pendingCount = ref(0)
const bucket = ref<typeof EXECUTION_BUCKET[keyof typeof EXECUTION_BUCKET]>(EXECUTION_BUCKET.PENDING)
const pagination = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const filters = ref({ paid_from: '', paid_to: '' })
const totals = ref<SupplierPaymentExecutionTotals>({
  count: 0,
  cargo: 0,
  charged_bank_fee: 0,
  real_bank_fee: 0,
  bank_difference: 0,
  admin_fee: 0,
  profit: 0
})

const filterConfig = [
  { key: 'paid_from', label: 'Ejecutado desde', type: 'date' },
  { key: 'paid_to', label: 'Ejecutado hasta', type: 'date' }
]

function money(value: number) {
  const sign = value > 0.004 ? '+' : ''
  return `${sign}$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const cards = computed(() => [
  { label: 'Pagos realizados', value: String(totals.value.count), className: '' },
  { label: 'Pagado a proveedores', value: money(totals.value.cargo).replace('+', ''), className: '' },
  { label: 'Comisión cobrada', value: money(totals.value.charged_bank_fee).replace('+', ''), className: '' },
  { label: 'Comisión real', value: money(totals.value.real_bank_fee).replace('+', ''), className: '' },
  { label: 'Diferencia bancaria', value: money(totals.value.bank_difference), className: tone(totals.value.bank_difference) },
  { label: 'Ganancia', value: money(totals.value.profit), className: tone(totals.value.profit) }
])

function tone(value: number) {
  if (value > 0.004) return 'text-green-700'
  if (value < -0.004) return 'text-red-600'
  return ''
}

const columns = computed<TableColumn<SupplierPaymentExecution>[]>(() => [
  { accessorKey: 'order_number', header: 'N.° de orden' },
  { accessorKey: 'client_name', header: 'Cliente' },
  { accessorKey: 'consolidation', header: 'Consolidado' },
  { accessorKey: 'supplier_code', header: 'Proveedor', cell: ({ row }) => h('div', [
    h('div', { class: 'font-semibold' }, row.original.supplier_code || '—'),
    h('div', { class: 'text-xs text-gray-500' }, row.original.supplier_name || '')
  ]) },
  { accessorKey: 'request_code', header: 'Código', cell: ({ row }) => row.original.request_code || '—' },
  { accessorKey: 'cargo_amount', header: 'Importe al proveedor', cell: ({ row }) => `$${Number(row.original.cargo_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
  { accessorKey: 'charged_bank_fee', header: 'Comisión bancaria', cell: ({ row }) => `$${Number(row.original.charged_bank_fee).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
  { accessorKey: 'charged_admin_fee', header: 'Administrativa', cell: ({ row }) => `$${Number(row.original.charged_admin_fee).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
  { accessorKey: 'profit', header: 'Ganancia', cell: ({ row }) => row.original.profit === null ? '—' : money(row.original.profit) },
  { accessorKey: 'status_label', header: 'Estado', cell: ({ row }) => h('div', [
    h('div', { class: row.original.status === EXECUTION_STATUS.PAID ? 'font-semibold text-green-700' : 'font-semibold text-red-600' }, row.original.status_label),
    h('div', { class: 'text-xs text-gray-500' }, row.original.observation)
  ]) },
  { accessorKey: 'provider_id', header: '', cell: ({ row }) => h(UButton, { size: 'xs', color: 'primary', variant: 'soft', onClick: () => { selected.value = row.original } }, () => 'Ver') }
])

async function load() {
  loading.value = true
  try {
    const response = await PagoProveedorService.listExecutions({
      bucket: bucket.value,
      search: search.value,
      paid_from: filters.value.paid_from,
      paid_to: filters.value.paid_to,
      page: pagination.value.current_page,
      per_page: pagination.value.per_page
    })
    rows.value = response.data || []
    pagination.value = response.pagination
    pendingCount.value = response.pending_count || 0
    if (response.totals) totals.value = response.totals
  } catch (error: any) {
    showError('Pagos en dólares', error?.data?.message || 'No se pudieron cargar los pagos.')
  } finally {
    loading.value = false
  }
}

function changeBucket(next: typeof EXECUTION_BUCKET[keyof typeof EXECUTION_BUCKET]) {
  bucket.value = next
  pagination.value.current_page = 1
  load()
}

function onSearch(value: string) {
  search.value = value
  pagination.value.current_page = 1
  load()
}

function onFilter(key: string, value: unknown) {
  const normalized = value && typeof value === 'object' && 'value' in (value as Record<string, unknown>)
    ? (value as Record<string, unknown>).value
    : value
  filters.value = { ...filters.value, [key]: String(normalized ?? '') }
  pagination.value.current_page = 1
  load()
}

function onPage(page: number) {
  pagination.value.current_page = page
  load()
}

function onPageSize(size: number) {
  pagination.value.per_page = size
  pagination.value.current_page = 1
  load()
}

onMounted(load)
</script>
