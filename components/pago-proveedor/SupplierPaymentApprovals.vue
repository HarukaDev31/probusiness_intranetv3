<template>
  <div>
    <div class="mb-3 flex flex-wrap justify-end gap-2">
      <UButton color="neutral" variant="outline" icon="i-lucide-settings" @click="openTariffs('bancaria')">Comisión bancaria / plataforma</UButton>
      <UButton color="neutral" variant="outline" icon="i-lucide-settings" @click="openTariffs('admin')">Comisión administrativa</UButton>
      <UButton color="neutral" variant="outline" icon="i-lucide-settings" @click="openSettings">Tolerancia y plazos</UButton>
    </div>
    <SupplierPaymentTabs
      class="mb-3"
      :model-value="bucket"
      :items="approvalTabs"
      @update:model-value="(value) => changeBucket(value as typeof APPROVAL_BUCKET[keyof typeof APPROVAL_BUCKET])"
    />

    <UAlert
      v-if="alertas.length"
      class="mb-3"
      color="warning"
      variant="subtle"
      :title="alertas[0]"
      :description="alertas.slice(1).join(' · ') || undefined"
    />

    <SupplierPaymentRefunds
      ref="refundsRef"
      modal-only
      :force-bucket="refundBucket"
    />

    <DataTable
      sticky-last-column
      :data="unifiedRows"
      :columns="columns"
      :loading="loading || refundLoading"
      :current-page="pagination.current_page"
      :total-pages="pagination.last_page"
      :total-records="unifiedTotal"
      :items-per-page="pagination.per_page"
      :show-export="false"
      :empty-state-message="emptyMessage"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    >
      <template #filters>
        <SupplierPaymentFilterBar
          :search="search"
          search-placeholder="Cliente, proveedor o código"
          :fields="filterConfig"
          :values="filters"
          @update:search="onSearch"
          @change="onFilter"
        />
      </template>
    </DataTable>
    <p class="mt-2 text-xs text-muted">
      {{ bucket === APPROVAL_BUCKET.PENDING
        ? `Pagos con depósitos ya validados en Verificación. Pendiente: el sistema no los aprobó solo (la diferencia supera la tolerancia de ${Number(settingsForm.tolerance || 0).toFixed(2)}) o es un reembolso solicitado; apruébalos (asumiendo la diferencia, con motivo) o márcalos Por cobrar. Por cobrar: Ventas cobra la diferencia al cliente (plazo de ${settingsForm.remedy_days} días; al vencer vuelve a Pendiente).`
        : 'Pagos de proveedores y reembolsos ya aprobados. Los pagos siguen su camino (Ejecución de pago y Confirmación).' }}
    </p>

    <ApprovalReviewModal :payment="selectedPayment" @close="selectedPayment = null" @saved="reloadAll" />

    <SupplierPaymentWindow
      :open="settingsOpen"
      title="Tolerancia y plazos"
      subtitle="Los define Administración. Se aplican a las verificaciones de depósitos y a las observaciones."
      @close="settingsOpen = false"
    >
      <div class="grid gap-3 rounded-2xl border border-default bg-elevated p-4 sm:grid-cols-2">
        <UFormField v-for="field in settingFields" :key="field.key" :label="field.label">
          <UInput v-model.number="settingsForm[field.key]" type="number" min="0" step="0.01" class="w-full" />
        </UFormField>
        <div class="sm:col-span-2">
          <UCheckbox
            v-model="settingsForm.auto_approve"
            label="Aprobar automáticamente los pagos sin diferencias."
            description="Se aprueban solos cuando todos sus depósitos están validados, el importe está completo (o la diferencia está dentro de la tolerancia) y no hay observaciones. El resto lo aprueba Administración."
          />
        </div>
      </div>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="() => { settingsOpen = false }">Cancelar</UButton>
        <UButton color="primary" :loading="savingSettings" @click="saveSettings">Guardar</UButton>
      </template>
    </SupplierPaymentWindow>

    <SupplierPaymentWindow
      :open="tariffsOpen"
      :title="tariffTipo === 'admin' ? 'Configurar comisión administrativa' : 'Configurar comisión bancaria / plataforma'"
      :subtitle="tariffTipo === 'admin'
        ? 'Se cobra por cada pago que gestiona Pro Business a un proveedor.'
        : 'Tarifa fija en $ según el monto de cada transferencia. Los tramos son los mismos en dólares y yuanes.'"
      @close="tariffsOpen = false"
    >
      <div v-if="tariffTipo === 'admin'" class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Dólares ($)">
          <UInput v-model.number="tariffs.admin_usd" type="number" min="0" class="w-full" />
        </UFormField>
        <UFormField label="Yuanes (¥)">
          <UInput v-model.number="tariffs.admin_rmb" type="number" min="0" class="w-full" />
        </UFormField>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wide text-muted">
              <th class="pb-2 pr-2">Tramo (monto de transferencia)</th>
              <th class="pb-2 pr-2">Dólares (T-T) · Tarifa ($)</th>
              <th class="pb-2">Yuanes · Tarifa ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-default">
              <td class="py-2 pr-2">
                Menor a $
                <UInput v-model.number="tariffs.tramo_medio" type="number" min="0" size="sm" class="ml-1 w-24" />
              </td>
              <td class="py-2 pr-2"><UInput v-model.number="tariffs.usd[0]" type="number" min="0" size="sm" class="w-24" /></td>
              <td class="py-2"><UInput v-model.number="tariffs.rmb[0]" type="number" min="0" size="sm" class="w-24" /></td>
            </tr>
            <tr class="border-t border-default">
              <td class="py-2 pr-2">
                De ${{ tariffs.tramo_medio || 0 }} a $
                <UInput v-model.number="tariffs.tramo_alto" type="number" min="0" size="sm" class="ml-1 w-24" />
              </td>
              <td class="py-2 pr-2"><UInput v-model.number="tariffs.usd[1]" type="number" min="0" size="sm" class="w-24" /></td>
              <td class="py-2"><UInput v-model.number="tariffs.rmb[1]" type="number" min="0" size="sm" class="w-24" /></td>
            </tr>
            <tr class="border-t border-default">
              <td class="py-2 pr-2">Mayor a ${{ tariffs.tramo_alto || 0 }}</td>
              <td class="py-2 pr-2"><UInput v-model.number="tariffs.usd[2]" type="number" min="0" size="sm" class="w-24" /></td>
              <td class="py-2"><UInput v-model.number="tariffs.rmb[2]" type="number" min="0" size="sm" class="w-24" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-muted">Tarifa configurable solo por usuarios autorizados. Aplica a las nuevas solicitudes desde el momento en que se guarda — no afecta solicitudes ya creadas.</p>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="() => { tariffsOpen = false }">Cancelar</UButton>
        <UButton color="primary" :loading="savingTariffs" @click="saveTariffs">Guardar tarifa</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import SupplierPaymentRefunds from '~/components/pago-proveedor/SupplierPaymentRefunds.vue'
