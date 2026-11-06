<template>
  <div class="md:p-6">
    <header class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-highlighted">Pago a Proveedor</h1>
        <p v-if="profile === SUPPLIER_PAYMENT_PROFILE.SALES" class="mt-1 text-sm text-muted">Lo que te toca hacer está en Mis pendientes. El resto del pago lo ves en el detalle, en solo lectura.</p>
      </div>
      <div v-if="profile === SUPPLIER_PAYMENT_PROFILE.SALES" class="flex gap-2">
        <UButton color="neutral" variant="soft" to="/pago-proveedor/cotizaciones">Cotizaciones</UButton>
        <UButton color="primary" @click="nuevaCotizacion = true">Nueva cotización</UButton>
      </div>
    </header>
    <NuevaCotizacionModal v-if="profile === SUPPLIER_PAYMENT_PROFILE.SALES" :open="nuevaCotizacion" @close="nuevaCotizacion = false" @accepted="(codigo) => navigateTo({ path: '/pago-proveedor/cotizaciones/nueva', query: { cc: codigo } })" />
    <template v-if="profile === SUPPLIER_PAYMENT_PROFILE.SALES">
    <div class="mb-4 flex gap-1.5 border-b border-default">
      <button
        type="button"
        class="border-b-2 px-3.5 py-2 text-sm font-semibold"
        :class="tab === INBOX_TAB.PENDING ? 'border-primary text-primary' : 'border-transparent text-muted'"
        @click="tab = INBOX_TAB.PENDING"
      >
        Mis pendientes <span class="ml-1 rounded-full bg-primary px-1.5 text-[11px] text-white">{{ pendingRows.length }}</span>
      </button>
      <button
        type="button"
        class="border-b-2 px-3.5 py-2 text-sm font-semibold"
        :class="tab === INBOX_TAB.ALL ? 'border-primary text-primary' : 'border-transparent text-muted'"
        @click="tab = INBOX_TAB.ALL"
      >
        Todas las solicitudes
      </button>
    </div>

    <div v-if="tab === INBOX_TAB.PENDING" class="space-y-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="chip in taskChips"
          :key="chip.key"
          type="button"
          class="rounded-full border px-3 py-1 text-xs"
          :class="taskFilter === chip.key ? 'border-primary bg-primary/10 font-semibold text-highlighted' : 'border-default bg-default text-muted'"
          @click="taskFilter = chip.key"
        >
          {{ chip.label }} <b class="ml-1 text-primary">{{ chip.count }}</b>
        </button>
      </div>
      <div v-if="loading" class="space-y-2">
        <UCard v-for="row in 4" :key="row" variant="subtle">
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 space-y-2">
              <USkeleton class="h-4 w-2/3" />
              <USkeleton class="h-3 w-1/2" />
            </div>
            <USkeleton class="h-8 w-16 rounded-md" />
          </div>
        </UCard>
      </div>
      <UCard v-else-if="!visiblePending.length" variant="subtle" class="border-dashed px-4 py-10 text-center text-sm text-muted">
        No tienes pendientes{{ taskFilter !== SALES_TASK.ALL ? ' en este grupo' : '' }}.
        <span class="mt-1 block text-muted">Cuando un pago necesite datos, un comprobante o una confirmación, aparece aquí.</span>
      </UCard>
      <div
        v-for="row in visiblePending"
        :key="`${row.requestId}-${row.provider.id}`"
        class="mb-2 rounded-xl border border-default border-l-4 bg-default px-4 py-3.5 transition hover:border-primary hover:shadow-sm"
        :class="row.provider.sales_task === SALES_TASK.OBSERVED ? 'border-l-error' : 'border-l-primary'"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-highlighted">{{ row.clientName || 'Cliente' }}</p>
            <p class="mt-1 text-sm text-muted">{{ taskText(row.provider) }}</p>
            <p class="mt-1 text-xs text-muted">
              {{ row.consolidation || 'Sin consolidado' }} · {{ supplierLabel(row.provider) }} · {{ paymentLabel(row.provider) }}
              <template v-if="row.provider.payment_shape === PAYMENT_SHAPE.CLIENT_INSTALLMENTS"> · Cuota {{ installmentTag(row.provider) }}</template>
            </p>
            <p v-if="compromisoCuota(row.provider)" class="mt-1 text-xs font-medium text-warning">{{ compromisoCuota(row.provider) }}</p>
            <p v-if="row.provider.decision_due_text || row.provider.observe_text" class="mt-1 text-xs font-medium text-warning">
              {{ row.provider.decision_due_text || row.provider.observe_text }}
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-2">
            <UBadge color="neutral" variant="subtle" size="sm">{{ stageLabel(row.provider.stage) }}</UBadge>
            <UButton size="xs" color="primary" :to="`/pago-proveedor/solicitudes/${row.requestId}`">Abrir</UButton>
          </div>
        </div>
        <SupplierPaymentSteps class="mt-3" :current="row.provider.stage" />
      </div>
      <details v-if="otherAreaRows.length" class="pt-2" open>
        <summary class="mb-2 cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">
          En curso en otras áreas · solo lectura ({{ otherAreaRows.length }})
        </summary>
        <div class="space-y-2">
          <NuxtLink
            v-for="row in otherAreaRows"
            :key="`other-${row.provider.id}`"
            :to="`/pago-proveedor/solicitudes/${row.requestId}`"
            class="flex items-center justify-between rounded-xl border border-default bg-default px-4 py-3 text-sm hover:border-primary"
          >
            <span>
              <strong class="text-highlighted">{{ row.clientName }}</strong>
              <span class="text-muted"> · {{ supplierLabel(row.provider) }} · En manos de {{ ownerLabel(row.provider) }}</span>
            </span>
            <span class="flex items-center gap-2">
              <UBadge color="neutral" variant="subtle" size="sm">{{ statusLabel(row.provider.status) }}</UBadge>
              <span class="text-xs text-muted">{{ stageLabel(row.provider.stage) }}</span>
            </span>
          </NuxtLink>
        </div>
      </details>
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
      :show-filters="true"
      :filter-config="filtrosConfig"
      :filters-value="filtros"
      :show-export="false"
      empty-state-message="Todavía no hay solicitudes."
      @update:primary-search="onSearch"
      @page-change="onPage"
      @items-per-page-change="onPageSize"
      @filter-change="onFilter"
      @clear-filters="onClearFilters"
    />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/types/data-table'
