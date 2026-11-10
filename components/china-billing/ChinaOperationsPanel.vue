<template>
  <div>
    <p class="mb-2 text-xs text-muted">Resumen · {{ rangeLabel }}</p>
    <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <UCard v-for="card in cards" :key="card.label" variant="subtle">
        <p class="text-xs uppercase tracking-wider text-muted">{{ card.label }}</p>
        <USkeleton v-if="loading && !rows.length" class="mt-2 h-8 w-28" />
        <p v-else class="mt-1 text-2xl font-bold" :class="card.tone">{{ card.value }}</p>
        <p v-if="card.sub" class="text-xs text-muted">{{ card.sub }}</p>
      </UCard>
    </div>

    <UCard v-if="credits.length" variant="subtle" class="mb-4">
      <p class="mb-1 text-sm font-semibold text-highlighted">Saldos a favor</p>
      <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span v-for="credit in credits" :key="credit.organization_id">
          {{ credit.name }}: <span class="font-semibold text-success">{{ usd(credit.balance) }}</span>
          <UButton size="xs" color="neutral" variant="link" @click="openBalance(credit)">Balance</UButton>
        </span>
      </div>
    </UCard>

    <div class="mb-4 grid grid-cols-2 overflow-hidden rounded-lg bg-default ring ring-default lg:grid-cols-6">
      <button
        v-for="state in states"
        :key="state.key"
        type="button"
        class="flex flex-col gap-1 border-b-[3px] border-r border-r-default px-4 py-3 text-left transition-colors hover:bg-primary/5"
        :class="status === state.key ? 'border-b-primary bg-primary/10' : 'border-b-transparent'"
        @click="changeStatus(state.key)"
      >
        <span class="flex items-center gap-2 text-sm text-toned"><span class="size-2.5 rounded-full" :class="state.dot" />{{ state.label }}</span>
        <span class="text-2xl font-bold text-highlighted">{{ state.count }}</span>
      </button>
    </div>

    <DataTable
      sticky-last-column
      keep-spanish-headers
      filters-layout="inline"
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
      :show-export="false"
      empty-state-message="No hay operaciones que coincidan."
      @update:primary-search="onSearch"
      @filter-change="onFilter"
      @clear-filters="onClearFilters"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />

    <ChinaOperationDrawer
      :operation="selected"
      :siblings="rows"
      :credits="credits"
      @close="selectedId = null"
      @changed="refresh"
      @edit="(operation) => openForm(operation, null)"
      @invoice="(operation) => (documentTarget = { kind: 'invoice', mode: 'china', title: `Factura ${operation.code}`, operationId: operation.id! })"
    />
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
import ChinaPaymentForm from '~/components/china-billing/ChinaPaymentForm.vue'
import { CHINA_STATUS, CHINA_STATUS_COLOR, CHINA_STATUS_LABEL } from '~/constants/chinaBilling'
import { useChinaOperations } from '~/composables/china-billing/useChinaOperations'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaCredit, ChinaDocumentTarget, ChinaOperation } from '~/types/china-billing'
import { UBadge, UButton, UCheckbox } from '#components'

const emit = defineEmits<{ changed: [] }>()

const {
  status, search, countryId, from, to, rows, counts, credits, organizations, countries, pagination, loading,
  cards, states, load, reload, changeStatus
} = useChinaOperations()
const { showConfirmation, showError } = useModal()

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
const filters = ref<Record<string, string>>({ status: CHINA_STATUS.ALL, country: 'todos', date_from: '', date_to: '' })

const selectedOrganizationId = computed(() => rows.value.find((row) => row.id === selectedIds.value[0])?.organization.id ?? null)
const rangeLabel = computed(() => (from.value || to.value ? `${from.value || '…'} a ${to.value || '…'}` : 'todo el período'))

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
  {
    key: 'country',
    label: 'País',
    type: 'select',
    placeholder: 'País',
    options: [{ value: 'todos', label: 'Todos los países' }, ...countries.value]
  },
  { key: 'date_from', label: 'Desde', type: 'date', placeholder: 'Desde' },
  { key: 'date_to', label: 'Hasta', type: 'date', placeholder: 'Hasta' }
])

// Los borradores por aprobar se pintan en amarillo, como en la maqueta.
const tableMeta = {
  class: { td: ({ original }: { original: ChinaOperation }) => (original?.is_draft ? '!bg-amber-50' : '') }
}

// La barra de estados y el filtro «Estado» siempre muestran lo mismo.
watch(status, (value) => { filters.value = { ...filters.value, status: value } })

/** Solo se puede seleccionar con saldo pendiente y del mismo cliente que lo ya elegido. */
function canSelect(row: ChinaOperation): boolean {
  if (row.is_draft || (row.pending || 0) <= 0) return false
  return !selectedIds.value.length || row.organization.id === selectedOrganizationId.value
}