import SupplierPaymentFilterBar from '~/components/pago-proveedor/SupplierPaymentFilterBar.vue'
import type { TableColumn } from '@nuxt/ui'
import ApprovalReviewModal from '~/components/pago-proveedor/ApprovalReviewModal.vue'
import { APPROVAL_BUCKET, APPROVAL_STATUS } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type {
  PagoProveedorPaginacion,
  SupplierPaymentApproval,
  SupplierPaymentApprovalSettings,
  SupplierPaymentRefund
} from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import { useSupplierPaymentRefunds } from '~/composables/pago-proveedor/useSupplierPaymentRefunds'
import { UButton } from '#components'

const FILTRO_REEMBOLSO = 'reembolso'
/** Dato principal de cada celda en negro; los secundarios (proveedor, cuota, fecha, observación) quedan en gris. */
const TEXTO_PRINCIPAL = 'text-highlighted'

type UnifiedRow = {
  kind: 'pago' | 'reemb'
  id: string
  order_number: number | null
  client_name: string | null
  consolidation: string | null
  supplier_code: string | null
  supplier_name: string | null
  request_code: string | null
  payment_type: string
  installment_label: string | null
  amount: number
  deposit_text: string
  /** Fecha del depósito (en gris, bajo el banco). */
  deposit_date: string | null
  deadline_text: string
  status_label: string
  status_tone: 'ok' | 'warn' | 'muted'
  observation: string
  observation_alert: boolean
  payment?: SupplierPaymentApproval
  refund?: SupplierPaymentRefund
}

