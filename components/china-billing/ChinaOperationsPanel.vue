<template>
  <div>
    <div class="mb-4 grid grid-cols-2 overflow-hidden rounded-2xl bg-default shadow-[0_6px_20px_rgba(30,42,59,.06)] lg:grid-cols-6">
      <button
        v-for="state in states"
        :key="state.key"
        type="button"
        class="flex flex-col gap-1.5 border-b-[3px] border-r border-default px-5 py-4 text-left transition-colors hover:bg-elevated"
        :class="status === state.key ? 'border-b-primary bg-primary/10' : 'border-b-transparent'"
        @click="changeStatus(state.key)"
      >
        <span class="flex items-center gap-2 text-[13px] text-toned"><span class="size-2.5 flex-none rounded-full" :class="state.dot" />{{ state.label }}</span>
        <span class="text-[26px] font-bold leading-none text-highlighted">{{ state.count }}</span>
      </button>
    </div>

    <UCollapsible v-model:open="bankCardOpen" class="mb-4 rounded-2xl bg-default ring ring-default">
      <button type="button" class="flex w-full items-center gap-3 px-5 py-4 text-left">
        <UIcon name="i-heroicons-building-library" class="size-5 text-primary" />
        <span class="flex-1 font-semibold text-highlighted">Nuestra cuenta bancaria en China</span>
        <UIcon :name="bankCardOpen ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="size-4 text-muted" />
      </button>
      <template #content>
        <ChinaBankAccountCard class="px-5 pb-5" />
      </template>
    </UCollapsible>

    <DataTable
      sticky-last-column
      keep-spanish-headers
      filters-layout="inline"
      :fill-viewport="false"
      :data="rows"
      :columns="columns"
      :loading="loading"
      :table-meta="tableMeta"
      :current-page="pagination.current_page"
      :total-pages="pagination.last_page"
      :total-records="pagination.total"
      :items-per-page="pagination.per_page"
      :primary-search-value="search"
      :show-primary-search="true"
      :show-primary-search-label="false"
      primary-search-placeholder="Buscar por cliente, N° de orden, servicio o país"
      :show-filters="true"
      :filter-config="filterConfig"
      :filters-value="filters"
      :inline-count-text="`${pagination.total} de ${counts.overall ?? pagination.total}`"
      :show-export="false"
      empty-state-message="No hay operaciones que coincidan con la búsqueda o el filtro."
      @update:primary-search="onSearch"
      @filter-change="onFilter"
      @clear-filters="onClearFilters"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    >
      <template #inline-extra>
        <div v-if="selectedIds.length" class="flex flex-wrap items-center gap-4 border-b border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          <span class="font-semibold text-highlighted">{{ selectedIds.length }} {{ selectedIds.length === 1 ? 'operación seleccionada' : 'operaciones seleccionadas' }}</span>
          <span class="text-toned">{{ selectedOrganizationName }} · Pendiente {{ usd(selectedPending) }}</span>
          <span class="flex-1" />
          <UButton color="neutral" variant="link" @click="selectedIds = []">Limpiar</UButton>
          <UButton color="primary" @click="paymentOpen = true">Registrar pago</UButton>
        </div>
      </template>
    </DataTable>

    <!-- #2024: confirmación de eliminar con el formato de la maqueta. -->
    <UModal
      :open="!!deleting"
      :title="deleting ? `¿Eliminar ${deleting.row.code}?` : ''"
      :description="deleting ? `${deleting.row.service_name} · ${deleting.row.organization.name} · ${usd(deleting.row.total)}` : ''"
      :dismissible="!deleteBusy"
      :ui="{ content: 'w-full max-w-lg sm:max-w-lg', title: 'text-lg font-bold text-highlighted', description: 'text-sm text-toned' }"
      @update:open="(value: boolean) => !value && (deleting = null)"
    >
      <template #body>
        <div v-if="deleting" class="flex flex-col gap-3 text-sm">
          <div v-if="deleting.warnings.length" class="rounded-lg bg-error/10 px-4 py-3 text-error">
            <p v-for="warning in deleting.warnings" :key="warning">{{ warning }}</p>
          </div>
          <p class="text-toned">Esta acción no se puede deshacer.</p>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" :disabled="deleteBusy" @click="deleting = null">Cancelar</UButton>
          <UButton color="error" :loading="deleteBusy" @click="confirmRemove">Eliminar operación</UButton>
        </div>
      </template>
    </UModal>

    <ChinaOperationDrawer
      :operation="selected"
      :credits="credits"
      :operations="rows"
      @close="selectedId = null"
      @changed="refresh"
      @register-payment="(operation) => openPaymentFor(operation)"
      @open-payment="openPaymentDetail"
    />
    <ChinaPaymentDrawer :payment="paymentDetail" @close="paymentDetail = null" @changed="onPaymentChanged" @edit="(payment) => { paymentDetail = null; editingPayment = payment }" />
    <ChinaPaymentForm :open="!!editingPayment" mode="china" :payment="editingPayment" @close="editingPayment = null" @saved="onPaymentEdited" />
    <ChinaOperationForm :open="formOpen" :organizations="organizations" :operation="editing" :draft="draft" @close="formOpen = false" @saved="onSaved" />
    <ChinaPaymentForm
      :open="paymentOpen"
      mode="china"
      :organizations="organizations"
      :locked-organization-id="selectedOrganizationId"
      :preselected-ids="selectedIds"
      @close="paymentOpen = false"
      @saved="onPaymentSaved"
    />
    <ChinaTransferModal :operation="transferring" :mode="transferMode" :siblings="rows" @close="transferring = null" @done="onTransferred" />
    <ChinaBankAccountForm :open="bankOpen" @close="bankOpen = false" @saved="bankOpen = false" />
    <ChinaDocumentsModal :target="documentTarget" @close="documentTarget = null" />

    <UModal
      :open="!!invoiceDownloadTarget"
      :title="invoiceDownloadTarget ? `Factura ${invoiceDownloadTarget.code}` : ''"
      description="¿Realizaste alguna modificación en los datos bancarios, montos o información de la operación?"
      :dismissible="!invoiceAction"
      :ui="{ content: 'w-full max-w-lg sm:max-w-lg', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted', description: 'text-sm text-toned' }"
      @update:open="(value: boolean) => !value && !invoiceAction && closeInvoiceDownload()"
    >
      <template #body>
        <div class="flex flex-col gap-3 text-sm">
          <p class="text-toned">
            Si hiciste cambios, genera una factura nueva con los datos actualizados. Si no hubo modificaciones, descarga la última factura emitida.
          </p>
          <UAlert
            v-if="invoiceActionError"
            color="error"
            variant="subtle"
            icon="i-heroicons-exclamation-triangle"
            :description="invoiceActionError"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex w-full flex-wrap justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-down-tray"
            :loading="invoiceAction === 'current'"
            :disabled="!!invoiceAction"
            @click="downloadCurrentInvoice"
          >
            No, descargar actual
          </UButton>
          <UButton
            color="primary"
            icon="i-heroicons-document-plus"
            :loading="invoiceAction === 'new'"
            :disabled="!!invoiceAction"
            @click="regenerateAndDownloadInvoice"
          >
            Sí, generar nueva
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import ChinaBankAccountCard from '~/components/china-billing/ChinaBankAccountCard.vue'
import ChinaBankAccountForm from '~/components/china-billing/ChinaBankAccountForm.vue'
import ChinaDocumentsModal from '~/components/china-billing/ChinaDocumentsModal.vue'
import ChinaOperationDrawer from '~/components/china-billing/ChinaOperationDrawer.vue'
import ChinaOperationForm from '~/components/china-billing/ChinaOperationForm.vue'
import ChinaPaymentDrawer from '~/components/china-billing/ChinaPaymentDrawer.vue'
import ChinaPaymentForm from '~/components/china-billing/ChinaPaymentForm.vue'
import ChinaTransferModal from '~/components/china-billing/ChinaTransferModal.vue'
import { CHINA_STATUS, CHINA_STATUS_LABEL, CHINA_STATUS_PILL } from '~/constants/chinaBilling'
import { useChinaOperations } from '~/composables/china-billing/useChinaOperations'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaDocumentTarget, ChinaOperation, ChinaPayment } from '~/types/china-billing'
import { formatNombreEmpresa } from '~/utils/formatters'
import { UButton, UCheckbox, UIcon, UTooltip } from '#components'

