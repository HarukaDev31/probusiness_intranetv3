<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-xs text-gray-500">Operaciones</p>
        <h2 class="text-xl font-bold text-gray-800">Pagos en yuanes</h2>
      </div>
      <UButton color="primary" @click="manualOpen = true">Nueva solicitud</UButton>
    </div>
    <div class="mb-3.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in cards" :key="card.label" class="rounded-2xl border border-gray-200 bg-white px-4 py-4">
        <p class="text-[11px] font-bold uppercase tracking-wider text-gray-500">{{ card.label }}</p>
        <p class="mt-1 text-2xl font-bold" :class="card.danger ? 'text-red-600' : 'text-gray-900'">{{ card.value }}</p>
      </article>
    </div>
    <div class="mb-3.5 flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="flex-1 border-r border-gray-200 px-4 py-3.5 text-left text-xs text-gray-500 last:border-r-0"
        :class="bucket === tab.key ? 'border-b-4 border-b-primary-500 bg-primary-50 text-gray-800' : ''"
        @click="changeBucket(tab.key)"
      >
        {{ tab.label }}
        <b class="mt-0.5 block text-2xl text-gray-900">{{ tabCount(tab.key) }}</b>
      </button>
    </div>
    <p v-if="loading" class="text-sm text-gray-500">Cargando pagos en yuanes…</p>
    <div v-else class="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            <th class="px-3.5 py-3">Proveedor</th>
            <th class="px-3.5 py-3">Cliente</th>
            <th class="px-3.5 py-3">Socio</th>
            <th class="px-3.5 py-3">USD</th>
            <th class="px-3.5 py-3">RMB</th>
            <th class="px-3.5 py-3">Diferencia</th>
            <th class="px-3.5 py-3">Estado</th>
            <th class="px-3.5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="8" class="px-3.5 py-8 text-center text-gray-400">No hay pagos en esta pestaña.</td>
          </tr>
          <tr v-for="row in rows" :key="row.provider_id" class="border-t border-gray-100">
            <td class="px-3.5 py-3">
              <p class="font-semibold">{{ row.supplier_code || 'Sin código' }}</p>
              <p class="text-xs text-gray-500">{{ row.supplier_name || row.product }}</p>
            </td>
            <td class="px-3.5 py-3">{{ row.client_name || '—' }}</td>
            <td class="px-3.5 py-3">{{ row.partner }}</td>
            <td class="px-3.5 py-3">${{ money(row.usd_amount) }}</td>
            <td class="px-3.5 py-3 font-semibold text-primary-600">¥{{ money(row.yuan_amount) }}</td>
            <td class="px-3.5 py-3">
              <span v-if="row.difference_label">{{ row.difference_label }}</span>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="px-3.5 py-3">
              <UBadge :color="statusColor(row.status)" variant="soft" :label="row.status_label" />
              <p v-if="row.observation_label" class="mt-1 text-xs text-red-600">{{ row.observation_label }}</p>
            </td>
            <td class="px-3.5 py-3 text-right">
              <UButton v-if="row.can_register" size="sm" color="primary" @click="open(row)">Registrar</UButton>
              <a v-else-if="row.receipt_url" :href="row.receipt_url" target="_blank" rel="noopener" class="text-sm font-semibold text-primary-600">Constancia</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="opened" :ui="{ content: 'max-w-lg' }">
      <template #header><h2 class="text-lg font-semibold">Pago en yuanes</h2></template>
      <template #body>
        <div v-if="selected" class="space-y-3 text-sm">
          <p>{{ selected.supplier_code }} · {{ selected.client_name }} · {{ selected.consolidation }}</p>
          <p>WeChat {{ selected.wechat || '—' }} · vendedor {{ selected.seller_name || '—' }}</p>
          <p>A pagar <span class="font-semibold text-orange-600">¥{{ money(selected.yuan_amount) }}</span> · T.C. cotizado {{ selected.quoted_rate }}</p>
          <a v-if="selected.proforma_url" :href="selected.proforma_url" target="_blank" rel="noopener" class="text-primary-600">Ver proforma</a>
          <label class="block">T.C. real (¥ por $)
            <input v-model.number="rate" type="number" min="0" step="0.0001" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" />
          </label>
          <label class="block">Yuanes pagados
            <input v-model.number="yuanPaid" type="number" min="0" step="0.01" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" />
          </label>
          <p>Obtenidos ¥{{ money(obtained) }} · diferencia ${{ money(differenceUsd) }} · {{ differenceText }}</p>
          <label class="block">Constancia
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="mt-1 block" @change="onFile" />
          </label>
          <p class="text-gray-500">La constancia queda registrada. El aviso al cliente por WhatsApp queda para el final y no bloquea el registro.</p>
          <label class="block">Observar
            <select v-model="reason" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5">
              <option value="">Sin observación</option>
              <option v-for="item in reasons" :key="item.code" :value="item.code">{{ item.label }}</option>
              <option value="other">Otro motivo</option>
            </select>
          </label>
          <input v-if="reason === 'other'" v-model="newReason" placeholder="Nuevo motivo" class="w-full rounded-md border border-gray-300 px-2 py-1.5" />
          <input v-if="reason" v-model="detail" placeholder="Detalle opcional" class="w-full rounded-md border border-gray-300 px-2 py-1.5" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="opened = false">Cancelar</UButton>
          <UButton v-if="reason" color="warning" :loading="saving" @click="observe">Observar</UButton>
          <UButton color="primary" :loading="saving" :disabled="!canSave" @click="save">Registrar pago</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="manualOpen" :ui="{ content: 'max-w-lg' }">
      <template #header><h2 class="text-lg font-semibold">Nueva solicitud</h2></template>
      <template #body>
        <form class="grid gap-2 text-sm sm:grid-cols-2" @submit.prevent="createManual">
          <label>Socio<input v-model="manual.partner" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <label>Cliente<input v-model="manual.client_name" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <label>Consolidado<input v-model="manual.consolidation" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <label>Producto<input v-model="manual.product" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <label>Código proveedor<input v-model="manual.supplier_code" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <label>Nombre proveedor<input v-model="manual.supplier_name" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <label>Vendedor<input v-model="manual.seller_name" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <label>WeChat<input v-model="manual.wechat" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <label>USD<input v-model.number="manual.usd_amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <label>RMB<input v-model.number="manual.yuan_amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" /></label>
          <p class="sm:col-span-2 text-gray-600">Tipo de cambio {{ manualRate }}</p>
          <label class="sm:col-span-2">Proforma (opcional)<input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" @change="onProforma" /></label>
          <div class="sm:col-span-2 flex justify-end"><UButton type="submit" color="primary" :loading="saving">Crear</UButton></div>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { YUAN_BUCKET } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentObservationReason, SupplierPaymentYuan, SupplierPaymentYuanIndicators } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'