const { showError, showSuccess } = useModal()
const {
  rows: refundRows,
  loading: refundLoading,
  pendingCount: refundPendingCount,
  load: loadRefunds,
  changeBucket: changeRefundBucket
} = useSupplierPaymentRefunds()
const rows = ref<SupplierPaymentApproval[]>([])
const selectedPayment = ref<SupplierPaymentApproval | null>(null)
const refundsRef = ref<{ open: (row: SupplierPaymentRefund) => void } | null>(null)
const loading = ref(false)
const search = ref('')
const pendingCount = ref(0)
const typeFilter = ref<'todos' | 'pago' | 'reemb'>('todos')
const bucket = ref<typeof APPROVAL_BUCKET[keyof typeof APPROVAL_BUCKET]>(APPROVAL_BUCKET.PENDING)
const refundBucket = computed(() => (bucket.value === APPROVAL_BUCKET.APPROVED ? 'aprobado' : 'solicitado') as 'solicitado' | 'aprobado')
const totalPending = computed(() => pendingCount.value + refundPendingCount.value)
/** Mensaje vacío según la pestaña y el filtro de código (enlace desde Verificación). */
const emptyMessage = computed(() => {
  if (search.value.trim()) return `No hay ítems con «${search.value.trim()}» en esta bandeja.`
  return bucket.value === APPROVAL_BUCKET.PENDING
    ? 'No hay nada por aprobar.'
    : 'Aún no hay pagos aprobados.'
})
const approvalTabs = computed(() => [
  { label: 'Por aprobar', value: APPROVAL_BUCKET.PENDING, count: totalPending.value },
  { label: 'Aprobados', value: APPROVAL_BUCKET.APPROVED }
])
const pagination = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const filters = ref<{ status: string; consolidado: string; banco: string }>({ status: APPROVAL_STATUS.ALL, consolidado: 'todos', banco: 'todos' })
const settingsOpen = ref(false)
const tariffsOpen = ref(false)
const tariffTipo = ref<'bancaria' | 'admin'>('bancaria')
const savingTariffs = ref(false)
const tariffs = reactive({
  usd: [100, 120, 150],
  rmb: [50, 90, 120],
  tramo_medio: 3000,
  tramo_alto: 9000,
  admin_usd: 30,
  admin_rmb: 30
})
const savingSettings = ref(false)
const overdueCount = ref(0)
const alertas = computed(() => {
  const items: string[] = []
  if (overdueCount.value > 0) {
    items.push(`${overdueCount.value} observación${overdueCount.value > 1 ? 'es' : ''} vencida${overdueCount.value > 1 ? 's' : ''} (plazo de cobro sin resolver).`)
  }
  return items
})
const consolidadosDisponibles = computed(() => [...new Set(  [...rows.value.map((row) => row.consolidation), ...refundRows.value.map((row) => row.consolidation)]
    .filter((value): value is string => !!value && value.trim() !== '')
)].sort())

