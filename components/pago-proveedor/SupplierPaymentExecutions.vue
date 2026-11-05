<template>
  <div>
    <UTabs
      :model-value="bucket"
      :items="executionTabs"
      color="neutral"
      size="sm"
      variant="pill"
      class="mb-3 w-fit"
      @update:model-value="(value) => changeBucket(String(value) as typeof EXECUTION_BUCKET[keyof typeof EXECUTION_BUCKET])"
    />

    <div v-if="bucket === EXECUTION_BUCKET.PAID" class="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <UCard v-for="card in cards" :key="card.label" variant="subtle">
        <p class="text-[11px] font-bold uppercase tracking-wider text-muted">{{ card.label }}</p>
        <p class="mt-1 text-xl font-bold text-highlighted" :class="card.className">{{ card.value }}</p>
        <p v-if="card.hint" class="mt-1 text-[11px] text-muted">{{ card.hint }}</p>
      </UCard>
    </div>

    <DataTable
      sticky-last-column
      title="Pagos en dólares"
      subtitle="Listos para transferir al proveedor."
      icon="i-heroicons-banknotes"
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
      :show-filters="true"
      :filter-config="filterConfig"
      :filters-value="filters"
      :show-export="false"
      empty-state-message="No hay pagos en dólares en esta bandeja."
      @update:primary-search="onSearch"
      @filter-change="onFilter"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />
    <p class="mt-2 text-xs text-muted">
      {{ bucket === EXECUTION_BUCKET.PENDING
        ? 'En proceso: listos para transferir al proveedor cuando los datos y la aprobación estén OK.'
        : 'Pagados: resumen de comisiones y ganancia según el rango de fechas.' }}
    </p>

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
const filters = ref({ paid_from: '', paid_to: '', consolidado: 'todos', estado: 'todos', banco: 'todos' })
const totals = ref<SupplierPaymentExecutionTotals>({
  count: 0,
  cargo: 0,
  charged_bank_fee: 0,
  real_bank_fee: 0,
  bank_difference: 0,
  admin_fee: 0,
  profit: 0
})

const filterConfig = computed(() => {
  const base = [
    {
      key: 'consolidado',
      label: 'Consolidado',
      type: 'select',
      placeholder: 'Consolidado',
      options: [
        { value: 'todos', label: 'Todos' },
        ...[...new Set(rows.value.map((row) => row.consolidation).filter((value): value is string => !!value))].sort()
          .map((item) => ({ value: item, label: item }))
      ]
    },
    {
      key: 'banco',
      label: 'Banco',
      type: 'select',
      placeholder: 'Banco',
      options: [
        { value: 'todos', label: 'Todos' },
        { value: 'bcp', label: 'BCP' },
        { value: 'interbank', label: 'Interbank' }
      ]
    }
  ]
  if (bucket.value === EXECUTION_BUCKET.PENDING) {
    return [
      ...base,
      {
        key: 'estado',
        label: 'Estado',
        type: 'select',
        placeholder: 'Estado',
        options: [
          { value: 'todos', label: 'Todos' },
          { value: 'pendiente', label: 'Pendiente' }
        ]
      }
    ]
  }
  return [
    ...base,
    { key: 'paid_from', label: 'Pagado el (desde)', type: 'date', placeholder: 'Desde', options: [] },
    { key: 'paid_to', label: 'Pagado el (hasta)', type: 'date', placeholder: 'Hasta', options: [] }
  ]
})

