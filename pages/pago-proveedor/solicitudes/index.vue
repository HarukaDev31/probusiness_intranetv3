<template>
  <div class="md:p-6">
    <header v-if="profile !== SUPPLIER_PAYMENT_PROFILE.WAREHOUSE" class="mb-4">
      <h1 class="text-xl font-bold text-gray-800">Pago a Proveedor</h1>
      <p v-if="profile === SUPPLIER_PAYMENT_PROFILE.ADMINISTRATION" class="mt-1 text-sm text-gray-500">Primero se valida el depósito. Después se aprueba el pago y, si es en dólares, se transfiere al proveedor.</p>
      <p v-else-if="profile === SUPPLIER_PAYMENT_PROFILE.SALES" class="mt-1 text-sm text-gray-500">Lo que te toca hacer está en Mis pendientes. El resto del pago lo ves en el detalle, en solo lectura.</p>
    </header>
    <div v-if="profile === SUPPLIER_PAYMENT_PROFILE.ADMINISTRATION">
      <div class="mb-4 flex gap-1.5 border-b border-gray-200">
        <button
          type="button"
          class="border-b-2 px-3.5 py-2 text-sm font-semibold"
          :class="adminTab === ADMIN_TAB.APPROVAL ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'"
          @click="adminTab = ADMIN_TAB.APPROVAL"
        >
          Aprobación de pagos
        </button>
        <button
          type="button"
          class="border-b-2 px-3.5 py-2 text-sm font-semibold"
          :class="adminTab === ADMIN_TAB.USD ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'"
          @click="adminTab = ADMIN_TAB.USD"
        >
          Pagos en dólares
        </button>
        <button
          type="button"
          class="border-b-2 px-3.5 py-2 text-sm font-semibold"
          :class="adminTab === ADMIN_TAB.REFUNDS ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'"
          @click="adminTab = ADMIN_TAB.REFUNDS"
        >
          Reembolsos
        </button>
      </div>
      <SupplierPaymentApprovals v-if="adminTab === ADMIN_TAB.APPROVAL" />
      <SupplierPaymentExecutions v-else-if="adminTab === ADMIN_TAB.USD" />
      <SupplierPaymentRefunds v-else-if="adminTab === ADMIN_TAB.REFUNDS" />
    </div>
    <section v-else-if="profile === SUPPLIER_PAYMENT_PROFILE.WAREHOUSE">
      <SupplierPaymentYuan />
    </section>
    <template v-else-if="profile === SUPPLIER_PAYMENT_PROFILE.SALES">
    <div class="mb-4 flex gap-1.5 border-b border-gray-200">
      <button
        type="button"
        class="border-b-2 px-3.5 py-2 text-sm font-semibold"
        :class="tab === INBOX_TAB.PENDING ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'"
        @click="tab = INBOX_TAB.PENDING"
      >
        Mis pendientes <span class="ml-1 rounded-full bg-primary-500 px-1.5 text-[11px] text-white">{{ pendingRows.length }}</span>
      </button>
      <button
        type="button"
        class="border-b-2 px-3.5 py-2 text-sm font-semibold"
        :class="tab === INBOX_TAB.ALL ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'"
        @click="tab = INBOX_TAB.ALL"
      >
        Todas las solicitudes
      </button>
    </div>

    <div v-if="tab === INBOX_TAB.PENDING" class="space-y-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="chip in visibleChips"
          :key="chip.key"
          type="button"
          class="rounded-full border px-3 py-1 text-xs"
          :class="taskFilter === chip.key ? 'border-primary-500 bg-primary-50 font-semibold text-gray-900' : 'border-gray-200 bg-white text-gray-700'"
          @click="taskFilter = chip.key"
        >
          {{ chip.label }} <b class="ml-1 text-primary-600">{{ chip.count }}</b>
        </button>
      </div>
      <div v-if="loading" class="space-y-2">
        <div v-for="row in 4" :key="row" class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3.5 py-3">
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-2/3" />
            <USkeleton class="h-3 w-1/2" />
          </div>
          <USkeleton class="h-8 w-16 rounded-md" />
        </div>
      </div>
      <p v-else-if="!visiblePending.length" class="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
        No tienes pendientes{{ taskFilter !== SALES_TASK.ALL ? ' en este grupo' : '' }}.
        <span class="mt-1 block text-gray-400">Cuando un pago necesite datos, un comprobante o una confirmación, aparece aquí.</span>
      </p>
      <NuxtLink
        v-for="row in visiblePending"
        :key="`${row.requestId}-${row.provider.id}`"
        :to="`/pago-proveedor/solicitudes/${row.requestId}`"
        class="mb-2 block rounded-xl border border-gray-200 border-l-4 bg-white px-4 py-3.5 transition hover:border-primary-300 hover:shadow-sm"
        :class="row.provider.sales_task === SALES_TASK.OBSERVED ? 'border-l-red-600' : 'border-l-primary-500'"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-900">{{ taskText(row.provider) }}</p>
            <p class="mt-1 text-xs text-gray-500">
              {{ row.clientName || 'Cliente' }} · {{ row.consolidation || 'Sin consolidado' }} · {{ supplierLabel(row.provider) }} · {{ paymentLabel(row.provider) }}
            </p>
          </div>
          <span class="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">{{ stageLabel(row.provider.stage) }}</span>
        </div>
        <SupplierPaymentSteps class="mt-3" :current="row.provider.stage" />
      </NuxtLink>
      <section v-if="otherAreaRows.length" class="pt-2">
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">En curso en otras áreas · solo lectura</h2>
        <div class="space-y-2">
          <NuxtLink
            v-for="row in otherAreaRows"
            :key="`other-${row.provider.id}`"
            :to="`/pago-proveedor/solicitudes/${row.requestId}`"
            class="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm hover:border-gray-300"
          >
            <span><strong class="text-gray-800">{{ row.clientName }}</strong> <span class="text-gray-500">· {{ supplierLabel(row.provider) }} · {{ stageLabel(row.provider.stage) }}</span></span>
            <span class="text-xs font-semibold text-primary-600">Ver</span>
          </NuxtLink>
        </div>
      </section>
    </div>

    <DataTable
      v-else
      title="Todas las solicitudes"
      subtitle="Pago a proveedor"
      :show-title="true"
      icon="i-heroicons-clipboard-document-list"
      :data="allRows"
      :columns="columns"
      :loading="loading"
      :current-page="pagination.current_page"
      :total-pages="pagination.last_page"
      :total-records="pagination.total"
      :items-per-page="pagination.per_page"
      :primary-search-value="search"
      :show-primary-search="true"
      :show-primary-search-label="false"
      primary-search-placeholder="Cliente, código de proveedor o N.°"
      :show-filters="false"
      :show-export="false"
      empty-state-message="Todavía no hay solicitudes."
      @update:primary-search="onSearch"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
    />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { PagoProveedorPaginacion, PagoProveedorSolicitud, SupplierPaymentProviderRow } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import {
  INBOX_TAB,
  PAYMENT_SHAPE,
  PROVIDER_STATUS,
  REQUEST_OWNER,
  REQUEST_STAGE,
  SALES_TASK,
  ADMIN_TAB,
  APPROVAL_STATUS,
  SUPPLIER_CURRENCY,
  SUPPLIER_PAYMENT_PROFILE
} from '~/constants/supplierPayment'
import { useModal } from '~/composables/commons/useModal'
import { useSupplierPaymentProfile } from '~/composables/pago-proveedor/useSupplierPaymentProfile'
import SupplierPaymentApprovals from '~/components/pago-proveedor/SupplierPaymentApprovals.vue'
import SupplierPaymentExecutions from '~/components/pago-proveedor/SupplierPaymentExecutions.vue'
import SupplierPaymentRefunds from '~/components/pago-proveedor/SupplierPaymentRefunds.vue'
import SupplierPaymentYuan from '~/components/pago-proveedor/SupplierPaymentYuan.vue'
import SupplierPaymentSteps from '~/components/pago-proveedor/SupplierPaymentSteps.vue'
import { UButton } from '#components'