import type { PagoProveedorPaginacion, PagoProveedorSolicitud, SupplierPaymentProviderRow } from '~/types/pago-proveedor'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import {
  INBOX_TAB,
  PAYMENT_SHAPE,
  PROVIDER_STATUS,
  REQUEST_OWNER,
  REQUEST_STAGE,
  SALES_TASK,
  APPROVAL_STATUS,
  SUPPLIER_CURRENCY,
  SUPPLIER_PAYMENT_PROFILE
} from '~/constants/supplierPayment'
import { useModal } from '~/composables/commons/useModal'
import { useSupplierPaymentProfile } from '~/composables/pago-proveedor/useSupplierPaymentProfile'
import SupplierPaymentSteps from '~/components/pago-proveedor/SupplierPaymentSteps.vue'
import NuevaCotizacionModal from '~/components/pago-proveedor/NuevaCotizacionModal.vue'
import { UBadge, UButton } from '#components'

interface RequestLine {
  groupIndex: number
  groupSize: number
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
const taskFilter = ref<typeof SALES_TASK[keyof typeof SALES_TASK]>(SALES_TASK.ALL)
const nuevaCotizacion = ref(false)
const pagination = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const filtros = ref<Record<string, string>>({
  consolidado: 'todos',
  tipo_pago: 'todos',
  etapa: 'todos',
  estado: 'todos'
})

const lines = computed<RequestLine[]>(() => requests.value.flatMap((request) => (request.providers || []).map((provider, groupIndex) => ({
  groupIndex,
  groupSize: request.providers.length,
  requestId: request.id,
  orderNumber: request.numero_orden,
  clientName: request.cliente_nombre,
  consolidation: request.consolidado,
  createdAt: request.creado_en,
  provider
}))))

function isCuota2Task(provider: SupplierPaymentProviderRow) {
  if (provider.sales_task !== SALES_TASK.CONFIRMATION) return false
  if (provider.second_installment_on) return true
  if (provider.payment_shape === PAYMENT_SHAPE.CLIENT_INSTALLMENTS && provider.stage === REQUEST_STAGE.CONFIRMATION) return true
  if (provider.payment_shape === PAYMENT_SHAPE.SUPPLIER_INSTALLMENTS && !provider.second_payment_choice) return true
  return false
}

const pendingRows = computed(() => lines.value.filter((line) => line.provider.sales_task))
const otherAreaRows = computed(() => lines.value.filter((line) => !line.provider.sales_task && line.provider.status !== PROVIDER_STATUS.CANCELLED))
const visiblePending = computed(() => pendingRows.value.filter((line) => {
  if (taskFilter.value === SALES_TASK.ALL) return true
  if (taskFilter.value === SALES_TASK.INSTALLMENT_2) return isCuota2Task(line.provider)
  if (taskFilter.value === SALES_TASK.CONFIRMATION) {
    return line.provider.sales_task === SALES_TASK.CONFIRMATION && !isCuota2Task(line.provider)
  }
  return line.provider.sales_task === taskFilter.value
}))
const allRows = computed(() => lines.value)
const consolidadosDisponibles = computed(() => [...new Set(
  lines.value.map((line) => line.consolidation).filter((value): value is string => !!value && value.trim() !== '')
)].sort())

const taskChips = computed(() => [
  { key: SALES_TASK.ALL, label: 'Todos', count: pendingRows.value.length },
  { key: SALES_TASK.PROVIDER_DATA, label: 'Datos del proveedor', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.PROVIDER_DATA).length },
  { key: SALES_TASK.RECEIPT, label: 'Registro de comprobante', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.RECEIPT).length },
  { key: SALES_TASK.OBSERVED, label: 'Observado', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.OBSERVED).length },
  { key: SALES_TASK.CONFIRMATION, label: 'Confirmación final', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.CONFIRMATION && !isCuota2Task(line.provider)).length },
  { key: SALES_TASK.INSTALLMENT_2, label: 'Cuota 2', count: pendingRows.value.filter((line) => isCuota2Task(line.provider)).length }
])