function money(value: number) {
  const sign = value > 0.004 ? '+' : ''
  return `${sign}$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const cards = computed(() => [
  { label: 'Pagos realizados', value: String(totals.value.count), hint: 'En el rango filtrado', className: '' },
  { label: 'Pagado a proveedores', value: money(totals.value.cargo).replace('+', ''), hint: 'Suma del valor de carga ejecutado', className: '' },
  { label: 'Comisión bancaria cobrada', value: money(totals.value.charged_bank_fee).replace('+', ''), hint: 'Lo cobrado al cliente', className: '' },
  { label: 'Comisión bancaria ejecutada', value: money(totals.value.real_bank_fee).replace('+', ''), hint: 'Costo real del banco', className: '' },
  { label: 'Diferencia bancaria', value: money(totals.value.bank_difference), hint: 'Cobrada − real', className: tone(totals.value.bank_difference) },
  { label: 'Comisión administrativa', value: money(totals.value.admin_fee).replace('+', ''), hint: 'Tarifa administrativa cobrada', className: '' },
  { label: 'Ganancia total de Pro Business', value: money(totals.value.profit), hint: 'Diferencia bancaria + administrativa', className: tone(totals.value.profit) }
])

function tone(value: number) {
  if (value > 0.004) return 'text-success'
  if (value < -0.004) return 'text-error'
  return ''
}

const executionTabs = computed(() => [
  { label: pendingCount.value ? `En proceso (${pendingCount.value})` : 'En proceso', value: EXECUTION_BUCKET.PENDING },
  { label: 'Pagados', value: EXECUTION_BUCKET.PAID }
])

const columns = computed<TableColumn<SupplierPaymentExecution>[]>(() => [
  { accessorKey: 'order_number', header: 'N.° de orden' },
  { accessorKey: 'client_name', header: 'Cliente' },
  { accessorKey: 'consolidation', header: 'Consolidado' },
  { accessorKey: 'supplier_code', header: 'Proveedor', cell: ({ row }) => h('div', [
    h('div', { class: 'font-semibold' }, row.original.supplier_code || '—'),
    h('div', { class: 'text-xs text-muted' }, row.original.supplier_name || '')
  ]) },
  { accessorKey: 'request_code', header: 'Código de solicitud', cell: ({ row }) => row.original.request_code || '—' },
  {
    accessorKey: 'payment_type',
    header: 'Tipo de pago',
    cell: ({ row }) => h('div', [
      h('div', row.original.currency === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T'),
      row.original.installment_label
        ? h('div', { class: 'text-[11px] text-muted' }, row.original.installment_label)
        : null
    ])
  },
  {
    accessorKey: 'cargo_amount',
    header: bucket.value === EXECUTION_BUCKET.PAID ? 'Importe pagado al proveedor' : 'Importe a pagar al proveedor',
    cell: ({ row }) => `$${Number(row.original.cargo_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  },
  { accessorKey: 'status_label', header: 'Estado', cell: ({ row }) => h('span', { class: row.original.status === EXECUTION_STATUS.PAID ? 'font-semibold text-success' : 'font-semibold text-error' }, row.original.status_label) },
  ...(bucket.value === EXECUTION_BUCKET.PENDING
    ? [
        { accessorKey: 'observation', header: 'Observaciones', cell: ({ row }: { row: { original: SupplierPaymentExecution } }) => row.original.observation || '—' }
      ]
    : [
        {
          accessorKey: 'executed_on',
          header: 'Pagado el',
          cell: ({ row }: { row: { original: SupplierPaymentExecution } }) => row.original.executed_on
            ? new Date(row.original.executed_on).toLocaleDateString('es-PE')
            : '—'
        },
        { accessorKey: 'profit', header: 'Ganancia', cell: ({ row }: { row: { original: SupplierPaymentExecution } }) => row.original.profit === null ? '—' : money(row.original.profit) }
      ]) as TableColumn<SupplierPaymentExecution>[],
  { accessorKey: 'provider_id', header: 'Acciones', cell: ({ row }) => h(UButton, { size: 'xs', color: 'primary', variant: 'soft', onClick: () => { selected.value = row.original } }, () => 'Ver') }
])

async function load() {
  loading.value = true
  try {
    const response = await PagoProveedorService.listExecutions({
      bucket: bucket.value,
      search: search.value,
      paid_from: filters.value.paid_from,
      paid_to: filters.value.paid_to,
      banco: filters.value.banco,
      consolidado: filters.value.consolidado,
      page: pagination.value.current_page,
      per_page: pagination.value.per_page
    })
    rows.value = response.data || []
    pagination.value = response.pagination
    pendingCount.value = response.pending_count || 0
    if (response.totals) totals.value = response.totals
  } catch (error: any) {
    showError('Pagos en dólares', error?.data?.message || error?.message || 'No se pudieron cargar los pagos.')
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
