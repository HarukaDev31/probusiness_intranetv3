<template>
  <SupplierPaymentPage wide-tables title="Estado de contenedores" subtitle="BL oficial, telex, flete y cobro de cada contenedor." icon="i-lucide-container">
    <template #actions>
      <UButton color="primary" icon="i-heroicons-banknotes" :disabled="!payable.length" @click="openPay([])">Pagar fletes</UButton>
    </template>

    <div class="mb-4 grid gap-3 sm:grid-cols-3">
      <UCard v-for="card in cards" :key="card.label">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">{{ card.label }}</p>
        <p class="mt-1 text-2xl font-bold" :class="card.color">{{ usd(card.value) }}</p>
        <p class="text-sm text-muted">{{ card.sub }}</p>
      </UCard>
    </div>

    <SupplierPaymentTabs v-model="tab" :items="tabs" class="mb-4" />
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Cliente, BL, naviera, consignatario…" class="w-72" />
      <USelect v-model="country" :items="countryItems" class="w-44" />
      <USelect v-if="tab === OPEN" v-model="group" :items="groupItems" class="w-56" />
      <template v-if="tab === OPEN">
        <UButton v-for="chip in chips" :key="chip.key" size="sm" :variant="pendingFilter === chip.key ? 'solid' : 'outline'" color="neutral" @click="pendingFilter = pendingFilter === chip.key ? '' : chip.key">{{ chip.count }} {{ chip.label }}</UButton>
      </template>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-3" />
    <div class="overflow-x-auto rounded-xl border border-default bg-default">
      <table class="w-full min-w-[880px] text-sm">
        <thead class="bg-elevated/60 text-left text-xs uppercase text-muted">
          <tr>
            <th class="p-3">Estado</th><th class="p-3">F. llenado</th><th class="p-3">Cliente</th><th class="p-3">Carga / BL</th>
            <th class="p-3 text-right">Flete</th><th class="p-3">BL oficial</th><th class="p-3">Telex</th><th class="p-3">Flete pagado</th><th class="p-3">Cobro cliente</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="9" class="p-6 text-center text-muted">Cargando…</td></tr>
          <tr v-else-if="!shown.length"><td colspan="9" class="p-6 text-center text-muted">No hay contenedores. Solo aparecen los que ya tienen fecha de llenado o están cerrados en China.</td></tr>
          <tr v-for="row in shown" :key="row.id" class="cursor-pointer border-t border-default hover:bg-elevated/40" :class="row.id === selectedId ? 'bg-primary/5' : ''" @click="select(row.id)">
            <td class="p-3"><UBadge :color="GROUPS[row.status.group].color" variant="soft">{{ GROUPS[row.status.group].label }}</UBadge></td>
            <td class="p-3">{{ dayLabel(row.data.filling_on || row.closed_on) }}</td>
            <td class="p-3">
              <p class="font-semibold text-highlighted">{{ row.client }}</p>
              <p class="text-xs text-muted">CNE: {{ row.data.bl_consignee || '—' }} · {{ row.country }}</p>
            </td>
            <td class="p-3">
              <p class="font-medium text-highlighted">{{ row.label }} · {{ row.data.container_type || '—' }}</p>
              <p class="text-xs" :class="row.status.arrival_due ? 'font-semibold text-primary' : 'text-muted'">{{ arrivalText(row) }}</p>
              <p class="text-xs" :class="row.data.bl_number ? 'text-muted' : 'text-warning'">BL {{ row.data.bl_number || 'pendiente' }}</p>
            </td>
            <td class="p-3 text-right font-semibold">{{ row.data.freight_usd ? usd(row.data.freight_usd) : '—' }}</td>
            <td v-for="check in checks(row)" :key="check.key" class="p-3"><UBadge :color="check.color" variant="soft">{{ check.text }}</UBadge></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Panel lateral -->
    <USlideover :open="!!selected" side="right" :ui="{ content: 'w-full max-w-xl sm:max-w-xl', body: 'bg-elevated/40' }" @update:open="(value: boolean) => !value && (selectedId = null)">
      <template #header>
        <div v-if="selected" class="flex w-full items-start justify-between gap-3">
          <div>
            <p class="text-sm text-muted">{{ selected.country }} · Carga consolidada</p>
            <p class="text-2xl font-bold text-highlighted">{{ selected.label }}</p>
            <p class="text-sm text-muted">{{ selected.client }} · {{ arrivalText(selected) }}</p>
          </div>
          <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Cerrar" @click="selectedId = null" />
        </div>
      </template>
      <template #body>
        <div v-if="selected" class="flex flex-col gap-4">
          <section class="rounded-xl border border-default bg-default p-4">
            <p class="mb-3 font-semibold text-highlighted">Datos del contenedor</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <UFormField v-for="field in FIELDS" :key="field.key" :label="field.label">
                <USelect v-if="field.key === 'container_type'" v-model="form[field.key]" :items="options.container_types" class="w-full" />
                <UInput v-else v-model="form[field.key]" :type="field.type" :step="field.type === 'number' ? '0.01' : undefined" :disabled="field.key === 'freight_usd' && selected.freight.paid" class="w-full" />
              </UFormField>
            </div>
            <div class="mt-3 flex justify-end gap-2">
              <UButton v-if="dirty" color="neutral" variant="ghost" @click="fill(selected)">Descartar</UButton>
              <UButton color="primary" :disabled="!dirty" :loading="saving" @click="saveData">Guardar</UButton>
            </div>
          </section>

          <section class="flex flex-col gap-3 rounded-xl border border-default bg-default p-4 text-sm">
            <div class="flex items-center justify-between gap-3">
              <div><p class="font-semibold text-highlighted">BL oficial</p><p class="text-muted">{{ selected.data.bl_official_name || dueText(selected.status.bl_from, selected.status.bl_due, '3 semanas tras zarpe') }}</p></div>
              <div class="flex gap-2">
                <UButton v-if="selected.bl_official_url" size="xs" color="neutral" variant="outline" :to="selected.bl_official_url" target="_blank">Ver</UButton>
                <UButton v-if="selected.data.bl_official_name" size="xs" color="error" variant="link" @click="removeBl">Eliminar</UButton>
              </div>
            </div>
            <YuanFilePick v-if="!selected.data.bl_official_name" label="Subir BL oficial (PDF o imagen)" accept=".pdf,image/*" @pick="uploadBl" />
            <USeparator />
            <div class="flex items-center justify-between gap-3">
              <div><p class="font-semibold text-highlighted">Telex</p><p class="text-muted">{{ selected.data.telex ? 'Liberado' : dueText(selected.status.arrival_from, selected.status.arrival_due, '1 semana antes del arribo') }}</p></div>
              <USelect :model-value="selected.data.telex ? 'si' : 'no'" :items="[{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }]" class="w-24" @update:model-value="(value: string) => patch({ telex: value === 'si' })" />
            </div>
            <USeparator />
            <div class="flex items-center justify-between gap-3">
              <div><p class="font-semibold text-highlighted">Cobro cliente</p><p class="text-muted">{{ selected.operation ? selected.operation.code : 'Aún no hay operación' }}</p></div>
              <UBadge v-if="selected.operation" :color="COLLECTION[selected.collection].color" variant="soft">{{ COLLECTION[selected.collection].label }}</UBadge>
              <UButton size="xs" color="primary" variant="link" :to="operationLink(selected)">Ir a operación →</UButton>
            </div>
            <USeparator />
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-semibold text-highlighted">Flete pagado</p>
                <p class="text-muted">{{ freightText(selected) }}</p>
              </div>
              <div class="flex gap-2">
                <template v-if="selected.freight.paid">
                  <UButton v-if="selected.freight.voucher_url" size="xs" color="neutral" variant="outline" :to="selected.freight.voucher_url" target="_blank">Ver voucher</UButton>
                  <UButton size="xs" color="error" variant="link" @click="cancelFreight(selected)">Anular</UButton>
                </template>
                <template v-else-if="selected.data.freight_usd">
                  <UButton size="xs" color="primary" @click="openPay([selected.id])">Pagar</UButton>
                  <UButton size="xs" color="neutral" variant="outline" @click="confirmManual(selected)">Confirmar sin voucher</UButton>
                </template>
              </div>
            </div>
            <p v-if="!selected.freight.paid && selected.data.freight_usd && selected.collection !== 'paid'" class="text-xs text-warning">El cliente aún no paga esta operación.</p>
          </section>
        </div>
      </template>
    </USlideover>

    <!-- Pago de uno o varios fletes -->
    <UModal v-model:open="payOpen" title="Pagar fletes">
      <template #body>
        <div class="flex flex-col gap-3">
          <div class="max-h-60 overflow-y-auto rounded-lg border border-default">
            <label v-for="row in payable" :key="row.id" class="flex cursor-pointer items-center gap-3 border-b border-default p-3 text-sm last:border-0">
              <UCheckbox :model-value="payIds.includes(row.id)" @update:model-value="(on: any) => togglePay(row.id, on === true)" />
              <span class="flex-1">{{ row.label }} · {{ row.country }} <span class="text-muted">{{ row.data.shipping_line || '' }}</span></span>
              <strong>{{ usd(row.data.freight_usd) }}</strong>
            </label>
          </div>
          <UFormField label="Fecha de pago"><UInput v-model="payDate" type="date" class="w-full" /></UFormField>
          <YuanFilePick label="Adjuntar voucher del pago (PDF o imagen)" accept=".pdf,image/*" @pick="(file) => { payVoucher = file }" />
          <p class="text-right font-semibold">Total {{ usd(payTotal) }}</p>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="payOpen = false">Cancelar</UButton>
          <UButton color="primary" :disabled="!payIds.length || !payVoucher || !payDate" :loading="saving" @click="pay">Registrar pago</UButton>
        </div>
      </template>
    </UModal>
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { useModal } from '~/composables/commons/useModal'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaContainer, ChinaContainerData, ChinaContainerGroup, ChinaContainerOptions } from '~/types/china-caja'
import { chinaToday } from '~/utils/chinaCaja'
import { dayLabel, usd } from '~/utils/yuanFormat'

