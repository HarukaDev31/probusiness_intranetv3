<template>
  <div class="supplier-payment-requests md:p-6">
    <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <PageHeader title="Solicitudes" subtitle="Pago a proveedor" icon="i-heroicons-clipboard-document-list" :hide-back-button="true" align-subtitle />
      <div v-if="profile === SUPPLIER_PAYMENT_PROFILE.SALES" class="flex flex-wrap items-center gap-2">
        <!-- #1743: el plazo por defecto de los pendientes se ve y se cambia desde aquí. -->
        <UButton
          color="neutral"
          variant="soft"
          icon="i-heroicons-cog-6-tooth"
          class="h-11 font-normal"
          :label="`Plazo de pendientes · ${plazoTareasHoras} h`"
          title="Configurar el plazo por defecto de los pendientes"
          @click="abrirPlazoTareas"
        />
        <UButton label="Nueva cotización" icon="i-heroicons-plus" color="primary" class="h-11 font-normal" @click="nuevaCotizacion = true" />
      </div>
    </header>
    <SupplierPaymentWindow
      v-if="profile === SUPPLIER_PAYMENT_PROFILE.SALES"
      :open="plazoTareasAbierto"
      title="Plazo de pendientes"
      subtitle="Fecha límite por defecto de las tareas de Ventas que no tienen un plazo propio (registrar datos, comprobante, diferencia de cambio…). Se cuenta desde que se crea la solicitud o desde el último cambio."
      @close="plazoTareasAbierto = false"
    >
      <label class="block text-sm text-muted">Plazo (horas)
        <UInput v-model.number="plazoTareasBorrador" type="number" min="1" max="240" class="mt-1 w-full" />
      </label>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="() => { plazoTareasAbierto = false }">Cancelar</UButton>
        <UButton color="primary" :loading="guardandoPlazoTareas" @click="guardarPlazoTareas">Guardar</UButton>
      </template>
    </SupplierPaymentWindow>
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
      <!-- #1732: chips de filtro + vista Tablero | Lista; ambas ordenan por fecha límite. -->
      <div class="flex flex-wrap items-center justify-between gap-2">
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
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <label v-if="pendingView === 'list'" class="flex items-center gap-1.5 text-xs text-muted">
            Orden:
            <USelect v-model="listOrder" :items="listOrderOptions" size="sm" class="w-36" aria-label="Orden de la lista" />
          </label>
          <div class="inline-flex rounded-lg bg-elevated p-0.5" role="group" aria-label="Vista de mis pendientes">
            <button
              v-for="view in pendingViews"
              :key="view.value"
              type="button"
              class="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs"
              :class="pendingView === view.value ? 'bg-default font-semibold text-highlighted shadow-sm' : 'text-muted'"
              :aria-pressed="pendingView === view.value"
              @click="setPendingView(view.value)"
            >
              <UIcon :name="view.icon" class="size-4" />{{ view.label }}
            </button>
          </div>
        </div>
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

      <!-- Vista Tablero: 4 columnas por fecha límite (scroll horizontal en pantallas angostas). -->
      <div v-else-if="pendingView === 'board'" class="-mx-1 overflow-x-auto px-1 pb-2">
        <div class="grid min-w-[1000px] grid-cols-4 gap-3">
          <section v-for="column in boardColumns" :key="column.key" class="flex flex-col gap-3 rounded-xl bg-elevated p-3">
            <header class="flex items-center justify-between text-xs font-bold uppercase tracking-wide" :class="bucketStyle[column.key].title">
              <span class="flex items-center gap-1">
                <UIcon v-if="column.key === 'overdue'" name="i-heroicons-exclamation-triangle" class="size-4" />{{ column.label }}
              </span>
              <span class="rounded-full bg-default px-2 py-0.5 text-highlighted">{{ column.rows.length }}</span>
            </header>
            <p v-if="!column.rows.length" class="py-6 text-center text-xs text-muted">Sin pendientes</p>
            <article
              v-for="row in column.rows"
              :key="`${row.requestId}-${row.provider.id}`"
              class="flex flex-col gap-1.5 rounded-lg border-t-4 bg-default p-3 shadow-sm"
              :class="bucketStyle[column.key].border"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white dark:bg-slate-200 dark:text-slate-900">{{ row.provider.request_code || `N.° ${row.orderNumber}` }}</span>
                <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="bucketStyle[column.key].chip">{{ boardTime(row) }}</span>
              </div>
              <p class="truncate text-sm font-bold text-highlighted" :title="row.clientName || ''">{{ row.clientName || 'Cliente' }}</p>
              <p class="truncate text-xs text-muted">C{{ consolidadoNumero(row.consolidation) || '—' }} · {{ supplierLabel(row.provider) }} · {{ row.provider.currency }}</p>
              <p class="text-sm" :class="row.provider.sales_task === SALES_TASK.OBSERVED ? 'text-error' : 'text-default'">
                <b v-if="row.provider.sales_task === SALES_TASK.OBSERVED">Observado: </b>{{ actionText(row.provider) }}
                <UBadge v-if="row.provider.payment_shape === PAYMENT_SHAPE.CLIENT_INSTALLMENTS" color="warning" variant="subtle" size="sm" class="ml-1 align-middle">Cuota {{ installmentTag(row.provider) }}</UBadge>
              </p>
              <div class="mt-1 flex items-center justify-between gap-2">
                <UBadge color="info" variant="subtle" size="sm">{{ row.provider.stage }}. {{ stageShort(row.provider.stage) }}</UBadge>
                <UButton size="sm" color="primary" :to="`/pago-proveedor/solicitudes/${row.requestId}`">Abrir</UButton>
              </div>
            </article>
          </section>
        </div>
      </div>

      <!-- Vista Lista: secciones por fecha límite; cada fila con plazo, identidad + acción, etapa y Abrir. -->
      <div v-else class="space-y-3">
        <template v-for="section in listSections" :key="section.key">
          <div class="flex items-center gap-2 pt-1 text-xs font-bold uppercase tracking-wide" :class="bucketStyle[section.key].title">
            <UIcon v-if="section.key === 'overdue'" name="i-heroicons-exclamation-triangle" class="size-4" />
            {{ section.label }}
            <span class="text-highlighted">{{ section.rows.length }}</span>
            <span class="h-px flex-1 bg-default" />
          </div>
          <div
            v-for="row in section.rows"
            :key="`${row.requestId}-${row.provider.id}`"
            class="flex flex-col overflow-hidden rounded-xl border border-default bg-default transition hover:shadow-sm md:flex-row md:items-stretch"
          >
            <div class="flex shrink-0 flex-col justify-center border-l-4 px-5 py-3 md:w-52" :class="bucketStyle[section.key].block">
              <p class="text-base font-bold leading-tight">{{ listDeadline(row).title }}</p>
              <p class="mt-0.5 text-xs opacity-80">{{ listDeadline(row).detail }}</p>
            </div>
            <div class="min-w-0 flex-1 px-5 py-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white dark:bg-slate-200 dark:text-slate-900">{{ row.provider.request_code || `N.° ${row.orderNumber}` }}</span>
                <span class="text-sm font-bold text-highlighted">{{ row.clientName || 'Cliente' }}</span>
                <UBadge v-if="row.provider.payment_shape === PAYMENT_SHAPE.CLIENT_INSTALLMENTS" color="warning" variant="subtle" size="sm">Cuota {{ installmentTag(row.provider) }}</UBadge>
                <UBadge v-if="row.provider.sales_task === SALES_TASK.OBSERVED" color="error" variant="subtle" size="sm">Observado</UBadge>
              </div>
              <p class="mt-1 text-sm font-semibold" :class="row.provider.sales_task === SALES_TASK.OBSERVED ? 'text-error' : 'text-highlighted'">
                {{ actionText(row.provider, true) }}
              </p>
              <p class="mt-0.5 text-xs text-muted">
                Consolidado {{ consolidadoNumero(row.consolidation) || '—' }} · {{ supplierLabel(row.provider) }} · {{ paymentLabel(row.provider) }}
              </p>
            </div>
            <div class="flex items-center gap-4 px-5 pb-3 md:py-3">
              <div class="w-full md:w-56">
                <div class="flex gap-1" :aria-label="`Etapa ${row.provider.stage} de 4`">
                  <span
                    v-for="n in 4"
                    :key="n"
                    class="h-1.5 flex-1 rounded-full"
                    :class="n < row.provider.stage ? 'bg-success/70' : n === row.provider.stage ? 'bg-primary' : 'bg-accented'"
                  />
                </div>
                <p class="mt-1.5 text-xs font-semibold text-highlighted">{{ row.provider.stage }}. {{ stageShort(row.provider.stage) }}</p>
              </div>
              <UButton size="md" color="primary" class="shrink-0" :to="`/pago-proveedor/solicitudes/${row.requestId}`">Abrir</UButton>
            </div>
          </div>
        </template>
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
              <span class="text-muted"> · {{ supplierLabel(row.provider) }} · {{ waitingText(row.provider) }}</span>
            </span>
            <span class="flex items-center gap-2">
              <UBadge color="neutral" variant="subtle" size="sm">{{ statusLabel(row.provider.status) }}</UBadge>
              <span class="text-xs text-muted">{{ stageLabel(row.provider.stage) }}</span>
            </span>
          </NuxtLink>
        </div>
      </details>
    </div>

    <div v-else class="space-y-4">
      <form class="grid w-full gap-3 rounded-xl border border-default bg-default p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto]" @submit.prevent="aplicarFiltros">
        <UFormField label="Buscar cliente o código de solicitud" :ui="{ label: 'text-[11px] font-semibold uppercase text-muted' }">
          <UInput v-model="borrador.search" icon="i-heroicons-magnifying-glass" placeholder="Ej: María Torres, PE¥01" class="w-full" />
        </UFormField>
        <UFormField v-for="filtro in filtrosConfig" :key="filtro.key" :label="filtro.label" :ui="{ label: 'text-[11px] font-semibold uppercase text-muted' }">
          <USelect v-model="borrador[filtro.key]" :items="filtro.options" value-key="value" label-key="label" class="w-full lg:w-44" />
        </UFormField>
        <div class="flex items-end gap-2">
          <UButton type="submit" color="neutral" variant="outline" label="Aplicar" />
          <UButton color="neutral" variant="outline" label="Limpiar" @click="onClearFilters" />
        </div>
      </form>

      <DataTable
        class="pp-tabla"
        filters-layout="inline"
        :data="allRows"
        :columns="columns"
        :loading="loading"
        :current-page="pagination.current_page"
        :total-pages="pagination.last_page"
        :total-records="pagination.total"
        :items-per-page="pagination.per_page"
        :show-primary-search="false"
        :show-filters="false"
        :show-export="false"
        empty-state-message="Todavía no hay solicitudes."
        @page-change="onPage"
        @items-per-page-change="onPageSize"
      />
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import NuevaCotizacionModal from '~/components/pago-proveedor/NuevaCotizacionModal.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
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