const props = defineProps<{ range: { from: string; to: string } }>()
const emit = defineEmits<{ changed: []; 'range-change': [range: { from: string; to: string }] }>()

const {
  status, search, from, to, rows, counts, credits, organizations, pagination, loading,
  states, load, reload, changeStatus
} = useChinaOperations()
const { showConfirmation, showError, showWarning } = useModal()

const selectedId = ref<number | null>(null)
// Los borradores "Por aprobar" tienen id null: sin esta guarda el drawer se abría solo con ellos.
const selected = computed(() => (selectedId.value === null ? null : rows.value.find((row) => row.id === selectedId.value) || null))
const selectedIds = ref<number[]>([])
const formOpen = ref(false)
const editing = ref<ChinaOperation | null>(null)
const draft = ref<ChinaOperation | null>(null)
const paymentOpen = ref(false)
const bankOpen = ref(false)
const bankCardOpen = ref(false)
const documentTarget = ref<ChinaDocumentTarget | null>(null)
const invoiceDownloadTarget = ref<ChinaOperation | null>(null)
const invoiceAction = ref<'current' | 'new' | null>(null)
const invoiceActionError = ref('')
const paymentDetail = ref<ChinaPayment | null>(null)
const editingPayment = ref<ChinaPayment | null>(null)
const transferring = ref<ChinaOperation | null>(null)
const transferMode = ref<'difference' | 'credit'>('difference')
const filters = ref<Record<string, string>>({ status: CHINA_STATUS.ALL, date_from: '', date_to: '' })