definePageMeta({ middleware: 'auth' })

type Color = 'error' | 'primary' | 'neutral' | 'info' | 'success' | 'warning'
const OPEN = 'abiertos'
const ALL = 'todos'
const GROUPS: Record<ChinaContainerGroup, { label: string; color: Color }> = {
  arrived: { label: 'Arribó con pendientes', color: 'error' },
  this_week: { label: 'Llega esta semana', color: 'primary' },
  no_date: { label: 'Sin fecha de arribo', color: 'neutral' },
  in_transit: { label: 'En tránsito', color: 'neutral' },
  to_sail: { label: 'Por embarcar', color: 'info' },
  completed: { label: 'Completado', color: 'success' }
}
const GROUP_ORDER = Object.keys(GROUPS) as ChinaContainerGroup[]
const COLLECTION: Record<ChinaContainer['collection'], { label: string; color: Color }> = {
  none: { label: 'Sin cobro', color: 'neutral' }, pending: { label: 'Por cobrar', color: 'error' },
  partial: { label: 'Parcial', color: 'warning' }, paid: { label: 'Pagado', color: 'success' }
}
const FIELDS = [
  { key: 'bl_number', label: 'Cód. BL', type: 'text' }, { key: 'bl_consignee', label: 'Consignatario (CNE)', type: 'text' },
  { key: 'shipper', label: 'Cód. shipper', type: 'text' }, { key: 'shipping_line', label: 'Naviera', type: 'text' },
  { key: 'container_type', label: 'T. contenedor', type: 'text' }, { key: 'free_days', label: 'Free days', type: 'text' },
  { key: 'sailing_on', label: 'Zarpe', type: 'date' }, { key: 'arrival_on', label: 'Arribo', type: 'date' },
  { key: 'freight_usd', label: 'Flete (USD)', type: 'number' }
]
const PENDING: Record<string, { label: string; match: (row: ChinaContainer) => boolean }> = {
  bl: { label: 'sin BL oficial', match: (row) => !row.data.bl_official_name },
  telex: { label: 'sin telex', match: (row) => !row.data.telex },
  cobro: { label: 'cobro pendiente', match: (row) => row.collection !== 'paid' },
  flete: { label: 'flete por pagar', match: (row) => !row.freight.paid && !!row.data.freight_usd }
}