const paymentUnified = computed<UnifiedRow[]>(() => rows.value.map((row) => ({
  kind: 'pago' as const,
  id: `pago-${row.id}`,
  order_number: row.order_number,
  client_name: row.client_name,
  consolidation: row.consolidation,
  supplier_code: row.supplier_code,
  supplier_name: [row.supplier_name, row.product].filter(Boolean).join(' · '),
  request_code: row.request_code,
  payment_type: row.currency === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T',
  installment_label: row.installment_label,
  amount: row.charged_amount,
  deposit_text: depositCell(row),
  deposit_date: depositDate(row),
  deadline_text: bucket.value === APPROVAL_BUCKET.APPROVED
    ? formatDate(row.approved_at)
    : (row.deadline_text || '—'),
  status_label: row.status_label,
  status_tone: row.status === APPROVAL_STATUS.APPROVED ? 'ok' : 'warn',
  observation: row.observation,
  observation_alert: row.observation_for_admin && row.status !== APPROVAL_STATUS.APPROVED,
  payment: row
})))

const refundUnified = computed<UnifiedRow[]>(() => refundRows.value
  .filter((row) => {
    if (filters.value.consolidado !== 'todos' && row.consolidation !== filters.value.consolidado) return false
    if (!search.value.trim()) return true
    const q = search.value.trim().toLowerCase()
    return [row.client_name, row.consolidation, row.supplier_code, row.origin_label]
      .join(' ')
      .toLowerCase()
      .includes(q)
  })
  .map((row) => ({
    kind: 'reemb' as const,
    id: `reemb-${row.id}`,
    order_number: row.order_number,
    client_name: row.client_name,
    consolidation: row.consolidation,
    supplier_code: row.supplier_code,
    supplier_name: [row.supplier_name, row.product].filter(Boolean).join(' · ') || null,
    request_code: row.request_code || null,
    payment_type: '—',
    installment_label: null,
    amount: row.amount,
    deposit_text: '—',
    deposit_date: null,
    deadline_text: row.requested_at ? formatDate(row.requested_at) : '—',
    status_label: bucket.value === APPROVAL_BUCKET.APPROVED ? 'Reembolso aprobado' : 'Reembolso solicitado',
    status_tone: bucket.value === APPROVAL_BUCKET.APPROVED ? 'ok' : 'warn',
    observation: refundObservation(row),
    observation_alert: bucket.value === APPROVAL_BUCKET.PENDING,
    refund: row
  })))

const unifiedRows = computed(() => {
  if (typeFilter.value === 'pago') return paymentUnified.value
  if (typeFilter.value === 'reemb') return refundUnified.value
  return [...paymentUnified.value, ...refundUnified.value]
})
const unifiedTotal = computed(() => {
  if (typeFilter.value === 'reemb') return refundUnified.value.length
  if (typeFilter.value === 'pago') return pagination.value.total
  return pagination.value.total + refundUnified.value.length
})
const settingsForm = reactive<SupplierPaymentApprovalSettings>({
  tolerance: 1,
  exception_limit: 2,
  remedy_days: 7,
  verify_hours: 2,
  undo_minutes: 5,
  undo_hours: 24,
  decision_hours: 72,
  auto_approve: true
})

const settingFields = [
  { key: 'tolerance' as const, label: 'Tolerancia de importe (USD)' },
  { key: 'exception_limit' as const, label: 'Límite excepcional (USD, con motivo)' },
  { key: 'verify_hours' as const, label: 'Plazo para verificar un depósito (horas)' },
  { key: 'remedy_days' as const, label: 'Plazo para subsanar una observación (días)' },
  { key: 'undo_minutes' as const, label: 'Deshacer una verificación sin aviso (minutos)' },
  { key: 'undo_hours' as const, label: 'Deshacer con aviso a Ventas (horas)' },
  { key: 'decision_hours' as const, label: 'Plazo para que Ventas decida el pago 2 o el reembolso (horas)' }
]

