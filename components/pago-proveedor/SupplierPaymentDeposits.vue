<template>
  <div>
    <div v-if="overdueCount || observedCount" class="mb-3 flex flex-wrap gap-2">
      <UCard v-if="overdueCount" color="error" variant="subtle" :ui="{ body: 'px-3 py-2 sm:px-3 sm:py-2' }">
        <p class="text-sm font-semibold text-error">
          {{ overdueCount }} depósito{{ overdueCount === 1 ? '' : 's' }} con plazo vencido
        </p>
      </UCard>
      <UCard v-if="observedCount" color="warning" variant="subtle" :ui="{ body: 'px-3 py-2 sm:px-3 sm:py-2' }">
        <p class="text-sm font-semibold">
          {{ observedCount }} depósito{{ observedCount === 1 ? '' : 's' }} observado{{ observedCount === 1 ? '' : 's' }}
        </p>
      </UCard>
    </div>
    <DataTable
      sticky-last-column
      title=""
      subtitle=""
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
      primary-search-placeholder="Cliente, N.° de operación, importe o código de solicitud"
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
    <VoucherPreviewModal :deposit="preview" @close="preview = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import DepositReviewModal from '~/components/pago-proveedor/DepositReviewModal.vue'
import VoucherPreviewModal from '~/components/pago-proveedor/VoucherPreviewModal.vue'
import { DEPOSIT_BANK, DEPOSIT_STATUS } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { PagoProveedorPaginacion, SupplierPaymentDeposit, SupplierPaymentObservationReason } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import { slaOverdue, slaText, useSlaCountdown } from '~/composables/pago-proveedor/useSlaCountdown'
import { UButton } from '#components'

const emit = defineEmits<{ 'pending-count': [value: number] }>()
const { showError } = useModal()
// Tick compartido: el plazo se descuenta desde `deadline_at` del backend.
useSlaCountdown()

const rows = ref<SupplierPaymentDeposit[]>([])
const reasons = ref<SupplierPaymentObservationReason[]>([])
const consolidations = ref<string[]>([])
const selected = ref<SupplierPaymentDeposit | null>(null)
const preview = ref<SupplierPaymentDeposit | null>(null)
const loading = ref(false)
const search = ref('')
const pendingCount = ref(0)
const pagination = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const filters = ref({ status: DEPOSIT_STATUS.PENDING, bank: DEPOSIT_BANK.ALL, consolidation: DEPOSIT_STATUS.ALL, paid_from: '', paid_to: '' })

const overdueCount = computed(() => rows.value.filter((row) => slaOverdue(row.sla)).length)
const observedCount = computed(() => rows.value.filter((row) => row.status === DEPOSIT_STATUS.OBSERVED).length)

function isImageUrl(url: string | null) {
  return !!url && /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(url)
}

function money(value: number | null) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function dateTimeText(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
}

/** Detalle del estado tal como en la maqueta: cuándo se validó, importe del banco y ajustes. */
function statusDetail(row: SupplierPaymentDeposit): string[] {
  if (row.status !== DEPOSIT_STATUS.VALIDATED) return []
  const lines: string[] = []
  const bank = row.bank_amount != null ? money(row.bank_amount) : ''
  const recorded = row.recorded_amount != null ? Number(row.recorded_amount) : Number(row.amount)
  const difference = row.bank_amount != null ? Number((Number(row.bank_amount) - recorded).toFixed(2)) : 0
  const delta = Math.abs(difference) >= 0.005 ? ` (${difference > 0 ? '+' : '−'}${money(Math.abs(difference))})` : ''
  const when = dateTimeText(row.verified_at)
  if (when || bank) lines.push([when, bank ? `banco ${bank}` : ''].filter(Boolean).join(' · ') + delta)
  if (row.recorded_amount != null && Math.abs(difference) >= 0.005) lines.push(`Ajustado: Ventas registró ${money(row.recorded_amount)}`)
  if (row.corrected_by_admin) lines.push('Corregido por Administración')
  return lines
}

const filterConfig = computed(() => [
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todos los estados',
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
    placeholder: 'Todos los bancos',
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
    placeholder: 'Todos los consolidados',
    options: [{ value: DEPOSIT_STATUS.ALL, label: 'Todos' }, ...consolidations.value.map((value) => ({ value, label: value }))]
  },
  { key: 'paid_from', label: 'Desde', type: 'date', placeholder: 'Desde', options: [] },
  { key: 'paid_to', label: 'Hasta', type: 'date', placeholder: 'Hasta', options: [] }
])

