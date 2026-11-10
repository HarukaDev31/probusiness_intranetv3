<template>
  <div>
    <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <UCard v-for="card in cards" :key="card.label" variant="subtle">
        <p class="text-xs uppercase tracking-wider text-muted">{{ card.label }}</p>
        <USkeleton v-if="loading && !invoices.length" class="mt-2 h-8 w-28" />
        <p v-else class="mt-1 text-2xl font-bold" :class="card.tone || 'text-highlighted'">{{ card.value }}</p>
        <p v-if="card.sub" class="text-xs text-muted">{{ card.sub }}</p>
      </UCard>
    </div>

    <SupplierPaymentTabs v-model="tab" :items="tabs" class="mb-4" />

    <template v-if="tab === PARTNER_TAB.INVOICES">
      <div class="mb-3 flex flex-wrap items-center gap-3 rounded-2xl bg-default p-3 ring ring-default">
        <div class="inline-flex rounded-lg bg-elevated p-1">
          <button
            v-for="item in filters"
            :key="item.key"
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            :class="filter === item.key ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-highlighted'"
            @click="changeFilter(item.key)"
          >
            {{ item.label }}
          </button>
        </div>
        <span class="flex items-center gap-1.5 text-xs text-muted"><span class="size-2 rounded-full bg-success" />Pago confirmado</span>
        <span class="flex items-center gap-1.5 text-xs text-muted"><span class="size-2 rounded-full bg-neutral" />Enviado, por confirmar</span>
        <UButton v-if="selectedIds.length" class="ml-auto" color="primary" icon="i-heroicons-banknotes" @click="openPayment(null)">
          Pagar seleccionadas ({{ selectedIds.length }} · {{ usd(selectedTotal) }})
        </UButton>
      </div>
      <DataTable
        sticky-last-column
        keep-spanish-headers
        :data="invoices"
        :columns="invoiceColumns"
        :loading="loading"
        :current-page="invoicePagination.current_page"
        :total-pages="invoicePagination.last_page"
        :total-records="invoicePagination.total"
        :items-per-page="invoicePagination.per_page"
        :show-primary-search="false"
        :show-filters="false"
        :show-export="false"
        empty-state-message="No tienes facturas en este filtro."
        @page-change="onInvoicePage"
        @items-per-page-change="onInvoicePageSize"
      />
    </template>

    <DataTable
      v-else
      sticky-last-column
      keep-spanish-headers
      :data="payments"
      :columns="paymentColumns"
      :loading="loading"
      :current-page="paymentPagination.current_page"
      :total-pages="paymentPagination.last_page"
      :total-records="paymentPagination.total"
      :items-per-page="paymentPagination.per_page"
      :show-primary-search="false"
      :show-filters="false"
      :show-export="false"
      empty-state-message="Aún no registraste pagos."
      @page-change="onPaymentPage"
      @items-per-page-change="onPaymentPageSize"
    />

    <UCollapsible class="mt-4">
      <button type="button" class="flex w-full items-center gap-3 rounded-2xl bg-default px-5 py-4 text-left ring ring-default">
        <UIcon name="i-heroicons-building-library" class="size-5 text-primary" />
        <span class="flex-1 font-semibold text-highlighted">Nuestra cuenta bancaria en China</span>
        <span class="flex items-center gap-1 text-sm text-muted">Ver datos para transferir <UIcon name="i-heroicons-chevron-down" class="size-4" /></span>
      </button>
      <template #content>
        <ChinaBankAccountCard class="mt-2" />
      </template>
    </UCollapsible>

    <ChinaPaymentForm
      :open="paymentOpen"
      mode="partner"
      :payment="editingPayment"
      :preselected-ids="paymentPreselect"
      @close="paymentOpen = false"
      @saved="onPaymentSaved"
    />
    <ChinaDocumentsModal :target="documentTarget" @close="documentTarget = null" />
    <VoucherViewerModal :open="!!viewer" :url="viewer?.url || null" :name="viewer?.name" @close="viewer = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import ChinaBankAccountCard from '~/components/china-billing/ChinaBankAccountCard.vue'
import ChinaDocumentsModal from '~/components/china-billing/ChinaDocumentsModal.vue'
import ChinaPaymentForm from '~/components/china-billing/ChinaPaymentForm.vue'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import {
  CHINA_STATUS, CHINA_STATUS_COLOR, CHINA_STATUS_LABEL, PARTNER_STATUS_COLOR, PARTNER_STATUS_LABEL, PARTNER_TAB
} from '~/constants/chinaBilling'
import { usePartnerBilling } from '~/composables/china-billing/usePartnerBilling'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaDocumentTarget, ChinaOperation, ChinaPayment } from '~/types/china-billing'
import { UBadge, UButton, UCheckbox } from '#components'

