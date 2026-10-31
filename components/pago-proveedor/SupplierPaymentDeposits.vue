<template>
  <div>
    <VerificationTabs
      :model-value="VERIFICATION_TAB"
      :administration="true"
      :pending-count="pendingCount"
      @update:model-value="(tab) => emit('change-tab', tab)"
    />
    <DataTable
      title="Verificación"
      subtitle="Pago a proveedor"
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
      primary-search-placeholder="Cliente, N.° de operación, importe o código"
      :show-filters="true"
      :filter-config="filterConfig"
      :filters-value="filters"
      :show-export="false"
      empty-state-message="No hay depósitos con ese filtro."
      @update:primary-search="onSearch"
      @filter-change="onFilter"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />
    <DepositReviewModal :deposit="selected" :reasons="reasons" @close="selected = null" @saved="load" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import VerificationTabs from '~/components/verificacion/VerificationTabs.vue'
import DepositReviewModal from '~/components/pago-proveedor/DepositReviewModal.vue'
import { DEPOSIT_BANK, DEPOSIT_STATUS, VERIFICATION_TAB } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { PagoProveedorPaginacion, SupplierPaymentDeposit, SupplierPaymentObservationReason } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import { UButton } from '#components'

const emit = defineEmits<{ 'change-tab': [value: string]; 'pending-count': [value: number] }>()
const { showError } = useModal()

const rows = ref<SupplierPaymentDeposit[]>([])
const reasons = ref<SupplierPaymentObservationReason[]>([])
const consolidations = ref<string[]>([])
const selected = ref<SupplierPaymentDeposit | null>(null)
const loading = ref(false)
const search = ref('')
const pendingCount = ref(0)
const pagination = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const filters = ref({ status: DEPOSIT_STATUS.PENDING, bank: DEPOSIT_BANK.ALL, consolidation: DEPOSIT_STATUS.ALL, paid_from: '', paid_to: '' })

const filterConfig = computed(() => [
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    options: [
      { value: DEPOSIT_STATUS.PENDING, label: 'Pendiente' },
      { value: DEPOSIT_STATUS.OBSERVED, label: 'Observado' },
      { value: DEPOSIT_STATUS.VALIDATED, label: 'Validado' },
      { value: DEPOSIT_STATUS.CANCELLED, label: 'Anulado' },
      { value: DEPOSIT_STATUS.ALL, label: 'Todos' }
    ]
  },
  {
    key: 'bank',
    label: 'Banco',
    type: 'select',
    options: [
      { value: DEPOSIT_BANK.ALL, label: 'Todos' },
      { value: DEPOSIT_BANK.BCP, label: 'BCP' },
      { value: DEPOSIT_BANK.INTERBANK, label: 'Interbank' }
    ]
  },
  {
    key: 'consolidation',
    label: 'Consolidado',
    type: 'select',
    options: [{ value: DEPOSIT_STATUS.ALL, label: 'Todos' }, ...consolidations.value.map((value) => ({ value, label: value }))]
  },
  { key: 'paid_from', label: 'Desde', type: 'date', options: [] },
  { key: 'paid_to', label: 'Hasta', type: 'date', options: [] }
])

const columns: TableColumn<SupplierPaymentDeposit>[] = [
  { accessorKey: 'order_number', header: 'N.°' },
  { accessorKey: 'client_name', header: 'Cliente', cell: ({ row }) => h('div', [
    h('div', { class: 'font-medium' }, row.original.client_name || '—'),
    h('div', { class: 'text-xs text-gray-500' }, [row.original.client_document, row.original.client_whatsapp].filter(Boolean).join(' · '))
  ]) },
  { accessorKey: 'consolidation', header: 'Consolidado' },
  { accessorKey: 'providers', header: 'Código', cell: ({ row }) => row.original.providers.map((provider) => provider.request_code || 'Pendiente').join(', ') },
  { accessorKey: 'bank_label', header: 'Banco', cell: ({ row }) => row.original.interbank ? `${row.original.bank_label} · Interbancaria` : row.original.bank_label },
  { accessorKey: 'paid_on', header: 'Fecha' },
  { accessorKey: 'operation_number', header: 'N.° de operación' },
  { accessorKey: 'amount', header: 'Importe', cell: ({ row }) => `$${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
  { accessorKey: 'voucher_url', header: 'Comprobante', cell: ({ row }) => row.original.voucher_url ? h('a', { href: row.original.voucher_url, target: '_blank', class: 'text-primary-600 text-sm' }, 'Ver') : '—' },
  { accessorKey: 'status_label', header: 'Estado', cell: ({ row }) => h('div', [
    h('div', { class: row.original.status === DEPOSIT_STATUS.VALIDATED ? 'font-semibold text-green-700' : 'font-semibold text-red-600' }, row.original.status_label),
    row.original.deadline_text ? h('div', { class: row.original.deadline_overdue ? 'text-xs font-semibold text-red-600' : 'text-xs text-gray-500' }, row.original.deadline_text) : null
  ]) },
  { accessorKey: 'id', header: '', cell: ({ row }) => h(UButton, { size: 'xs', color: 'primary', variant: 'soft', onClick: () => { selected.value = row.original } }, () => 'Ver') }
]

async function load() {
  loading.value = true
  try {
    const response = await PagoProveedorService.listDeposits({
      search: search.value,
      status: filters.value.status,
      bank: filters.value.bank,
      consolidation: filters.value.consolidation === DEPOSIT_STATUS.ALL ? '' : filters.value.consolidation,
      paid_from: filters.value.paid_from,
      paid_to: filters.value.paid_to,
      page: pagination.value.current_page,
      per_page: pagination.value.per_page
    })
    rows.value = response.data || []
    pagination.value = response.pagination
    reasons.value = response.reasons || []
    consolidations.value = response.consolidations || []
    pendingCount.value = response.pending_count || 0
    emit('pending-count', pendingCount.value)
  } catch (error: any) {
    showError('Depósitos', error?.data?.message || 'No se pudieron cargar los depósitos.')
  } finally {
    loading.value = false
  }
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