const columns: TableColumn<SupplierPaymentDeposit>[] = [
  { accessorKey: 'order_number', header: 'N.° de orden' },
  { accessorKey: 'client_name', header: 'Cliente', cell: ({ row }) => h('div', [
    h('div', { class: 'w-32 whitespace-normal font-medium' }, row.original.client_name || '—'),
    h('div', { class: 'text-xs text-muted' }, [row.original.client_document, row.original.client_whatsapp].filter(Boolean).join(' · '))
  ]) },
  { accessorKey: 'consolidation', header: 'Consolidado' },
  { accessorKey: 'providers', header: 'Código de solicitud', cell: ({ row }) => {
    const codes = row.original.providers.map((provider) => provider.request_code).filter(Boolean)
    if (!codes.length) {
      return h('span', {
        class: 'text-xs italic text-muted',
        title: 'Se genera cuando el abono del proveedor está completo y avanza a Validación'
      }, 'Pendiente')
    }
    // Igual que la maqueta: el código lleva a Aprobación de pagos filtrado por esa solicitud.
    return h('div', { class: 'flex flex-col' }, codes.map((code) => h('a', {
      key: code,
      href: `/pago-proveedor/aprobacion-pagos?codigo=${encodeURIComponent(code)}`,
      class: 'font-mono text-xs font-semibold text-primary hover:underline',
      title: 'Ir a Aprobación de pagos'
    }, code)))
  } },
  { accessorKey: 'bank_label', header: 'Banco', cell: ({ row }) => row.original.interbank ? `${row.original.bank_label} · Interbancaria` : row.original.bank_label },
  { accessorKey: 'paid_on', header: 'Fecha', cell: ({ row }) => row.original.paid_on?.slice(0, 10).split('-').reverse().join('/') || '—' },
  { accessorKey: 'operation_number', header: 'N.° de operación' },
  { accessorKey: 'amount', header: 'Importe', cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
    h('span', { class: 'font-semibold' }, `$${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`),
    row.original.purpose === 'exchange_difference'
      ? h('span', { class: 'text-[11px] font-semibold text-primary', title: 'Abono por diferencia de cambio' }, 'Diferencia de cambio')
      : null
  ]) },
  { accessorKey: 'voucher_url', header: 'Comprobante', cell: ({ row }) => row.original.voucher_url
    ? (isImageUrl(row.original.voucher_url)
      ? h('button', {
        type: 'button',
        class: 'block overflow-hidden rounded border border-default',
        title: 'Ver comprobante',
        'aria-label': 'Ver comprobante',
        onClick: () => { preview.value = row.original }
      }, [h('img', {
        src: row.original.voucher_url,
        alt: row.original.voucher_name || 'Comprobante',
        class: 'size-9 object-cover'
      })])
      : h(UButton, {
        size: 'xs',
        color: 'neutral',
        variant: 'ghost',
        icon: 'i-heroicons-document-magnifying-glass',
        title: 'Ver comprobante',
        'aria-label': 'Ver comprobante',
        onClick: () => { preview.value = row.original }
      }))
    : h('span', { class: 'text-sm text-muted' }, '—') },
  { accessorKey: 'status_label', header: 'Estado', cell: ({ row }) => h('div', [
    h('div', {
      class: row.original.status === DEPOSIT_STATUS.VALIDATED
        ? 'font-semibold text-success'
        : row.original.status === DEPOSIT_STATUS.OBSERVED ? 'font-semibold text-error' : 'font-semibold text-error'
    }, row.original.status_label),
    row.original.status === DEPOSIT_STATUS.OBSERVED && row.original.observation_reason
      ? h('div', { class: 'text-xs text-muted' }, row.original.observation_detail || row.original.observation_reason)
      : null,
    ...statusDetail(row.original).map((line, index) => h('div', {
      key: `detail-${index}`,
      class: 'text-xs text-muted'
    }, line)),
    row.original.deadline_text
      ? h('div', {
        class: slaOverdue(row.original.sla) ? 'text-xs font-semibold text-error' : 'text-xs text-muted'
      }, `${slaOverdue(row.original.sla) ? '⏰ ' : ''}${slaText(row.original.sla) || row.original.deadline_text}`)
      : null
  ]) },
  { accessorKey: 'id', header: 'Acciones', cell: ({ row }) => h(UButton, {
    size: 'xs',
    color: 'primary',
    variant: 'ghost',
    icon: 'i-heroicons-eye',
    title: 'Ver comprobante y validar',
    'aria-label': 'Ver comprobante y validar',
    onClick: () => { selected.value = row.original }
  }) }
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
    showError('Depósitos', error?.data?.message || error?.message || 'No se pudieron cargar los depósitos.')
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