const selectedRows = computed(() => rows.value.filter((row) => selectedIds.value.includes(row.id as number)))
const selectedOrganizationId = computed(() => selectedRows.value[0]?.organization.id ?? null)
const selectedOrganizationName = computed(() => formatNombreEmpresa(selectedRows.value[0]?.organization.name))
const selectedPending = computed(() => selectedRows.value.reduce((sum, row) => sum + (row.pending || 0), 0))

const filterConfig = computed(() => [
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    placeholder: 'Estado',
    options: [
      { value: CHINA_STATUS.ALL, label: 'Todos los estados' },
      ...[CHINA_STATUS.DRAFT, CHINA_STATUS.PENDING, CHINA_STATUS.TO_CONFIRM, CHINA_STATUS.CONFIRMED, CHINA_STATUS.IN_CASH]
        .map((key) => ({ value: key, label: CHINA_STATUS_LABEL[key] }))
    ]
  },
  { key: 'date_from', label: 'Desde', type: 'date', placeholder: 'Desde', separatorAfter: 'a' },
  { key: 'date_to', label: 'Hasta', type: 'date', placeholder: 'Hasta' }
])

// Los borradores por aprobar se pintan en amarillo, como en la maqueta.
const tableMeta = {
  class: { td: ({ original }: { original: ChinaOperation }) => (original?.is_draft ? '!bg-warning/10' : '') }
}

// La barra de estados y el filtro «Estado» siempre muestran lo mismo.
watch(status, (value) => { filters.value = { ...filters.value, status: value } })