const { showError, showSuccess } = useModal()
const { profile } = useSupplierPaymentProfile()
const requests = ref<PagoProveedorSolicitud[]>([])
const loading = ref(false)
const search = ref('')
const tab = ref<typeof INBOX_TAB[keyof typeof INBOX_TAB]>(INBOX_TAB.PENDING)
const taskFilter = ref<typeof SALES_TASK[keyof typeof SALES_TASK]>(SALES_TASK.ALL)
const nuevaCotizacion = ref(false)
// #1742/#1743: plazo por defecto (48 h) de las tareas de Ventas sin plazo propio.
const plazoTareasHoras = ref(48)
const plazoTareasBorrador = ref(48)
const plazoTareasAbierto = ref(false)
const guardandoPlazoTareas = ref(false)
const pagination = ref<PagoProveedorPaginacion>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const filtros = ref<Record<string, string>>({
  consolidado: 'todos',
  tipo_pago: 'todos',
  etapa: 'todos',
  estado: 'todos'
})
const borrador = ref<Record<string, string>>({ search: '', ...filtros.value })

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
// #1745: los completados ya no están «en curso» (salvo que quede un reembolso abierto: lo dice waiting_on).
const otherAreaRows = computed(() => lines.value.filter((line) => !line.provider.sales_task
  && line.provider.status !== PROVIDER_STATUS.CANCELLED
  && (line.provider.status !== PROVIDER_STATUS.COMPLETED || !!line.provider.waiting_on)))
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
  { key: SALES_TASK.INSTALLMENT_2, label: 'Cuota 2', count: pendingRows.value.filter((line) => isCuota2Task(line.provider)).length },
  { key: SALES_TASK.CONFIRMATION, label: 'Confirmación final', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.CONFIRMATION && !isCuota2Task(line.provider)).length },
  { key: SALES_TASK.OBSERVED, label: 'Observado', count: pendingRows.value.filter((line) => line.provider.sales_task === SALES_TASK.OBSERVED).length }
])

