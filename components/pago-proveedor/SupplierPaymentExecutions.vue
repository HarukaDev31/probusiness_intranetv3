<template>
  <div>
    <SupplierPaymentTabs
      class="mb-3"
      :model-value="bucket"
      :items="executionTabs"
      @update:model-value="(value) => changeBucket(value as typeof EXECUTION_BUCKET[keyof typeof EXECUTION_BUCKET])"
    />

    <!-- Maqueta: el resumen de comisiones solo aparece en "Pagados". En "En proceso" se muestra
         una franja equivalente (misma altura) con lo que falta transferir. -->
    <div v-if="bucket === EXECUTION_BUCKET.PAID" class="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <div
        v-for="card in cards"
        :key="card.label"
        class="flex items-center gap-2.5 rounded-xl border p-3"
        :class="card.highlight ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40' : 'border-default bg-default'"
      >
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full" :class="card.iconClass">
          <UIcon :name="card.icon" class="size-4.5" />
        </span>
        <div class="min-w-0">
          <p class="text-[11px] font-semibold leading-tight text-muted">{{ card.label }}</p>
          <p class="text-lg font-bold leading-tight text-highlighted" :class="card.className">{{ card.value }}</p>
          <p class="text-[11px] leading-tight text-muted">{{ card.hint }}</p>
        </div>
      </div>
    </div>
    <div v-else class="mb-3 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/40">
      <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <UIcon name="i-heroicons-banknotes" class="size-4.5" />
      </span>
      <div class="min-w-0">
        <p class="text-[11px] font-semibold text-muted">Pagos listos para transferir</p>
        <p class="text-lg font-bold leading-tight text-highlighted">{{ pendingCount }}</p>
        <p class="text-[11px] leading-tight text-muted">Al registrar el pago con su constancia pasan a «Pagados».</p>
      </div>
    </div>

    <DataTable
      sticky-last-column
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
      :empty-state-message="emptyMessage"
      @update:primary-search="onSearch"
      @filter-change="onFilter"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />
    <p class="mt-2 text-xs text-muted">
      {{ bucket === EXECUTION_BUCKET.PENDING
        ? 'Pagos en dólares (T-T y tarjeta) que ejecuta Administración. Pendiente: todo está listo, falta transferir. Al registrar el pago con su constancia, pasa a la pestaña Pagados.'
        : 'Pagos en dólares ya ejecutados: quedan completos al registrarlos con su constancia. Arriba, el resumen de comisiones y la ganancia de Pro Business.' }}
    </p>

    <UsdExecutionModal :payment="selected" @close="selected = null" @saved="load" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import UsdExecutionModal from '~/components/pago-proveedor/UsdExecutionModal.vue'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
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
  const amount = Number(value || 0)
  const sign = amount > 0.004 ? '+' : (amount < -0.004 ? '-' : '')
  return `${sign}$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function plainMoney(value: number) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const rangoPagos = computed(() => {
  const { paid_from: desde, paid_to: hasta } = filters.value
  if (desde && hasta) return `del ${desde} al ${hasta}`
  if (desde) return `desde el ${desde}`
  if (hasta) return `hasta el ${hasta}`
  return 'todas las fechas'
})

/** Indicadores de "Pagados": mismos conceptos y textos que la maqueta (`ejResumenHTML`). */
const cards = computed(() => {
  const gris = 'bg-elevated text-muted'
  return [
    { label: 'Pagos realizados', value: String(totals.value.count), hint: `${plainMoney(totals.value.cargo)} pagados a proveedores · ${rangoPagos.value}`, className: '', icon: 'i-heroicons-check-circle', iconClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', highlight: false },
    { label: 'Comisión bancaria cobrada', value: plainMoney(totals.value.charged_bank_fee), hint: 'cobrada al cliente', className: '', icon: 'i-heroicons-arrow-down', iconClass: gris, highlight: false },
    { label: 'Comisión bancaria ejecutada', value: plainMoney(totals.value.real_bank_fee), hint: 'lo que cobró el banco', className: '', icon: 'i-heroicons-arrow-up', iconClass: gris, highlight: false },
    { label: 'Diferencia bancaria', value: money(totals.value.bank_difference), hint: 'cobrada − ejecutada', className: tone(totals.value.bank_difference), icon: 'i-heroicons-minus-circle', iconClass: gris, highlight: false },
    { label: 'Comisión administrativa', value: plainMoney(totals.value.admin_fee), hint: 'ingreso por administración', className: '', icon: 'i-heroicons-briefcase', iconClass: gris, highlight: false },
    { label: 'Ganancia total de Pro Business', value: money(totals.value.profit), hint: 'diferencia bancaria + administrativa', className: tone(totals.value.profit), icon: 'i-heroicons-arrow-trending-up', iconClass: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', highlight: true }
  ]
})

function tone(value: number) {
  if (value > 0.004) return 'text-success'
  if (value < -0.004) return 'text-error'
  return ''
}

const executionTabs = computed(() => [
  { label: 'En proceso', value: EXECUTION_BUCKET.PENDING, count: pendingCount.value },
  { label: 'Pagados', value: EXECUTION_BUCKET.PAID }
])
const emptyMessage = computed(() => {
  if (search.value.trim()) return `No hay pagos con «${search.value.trim()}» en esta bandeja.`
  return bucket.value === EXECUTION_BUCKET.PENDING
    ? 'No hay pagos en dólares por ejecutar.'
    : 'Aún no hay pagos ejecutados en ese período.'
})

const columns = computed<TableColumn<SupplierPaymentExecution>[]>(() => [
  { accessorKey: 'order_number', header: 'N.° de orden', cell: ({ row }) => row.original.order_number ?? '—' },
  { accessorKey: 'client_name', header: 'Cliente', cell: ({ row }) => h('span', { class: 'block w-24 whitespace-normal' }, row.original.client_name || '—') },
  { accessorKey: 'consolidation', header: 'Consolidado', cell: ({ row }) => row.original.consolidation || '—' },
  {
    accessorKey: 'supplier_code',
    header: 'Proveedor',
    cell: ({ row }) => h('div', [
      h('div', { class: 'font-semibold' }, row.original.supplier_code || '—'),
      h('div', { class: 'w-32 whitespace-normal text-xs text-muted' }, [row.original.supplier_name, row.original.product].filter(Boolean).join(' · '))
    ])
  },
  {
    accessorKey: 'request_code',
    header: 'Código de solicitud',
    cell: ({ row }) => row.original.request_code
      ? h('span', { class: 'font-mono text-xs font-semibold' }, row.original.request_code)
      : '—'
  },
  {
    accessorKey: 'payment_type',
    header: 'Tipo de pago',
    cell: ({ row }) => h('div', [
      h('div', row.original.payment_type_label || (row.original.currency === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T')),
      row.original.installment_label
        ? h('div', { class: 'text-[11px] text-muted' }, row.original.installment_label)
        : null
    ])
  },
  {
    accessorKey: 'cargo_amount',
    header: bucket.value === EXECUTION_BUCKET.PAID ? 'Importe pagado al proveedor' : 'Importe a pagar al proveedor',
    cell: ({ row }) => h('span', { class: 'font-semibold' }, plainMoney(row.original.cargo_amount))
  },
  {
    accessorKey: 'status_label',
    header: 'Estado',
    cell: ({ row }) => h('span', {
      class: `inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${row.original.status === EXECUTION_STATUS.PAID ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`
    }, row.original.status_label)
  },
  ...(bucket.value === EXECUTION_BUCKET.PENDING
    ? [
        {
          accessorKey: 'observation',
          header: 'Observaciones',
          cell: ({ row }: { row: { original: SupplierPaymentExecution } }) => {
            const payment = row.original
            const text = payment.bank_ready
              ? payment.observation || 'Listo para transferir'
              : 'Faltan los datos bancarios del proveedor (T-T)'
            return h('span', { class: 'block w-24 whitespace-normal text-sm font-semibold text-error' }, text)
          }
        }
      ]
    : [
        {
          accessorKey: 'executed_on',
          header: 'Pagado el',
          cell: ({ row }: { row: { original: SupplierPaymentExecution } }) => row.original.executed_on
            ? new Date(row.original.executed_on).toLocaleDateString('es-PE')
            : '—'
        },
        {
          accessorKey: 'profit',
          header: 'Ganancia',
          cell: ({ row }: { row: { original: SupplierPaymentExecution } }) => {
            const value = row.original.profit
            if (value === null || value === undefined) return '—'
            const cls = value > 0.004 ? 'text-success' : (value < -0.004 ? 'text-error' : '')
            return h('span', { class: `font-semibold ${cls}` }, money(value))
          }
        }
      ]) as TableColumn<SupplierPaymentExecution>[],
  {
    accessorKey: 'provider_id',
    header: 'Acciones',
    cell: ({ row }) => h(UButton, {
      size: 'xs',
      color: 'primary',
      variant: 'ghost',
      icon: 'i-heroicons-eye',
      title: row.original.can_register ? 'Ver y registrar el pago' : 'Ver',
      'aria-label': 'Ver',
      onClick: () => { selected.value = row.original }
    })
  }
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
  filters.value = { paid_from: '', paid_to: '', consolidado: 'todos', estado: 'todos', banco: 'todos' }
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
