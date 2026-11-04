<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex gap-1.5 border-b border-gray-200">
        <button
          type="button"
          class="border-b-2 px-3.5 py-2 text-sm font-semibold"
          :class="bucket === APPROVAL_BUCKET.PENDING ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'"
          @click="changeBucket(APPROVAL_BUCKET.PENDING)"
        >
          Por aprobar <span v-if="totalPending" class="ml-1 rounded-full bg-primary-500 px-1.5 text-[11px] text-white">{{ totalPending }}</span>
        </button>
        <button
          type="button"
          class="border-b-2 px-3.5 py-2 text-sm font-semibold"
          :class="bucket === APPROVAL_BUCKET.APPROVED ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'"
          @click="changeBucket(APPROVAL_BUCKET.APPROVED)"
        >
          Aprobados
        </button>
      </div>
      <div class="flex gap-2">
        <UButton color="neutral" variant="soft" to="/verificacion?tab=supplier-payment">Validar depósitos</UButton>
        <UButton color="neutral" variant="outline" @click="openSettings">Tolerancia y plazos</UButton>
        <UButton color="neutral" variant="outline" @click="openTariffs">Comisiones</UButton>
      </div>
    </div>

    <div class="mb-3 flex flex-wrap gap-2">
      <button
        v-for="chip in typeChips"
        :key="chip.key"
        type="button"
        class="rounded-full border px-3 py-1 text-xs"
        :class="typeFilter === chip.key ? 'border-primary-500 bg-primary-50 font-semibold text-gray-900' : 'border-gray-200 bg-white text-gray-700'"
        @click="typeFilter = chip.key"
      >
        {{ chip.label }}
      </button>
    </div>

    <div v-if="typeFilter !== 'pago'" class="mb-4">
      <h3 class="mb-2 text-sm font-semibold text-gray-800">Reembolsos</h3>
      <p class="mb-3 text-sm text-gray-500">El dinero sale fuera de la intranet. Aquí solo apruebas el reembolso y dejas el voucher.</p>
      <SupplierPaymentRefunds :embedded="true" :force-bucket="refundBucket" />
    </div>

    <DataTable
      v-if="typeFilter !== 'reemb'"
      title="Aprobación de pagos"
      subtitle="Compara lo cobrado con lo que ingresó al banco. Los reembolsos solicitados también aparecen arriba."
      icon="i-heroicons-check-badge"
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
      empty-state-message="No hay pagos en esta bandeja."
      @update:primary-search="onSearch"
      @filter-change="onFilter"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />

    <ApprovalReviewModal :payment="selected" @close="selected = null" @saved="load" />

    <SupplierPaymentWindow
      :open="settingsOpen"
      title="Tolerancia y plazos"
      subtitle="Aplican a la comparación del importe cobrado contra el del banco."
      @close="settingsOpen = false"
    >
      <div class="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
        <label v-for="field in settingFields" :key="field.key" class="text-sm text-gray-500">
          {{ field.label }}
          <input v-model.number="settingsForm[field.key]" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900">
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-800 sm:col-span-2">
          <input v-model="settingsForm.auto_approve" type="checkbox">
          Aprobar automáticamente los pagos dentro de la tolerancia
        </label>
      </div>
      <template #footer>
        <UButton color="primary" :loading="savingSettings" @click="saveSettings">Guardar</UButton>
      </template>
    </SupplierPaymentWindow>

    <SupplierPaymentWindow
      :open="tariffsOpen"
      title="Comisiones"
      subtitle="Tramos: menos de $3,000 · de $3,000 a $9,000 · más de $9,000."
      @close="tariffsOpen = false"
    >
      <div class="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
        <div class="grid grid-cols-3 gap-2">
          <label v-for="(label, index) in tariffLabels" :key="'usd'+index" class="text-gray-500">USD {{ label }}
            <input v-model.number="tariffs.usd[index]" type="number" min="0" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" />
          </label>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <label v-for="(label, index) in tariffLabels" :key="'rmb'+index" class="text-gray-500">RMB {{ label }}
            <input v-model.number="tariffs.rmb[index]" type="number" min="0" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" />
          </label>
        </div>
        <label class="text-gray-500">Administrativa
          <input v-model.number="tariffs.admin" type="number" min="0" class="mt-1 block w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" />
        </label>
      </div>
      <template #footer>
        <UButton color="primary" :loading="savingTariffs" @click="saveTariffs">Guardar</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import SupplierPaymentRefunds from '~/components/pago-proveedor/SupplierPaymentRefunds.vue'