function toggle(row: ChinaOperation, value: boolean) {
  selectedIds.value = value ? [...selectedIds.value, row.id!] : selectedIds.value.filter((id) => id !== row.id)
}

const dash = () => h('span', { class: 'text-muted' }, '—')

function differenceCell(row: ChinaOperation) {
  if (row.transferred_to_code) {
    return h('div', { class: 'flex flex-col' }, [
      h('span', { class: 'text-xs text-error whitespace-nowrap' }, 'Trasladada a otra orden'),
      h('span', { class: 'text-xs text-muted' }, row.transferred_to_code)
    ])
  }
  if (!row.difference) return h('span', { class: 'font-semibold' }, row.difference === 0 ? usd(0) : '—')
  const favor = row.difference < 0
  return h('div', { class: 'flex min-w-24 flex-col whitespace-nowrap' }, [
    h('span', { class: `font-semibold ${favor ? 'text-success' : 'text-error'}` }, `${favor ? '+' : ''}${usd(Math.abs(row.difference))}${favor ? ' a favor' : ''}`),
    favor ? null : h('span', { class: 'text-xs text-muted' }, 'Por cobrar')
  ])
}

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
  { accessorKey: 'organization', header: 'Cliente', cell: ({ row }) => h('span', { class: 'block w-32 whitespace-normal' }, row.original.organization.name) },
  { accessorKey: 'description', header: 'Servicio', cell: ({ row }) => h('div', { class: 'flex min-w-56 flex-col gap-0.5' }, [
    h('div', { class: 'flex items-center gap-2' }, [
      h('span', { class: 'font-semibold' }, row.original.service_name),
      row.original.code ? h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm', label: row.original.code }) : null
    ]),
    h('span', { class: 'text-xs text-muted' }, row.original.is_draft ? `${row.original.description} · ${row.original.cbm} CBM` : row.original.description),
    row.original.is_draft ? null : h(UButton, {
      size: 'xs', color: 'primary', variant: 'link', icon: 'i-heroicons-arrow-down-tray', class: 'self-start px-0',
      onClick: () => { documentTarget.value = { kind: 'invoice', mode: 'china', title: `Factura ${row.original.code}`, operationId: row.original.id! } }
    }, () => 'Descargar factura')
  ]) },
  { accessorKey: 'total', header: 'Monto total', cell: ({ row }) => row.original.is_draft ? dash() : h('span', { class: 'font-semibold' }, usd(row.original.total)) },
  { accessorKey: 'received', header: 'Recibido USD', cell: ({ row }) => row.original.is_draft || !row.original.received ? dash() : h('span', usd(row.original.received)) },
  { id: 'difference', header: 'Diferencia USD', cell: ({ row }) => row.original.is_draft ? dash() : differenceCell(row.original) },
  { accessorKey: 'received_rmb', header: 'Recibido RMB', cell: ({ row }) => row.original.is_draft || !row.original.received_rmb ? dash() : h('span', rmb(row.original.received_rmb)) },
  { accessorKey: 'status', header: 'Estado', cell: ({ row }) => h('div', { class: 'flex min-w-36 flex-col items-start gap-1.5' }, [
    h(UBadge, { color: CHINA_STATUS_COLOR[row.original.status], variant: 'soft', label: CHINA_STATUS_LABEL[row.original.status] }),
    row.original.is_draft
      ? h('span', { class: 'text-xs text-muted' }, 'Cerrado por Almacén China')
      : null,
    row.original.is_draft
      ? h('div', { class: 'flex gap-1' }, [
        h(UButton, { size: 'xs', color: 'primary', variant: 'outline', onClick: () => openForm(null, row.original) }, () => 'Aprobar'),
        h(UButton, { size: 'xs', color: 'error', variant: 'ghost', icon: 'i-heroicons-trash', 'aria-label': 'Eliminar', onClick: () => dismissDraft(row.original) })
      ])
      : h(UButton, { size: 'xs', color: 'primary', variant: 'outline', trailingIcon: 'i-heroicons-chevron-right', onClick: () => { selectedId.value = row.original.id } }, () => 'Gestionar')
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

function openBalance(credit: ChinaCredit) {
  documentTarget.value = { kind: 'balance', mode: 'china', title: `Balance de pago · ${credit.name}`, organizationId: credit.organization_id }
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
  if (key === 'country') countryId.value = next === 'todos' ? '' : next
  if (key === 'date_from') from.value = next
  if (key === 'date_to') to.value = next
  return reload()
}

function onClearFilters() {
  filters.value = { status: CHINA_STATUS.ALL, country: 'todos', date_from: '', date_to: '' }
  status.value = CHINA_STATUS.ALL
  countryId.value = ''
  from.value = ''
  to.value = ''
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
  operationsCount: computed(() => (counts.value.all ?? 0) - (counts.value.draft ?? 0))
})

onMounted(load)
</script>