const filterConfig = computed(() => [
  {
    key: 'consolidado',
    label: 'Consolidado',
    options: [
      { value: 'todos', label: 'Todos' },
      ...consolidadosDisponibles.value.map((item) => ({ value: item, label: soloConsolidado(item) }))
    ]
  },
  {
    key: 'status',
    label: 'Estado',
    options: bucket.value === APPROVAL_BUCKET.APPROVED
      ? [
          { value: APPROVAL_STATUS.ALL, label: 'Todos' },
          { value: APPROVAL_STATUS.APPROVED, label: 'Aprobado' },
          { value: FILTRO_REEMBOLSO, label: 'Reembolso aprobado' }
        ]
      : [
          { value: APPROVAL_STATUS.ALL, label: 'Todos' },
          { value: APPROVAL_STATUS.PENDING, label: 'Pendiente' },
          { value: APPROVAL_STATUS.TO_COLLECT, label: 'Por cobrar' },
          { value: FILTRO_REEMBOLSO, label: 'Reembolso solicitado' }
        ]
  },
  {
    key: 'banco',
    label: 'Banco',
    options: [
      { value: 'todos', label: 'Todos' },
      { value: 'bcp', label: 'BCP' },
      { value: 'interbank', label: 'Interbank' }
    ]
  }
])

const columns = computed<TableColumn<UnifiedRow>[]>(() => [
  { accessorKey: 'order_number', header: 'N.° de orden', cell: ({ row }) => h('span', { class: TEXTO_PRINCIPAL }, row.original.order_number ?? '—') },
  { accessorKey: 'client_name', header: 'Cliente', cell: ({ row }) => h('span', { class: `block min-w-36 max-w-72 whitespace-normal ${TEXTO_PRINCIPAL}` }, row.original.client_name || '—') },
  { accessorKey: 'consolidation', header: 'Consolidado', cell: ({ row }) => h('span', { class: TEXTO_PRINCIPAL }, soloConsolidado(row.original.consolidation)) },
  { accessorKey: 'supplier_code', header: 'Proveedor', cell: ({ row }) => h('div', [
    h('div', { class: `font-semibold ${TEXTO_PRINCIPAL}` }, row.original.supplier_code || '—'),
    h('div', { class: 'min-w-40 max-w-64 whitespace-normal text-xs text-muted' }, row.original.supplier_name || '')
  ]) },
  { accessorKey: 'request_code', header: 'Código de solicitud', cell: ({ row }) => h('span', { class: TEXTO_PRINCIPAL }, row.original.request_code || '—') },
  {
    accessorKey: 'payment_type',
    header: 'Tipo de pago',
    cell: ({ row }) => h('div', { class: 'w-20 whitespace-normal' }, [
      h('div', { class: TEXTO_PRINCIPAL }, row.original.payment_type),
      row.original.installment_label
        ? h('div', { class: 'text-[11px] text-muted' }, row.original.installment_label)
        : null
    ])
  },
  { accessorKey: 'amount', header: 'Importe', cell: ({ row }) => h('span', { class: TEXTO_PRINCIPAL }, `$${Number(row.original.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`) },
  ...(bucket.value === APPROVAL_BUCKET.PENDING
    ? [
        { accessorKey: 'deposit_text', header: 'Depósito', cell: ({ row }) => h('div', { class: 'w-20 whitespace-normal' }, [
          h('div', { class: TEXTO_PRINCIPAL }, row.original.deposit_text),
          row.original.deposit_date
            ? h('div', { class: 'text-xs text-muted' }, row.original.deposit_date)
            : null
        ]) },
        { accessorKey: 'deadline_text', header: 'Antigüedad / plazo', cell: ({ row }) => h('span', { class: `block w-20 whitespace-normal ${TEXTO_PRINCIPAL}` }, row.original.deadline_text) }
      ]
    : []) as TableColumn<UnifiedRow>[],
  {
    accessorKey: 'status_label',
    header: 'Estado',
    cell: ({ row }) => pastilla(
      row.original.status_label,
      row.original.status_tone === 'ok' ? 'ok' : row.original.payment?.status === APPROVAL_STATUS.TO_COLLECT ? 'warn' : 'info'
    )
  },
  ...(bucket.value === APPROVAL_BUCKET.APPROVED
    ? [{ accessorKey: 'deadline_text', header: 'Aprobado el' }]
    : []) as TableColumn<UnifiedRow>[],
  {
    accessorKey: 'observation',
    header: 'Observaciones',
    cell: ({ row }) => h('span', {
      class: ['block w-36 whitespace-normal text-sm', row.original.observation_alert ? 'font-semibold text-error' : 'text-muted']
    }, row.original.observation)
  },
  {
    accessorKey: 'id',
    header: 'Acciones',
    cell: ({ row }) => {
      const item = row.original
      if (item.kind === 'reemb' && bucket.value === APPROVAL_BUCKET.APPROVED && item.refund?.voucher_url) {
        return h(UButton, {
          size: 'xs',
          color: 'neutral',
          variant: 'ghost',
          icon: 'i-heroicons-document-magnifying-glass',
          title: 'Ver comprobante del reembolso',
          'aria-label': 'Ver comprobante del reembolso',
          onClick: () => openUnified(item)
        })
      }
      return h(UButton, {
        size: 'xs',
        color: 'primary',
        variant: 'ghost',
        icon: 'i-heroicons-eye',
        title: item.kind === 'reemb' ? 'Ver reembolso' : 'Ver pago',
        'aria-label': item.kind === 'reemb' ? 'Ver reembolso' : 'Ver pago',
        onClick: () => openUnified(item)
      })
    }
  }
])