const route = useRoute()
const { showError, showSuccess, showConfirmation } = useModal()
const rows = ref<ChinaContainer[]>([])
const options = ref<ChinaContainerOptions>({ lines: [], shippers: [], container_types: [] })
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const tab = ref(OPEN)
const search = ref('')
const country = ref(ALL)
const group = ref(ALL)
const pendingFilter = ref('')
const selectedId = ref<number | null>(null)
const form = reactive<Record<string, string>>({})
const payOpen = ref(false)
const payIds = ref<number[]>([])
const payDate = ref('')
const payVoucher = ref<File | null>(null)

const base = computed(() => {
  const text = search.value.trim().toLowerCase()
  return rows.value.filter((row) => (country.value === ALL || row.country === country.value)
    && (!text || [row.client, row.label, row.data.bl_number, row.data.bl_consignee, row.data.shipper, row.data.shipping_line].join(' ').toLowerCase().includes(text)))
})
const openRows = computed(() => base.value.filter((row) => !row.status.completed))
const tabs = computed(() => [
  { label: 'Abiertos', value: OPEN, count: openRows.value.length },
  { label: 'Completados', value: 'completados', count: base.value.length - openRows.value.length }
])
const shown = computed(() => {
  if (tab.value !== OPEN) return base.value.filter((row) => row.status.completed)
  return openRows.value
    .filter((row) => (group.value === ALL || row.status.group === group.value) && (!pendingFilter.value || PENDING[pendingFilter.value]!.match(row)))
    .sort((a, b) => GROUP_ORDER.indexOf(a.status.group) - GROUP_ORDER.indexOf(b.status.group))
})
const cards = computed(() => {
  const sum = (list: ChinaContainer[]) => list.reduce((total, row) => total + (row.data.freight_usd || 0), 0)
  const paid = shown.value.filter((row) => row.freight.paid)
  const unpaid = shown.value.filter((row) => !row.freight.paid && row.data.freight_usd)
  return [
    { label: 'Suma total del flete', value: sum(shown.value), sub: `${shown.value.length} contenedores`, color: 'text-highlighted' },
    { label: 'Flete pagado', value: sum(paid), sub: `${paid.length} pagados`, color: 'text-success' },
    { label: 'Flete por pagar', value: sum(unpaid), sub: `${unpaid.length} pendientes`, color: 'text-primary' }
  ]
})
const countryItems = computed(() => [{ label: 'Todos los países', value: ALL }, ...[...new Set(rows.value.map((row) => row.country))].filter(Boolean).map((value) => ({ label: value, value }))])
const groupItems = [{ label: 'Todos los estados', value: ALL }, ...GROUP_ORDER.filter((key) => key !== 'completed').map((key) => ({ label: GROUPS[key].label, value: key }))]
const chips = computed(() => Object.entries(PENDING).map(([key, item]) => ({ key, label: item.label, count: openRows.value.filter(item.match).length })))
const selected = computed(() => rows.value.find((row) => row.id === selectedId.value) || null)
const payable = computed(() => rows.value.filter((row) => !row.freight.paid && !!row.data.freight_usd))
const payTotal = computed(() => payable.value.filter((row) => payIds.value.includes(row.id)).reduce((sum, row) => sum + (row.data.freight_usd || 0), 0))
const dirty = computed(() => !!selected.value && FIELDS.some(({ key }) => form[key] !== original(selected.value!, key)))