interface RequestLine {
  requestId: number
  orderNumber: number
  clientName: string | null
  consolidation: string | null
  createdAt: string | null
  provider: SupplierPaymentProviderRow
}

const { showError } = useModal()
const { profile } = useSupplierPaymentProfile()
const requests = ref<PagoProveedorSolicitud[]>([])
const loading = ref(false)
const search = ref('')
const tab = ref<typeof INBOX_TAB[keyof typeof INBOX_TAB]>(INBOX_TAB.PENDING)
const adminTab = ref<typeof ADMIN_TAB[keyof typeof ADMIN_TAB]>(ADMIN_TAB.APPROVAL)
const taskFilter = ref<typeof SALES_TASK[keyof typeof SALES_TASK]>(SALES_TASK.ALL)
const pagination = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })

const lines = computed<RequestLine[]>(() => requests.value.flatMap((request) => (request.providers || []).map((provider) => ({
  requestId: request.id,
  orderNumber: request.numero_orden,
  clientName: request.cliente_nombre,
  consolidation: request.consolidado,
  createdAt: request.creado_en,
  provider
}))))

const pendingRows = computed(() => lines.value.filter((line) => line.provider.sales_task))
const otherAreaRows = computed(() => lines.value.filter((line) => !line.provider.sales_task && line.provider.status !== PROVIDER_STATUS.CANCELLED))
const visiblePending = computed(() => pendingRows.value.filter((line) => taskFilter.value === SALES_TASK.ALL || line.provider.sales_task === taskFilter.value))
const allRows = computed(() => lines.value)