/* ---------- #1732: Mis pendientes en Tablero / Lista, por fecha límite ---------- */
type PendingView = 'board' | 'list'
type Bucket = 'overdue' | 'today' | 'tomorrow' | 'later'
const PENDING_VIEW_KEY = 'pago-proveedor:mis-pendientes:vista'
const LIMA = 'America/Lima'
const pendingViews: Array<{ value: PendingView; label: string; icon: string }> = [
  { value: 'board', label: 'Tablero', icon: 'i-heroicons-view-columns' },
  { value: 'list', label: 'Lista', icon: 'i-heroicons-bars-3' }
]
const pendingView = ref<PendingView>('board')
const listOrder = ref<'asc' | 'desc'>('asc')
const listOrderOptions = [
  { label: 'Fecha límite ↑', value: 'asc' },
  { label: 'Fecha límite ↓', value: 'desc' }
]
const now = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  try {
    const saved = localStorage.getItem(PENDING_VIEW_KEY)
    if (saved === 'board' || saved === 'list') pendingView.value = saved
  } catch { /* sin almacenamiento: queda Tablero */ }
  nowTimer = setInterval(() => { now.value = Date.now() }, 60000)
})
onBeforeUnmount(() => { if (nowTimer) clearInterval(nowTimer) })

function setPendingView(view: PendingView) {
  pendingView.value = view
  try { localStorage.setItem(PENDING_VIEW_KEY, view) } catch { /* sin almacenamiento */ }
}