function original(row: ChinaContainer, key: string) {
  return String(row.data[key as keyof ChinaContainerData] ?? '')
}

function fill(row: ChinaContainer) {
  FIELDS.forEach(({ key }) => { form[key] = original(row, key) })
}

function select(id: number) {
  selectedId.value = selectedId.value === id ? null : id
  if (selected.value) fill(selected.value)
}

function arrivalText(row: ChinaContainer) {
  if (row.status.group === 'to_sail') return `Embarca ${dayLabel(row.data.sailing_on)}`
  const days = row.status.days_to_arrival
  if (days === null) return 'Sin fecha de arribo'
  if (days < 0) return `Arribó ${dayLabel(row.data.arrival_on)}`
  return days === 0 ? 'Llega hoy' : `Llega ${dayLabel(row.data.arrival_on)} · faltan ${days} d`
}

function dueText(from: string | null, due: boolean, rule: string) {
  return from ? `${due ? 'Solicitado desde' : 'Se solicita desde'} ${dayLabel(from)} · ${rule}` : `Se solicita ${rule}`
}

function freightText(row: ChinaContainer) {
  if (row.freight.paid) return `${dayLabel(row.freight.paid_on)} · ${row.freight.manual ? 'Confirmado manualmente' : row.freight.voucher_name}`
  if (!row.data.freight_usd) return 'Sin precio de flete'
  return `${usd(row.data.freight_usd)} · ${dueText(row.status.arrival_from, row.status.arrival_due, '1 semana antes del arribo')}`
}

