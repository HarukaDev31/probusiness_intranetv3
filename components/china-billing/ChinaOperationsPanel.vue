<template>
  <div>
    <div class="mb-4 grid grid-cols-2 overflow-hidden rounded-2xl bg-default shadow-[0_6px_20px_rgba(30,42,59,.06)] lg:grid-cols-6">
      <button
        v-for="state in states"
        :key="state.key"
        type="button"
        class="flex flex-col gap-1.5 border-b-[3px] border-r border-r-[#eef1f6] px-5 py-4 text-left transition-colors hover:bg-[#fff8f2]"
        :class="status === state.key ? 'border-b-primary bg-[#fff3ea]' : 'border-b-transparent'"
        @click="changeStatus(state.key)"
      >
        <span class="flex items-center gap-2 text-[13px] text-toned"><span class="size-2.5 flex-none rounded-full" :class="state.dot" />{{ state.label }}</span>
        <span class="text-[26px] font-bold leading-none text-highlighted">{{ state.count }}</span>
      </button>
    </div>

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
        <div v-if="selectedIds.length" class="flex flex-wrap items-center gap-4 border-b border-[#f9c6a5] bg-[#fff3ea] px-4 py-3 text-sm">
          <span class="font-semibold text-highlighted">{{ selectedIds.length }} {{ selectedIds.length === 1 ? 'operación seleccionada' : 'operaciones seleccionadas' }}</span>
          <span class="text-toned">{{ selectedOrganizationName }} · Pendiente {{ usd(selectedPending) }}</span>
          <span class="flex-1" />
          <UButton color="neutral" variant="link" @click="selectedIds = []">Limpiar</UButton>
          <UButton color="primary" @click="paymentOpen = true">Registrar pago</UButton>
        </div>
      </template>
    </DataTable>

    <ChinaOperationDrawer
      :operation="selected"
      :credits="credits"
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
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
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
import { UButton, UCheckbox, UIcon } from '#components'

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
const documentTarget = ref<ChinaDocumentTarget | null>(null)
const paymentDetail = ref<ChinaPayment | null>(null)
const editingPayment = ref<ChinaPayment | null>(null)
const transferring = ref<ChinaOperation | null>(null)
const transferMode = ref<'difference' | 'credit'>('difference')
const filters = ref<Record<string, string>>({ status: CHINA_STATUS.ALL, date_from: '', date_to: '' })

const selectedRows = computed(() => rows.value.filter((row) => selectedIds.value.includes(row.id as number)))
const selectedOrganizationId = computed(() => selectedRows.value[0]?.organization.id ?? null)
const selectedOrganizationName = computed(() => selectedRows.value[0]?.organization.name ?? '')
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
  class: { td: ({ original }: { original: ChinaOperation }) => (original?.is_draft ? '!bg-[#fffcf3]' : '') }
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
  const text = row.difference == null || row.difference === undefined
    ? '—'
    : favor ? `+${usd(Math.abs(row.difference))} a favor` : usd(row.difference)
  const tone = favor ? 'text-success' : owed ? 'text-error' : row.transferred ? 'text-muted' : 'text-highlighted'
  return h('div', { class: 'flex min-w-28 flex-col items-end gap-1' }, [
    h('span', { class: `font-medium ${tone}` }, text),
    owed || favor
      ? h('button', { type: 'button', class: 'text-xs font-medium text-primary hover:underline', onClick: () => startTransfer(row, favor ? 'credit' : 'difference') }, 'Trasladar a otra orden')
      : null,
    row.transferred_to_code
      ? h('span', { class: 'text-xs text-muted' }, `Trasladada a ${row.transferred_to_code}`)
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

const columns: TableColumn<ChinaOperation>[] = [
  { id: 'select', header: '', cell: ({ row }) => row.original.is_draft ? null : h(UCheckbox, {
    modelValue: selectedIds.value.includes(row.original.id!),
    disabled: !selectedIds.value.includes(row.original.id!) && !canSelect(row.original),
    'onUpdate:modelValue': (value: boolean | 'indeterminate') => toggle(row.original, value === true)
  }) },
  { id: 'number', header: 'N.', cell: ({ row }) => h('span', { class: 'text-muted' }, row.original.code ? String(Number(row.original.code.replace(/\D/g, ''))) : '') },
  { accessorKey: 'issued_on', header: 'Fecha', cell: ({ row }) => h('div', { class: 'flex flex-col whitespace-nowrap' }, [
    h('span', dayLabel(row.original.issued_on)),
    h('span', { class: 'text-xs text-muted' }, monthLabel(row.original.issued_on))
  ]) },
  { id: 'country', header: 'País', cell: ({ row }) => h('span', row.original.organization.country || '—') },
  { accessorKey: 'organization', header: 'Cliente', cell: ({ row }) => h('span', { class: 'block w-28 whitespace-normal' }, row.original.organization.name) },
  { accessorKey: 'description', header: 'Servicio', cell: ({ row }) => h('div', { class: 'flex min-w-48 flex-col gap-0.5' }, [
    h('div', { class: 'flex items-center gap-2' }, [
      h('span', { class: 'font-semibold' }, row.original.service_name),
      row.original.code ? h('span', { class: 'rounded-md bg-[#eef1f6] px-1.5 py-0.5 text-xs text-toned' }, row.original.code) : null
    ]),
    h('span', { class: 'text-xs text-muted' }, row.original.is_draft ? `${row.original.description} · ${row.original.cbm} CBM` : row.original.description),
    row.original.is_draft ? null : h(UButton, {
      size: 'xs', color: 'primary', variant: 'link', icon: 'i-heroicons-arrow-down-tray', class: 'self-start px-0',
      onClick: () => { documentTarget.value = { kind: 'invoice', mode: 'china', title: `Factura ${row.original.code}`, operationId: row.original.id! } }
    }, () => 'Descargar factura')
  ]) },
  { accessorKey: 'total', header: 'Monto total', meta: { class: right }, cell: ({ row }) => row.original.is_draft ? muted('') : h('span', { class: 'font-semibold' }, usd(row.original.total)) },
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
    iconButton('i-heroicons-pencil-square', 'Editar', () => openForm(row.original.is_draft ? null : row.original, row.original.is_draft ? row.original : null)),
    iconButton('i-heroicons-trash', 'Eliminar', () => (row.original.is_draft ? dismissDraft(row.original) : removeOperation(row.original)), 'hover:bg-error/10 hover:text-error')
  ]) }
]

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

function removeOperation(row: ChinaOperation) {
  const hasPayments = (row.payments || []).length > 0 || (row.credits || []).length > 0
  const received = (row.costs || []).filter((cost) => cost.source_operation_id).map((cost) => cost.name.replace('Diferencia ', ''))
  const warning = [
    hasPayments ? `Tiene pagos aplicados. Ese monto quedará sin asignar en el pago y pasará a saldo a favor del cliente.` : '',
    received.length ? `Incluye diferencias trasladadas desde ${received.join(', ')}; esas órdenes volverán a mostrar su diferencia pendiente.` : ''
  ].filter(Boolean).join(' ')
  showConfirmation(`¿Eliminar ${row.code}?`, `${row.service_name} · ${row.organization.name} · ${usd(row.total)}. ${warning} Esta acción no se puede deshacer.`.replace('  ', ' '), async () => {
    try {
      await ChinaBillingService.deleteOperation(row.id!)
      refresh()
    } catch (error: any) {
      showError('Operaciones', error?.message || 'No se pudo eliminar.')
    }
  })
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