const filtrosConfig = computed<FilterConfig[]>(() => [
  {
    key: 'consolidado',
    label: 'Consolidado',
    placeholder: 'Consolidado',
    options: [
      { label: 'Todos', value: 'todos' },
      ...consolidadosDisponibles.value.map((item) => ({ label: item, value: item }))
    ]
  },
  {
    key: 'tipo_pago',
    label: 'Tipo de pago',
    placeholder: 'Tipo de pago',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'RMB / Transferencia', value: 'RMB' },
      { label: 'USD / T-T', value: 'USD' }
    ]
  },
  {
    key: 'etapa',
    label: 'Etapa',
    placeholder: 'Etapa',
    options: [
      { label: 'Todas', value: 'todos' },
      { label: '1. Solicitud y datos', value: String(REQUEST_STAGE.DATA) },
      { label: '2. Validación', value: String(REQUEST_STAGE.VALIDATION) },
      { label: '3. Ejecución', value: String(REQUEST_STAGE.EXECUTION) },
      { label: '4. Confirmación', value: String(REQUEST_STAGE.CONFIRMATION) }
    ]
  },
  {
    key: 'estado',
    label: 'Estado',
    placeholder: 'Estado',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'En proceso', value: PROVIDER_STATUS.IN_PROGRESS },
      { label: 'Observado', value: PROVIDER_STATUS.OBSERVED },
      { label: 'Anulado', value: PROVIDER_STATUS.CANCELLED },
      { label: 'Completado', value: PROVIDER_STATUS.COMPLETED }
    ]
  }
])

function supplierLabel(provider: SupplierPaymentProviderRow) {
  return provider.supplier_name ? `${provider.supplier_code} · ${provider.supplier_name}` : (provider.supplier_code || 'Sin código')
}

function ownerLabel(provider: SupplierPaymentProviderRow) {
  if (provider.owner === REQUEST_OWNER.SALES) return 'Ventas'
  if (provider.stage === REQUEST_STAGE.VALIDATION) return 'Administración'
  if (provider.stage === REQUEST_STAGE.EXECUTION && provider.currency === SUPPLIER_CURRENCY.RMB) return 'Operaciones China'
  if (provider.stage === REQUEST_STAGE.EXECUTION) return 'Administración'
  return 'otra área'
}