const {
  filter, invoices, payments, invoicePagination, paymentPagination, loading, cards, filters,
  loadInvoices, loadPayments, loadAll, changeFilter
} = usePartnerBilling()
const { showConfirmation, showError } = useModal()

const tab = ref<string>(PARTNER_TAB.INVOICES)
const tabs = computed(() => [
  { label: 'Facturas', value: PARTNER_TAB.INVOICES, count: invoicePagination.value.total },
  { label: 'Mis pagos', value: PARTNER_TAB.PAYMENTS, count: paymentPagination.value.total }
])

const selectedIds = ref<number[]>([])
const paymentOpen = ref(false)
const editingPayment = ref<ChinaPayment | null>(null)
const paymentPreselect = ref<number[]>([])
const documentTarget = ref<ChinaDocumentTarget | null>(null)
const viewer = ref<{ url: string; name?: string | null } | null>(null)

/** Solo para mostrar «Pagar seleccionadas (N · $X)»: suma de los saldos que el backend ya calculó. */
const selectedTotal = computed(() => invoices.value
  .filter((invoice) => selectedIds.value.includes(invoice.id!))
  .reduce((sum, invoice) => sum + (invoice.pending || 0), 0))

function toggle(row: ChinaOperation, value: boolean) {
  selectedIds.value = value ? [...selectedIds.value, row.id!] : selectedIds.value.filter((id) => id !== row.id)
}

/** «04/10/26», como en la maqueta. */
function shortDate(date: string | null | undefined): string {
  const [year, month, day] = (date || '').split('-')
  return year ? `${day}/${month}/${year.slice(2)}` : '—'
}

function differenceCell(row: ChinaOperation) {
  if (row.transferred_to_code) return h('span', { class: 'text-xs text-muted' }, `Trasladada a ${row.transferred_to_code}`)
  if (!row.difference) return h('span', { class: 'text-muted' }, '—')
  return row.difference > 0
    ? h('span', { class: 'font-semibold text-error' }, `−${usd(row.difference)}`)
    : h('span', { class: 'font-semibold text-success' }, `+${usd(Math.abs(row.difference))} a favor`)
}

const invoiceColumns: TableColumn<ChinaOperation>[] = [
  { id: 'select', header: '', cell: ({ row }) => h(UCheckbox, {
    modelValue: selectedIds.value.includes(row.original.id!),
    disabled: (row.original.pending || 0) <= 0,
    'onUpdate:modelValue': (value: boolean | 'indeterminate') => toggle(row.original, value === true)
  }) },
  { accessorKey: 'code', header: 'N. OP', cell: ({ row }) => h('span', { class: 'font-bold' }, row.original.code) },
  { accessorKey: 'issued_on', header: 'Fecha', cell: ({ row }) => h('span', { class: 'whitespace-nowrap' }, shortDate(row.original.issued_on)) },
  { accessorKey: 'description', header: 'Consolidado', cell: ({ row }) => h('div', { class: 'flex min-w-44 flex-col' }, [
    h('span', { class: 'font-semibold' }, row.original.description),
    h('span', { class: 'text-xs text-muted' }, `${row.original.service_name} · ${row.original.organization.country || '—'}`)
  ]) },
  { id: 'cbm', header: 'CBM', cell: ({ row }) => h('span', row.original.cbm ? String(row.original.cbm) : '—') },
  { accessorKey: 'total', header: 'Monto', cell: ({ row }) => h('span', { class: 'font-semibold' }, usd(row.original.total)) },
  { accessorKey: 'confirmed', header: 'Pagado', cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
    h('span', { class: row.original.confirmed ? 'font-semibold text-success' : 'text-muted' }, row.original.confirmed ? usd(row.original.confirmed) : '—'),
    row.original.in_confirmation ? h('span', { class: 'text-xs text-muted' }, usd(row.original.in_confirmation)) : null
  ]) },
  { id: 'difference', header: 'Diferencia USD', cell: ({ row }) => differenceCell(row.original) },
  { accessorKey: 'balance_due', header: 'Saldo', cell: ({ row }) => (row.original.balance_due || 0) > 0
    ? h('span', { class: 'font-semibold text-error' }, usd(row.original.balance_due))
    : h('span', { class: 'text-muted' }, '—') },
  { id: 'status', header: 'Estado', cell: ({ row }) => h(UBadge, {
    color: PARTNER_STATUS_COLOR[row.original.partner_status || 'pending'], variant: 'soft', label: PARTNER_STATUS_LABEL[row.original.partner_status || 'pending']
  }) },
  { id: 'actions', header: '', cell: ({ row }) => h('div', { class: 'flex gap-1' }, [
    h(UButton, { size: 'sm', color: 'neutral', variant: 'outline', icon: 'i-heroicons-eye', 'aria-label': 'Ver factura', onClick: () => { documentTarget.value = { kind: 'invoice', mode: 'partner', title: `Factura ${row.original.code}`, operationId: row.original.id! } } }),
    (row.original.pending || 0) > 0
      ? h(UButton, { size: 'sm', color: 'primary', variant: 'soft', onClick: () => openPayment(row.original.id) }, () => 'Pagar')
      : null
  ]) }
]