const bucketStyle: Record<Bucket, { title: string; border: string; chip: string; block: string }> = {
  overdue: { title: 'text-error', border: 'border-t-error', chip: 'bg-error/10 text-error', block: 'border-l-error bg-error/5 text-error' },
  today: { title: 'text-orange-600 dark:text-orange-400', border: 'border-t-orange-500', chip: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', block: 'border-l-orange-500 bg-orange-500/5 text-orange-600 dark:text-orange-400' },
  tomorrow: { title: 'text-amber-600 dark:text-amber-400', border: 'border-t-amber-400', chip: 'bg-amber-400/15 text-amber-700 dark:text-amber-300', block: 'border-l-amber-400 bg-amber-400/10 text-amber-700 dark:text-amber-300' },
  later: { title: 'text-slate-600 dark:text-slate-300', border: 'border-t-slate-400', chip: 'bg-slate-500/10 text-slate-600 dark:text-slate-300', block: 'border-l-slate-400 bg-slate-500/5 text-slate-600 dark:text-slate-300' }
}

/** Fecha límite de la tarea: la manda el back (deadline_at); si falta, se arma con los plazos que ya llegan. */
function deadlineOf(provider: SupplierPaymentProviderRow): Date | null {
  let iso = provider.deadline_at
  if (iso === undefined) {
    iso = (provider.sales_task === SALES_TASK.OBSERVED && provider.observe_until) || provider.decision_due_at
      || (provider.payment_shape === PAYMENT_SHAPE.CLIENT_INSTALLMENTS && (provider.current_installment || 1) === 1 && provider.second_installment_on
        ? `${provider.second_installment_on.slice(0, 10)}T23:59:59-05:00`
        : null)
  }
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

function limaDay(date: Date | number) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: LIMA })
}
function daysFromToday(date: Date) {
  return Math.round((Date.parse(limaDay(date)) - Date.parse(limaDay(now.value))) / 86400000)
}
function bucketOf(provider: SupplierPaymentProviderRow): Bucket {
  const date = deadlineOf(provider)
  if (!date) return 'later'
  if (date.getTime() < now.value) return 'overdue'
  const days = daysFromToday(date)
  return days <= 0 ? 'today' : days === 1 ? 'tomorrow' : 'later'
}
function ddmm(date: Date, year = false) {
  return date.toLocaleDateString('es-PE', { timeZone: LIMA, day: '2-digit', month: '2-digit', ...(year ? { year: 'numeric' } : {}) })
}
function hoursLeft(date: Date) {
  return Math.max(0, Math.round((date.getTime() - now.value) / 3600000))
}
function ago(date: Date) {
  const hours = Math.floor((now.value - date.getTime()) / 3600000)
  if (hours < 24) return `${Math.max(hours, 1)} h`
  const days = Math.floor(hours / 24)
  return `${days} día${days > 1 ? 's' : ''}`
}
function remaining(date: Date) {
  const hours = hoursLeft(date)
  return hours > 72 ? `${Math.round(hours / 24)} días` : `${hours} h`
}