function installmentTag(provider: SupplierPaymentProviderRow) {
  if (provider.payment_shape !== PAYMENT_SHAPE.CLIENT_INSTALLMENTS && provider.payment_shape !== PAYMENT_SHAPE.SUPPLIER_INSTALLMENTS) {
    return ''
  }
  return `${provider.current_installment || 1}/2`
}

function paymentLabel(provider: SupplierPaymentProviderRow) {
  return provider.currency === SUPPLIER_CURRENCY.RMB ? 'RMB / Transferencia' : 'USD / T-T'
}

function paymentShapeLabel(shape: SupplierPaymentProviderRow['payment_shape']) {
  return {
    [PAYMENT_SHAPE.SINGLE]: 'Único',
    [PAYMENT_SHAPE.CLIENT_INSTALLMENTS]: 'Cuotas',
    [PAYMENT_SHAPE.SUPPLIER_INSTALLMENTS]: '2 pagos'
  }[shape]
}

type PillColor = 'neutral' | 'info' | 'warning' | 'success' | 'error'

function pill(label: string | undefined, color: PillColor) {
  return h(UBadge, { label, color, variant: 'subtle', size: 'sm' })
}

function shapeColor(shape: SupplierPaymentProviderRow['payment_shape']): PillColor {
  return {
    [PAYMENT_SHAPE.SINGLE]: 'neutral',
    [PAYMENT_SHAPE.CLIENT_INSTALLMENTS]: 'warning',
    [PAYMENT_SHAPE.SUPPLIER_INSTALLMENTS]: 'info'
  }[shape] as PillColor
}

function statusColor(status: string): PillColor {
  return ({
    [PROVIDER_STATUS.OBSERVED]: 'error',
    [PROVIDER_STATUS.CANCELLED]: 'neutral',
    [PROVIDER_STATUS.COMPLETED]: 'success'
  } as Record<string, PillColor>)[status] || 'info'
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

/** RN-18: la fecha comprometida se avisa desde 2 días antes; en la cuota 2 ya en curso se muestra siempre. */
function compromisoCuota(provider: SupplierPaymentProviderRow) {
  if (!provider.second_installment_on || provider.payment_shape !== PAYMENT_SHAPE.CLIENT_INSTALLMENTS) return ''
  const hoy = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }) + 'T00:00:00')
  const [anio, mes, dia] = provider.second_installment_on.split('-').map(Number)
  const dias = Math.round((new Date(anio, mes - 1, dia).getTime() - hoy.getTime()) / 86400000)
  const enCuota2 = (provider.current_installment || 1) === 2 && provider.stage === REQUEST_STAGE.DATA
  if (!enCuota2 && ((provider.current_installment || 1) !== 1 || dias > 2)) return ''
  const texto = dias < 0 ? `venció hace ${-dias} día${dias < -1 ? 's' : ''}` : dias === 0 ? 'vence hoy' : dias <= 2 ? `vence en ${dias} día${dias > 1 ? 's' : ''}` : `faltan ${dias} días`
  return `Compromiso del cliente: ${dia}/${mes}/${anio} · ${texto}`
}