const taskChips = computed(() => [
  { key: SALES_TASK.ALL, label: 'Todos', count: pendingRows.value.length },
  { key: SALES_TASK.PROVIDER_DATA, label: 'Datos del proveedor', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.PROVIDER_DATA).length },
  { key: SALES_TASK.RECEIPT, label: 'Registro de comprobante', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.RECEIPT).length },
  { key: SALES_TASK.OBSERVED, label: 'Observado', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.OBSERVED).length },
  { key: SALES_TASK.CONFIRMATION, label: 'Confirmación', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.CONFIRMATION).length }
])
const visibleChips = computed(() => taskChips.value.filter((chip) => chip.key === SALES_TASK.ALL || chip.count > 0 || chip.key === taskFilter.value))

function supplierLabel(provider: SupplierPaymentProviderRow) {
  return provider.supplier_name ? `${provider.supplier_code} · ${provider.supplier_name}` : (provider.supplier_code || 'Sin código')
}

function paymentLabel(provider: SupplierPaymentProviderRow) {
  return provider.currency === SUPPLIER_CURRENCY.RMB ? 'RMB / Transferencia' : 'USD / T-T'
}

function paymentShapeLabel(shape: SupplierPaymentProviderRow['payment_shape']) {
  return {
    [PAYMENT_SHAPE.SINGLE]: 'Único',
    [PAYMENT_SHAPE.CLIENT_INSTALLMENTS]: 'Cuotas',
    [PAYMENT_SHAPE.SUPPLIER_INSTALLMENTS]: '2 partes'
  }[shape]
}

function stageLabel(stage: number) {
  return {
    [REQUEST_STAGE.DATA]: 'Solicitud y datos de pago',
    [REQUEST_STAGE.VALIDATION]: 'Validación de pago',
    [REQUEST_STAGE.EXECUTION]: 'Ejecución de pago',
    [REQUEST_STAGE.CONFIRMATION]: 'Confirmación'
  }[stage] || 'Solicitud y datos de pago'
}

function statusLabel(status: string) {
  return {
    [PROVIDER_STATUS.IN_PROGRESS]: 'En proceso',
    [PROVIDER_STATUS.OBSERVED]: 'Observado',
    [PROVIDER_STATUS.CANCELLED]: 'Anulado',
    [PROVIDER_STATUS.COMPLETED]: 'Completado'
  }[status] || status
}