const sortedPending = computed(() => [...visiblePending.value].sort((a, b) => {
  const da = deadlineOf(a.provider)?.getTime() ?? Number.POSITIVE_INFINITY
  const db = deadlineOf(b.provider)?.getTime() ?? Number.POSITIVE_INFINITY
  return da === db ? a.orderNumber - b.orderNumber : da - db
}))
function bucketRows(bucket: Bucket) {
  return sortedPending.value.filter((row) => bucketOf(row.provider) === bucket)
}
const boardColumns = computed(() => {
  const today = new Date(now.value)
  const tomorrow = new Date(now.value + 86400000)
  return [
    { key: 'overdue' as Bucket, label: 'Vencidas', rows: bucketRows('overdue') },
    { key: 'today' as Bucket, label: `Hoy · ${ddmm(today)}`, rows: bucketRows('today') },
    { key: 'tomorrow' as Bucket, label: `Mañana · ${ddmm(tomorrow)}`, rows: bucketRows('tomorrow') },
    { key: 'later' as Bucket, label: 'Esta semana', rows: bucketRows('later') }
  ]
})
const listSections = computed(() => {
  const sections = [
    { key: 'overdue' as Bucket, label: 'Vencidas', rows: bucketRows('overdue') },
    { key: 'today' as Bucket, label: 'Hoy', rows: bucketRows('today') },
    { key: 'tomorrow' as Bucket, label: 'Mañana', rows: bucketRows('tomorrow') },
    { key: 'later' as Bucket, label: 'Próximos días', rows: bucketRows('later') }
  ].filter((section) => section.rows.length)
  return listOrder.value === 'asc' ? sections : sections.reverse().map((section) => ({ ...section, rows: [...section.rows].reverse() }))
})

/** Tiempo en la esquina de la tarjeta del tablero. */
function boardTime(row: RequestLine) {
  const date = deadlineOf(row.provider)
  if (!date) return 'Sin fecha'
  const bucket = bucketOf(row.provider)
  if (bucket === 'overdue') return `Hace ${ago(date)}`
  if (bucket === 'today') return 'Hoy'
  if (bucket === 'tomorrow') return `${hoursLeft(date)} h`
  return `${ddmm(date)} · ${remaining(date)}`
}

function deadlineKindLabel(provider: SupplierPaymentProviderRow) {
  const kind = provider.deadline_kind
    ?? (provider.sales_task === SALES_TASK.OBSERVED && provider.observe_until ? 'observation' : provider.decision_due_at ? 'decision' : 'commitment')
  return {
    collect: 'Plazo para cobrar',
    observation: 'Plazo para subsanar',
    decision: 'Plazo para decidir',
    commitment: 'Compromiso',
    task: 'Plazo de la tarea'
  }[kind]
}