function taskText(provider: SupplierPaymentProviderRow) {
  const deadline = provider.decision_due_text || provider.observe_text
  const withDeadline = (text: string) => (deadline ? `${text} · ${deadline}` : text)

  if (provider.approval_status === APPROVAL_STATUS.TO_COLLECT) {
    const amount = Number(provider.collect_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
    return `Cobrar la diferencia de $${amount} al cliente y registrar el comprobante.`
  }
  if (provider.approval_status === 'error_registro') {
    return 'Corrige el voucher o los datos: Administración marcó un error de registro.'
  }
  if (provider.sales_task === SALES_TASK.OBSERVED) {
    const reason = provider.observe_label ? `Observado por Operaciones China: ${provider.observe_label}` : 'Subsanar la observación.'
    return withDeadline(reason)
  }
  if (provider.sales_task === SALES_TASK.CONFIRMATION) {
    if (provider.stage === REQUEST_STAGE.CONFIRMATION && provider.currency === 'RMB' && provider.payment_shape === 'supplier_installments' && !provider.second_payment_choice) {
      return withDeadline('Decidir si el pago 2 se realizará')
    }
    if (provider.exchange_result === 'to_collect') return 'Registra el voucher de la diferencia de cambio.'
    if (provider.exchange_result === 'to_refund') return 'Hay diferencia de cambio a favor del cliente. El reembolso lo aprueba Administración.'
    if (provider.stage !== REQUEST_STAGE.CONFIRMATION && provider.second_installment_on) {
      return 'Aviso: la 2.ª cuota del cliente vence pronto — recordarle su compromiso.'
    }
    return provider.stage === REQUEST_STAGE.CONFIRMATION
      ? withDeadline('Resolver para cerrar la Confirmación: Decidir la cuota 2')
      : 'Confirma el tipo de cambio del día para cobrar la cuota 2.'
  }
  return {
    [SALES_TASK.PROVIDER_DATA]: 'Registrar los datos del proveedor.',
    [SALES_TASK.RECEIPT]: 'Registrar el comprobante de pago.',
    [SALES_TASK.OBSERVED]: 'Subsanar la observación.',
    [SALES_TASK.CONFIRMATION]: 'Resolver la confirmación.'
  }[provider.sales_task || ''] || 'Pendiente de Ventas.'
}

// Los datos de la orden se muestran una vez y abarcan a todos sus proveedores.
const orderCell = {
  rowspan: { td: (cell: { row: { original: RequestLine } }) => cell.row.original.groupSize },
  class: { td: (cell: { row: { original: RequestLine } }) => cell.row.original.groupIndex ? 'hidden' : '' }
}

const columns: TableColumn<RequestLine>[] = [
  { accessorKey: 'orderNumber', header: 'N.°', meta: orderCell },
  { accessorKey: 'createdAt', header: 'Fecha', meta: orderCell, cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString('es-PE') : '—' },
  { accessorKey: 'consolidation', header: 'Consolidado', meta: orderCell },
  { accessorKey: 'clientName', header: 'Cliente', meta: orderCell, cell: ({ row }) => h('span', { class: 'block w-32 whitespace-normal' }, row.original.clientName) },
  { accessorKey: 'provider', header: 'Proveedor', cell: ({ row }) => supplierLabel(row.original.provider) },
  { accessorKey: 'requestCode', header: 'Código de solicitud', cell: ({ row }) => row.original.provider.request_code || '—' },
  { accessorKey: 'paymentShape', header: 'Forma de pago', cell: ({ row }) => pill(paymentShapeLabel(row.original.provider.payment_shape), shapeColor(row.original.provider.payment_shape)) },
  { accessorKey: 'paymentType', header: 'Tipo de pago', cell: ({ row }) => paymentLabel(row.original.provider) },
  { accessorKey: 'stage', header: 'Etapa', cell: ({ row }) => pill(`${row.original.provider.stage}. ${stageLabel(row.original.provider.stage)}`, 'info') },
  { accessorKey: 'status', header: 'Estado', cell: ({ row }) => pill(statusLabel(row.original.provider.status), statusColor(row.original.provider.status)) },
  { accessorKey: 'owner', header: 'Responsable', cell: ({ row }) => row.original.provider.owner === REQUEST_OWNER.SALES ? 'Ventas' : 'Otra área' },
  {
    accessorKey: 'actions',
    header: 'Acciones',
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
      consolidado: filtros.value.consolidado,
      tipo_pago: filtros.value.tipo_pago,
      etapa: filtros.value.etapa,
      estado: filtros.value.estado,
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

function onFilter(clave: string, valor: unknown) {
  const normalizado = valor && typeof valor === 'object' && 'value' in (valor as Record<string, unknown>)
    ? (valor as Record<string, unknown>).value
    : valor
  const texto = normalizado === null || normalizado === undefined ? '' : String(normalizado)
  filtros.value = { ...filtros.value, [clave]: texto || 'todos' }
  pagination.value.current_page = 1
  loadRequests()
}

function onClearFilters() {
  filtros.value = { consolidado: 'todos', tipo_pago: 'todos', etapa: 'todos', estado: 'todos' }
  pagination.value.current_page = 1
  loadRequests()
}

watch(profile, (value) => {
  if (value === SUPPLIER_PAYMENT_PROFILE.SALES) loadRequests()
  if (value === SUPPLIER_PAYMENT_PROFILE.ADMINISTRATION) navigateTo('/pago-proveedor/aprobacion-pagos', { replace: true })
  if (value === SUPPLIER_PAYMENT_PROFILE.WAREHOUSE) navigateTo('/pago-proveedor/pagos-yuanes', { replace: true })
}, { immediate: true })
</script>