function taskText(provider: SupplierPaymentProviderRow) {
  if (provider.approval_status === APPROVAL_STATUS.TO_COLLECT) {
    const amount = Number(provider.collect_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
    return `Cobrar la diferencia de $${amount} al cliente y registrar el comprobante.`
  }
  if (provider.sales_task === SALES_TASK.CONFIRMATION) {
    if (provider.stage === REQUEST_STAGE.CONFIRMATION && provider.currency === 'RMB' && provider.payment_shape === 'supplier_installments' && !provider.second_payment_choice) {
      return 'Decide si el pago 2 al proveedor se va a realizar.'
    }
    if (provider.exchange_result === 'to_collect') return 'Registra el voucher de la diferencia de cambio.'
    if (provider.exchange_result === 'to_refund') return 'Hay diferencia de cambio a favor del cliente. El reembolso lo aprueba Administración.'
    return provider.stage === REQUEST_STAGE.CONFIRMATION
      ? 'Decide si la cuota 2 se va a realizar.'
      : 'Confirma el tipo de cambio del día para cobrar la cuota 2.'
  }
  return {
    [SALES_TASK.PROVIDER_DATA]: 'Registrar los datos del proveedor.',
    [SALES_TASK.RECEIPT]: 'Registrar el comprobante de pago.',
    [SALES_TASK.OBSERVED]: 'Subsanar la observación.',
    [SALES_TASK.CONFIRMATION]: 'Resolver la confirmación.'
  }[provider.sales_task || ''] || 'Pendiente de Ventas.'
}

const columns: TableColumn<RequestLine>[] = [
  { accessorKey: 'orderNumber', header: 'N.°' },
  { accessorKey: 'createdAt', header: 'Fecha', cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString('es-PE') : '—' },
  { accessorKey: 'consolidation', header: 'Consolidado' },
  { accessorKey: 'clientName', header: 'Cliente' },
  { accessorKey: 'provider', header: 'Proveedor', cell: ({ row }) => supplierLabel(row.original.provider) },
  { accessorKey: 'requestCode', header: 'Código de solicitud', cell: ({ row }) => row.original.provider.request_code || '—' },
  { accessorKey: 'paymentShape', header: 'Forma de pago', cell: ({ row }) => paymentShapeLabel(row.original.provider.payment_shape) },
  { accessorKey: 'paymentType', header: 'Tipo de pago', cell: ({ row }) => paymentLabel(row.original.provider) },
  { accessorKey: 'stage', header: 'Etapa', cell: ({ row }) => `${row.original.provider.stage}. ${stageLabel(row.original.provider.stage)}` },
  { accessorKey: 'status', header: 'Estado', cell: ({ row }) => statusLabel(row.original.provider.status) },
  { accessorKey: 'owner', header: 'Responsable', cell: ({ row }) => row.original.provider.owner === REQUEST_OWNER.SALES ? 'Ventas' : 'Otra área' },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => h(UButton, {
      size: 'xs',
      color: 'primary',
      variant: 'ghost',
      label: 'Ver',
      onClick: () => navigateTo(`/pago-proveedor/solicitudes/${row.original.requestId}`)
    })
  }
]

async function loadRequests() {
  loading.value = true
  try {
    const response = await PagoProveedorService.listarSolicitudes({
      search: search.value,
      page: pagination.value.current_page,
      per_page: pagination.value.per_page
    })
    requests.value = response.data
    pagination.value = response.pagination
  } catch (error: any) {
    showError('Solicitudes', error.message || 'No se pudo cargar el listado.')
  } finally {
    loading.value = false
  }
}

function onSearch(value: string) {
  search.value = value
  pagination.value.current_page = 1
  loadRequests()
}

function onPage(page: number) {
  pagination.value.current_page = page
  loadRequests()
}

function onPageSize(size: number) {
  pagination.value.per_page = size
  pagination.value.current_page = 1
  loadRequests()
}

watch(profile, (value) => {
  if (value === SUPPLIER_PAYMENT_PROFILE.SALES) loadRequests()
}, { immediate: true })
</script>