const paymentColumns: TableColumn<ChinaPayment>[] = [
  { accessorKey: 'paid_on', header: 'Fecha', cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
    h('span', { class: 'font-semibold' }, row.original.code),
    h('span', { class: 'text-xs text-muted' }, shortDate(row.original.paid_on))
  ]) },
  { id: 'invoices', header: 'Facturas aplicadas', cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.allocations.map((a) => a.code).join(', ') || '—') },
  { accessorKey: 'amount_sent', header: 'Enviado', cell: ({ row }) => h('span', { class: 'font-semibold' }, usd(row.original.amount_sent)) },
  { accessorKey: 'amount_received', header: 'Recibido por Pro Business', cell: ({ row }) => h('span', row.original.amount_received === null ? '—' : usd(row.original.amount_received)) },
  { id: 'difference', header: 'Diferencia', cell: ({ row }) => {
    if (row.original.shortfall > 0) return h('span', { class: 'text-error' }, `Llegaron ${usd(row.original.shortfall)} menos`)
    return h('span', { class: 'text-success' }, row.original.credit_generated > 0 ? `${usd(row.original.credit_generated)} a favor` : '—')
  } },
  { id: 'receipt', header: 'Comprobante', cell: ({ row }) => row.original.receipt_url
    ? h(UButton, { size: 'xs', color: 'neutral', variant: 'link', onClick: () => { viewer.value = { url: row.original.receipt_url!, name: row.original.receipt_name } } }, () => 'Ver')
    : h('span', { class: 'text-muted' }, '—') },
  { id: 'status', header: 'Estado', cell: ({ row }) => h(UBadge, {
    color: CHINA_STATUS_COLOR[row.original.status === CHINA_STATUS.TO_CONFIRM ? CHINA_STATUS.TO_CONFIRM : CHINA_STATUS.CONFIRMED],
    variant: 'soft',
    label: row.original.status === CHINA_STATUS.TO_CONFIRM ? CHINA_STATUS_LABEL[CHINA_STATUS.TO_CONFIRM] : CHINA_STATUS_LABEL[CHINA_STATUS.CONFIRMED]
  }) },
  { id: 'actions', header: '', cell: ({ row }) => row.original.status === CHINA_STATUS.TO_CONFIRM
    ? h('div', { class: 'flex gap-1' }, [
      h(UButton, { size: 'sm', color: 'neutral', variant: 'outline', icon: 'i-heroicons-pencil-square', 'aria-label': 'Editar', onClick: () => openPayment(null, false, row.original) }),
      h(UButton, { size: 'sm', color: 'error', variant: 'ghost', icon: 'i-heroicons-trash', 'aria-label': 'Anular', onClick: () => cancelPayment(row.original) })
    ])
    : null }
]

/** Pagar una factura, las seleccionadas, o registrar un pago libre. */
function openPayment(invoiceId: number | null, free = false, payment: ChinaPayment | null = null) {
  editingPayment.value = payment
  paymentPreselect.value = payment || free ? [] : invoiceId ? [invoiceId] : selectedIds.value
  paymentOpen.value = true
}

function cancelPayment(payment: ChinaPayment) {
  showConfirmation('Anular pago', `¿Anular el pago ${payment.code}? Podrás registrarlo de nuevo.`, async () => {
    try {
      await ChinaBillingService.partnerDeletePayment(payment.id)
      loadAll()
    } catch (error: any) {
      showError('Pagos', error?.message || 'No se pudo anular el pago.')
    }
  })
}

function openBalance() {
  documentTarget.value = { kind: 'balance', mode: 'partner', title: 'Descargar balance' }
}

function onPaymentSaved() {
  paymentOpen.value = false
  selectedIds.value = []
  loadAll()
}

function onInvoicePage(page: number) {
  invoicePagination.value.current_page = page
  loadInvoices()
}

function onInvoicePageSize(size: number) {
  invoicePagination.value.per_page = size
  invoicePagination.value.current_page = 1
  loadInvoices()
}

function onPaymentPage(page: number) {
  paymentPagination.value.current_page = page
  loadPayments()
}

function onPaymentPageSize(size: number) {
  paymentPagination.value.per_page = size
  paymentPagination.value.current_page = 1
  loadPayments()
}

/** Acciones del encabezado de la página (Descargar balance, Registrar pago). */
defineExpose({
  openBalance,
  openFreePayment: () => openPayment(null, true)
})

onMounted(loadAll)
</script>