// El rango de fechas es compartido con la pestaña Cobros y con los KPIs del encabezado.
watch(() => props.range, (value) => {
  if (value.from === from.value && value.to === to.value) return
  from.value = value.from
  to.value = value.to
  filters.value = { ...filters.value, date_from: value.from, date_to: value.to }
  reload()
}, { deep: true })

/** Solo se puede seleccionar con saldo pendiente y del mismo cliente que lo ya elegido. */
function canSelect(row: ChinaOperation): boolean {
  if (row.is_draft || (row.pending || 0) <= 0) return false
  return !selectedIds.value.length || row.organization.id === selectedOrganizationId.value
}

function toggle(row: ChinaOperation, value: boolean) {
  selectedIds.value = value ? [...selectedIds.value, row.id!] : selectedIds.value.filter((id) => id !== row.id)
}

const muted = (text = '—') => h('span', { class: 'text-muted' }, text)
const right = { th: 'text-right', td: 'text-right' }

/** Texto bajo el estado: pagos aplicados (PG-####) y saldo a favor, como en la maqueta. */
function paymentsText(row: ChinaOperation): string {
  const codes = (row.payments || []).map((payment) => payment.code)
  const hasCredit = (row.credits || []).length > 0
  if (!codes.length) return hasCredit ? 'Saldo a favor aplicado · falta pago' : ''
  const partial = (row.declared || 0) < (row.total || 0) - 0.005
  return `${partial ? 'Pago parcial · ' : ''}${[...codes, ...(hasCredit ? ['Saldo a favor'] : [])].join(', ')}`
}

function differenceCell(row: ChinaOperation) {
  const received = (row.costs || []).filter((cost) => cost.source_operation_id).map((cost) => cost.name.replace('Diferencia ', ''))
  const favor = (row.difference ?? 0) < 0
  const owed = (row.difference ?? 0) > 0 && !row.transferred
  const moved = row.transferred && row.transferred_amount != null
  const text = moved
    ? usd(row.transferred_amount)
    : row.difference == null || row.difference === undefined
      ? '—'
      : favor ? `+${usd(Math.abs(row.difference))} a favor` : usd(row.difference)
  const tone = moved ? 'text-muted' : favor ? 'text-success' : owed ? 'text-error' : row.transferred ? 'text-muted' : 'text-highlighted'
  return h('div', { class: 'flex min-w-28 flex-col items-end gap-1' }, [
    h('span', { class: `font-medium ${tone}` }, text),
    owed || favor
      ? h('button', { type: 'button', class: 'text-xs font-medium text-primary hover:underline', onClick: () => startTransfer(row, favor ? 'credit' : 'difference') }, 'Trasladar a otra orden')
      : null,
    row.transferred_to_code
      ? h('span', { class: 'text-xs text-muted' }, `Trasladado a ${row.transferred_to_code}`)
      : null,
    row.transferred_to_code
      ? h('button', { type: 'button', class: 'text-xs font-medium text-primary hover:underline', onClick: () => undoTransfer(row) }, 'Deshacer traslado')
      : null,
    received.length ? h('span', { class: 'text-xs text-muted' }, `Incluye diferencia de ${received.join(', ')}`) : null
  ])
}

const iconButton = (icon: string, label: string, onClick: () => void, tone = 'hover:bg-primary/10 hover:text-primary') => h('button', {
  type: 'button',
  title: label,
  'aria-label': label,
  class: `grid size-8 place-items-center rounded-lg text-toned transition-colors ${tone}`,
  onClick
}, h(UIcon, { name: icon, class: 'size-4' }))