/** Bloque izquierdo de la lista: fecha límite y tiempo restante. */
function listDeadline(row: RequestLine) {
  const date = deadlineOf(row.provider)
  if (!date) return { title: 'Sin fecha límite', detail: 'Pendiente de Ventas' }
  const bucket = bucketOf(row.provider)
  if (bucket === 'overdue') return { title: `Venció hace ${ago(date)}`, detail: `${deadlineKindLabel(row.provider)} ${ddmm(date, true)}` }
  if (bucket === 'today') return { title: 'Hoy', detail: ddmm(date, true) }
  if (bucket === 'tomorrow') return { title: `Mañana · quedan ${hoursLeft(date)} h`, detail: ddmm(date, true) }
  const weekday = date.toLocaleDateString('es-PE', { timeZone: LIMA, weekday: 'short' }).replace('.', '')
  return {
    title: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${ddmm(date)} · ${remaining(date)}`,
    detail: deadlineKindLabel(row.provider)
  }
}

function stageShort(stage: number) {
  return {
    [REQUEST_STAGE.DATA]: 'Solicitud y datos',
    [REQUEST_STAGE.VALIDATION]: 'Validación de pago',
    [REQUEST_STAGE.EXECUTION]: 'Ejecución de pago',
    [REQUEST_STAGE.CONFIRMATION]: 'Confirmación'
  }[stage] || 'Solicitud y datos'
}

/** Acción corta (sin el plazo, que ya va en su propio bloque). */
function actionText(provider: SupplierPaymentProviderRow, withArea = false) {
  if (provider.approval_status === APPROVAL_STATUS.TO_COLLECT) {
    const amount = Number(provider.collect_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
    return `Cobrar diferencia de $${amount} y registrar voucher`
  }
  if (provider.sales_task === SALES_TASK.OBSERVED && provider.observe_label) {
    return withArea ? `${provider.observe_label} (Operaciones China)` : provider.observe_label
  }
  return taskText(provider, false).replace(/^Resolver para cerrar la Confirmación: /, '').replace(/\.$/, '')
}

const filtrosConfig = computed<FilterConfig[]>(() => [
  {
    key: 'consolidado',
    label: 'Consolidado',
    placeholder: 'Consolidado',
    options: [
      { label: 'Todos', value: 'todos' },
      ...consolidadosDisponibles.value.map((item) => ({ label: consolidadoNumero(item), value: item }))
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

/** «21 - 2026» → «21»: en Pago a proveedor solo va el número de consolidado. */
function consolidadoNumero(consolidado: string | null) {
  return (consolidado || '').split('-')[0]!.trim()
}

/** Responsable por etapa: 1 y 4 Ventas; 2 Administración; 3 Administración (USD) u Operaciones China (RMB). */
function responsableEtapa(provider: SupplierPaymentProviderRow) {
  if (provider.stage === REQUEST_STAGE.VALIDATION) return 'Administración'
  if (provider.stage === REQUEST_STAGE.EXECUTION) return provider.currency === SUPPLIER_CURRENCY.RMB ? 'Operaciones China' : 'Administración'
  return 'Asesor de Ventas'
}

function fechaCorta(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

/** Forma de pago con la cuota en curso y, debajo, la fecha comprometida de la 2.ª cuota. */
function formaDePago(provider: SupplierPaymentProviderRow) {
  if (provider.payment_shape !== PAYMENT_SHAPE.CLIENT_INSTALLMENTS) {
    return pill(paymentShapeLabel(provider.payment_shape), shapeColor(provider.payment_shape))
  }
  const cuota = provider.current_installment || 1
  const cerrada = cuota === 2 && provider.status === PROVIDER_STATUS.COMPLETED
  return h('div', { class: 'flex flex-col items-start gap-1' }, [
    pill(`Cuotas ${cuota}/2${cerrada ? ' ✓' : ''}`, shapeColor(provider.payment_shape)),
    cuota === 1 && provider.second_installment_on
      ? h('span', { class: 'text-xs text-muted' }, `2.ª: ${fechaCorta(provider.second_installment_on)}`)
      : null
  ])
}

function ownerLabel(provider: SupplierPaymentProviderRow) {
  if (provider.owner === REQUEST_OWNER.SALES) return 'Ventas'
  if (provider.stage === REQUEST_STAGE.VALIDATION) return 'Administración'
  if (provider.stage === REQUEST_STAGE.EXECUTION && provider.currency === SUPPLIER_CURRENCY.RMB) return 'Operaciones China'
  if (provider.stage === REQUEST_STAGE.EXECUTION) return 'Administración'
  return 'otra área'
}

/** #1745: «En manos de Administración: aprobar el pago» — qué área y qué le falta para cerrar. */
function waitingText(provider: SupplierPaymentProviderRow) {
  const waiting = provider.waiting_on
  if (waiting) return `En manos de ${waiting.area}: ${waiting.task}`
  return `En manos de ${ownerLabel(provider)}`
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

function taskText(provider: SupplierPaymentProviderRow, withDeadlineText = true) {
  const deadline = withDeadlineText ? (provider.decision_due_text || provider.observe_text) : null
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
  { accessorKey: 'consolidation', header: 'Consolidado', meta: orderCell, cell: ({ row }) => consolidadoNumero(row.original.consolidation) || '—' },
  { accessorKey: 'clientName', header: 'Cliente', meta: orderCell, cell: ({ row }) => h('span', { class: 'block w-32 whitespace-normal' }, row.original.clientName) },
  { accessorKey: 'provider', header: 'Proveedor', cell: ({ row }) => row.original.provider.supplier_code || 'Sin código' },
  { accessorKey: 'requestCode', header: 'Código de solicitud', cell: ({ row }) => row.original.provider.request_code || '—' },
  { accessorKey: 'paymentShape', header: 'Forma de pago', cell: ({ row }) => formaDePago(row.original.provider) },
  { accessorKey: 'paymentType', header: 'Tipo de pago', cell: ({ row }) => paymentLabel(row.original.provider) },
  { accessorKey: 'stage', header: 'Etapa', cell: ({ row }) => pill(`${row.original.provider.stage}. ${stageLabel(row.original.provider.stage)}`, 'info') },
  { accessorKey: 'status', header: 'Estado', cell: ({ row }) => pill(statusLabel(row.original.provider.status), statusColor(row.original.provider.status)) },
  { accessorKey: 'owner', header: 'Responsable', cell: ({ row }) => responsableEtapa(row.original.provider) },
  {
    accessorKey: 'actions',
    header: 'Acciones',
    meta: orderCell,
    cell: ({ row }) => h(UButton, {
      size: 'sm',
      color: 'neutral',
      variant: 'outline',
      icon: 'i-lucide-eye',
      title: 'Ver solicitud',
      'aria-label': 'Ver solicitud',
      onClick: () => { navigateTo(`/pago-proveedor/solicitudes/${row.original.requestId}`) }
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

function aplicarFiltros() {
  const { search: texto, ...resto } = borrador.value
  search.value = (texto || '').trim()
  filtros.value = { ...filtros.value, ...resto }
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

function onClearFilters() {
  filtros.value = { consolidado: 'todos', tipo_pago: 'todos', etapa: 'todos', estado: 'todos' }
  borrador.value = { search: '', ...filtros.value }
  search.value = ''
  pagination.value.current_page = 1
  loadRequests()
}

async function loadPlazoTareas() {
  try {
    const config = await PagoProveedorService.obtenerConfiguracion()
    const horas = Number(config.data?.plazo_tarea_ventas_horas)
    if (horas > 0) plazoTareasHoras.value = horas
  } catch { /* sin configuración: queda 48 h */ }
}

function abrirPlazoTareas() {
  plazoTareasBorrador.value = plazoTareasHoras.value
  plazoTareasAbierto.value = true
}

async function guardarPlazoTareas() {
  const horas = Math.round(Number(plazoTareasBorrador.value))
  if (!horas || horas < 1 || horas > 240) {
    showError('Plazo de pendientes', 'Ingresa un plazo entre 1 y 240 horas.')
    return
  }
  guardandoPlazoTareas.value = true
  try {
    await PagoProveedorService.guardarPlazoTareas(horas)
    plazoTareasHoras.value = horas
    plazoTareasAbierto.value = false
    showSuccess('Plazo de pendientes', `Las tareas sin plazo propio vencen a las ${horas} h.`)
    await loadRequests()
  } catch (error: any) {
    showError('Plazo de pendientes', error?.data?.message || error.message || 'No se pudo guardar.')
  } finally {
    guardandoPlazoTareas.value = false
  }
}

watch(profile, (value) => {
  if (value === SUPPLIER_PAYMENT_PROFILE.SALES) {
    loadRequests()
    loadPlazoTareas()
  }
  if (value === SUPPLIER_PAYMENT_PROFILE.ADMINISTRATION) navigateTo('/pago-proveedor/aprobacion-pagos', { replace: true })
  if (value === SUPPLIER_PAYMENT_PROFILE.WAREHOUSE) navigateTo('/pago-proveedor/pagos-yuanes', { replace: true })
}, { immediate: true })
</script>

<style>
/* Como en Verificación: sin desborde, DataTable centra la tabla a su ancho natural (`utable-narrow`)
   y deja espacio en blanco a los lados; aquí se estira a todo el ancho del contenedor. */
.supplier-payment-requests .table-scroll-container .utable-narrow table {
  width: 100% !important;
  min-width: 100% !important;
}
</style>