import type { TableColumn } from '@nuxt/ui'
import ApprovalReviewModal from '~/components/pago-proveedor/ApprovalReviewModal.vue'
import { APPROVAL_BUCKET, APPROVAL_STATUS } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { PagoProveedorPaginacion, SupplierPaymentApproval, SupplierPaymentApprovalSettings } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import { useSupplierPaymentRefunds } from '~/composables/pago-proveedor/useSupplierPaymentRefunds'
import { UButton } from '#components'

const { showError, showSuccess } = useModal()
const { pendingCount: refundPendingCount, load: loadRefunds, changeBucket: changeRefundBucket } = useSupplierPaymentRefunds()
const rows = ref<SupplierPaymentApproval[]>([])
const selected = ref<SupplierPaymentApproval | null>(null)
const loading = ref(false)
const search = ref('')
const pendingCount = ref(0)
const typeFilter = ref<'todos' | 'pago' | 'reemb'>('todos')
const bucket = ref<typeof APPROVAL_BUCKET[keyof typeof APPROVAL_BUCKET]>(APPROVAL_BUCKET.PENDING)
const typeChips = [
  { key: 'todos' as const, label: 'Todos' },
  { key: 'pago' as const, label: 'Pago a proveedor' },
  { key: 'reemb' as const, label: 'Reembolsos' }
]
const refundBucket = computed(() => (bucket.value === APPROVAL_BUCKET.APPROVED ? 'aprobado' : 'solicitado') as 'solicitado' | 'aprobado')
const totalPending = computed(() => pendingCount.value + refundPendingCount.value)
const pagination = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const filters = ref({ status: APPROVAL_STATUS.ALL })
const settingsOpen = ref(false)
const tariffsOpen = ref(false)
const savingTariffs = ref(false)
const tariffLabels = ['bajo', 'medio', 'alto']
const tariffs = reactive({ usd: [100, 120, 150], rmb: [50, 90, 120], admin: 30 })
const savingSettings = ref(false)
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
  { key: 'tolerance' as const, label: 'Tolerancia (USD)' },
  { key: 'exception_limit' as const, label: 'Límite excepcional (USD)' },
  { key: 'verify_hours' as const, label: 'Plazo para validar (horas)' },
  { key: 'remedy_days' as const, label: 'Plazo para subsanar (días)' },
  { key: 'undo_minutes' as const, label: 'Deshacer sin aviso (minutos)' },
  { key: 'undo_hours' as const, label: 'Deshacer avisando (horas)' },
  { key: 'decision_hours' as const, label: 'Decisión de Ventas (horas)' }
]

const filterConfig = computed(() => [{
  key: 'status',
  label: 'Estado',
  type: 'select',
  options: bucket.value === APPROVAL_BUCKET.APPROVED
    ? [
        { value: APPROVAL_STATUS.ALL, label: 'Todos' },
        { value: APPROVAL_STATUS.APPROVED, label: 'Aprobado' }
      ]
    : [
        { value: APPROVAL_STATUS.ALL, label: 'Todos' },
        { value: APPROVAL_STATUS.PENDING, label: 'Pendiente' },
        { value: APPROVAL_STATUS.TO_COLLECT, label: 'Por cobrar' }
      ]
}])