import { UBadge } from '#components'

const { showError, showSuccess } = useModal()
const bucket = ref<string>(YUAN_BUCKET.PENDING)
const rows = ref<SupplierPaymentYuan[]>([])
const reasons = ref<SupplierPaymentObservationReason[]>([])
const indicators = ref<SupplierPaymentYuanIndicators>({ usd_received: 0, yuan_obtained: 0, yuan_paid: 0, to_collect: 0 })
const pendingCount = ref(0)
const tabTotals = ref<Record<string, number>>({})
const loading = ref(false)
const saving = ref(false)
const opened = ref(false)
const manualOpen = ref(false)
const proforma = ref<File | null>(null)
const manual = reactive({
  partner: 'Pro Business',
  client_name: '',
  consolidation: '',
  product: '',
  supplier_code: '',
  supplier_name: '',
  seller_name: '',
  wechat: '',
  usd_amount: 0,
  yuan_amount: 0
})
const manualRate = computed(() => manual.usd_amount > 0 ? (manual.yuan_amount / manual.usd_amount).toFixed(4) : '—')
const selected = ref<SupplierPaymentYuan | null>(null)
const rate = ref<number | null>(null)
const yuanPaid = ref<number | null>(null)
const receipt = ref<File | null>(null)
const reason = ref('')
const newReason = ref('')
const detail = ref('')

const tabs = [
  { key: YUAN_BUCKET.ALL, label: 'Todos' },
  { key: YUAN_BUCKET.PENDING, label: 'Pendiente' },
  { key: YUAN_BUCKET.OBSERVED, label: 'Observado' },
  { key: YUAN_BUCKET.PAID, label: 'Pagado' }
]