function totalWithDetail(operation: ChinaOperation) {
  const service = operation.billing_type === 'cbm'
    ? Number(operation.cbm || 0) * Number(operation.rate || 0)
    : Number(operation.amount || 0)
  const lines: [string, string][] = [[
    operation.billing_type === 'cbm'
      ? `Servicio (${Number(operation.cbm || 0)} CBM × ${usd(operation.rate || 0)})`
      : (operation.service_name || 'Servicio'),
    usd(service)
  ], ['Costo FOB', usd(operation.fob || 0)], ['Flete', usd(operation.freight || 0)]]
  for (const cost of operation.costs || []) lines.push([cost.name || 'Otro', usd(cost.amount)])
  lines.push(['Total', usd(operation.total)])

  return h(UTooltip, {
    ui: { content: 'h-auto max-w-sm bg-inverted px-3 py-2.5 text-inverted' }
  }, {
    default: () => h('span', { class: 'cursor-help font-semibold underline decoration-dotted underline-offset-2' }, usd(operation.total)),
    content: () => h('div', { class: 'min-w-56 space-y-1 text-xs text-inverted' }, lines.map(([label, value], index) => h('div', {
      class: `flex items-center justify-between gap-6 text-inverted ${index === lines.length - 1 ? 'mt-1 border-t border-current/30 pt-1 font-semibold' : ''}`
    }, [h('span', label), h('span', { class: 'font-medium' }, value)])))
  })
}

const columns: TableColumn<ChinaOperation>[] = [
  { id: 'select', header: '', cell: ({ row }) => row.original.is_draft ? null : h(UCheckbox, {
    modelValue: selectedIds.value.includes(row.original.id!),
    disabled: !selectedIds.value.includes(row.original.id!) && !canSelect(row.original),
    'onUpdate:modelValue': (value: boolean | 'indeterminate') => toggle(row.original, value === true)
  }) },
  // «N.» es solo la posición en la lista (la más antigua es 1), no el número de la operación (ese va en «OP-…»).
  { id: 'number', header: 'N.', cell: ({ row }) => row.original.is_draft ? null : h('span', { class: 'text-muted' }, String(Math.max(1, (pagination.value.total || rows.value.length) - ((pagination.value.current_page - 1) * pagination.value.per_page + row.index)))) },
  { accessorKey: 'issued_on', header: 'Fecha', cell: ({ row }) => h('div', { class: 'flex flex-col whitespace-nowrap' }, [
    h('span', dayLabel(row.original.issued_on)),
    h('span', { class: 'text-xs text-muted' }, monthLabel(row.original.issued_on))
  ]) },
  { id: 'country', header: 'País', cell: ({ row }) => h('span', row.original.organization.country || '—') },
  { accessorKey: 'organization', header: 'Cliente', cell: ({ row }) => h('span', { class: 'block w-36 whitespace-normal' }, formatNombreEmpresa(row.original.organization.name)) },
  { accessorKey: 'description', header: 'Servicio', cell: ({ row }) => h('div', { class: 'flex min-w-48 flex-col gap-0.5' }, [
    h('div', { class: 'flex items-center gap-2' }, [
      h('span', { class: 'font-semibold' }, row.original.service_name),
      row.original.code ? h('span', { class: 'rounded-md bg-elevated px-1.5 py-0.5 text-xs text-toned' }, row.original.code) : null
    ]),
    h('span', { class: 'text-xs text-muted' }, row.original.is_draft ? `${row.original.description} · ${row.original.cbm} CBM` : row.original.description),
    row.original.is_draft ? null : h(UButton, {
      size: 'xs', color: 'primary', variant: 'link', icon: 'i-heroicons-arrow-down-tray', class: 'self-start px-0',
      onClick: () => openInvoiceDownload(row.original)
    }, () => 'Descargar factura')
  ]) },
  { accessorKey: 'total', header: 'Monto total', meta: { class: right }, cell: ({ row }) => row.original.is_draft ? muted('') : totalWithDetail(row.original) },
  { accessorKey: 'received', header: 'Recibido USD', meta: { class: right }, cell: ({ row }) => row.original.is_draft ? muted('') : h('span', row.original.received ? usd(row.original.received) : '—') },
  { id: 'difference', header: 'Diferencia USD', meta: { class: right }, cell: ({ row }) => row.original.is_draft ? muted('') : differenceCell(row.original) },
  { accessorKey: 'received_rmb', header: 'Recibido RMB', meta: { class: right }, cell: ({ row }) => row.original.is_draft ? muted('') : h('span', row.original.received_rmb ? rmb(row.original.received_rmb) : '—') },
  { accessorKey: 'status', header: 'Estado', cell: ({ row }) => h('div', { class: 'flex min-w-32 flex-col items-start gap-1.5' }, [
    h('button', {
      type: 'button',
      title: row.original.is_draft ? 'Revisar y aprobar' : 'Ver pagos de la operación',
      class: `flex items-center gap-1 whitespace-nowrap rounded-full py-1 pl-3 pr-2 text-[13px] font-medium transition hover:brightness-95 ${CHINA_STATUS_PILL[row.original.status]}`,
      onClick: () => (row.original.is_draft ? openForm(null, row.original) : (selectedId.value = row.original.id))
    }, [CHINA_STATUS_LABEL[row.original.status], h(UIcon, { name: 'i-heroicons-chevron-right', class: 'size-3.5' })]),
    h('span', { class: 'max-w-44 text-xs text-muted' }, row.original.is_draft ? 'Cerrado por Almacén China' : paymentsText(row.original))
  ]) },
  { id: 'actions', header: '', cell: ({ row }) => h('div', { class: 'flex gap-1' }, [
    row.original.is_draft ? null : iconButton('i-heroicons-document-text', 'Ver facturas', () => openInvoiceHistory(row.original)),
    iconButton('i-heroicons-pencil-square', 'Editar', () => openForm(row.original.is_draft ? null : row.original, row.original.is_draft ? row.original : null)),
    iconButton('i-heroicons-trash', 'Eliminar', () => (row.original.is_draft ? dismissDraft(row.original) : removeOperation(row.original)), 'hover:bg-error/10 hover:text-error')
  ]) }
]