const columns = computed<TableColumn<SupplierPaymentApproval>[]>(() => [
  { accessorKey: 'order_number', header: 'N.° de orden' },
  { accessorKey: 'client_name', header: 'Cliente' },
  { accessorKey: 'consolidation', header: 'Consolidado' },
  { accessorKey: 'supplier_code', header: 'Proveedor', cell: ({ row }) => h('div', [
    h('div', { class: 'font-semibold' }, row.original.supplier_code || '—'),
    h('div', { class: 'text-xs text-gray-500' }, row.original.supplier_name || row.original.product || '')
  ]) },
  { accessorKey: 'request_code', header: 'Código de solicitud', cell: ({ row }) => row.original.request_code || 'Pendiente' },
  { accessorKey: 'payment_type', header: 'Tipo de pago', cell: ({ row }) => row.original.currency === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T' },
  { accessorKey: 'charged_amount', header: 'Importe', cell: ({ row }) => `$${Number(row.original.charged_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
  { accessorKey: 'deposits', header: 'Depósito', cell: ({ row }) => depositCell(row.original) },
  { accessorKey: 'deadline_text', header: bucket.value === APPROVAL_BUCKET.APPROVED ? 'Aprobado el' : 'Antigüedad / plazo', cell: ({ row }) => bucket.value === APPROVAL_BUCKET.APPROVED ? formatDate(row.original.approved_at) : (row.original.deadline_text || '—') },
  { accessorKey: 'status_label', header: 'Estado', cell: ({ row }) => h('span', { class: row.original.status === APPROVAL_STATUS.APPROVED ? 'font-semibold text-green-700' : 'font-semibold text-red-600' }, row.original.status_label) },
  { accessorKey: 'observation', header: 'Observaciones', cell: ({ row }) => h('span', { class: row.original.observation_for_admin && row.original.status !== APPROVAL_STATUS.APPROVED ? 'text-sm text-red-600' : 'text-sm text-gray-500' }, row.original.observation) },
  { accessorKey: 'id', header: '', cell: ({ row }) => h(UButton, { size: 'xs', color: 'primary', variant: 'soft', onClick: () => { selected.value = row.original } }, () => 'Ver') }
])

function depositCell(row: SupplierPaymentApproval) {
  if (!row.deposits.length) return '—'
  if (row.deposits.length === 1) return `${row.deposits[0].bank_label} · ${row.deposits[0].paid_on || ''}`
  return `${row.deposits.length} depósitos`
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('es-PE') : '—'
}

async function load() {
  loading.value = true
  try {
    const response = await PagoProveedorService.listApprovals({
      bucket: bucket.value,
      status: filters.value.status,
      search: search.value,
      page: pagination.value.current_page,
      per_page: pagination.value.per_page
    })
    rows.value = response.data || []
    pagination.value = response.pagination
    pendingCount.value = response.pending_count || 0
    if (response.settings) Object.assign(settingsForm, response.settings)
  } catch (error: any) {
    showError('Aprobación', error?.data?.message || 'No se pudieron cargar los pagos.')
  } finally {
    loading.value = false
  }
}

function changeBucket(next: typeof APPROVAL_BUCKET[keyof typeof APPROVAL_BUCKET]) {
  bucket.value = next
  filters.value = { status: APPROVAL_STATUS.ALL }
  pagination.value.current_page = 1
  changeRefundBucket(next === APPROVAL_BUCKET.APPROVED ? 'aprobado' : 'solicitado')
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
    showError('Tolerancia y plazos', error?.data?.message || 'No se pudo guardar.')
  } finally {
    savingSettings.value = false
  }
}

async function openTariffs() {
  try {
    const response = await PagoProveedorService.getTariffs()
    if (response.data) {
      tariffs.usd = [...response.data.usd]
      tariffs.rmb = [...response.data.rmb]
      tariffs.admin = response.data.admin
    }
  } catch {
    // Se muestran los valores de fábrica si la lectura falla.
  }
  tariffsOpen.value = true
}

async function saveTariffs() {
  savingTariffs.value = true
  try {
    await PagoProveedorService.saveTariffs({ usd: [...tariffs.usd], rmb: [...tariffs.rmb], admin: tariffs.admin })
    tariffsOpen.value = false
    showSuccess('Comisiones', 'Las tarifas quedaron guardadas.')
  } catch (error: any) {
    showError('Comisiones', error?.data?.message || 'No se pudo guardar.')
  } finally {
    savingTariffs.value = false
  }
}

onMounted(async () => {
  await Promise.all([load(), loadRefunds()])
})
</script>