const cards = computed(() => [
  { label: 'USD recibido de socios', value: `$${money(indicators.value.usd_received)}` },
  { label: 'RMB obtenido', value: `¥${money(indicators.value.yuan_obtained)}` },
  { label: 'RMB pagado', value: `¥${money(indicators.value.yuan_paid)}` },
  { label: 'Diferencia por cobrar', value: `$${money(indicators.value.to_collect)}`, danger: indicators.value.to_collect > 0 }
])

function tabCount(key: string) {
  if (key === YUAN_BUCKET.PENDING) return pendingCount.value
  return tabTotals.value[key] ?? (bucket.value === key ? rows.value.length : '—')
}

function statusColor(status: string): 'success' | 'error' | 'warning' {
  if (status === 'pagado') return 'success'
  if (status === 'observado') return 'error'
  return 'warning'
}

const obtained = computed(() => Number(selected.value?.usd_amount || 0) * Number(rate.value || 0))
const differenceUsd = computed(() => {
  const real = Number(rate.value || 0)
  if (real <= 0) return 0
  return (obtained.value - Number(yuanPaid.value || 0)) / real
})
const differenceText = computed(() => {
  const tolerance = Number(selected.value?.tolerance || 1)
  if (Math.abs(differenceUsd.value) <= tolerance) return 'En tolerancia'
  return differenceUsd.value < 0 ? 'Por cobrar' : 'A favor del cliente'
})
const canSave = computed(() => Number(rate.value) > 0 && Number(yuanPaid.value) > 0 && !!receipt.value)

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function changeBucket(next: string) {
  bucket.value = next
  load()
}

function open(row: SupplierPaymentYuan) {
  selected.value = row
  rate.value = row.quoted_rate || null
  yuanPaid.value = row.yuan_amount || null
  receipt.value = null
  reason.value = ''
  newReason.value = ''
  detail.value = ''
  opened.value = true
}

function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  receipt.value = input.files?.[0] || null
}

async function load() {
  loading.value = true
  try {
    const response = await PagoProveedorService.listYuan({ bucket: bucket.value, per_page: 50 })
    rows.value = response.data || []
    pendingCount.value = response.pending_count || 0
    tabTotals.value = { ...tabTotals.value, [bucket.value]: response.pagination?.total ?? rows.value.length }
    indicators.value = response.indicators
    reasons.value = response.reasons || []
  } catch (error: any) {
    showError('Pagos en yuanes', error?.data?.message || 'No se pudo cargar la lista.')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!selected.value || !receipt.value || !rate.value || !yuanPaid.value) return
  saving.value = true
  try {
    await PagoProveedorService.registerYuan(selected.value.provider_id, rate.value, yuanPaid.value, receipt.value)
    showSuccess('Pago en yuanes', 'Quedó registrado. El proveedor pasó a confirmación.')
    opened.value = false
    await load()
  } catch (error: any) {
    showError('Pago en yuanes', error?.data?.message || 'No se pudo registrar el pago.')
  } finally {
    saving.value = false
  }
}

function onProforma(event: Event) {
  proforma.value = (event.target as HTMLInputElement).files?.[0] || null
}

async function createManual() {
  if (!manual.supplier_code.trim() && !manual.supplier_name.trim()) {
    showError('Nueva solicitud', 'Indica el código o el nombre del proveedor.')
    return
  }
  saving.value = true
  try {
    const form = new FormData()
    Object.entries(manual).forEach(([key, value]) => form.append(key, String(value ?? '')))
    if (proforma.value) form.append('proforma', proforma.value)
    await PagoProveedorService.createManualYuan(form)
    manualOpen.value = false
    showSuccess('Nueva solicitud', 'Quedó en pendientes para registrar el pago.')
    bucket.value = YUAN_BUCKET.PENDING
    await load()
  } catch (error: any) {
    showError('Nueva solicitud', error?.data?.message || 'No se pudo crear la solicitud.')
  } finally {
    saving.value = false
  }
}

async function observe() {
  if (!selected.value) return
  saving.value = true
  try {
    await PagoProveedorService.observeYuan(selected.value.provider_id, {
      reason: reason.value === 'other' ? '' : reason.value,
      new_reason: reason.value === 'other' ? newReason.value : '',
      detail: detail.value
    })
    showSuccess('Observación', 'Ventas puede corregir los datos y levantar la observación.')
    opened.value = false
    await load()
  } catch (error: any) {
    showError('Observación', error?.data?.message || 'No se pudo observar el pago.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