/** Gris mientras no toca pedirlo; naranja cuando ya se solicitó; verde cuando está listo. */
function checks(row: ChinaContainer): Array<{ key: string; text: string; color: Color }> {
  const state = (done: boolean, due: boolean): Color => (done ? 'success' : due ? 'primary' : 'neutral')
  return [
    { key: 'bl', text: row.data.bl_official_name ? 'Sí' : 'No', color: state(!!row.data.bl_official_name, row.status.bl_due) },
    { key: 'telex', text: row.data.telex ? 'Sí' : 'No', color: state(row.data.telex, row.status.arrival_due) },
    { key: 'flete', text: row.freight.paid ? 'Sí' : 'No', color: state(row.freight.paid, row.status.arrival_due) },
    { key: 'cobro', text: COLLECTION[row.collection].label, color: COLLECTION[row.collection].color }
  ]
}

function operationLink(row: ChinaContainer) {
  if (row.operation) return `/operaciones-china?operacion=${row.operation.id}`
  return row.operation_to_approve ? `/operaciones-china?borrador=${row.id}` : '/operaciones-china'
}

async function load() {
  try {
    const response = await ChinaCajaService.containers()
    rows.value = response.data
    options.value = response.options
    error.value = ''
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar la lista.'
  } finally {
    loading.value = false
  }
}

async function patch(values: Record<string, string | boolean | File | null>) {
  if (!selected.value || saving.value) return
  saving.value = true
  try {
    const updated = (await ChinaCajaService.updateContainer(selected.value.id, values)).data
    rows.value = rows.value.map((row) => (row.id === updated.id ? updated : row))
    showSuccess('Estado de contenedores', 'Guardado.')
    return true
  } catch (e: any) {
    showError('Estado de contenedores', e?.message || 'No se pudo guardar.')
    return false
  } finally {
    saving.value = false
  }
}

async function saveData() {
  if (!selected.value) return
  const changed = FIELDS.filter(({ key }) => form[key] !== original(selected.value!, key))
  const ok = await patch(Object.fromEntries(changed.map(({ key }) => [key, String(form[key] ?? '').trim()])))
  if (ok && selected.value) fill(selected.value)
}

function uploadBl(file: File | null) {
  if (file) patch({ bl_official: file })
}

function removeBl() {
  showConfirmation('¿Eliminar el BL oficial?', 'El contenedor vuelve a quedar sin BL oficial.', () => patch({ remove_bl_official: true }))
}

function openPay(ids: number[]) {
  payIds.value = ids
  payDate.value = chinaToday()
  payVoucher.value = null
  payOpen.value = true
}

function togglePay(id: number, on: boolean) {
  payIds.value = on ? [...payIds.value, id] : payIds.value.filter((value) => value !== id)
}

async function register(ids: number[], date: string, voucher: File | null) {
  saving.value = true
  try {
    await ChinaCajaService.payFreight(ids, date, voucher)
    payOpen.value = false
    await load()
    showSuccess('Flete', 'Pago registrado en Flujo de caja.')
  } catch (e: any) {
    showError('Flete', e?.message || 'No se pudo registrar el pago.')
  } finally {
    saving.value = false
  }
}

function pay() {
  return register(payIds.value, payDate.value, payVoucher.value)
}

function confirmManual(row: ChinaContainer) {
  showConfirmation('¿Confirmar el pago sin voucher?', `${row.label} · ${usd(row.data.freight_usd)}`, () => register([row.id], chinaToday(), null))
}

function cancelFreight(row: ChinaContainer) {
  showConfirmation('¿Anular el pago del flete?', 'Todos los contenedores de ese pago vuelven a «Por pagar».', async () => {
    try {
      await ChinaCajaService.cancelFreight(row.freight.payment_id!)
      await load()
    } catch (e: any) {
      showError('Flete', e?.message || 'No se pudo anular.')
    }
  })
}

// «Ir →» del Inicio y del Flujo abre la ficha exacta.
function openFromRoute() {
  const target = rows.value.find((row) => row.id === Number(route.query.contenedor))
  if (!target) return
  tab.value = target.status.completed ? 'completados' : OPEN
  selectedId.value = target.id
  fill(target)
}
watch(() => route.query.contenedor, openFromRoute)

onMounted(async () => {
  await load()
  openFromRoute()
})
</script>