function refundObservation(row: SupplierPaymentRefund) {
  const amount = `$${Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  if (bucket.value === APPROVAL_BUCKET.APPROVED) return row.origin === 'payment_2' ? 'Por anulación de pago' : 'Reembolso de un excedente'
  if (row.origin === 'payment_2') return `Reembolso por anulación de pago${row.reason ? ` · ${row.reason}` : ''}`
  if (row.origin === 'exchange') return `Reembolso de ${amount} por diferencia de cambio`
  return `Reembolso de ${amount} por excedente`
}

function pastilla(texto: string, tono: 'ok' | 'info' | 'warn') {
  const clases = {
    ok: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
  }
  return h('span', { class: `inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${clases[tono]}` }, texto)
}

function openUnified(row: UnifiedRow) {
  if (row.kind === 'reemb' && row.refund) {
    refundsRef.value?.open(row.refund)
    return
  }
  if (row.payment) selectedPayment.value = row.payment
}

function depositCell(row: SupplierPaymentApproval) {
  if (!row.deposits.length) return '—'
  if (row.deposits.length === 1) return row.deposits[0].bank_label
  return `${row.deposits.length} depósitos`
}

/** Fecha del único depósito (dd/mm/aaaa); con varios depósitos no se muestra. */
function depositDate(row: SupplierPaymentApproval) {
  if (row.deposits.length !== 1) return null
  return row.deposits[0].paid_on?.slice(0, 10).split('-').reverse().join('/') || null
}

/** Solo el número de consolidado, sin el año: «21 - 2026» → «21». */
function soloConsolidado(value: string | null) {
  if (!value) return '—'
  return value.replace(/\s*-\s*\d{4}\s*$/, '').trim() || value
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('es-PE') : '—'
}

// Solo se aplica la última consulta: una respuesta tardía de otra pestaña no pisa la lista.
let lastLoad = 0

async function load() {
  const current = ++lastLoad
  loading.value = true
  try {
    const response = await PagoProveedorService.listApprovals({
      bucket: bucket.value,
      status: filters.value.status === FILTRO_REEMBOLSO ? APPROVAL_STATUS.ALL : filters.value.status,
      consolidado: filters.value.consolidado,
      banco: filters.value.banco,
      search: search.value,
      page: pagination.value.current_page,
      per_page: pagination.value.per_page
    })
    if (current !== lastLoad) return
    rows.value = response.data || []
    pagination.value = response.pagination
    pendingCount.value = response.pending_count || 0
    overdueCount.value = (response.data || []).filter((row) => row.deadline_overdue).length
    if (response.settings) Object.assign(settingsForm, response.settings)
  } catch (error: any) {
    showError('Aprobación', error?.data?.message || error?.message || 'No se pudieron cargar los pagos.')
  } finally {
    if (current === lastLoad) loading.value = false
  }
}

async function reloadAll() {
  await Promise.all([load(), loadRefunds()])
}

function changeBucket(next: typeof APPROVAL_BUCKET[keyof typeof APPROVAL_BUCKET]) {
  typeFilter.value = 'todos'
  bucket.value = next
  filters.value = { status: APPROVAL_STATUS.ALL, consolidado: 'todos', banco: 'todos' }
  pagination.value.current_page = 1
  changeRefundBucket(next === APPROVAL_BUCKET.APPROVED ? 'aprobado' : 'solicitado')
  void reloadAll()
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
  if (key === 'status') {
    const estado = filters.value.status
    typeFilter.value = estado === FILTRO_REEMBOLSO
      ? 'reemb'
      : (estado === APPROVAL_STATUS.TO_COLLECT || estado === APPROVAL_STATUS.APPROVED ? 'pago' : 'todos')
  }
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

function openSettings() {
  settingsOpen.value = true
}

async function saveSettings() {
  savingSettings.value = true
  try {
    const response = await PagoProveedorService.saveApprovalSettings({ ...settingsForm })
    if (response.data) Object.assign(settingsForm, response.data)
    settingsOpen.value = false
    showSuccess('Tolerancia y plazos', 'La configuración quedó guardada.')
    await load()
  } catch (error: any) {
    showError('Tolerancia y plazos', error?.data?.message || error?.message || 'No se pudo guardar.')
  } finally {
    savingSettings.value = false
  }
}

async function openTariffs(tipo: 'bancaria' | 'admin' = 'bancaria') {
  tariffTipo.value = tipo
  try {
    const response = await PagoProveedorService.getTariffs()
    if (response.data) {
      tariffs.usd = [...response.data.usd]
      tariffs.rmb = [...response.data.rmb]
      tariffs.tramo_medio = Number(response.data.tramo_medio || 3000)
      tariffs.tramo_alto = Number(response.data.tramo_alto || 9000)
      tariffs.admin_usd = Number(response.data.admin_usd ?? response.data.admin ?? 30)
      tariffs.admin_rmb = Number(response.data.admin_rmb ?? response.data.admin ?? 30)
    }
  } catch {
    // Se muestran los valores de fábrica si la lectura falla.
  }
  tariffsOpen.value = true
}

async function saveTariffs() {
  savingTariffs.value = true
  try {
    if (tariffTipo.value === 'admin') {
      await PagoProveedorService.saveTariffs({
        tipo: 'admin',
        admin_usd: tariffs.admin_usd,
        admin_rmb: tariffs.admin_rmb
      })
    } else {
      await PagoProveedorService.saveTariffs({
        tipo: 'bancaria',
        usd: [...tariffs.usd],
        rmb: [...tariffs.rmb],
        tramo_medio: tariffs.tramo_medio,
        tramo_alto: tariffs.tramo_alto
      })
    }
    tariffsOpen.value = false
    showSuccess('Comisiones', 'Las tarifas quedaron guardadas.')
  } catch (error: any) {
    showError('Comisiones', error?.data?.message || error?.message || 'No se pudo guardar.')
  } finally {
    savingTariffs.value = false
  }
}

defineExpose({ pendingCount: totalPending })

onMounted(async () => {
  // Enlace directo desde Verificación › código de solicitud (?codigo=CN01NOV26).
  const code = String(useRoute().query.codigo || '').trim()
  if (code) search.value = code
  await Promise.all([load(), loadRefunds()])
})
</script>
