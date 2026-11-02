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
        <USkeleton v-if="loading" class="mt-2 h-8 w-24" />
        <p v-else class="mt-1 text-2xl font-bold" :class="card.danger ? 'text-red-600' : 'text-gray-900'">{{ card.value }}</p>
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
        <USkeleton v-if="loading" class="mt-1 h-8 w-10" />
        <b v-else class="mt-0.5 block text-2xl text-gray-900">{{ tabCount(tab.key) }}</b>
      </button>
    </div>
    <div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
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
          <template v-if="loading">
            <tr v-for="row in 5" :key="`sk-${row}`">
              <td v-for="col in 8" :key="col" class="px-3.5 py-3"><USkeleton class="h-4 w-full" /></td>
            </tr>
          </template>
          <tr v-else-if="!rows.length">
            <td colspan="8" class="px-3.5 py-8 text-center text-sm text-gray-400">No hay pagos en esta pestaña. Los RMB que Ventas deja en ejecución aparecen en Pendiente.</td>
          </tr>
          <template v-else>
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
          </template>
        </tbody>
      </table>
    </div>

    <SupplierPaymentWindow
      :open="opened"
      title="Pago en yuanes"
      :subtitle="selected ? `${selected.client_name || 'Cliente'} · ${selected.consolidation || 'Sin consolidado'}` : ''"
      :code="selected?.request_code"
      hint="La constancia queda registrada. El aviso al cliente por WhatsApp queda para el final y no bloquea el registro."
      wide
      @close="opened = false"
    >
      <div v-if="selected" class="grid gap-4 lg:grid-cols-3">
        <SupplierPaymentCard title="Solicitud">
          <SupplierPaymentFact label="Cliente" :value="selected.client_name || '—'" />
          <SupplierPaymentFact label="Consolidado" :value="selected.consolidation || '—'" />
          <SupplierPaymentFact label="Socio" :value="selected.partner" />
          <SupplierPaymentFact label="Vendedor" :value="selected.seller_name || '—'" />
          <a v-if="selected.proforma_url" :href="selected.proforma_url" target="_blank" rel="noopener" class="text-sm font-semibold text-primary-600">Ver proforma</a>
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Proveedor">
          <SupplierPaymentFact label="Código" :value="selected.supplier_code || '—'" />
          <SupplierPaymentFact label="Nombre" :value="selected.supplier_name || '—'" />
          <SupplierPaymentFact label="Producto" :value="selected.product || '—'" />
          <SupplierPaymentFact label="WeChat" :value="selected.wechat || '—'" />
        </SupplierPaymentCard>
        <SupplierPaymentCard title="Importes">
          <p class="text-3xl font-bold text-primary-700">¥{{ money(selected.yuan_amount) }}</p>
          <SupplierPaymentFact label="USD" :value="`$${money(selected.usd_amount)}`" />
          <SupplierPaymentFact label="T.C. cotizado" :value="String(selected.quoted_rate)" />
        </SupplierPaymentCard>
      </div>
      <section v-if="selected" class="rounded-2xl border border-gray-200 bg-white p-4">
        <h4 class="mb-2 text-[15px] font-bold text-gray-900">Registro del pago</h4>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-sm text-gray-500">T.C. real (¥ por $)
            <input v-model.number="rate" type="number" min="0" step="0.0001" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900" />
          </label>
          <label class="text-sm text-gray-500">Yuanes pagados
            <input v-model.number="yuanPaid" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900" />
          </label>
          <label class="text-sm text-gray-500 sm:col-span-2">Constancia
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="mt-1 block text-sm text-gray-800" @change="onFile" />
          </label>
        </div>
        <p class="mt-2 text-sm text-gray-700">Obtenidos ¥{{ money(obtained) }} · diferencia ${{ money(differenceUsd) }} · {{ differenceText }}</p>
      </section>
      <section v-if="selected" class="rounded-2xl border border-red-100 bg-white p-4">
        <h4 class="mb-2 text-[15px] font-bold text-gray-900">Observar</h4>
        <select v-model="reason" class="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm">
          <option value="">Sin observación</option>
          <option v-for="item in reasons" :key="item.code" :value="item.code">{{ item.label }}</option>
          <option value="other">Otro motivo</option>
        </select>
        <input v-if="reason === 'other'" v-model="newReason" placeholder="Nuevo motivo" class="mt-2 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm" />
        <input v-if="reason" v-model="detail" placeholder="Detalle opcional" class="mt-2 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm" />
      </section>
      <template #footer>
        <UButton v-if="reason" color="error" variant="soft" :loading="saving" @click="observe">Observar</UButton>
        <UButton color="primary" :loading="saving" :disabled="!canSave" @click="save">Registrar pago</UButton>
      </template>
    </SupplierPaymentWindow>

    <SupplierPaymentWindow
      :open="manualOpen"
      title="Nueva solicitud"
      subtitle="Queda en pendientes para registrar el pago."
      @close="manualOpen = false"
    >
      <form id="yuan-manual" class="grid gap-3 text-sm sm:grid-cols-2" @submit.prevent="createManual">
        <label class="text-gray-500">Socio<input v-model="manual.partner" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Cliente<input v-model="manual.client_name" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Consolidado<input v-model="manual.consolidation" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Producto<input v-model="manual.product" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Código proveedor<input v-model="manual.supplier_code" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Nombre proveedor<input v-model="manual.supplier_name" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">Vendedor<input v-model="manual.seller_name" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">WeChat<input v-model="manual.wechat" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">USD<input v-model.number="manual.usd_amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <label class="text-gray-500">RMB<input v-model.number="manual.yuan_amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-900" /></label>
        <p class="text-gray-600 sm:col-span-2">Tipo de cambio {{ manualRate }}</p>
        <label class="text-gray-500 sm:col-span-2">Proforma (opcional)<input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" class="mt-1 block text-gray-800" @change="onProforma" /></label>
      </form>
      <template #footer>
        <UButton type="submit" form="yuan-manual" color="primary" :loading="saving">Crear</UButton>
      </template>
    </SupplierPaymentWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
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