function invoiceTargetFor(operation: ChinaOperation): ChinaDocumentTarget {
  return { kind: 'invoice', mode: 'china', title: `Factura ${operation.code}`, operationId: operation.id! }
}

function openInvoiceHistory(operation: ChinaOperation) {
  documentTarget.value = invoiceTargetFor(operation)
}

function openInvoiceDownload(operation: ChinaOperation) {
  invoiceActionError.value = ''
  invoiceDownloadTarget.value = operation
}

function closeInvoiceDownload() {
  invoiceDownloadTarget.value = null
  invoiceActionError.value = ''
}

async function downloadCurrentInvoice() {
  if (!invoiceDownloadTarget.value) return
  invoiceAction.value = 'current'
  invoiceActionError.value = ''
  try {
    const target = invoiceTargetFor(invoiceDownloadTarget.value)
    const history = (await ChinaBillingService.documentHistory(target)).data || []
    const latest = history[0] || (await ChinaBillingService.issueDocument(target)).data
    window.open(latest.url, '_blank', 'noopener')
    closeInvoiceDownload()
  } catch (error: any) {
    invoiceActionError.value = error?.message || 'No se pudo descargar la factura.'
  } finally {
    invoiceAction.value = null
  }
}

async function regenerateAndDownloadInvoice() {
  if (!invoiceDownloadTarget.value) return
  invoiceAction.value = 'new'
  invoiceActionError.value = ''
  try {
    const target = invoiceTargetFor(invoiceDownloadTarget.value)
    const document = (await ChinaBillingService.issueDocument(target)).data
    window.open(document.url, '_blank', 'noopener')
    closeInvoiceDownload()
  } catch (error: any) {
    invoiceActionError.value = error?.message || 'No se pudo generar la nueva factura.'
  } finally {
    invoiceAction.value = null
  }
}

function openForm(operation: ChinaOperation | null, draftRow: ChinaOperation | null) {
  editing.value = operation
  draft.value = draftRow
  formOpen.value = true
}

function dismissDraft(row: ChinaOperation) {
  showConfirmation('Eliminar operación por aprobar', `¿Eliminar la operación por aprobar de ${row.organization.name} (${row.description})?`, async () => {
    try {
      await ChinaBillingService.dismissDraft(row.container_id!)
      refresh()
    } catch (error: any) {
      showError('Operaciones', error?.message || 'No se pudo eliminar.')
    }
  })
}

const deleting = ref<{ row: ChinaOperation; warnings: string[] } | null>(null)
const deleteBusy = ref(false)

function removeOperation(row: ChinaOperation) {
  const hasPayments = (row.payments || []).length > 0 || (row.credits || []).length > 0
  const received = (row.costs || []).filter((cost) => cost.source_operation_id).map((cost) => cost.name.replace('Diferencia ', ''))
  deleting.value = { row, warnings: [hasPayments ? 'Tiene pagos aplicados. Ese monto quedará sin asignar en el pago y pasará a saldo a favor del cliente.' : '', received.length ? `Incluye diferencias trasladadas desde ${received.join(', ')}; esas órdenes volverán a mostrar su diferencia pendiente.` : ''].filter(Boolean) }
}

async function confirmRemove() {
  if (!deleting.value) return
  deleteBusy.value = true
  try {
    await ChinaBillingService.deleteOperation(deleting.value.row.id!)
    deleting.value = null
    refresh()
  } catch (error: any) {
    showError('Operaciones', error?.message || 'No se pudo eliminar.')
  } finally {
    deleteBusy.value = false
  }
}

function startTransfer(row: ChinaOperation, mode: 'difference' | 'credit') {
  transferMode.value = mode
  transferring.value = row
}

function undoTransfer(row: ChinaOperation) {
  showConfirmation('Deshacer traslado', `Se quitará el costo «Diferencia ${row.code}» de ${row.transferred_to_code} y la diferencia volverá a ${row.code}.`, async () => {
    try {
      const response: any = await ChinaBillingService.undoTransferDifference(row.id!)
      if (response?.warning) showWarning('Operaciones', response.warning)
      refresh()
    } catch (error: any) {
      showError('Operaciones', error?.message || 'No se pudo deshacer.')
    }
  })
}

function onTransferred() {
  transferring.value = null
  refresh()
}

/** Abre el detalle de un pago aplicado a la operación (mismo modal que en Cobros). */
async function openPaymentDetail(paymentId: number) {
  try {
    paymentDetail.value = (await ChinaBillingService.getPayment(paymentId)).data
    selectedId.value = null
  } catch (error: any) {
    showError('Operaciones', error?.message || 'No se pudo abrir el pago.')
  }
}

async function onPaymentChanged() {
  const id = paymentDetail.value?.id
  await refresh()
  if (!id) return
  try {
    paymentDetail.value = (await ChinaBillingService.getPayment(id)).data
  } catch {
    paymentDetail.value = null
  }
}

function onPaymentEdited() {
  editingPayment.value = null
  refresh()
}

function openPaymentFor(operation: ChinaOperation) {
  selectedId.value = null
  selectedIds.value = [operation.id!]
  paymentOpen.value = true
}

async function refresh() {
  await load()
  emit('changed')
}

function onSaved() {
  formOpen.value = false
  refresh()
}

function onPaymentSaved() {
  paymentOpen.value = false
  selectedIds.value = []
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

/** Acciones del encabezado de la página (Registrar pago, Nueva operación, Datos bancarios). */
defineExpose({
  refresh: load,
  openNew: () => openForm(null, null),
  openPayment: () => { paymentOpen.value = true },
  openBank: () => { bankOpen.value = true },
  selectedCount: computed(() => selectedIds.value.length),
  operationsCount: computed(() => counts.value.operations_total ?? ((counts.value.all ?? 0) - (counts.value.draft ?? 0)))
})

onMounted(load)
</script>
