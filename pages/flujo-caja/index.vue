<template>
  <SupplierPaymentPage wide-tables title="Flujo de caja" subtitle="Todo en RMB. El saldo sale de los cierres semanales." icon="i-lucide-wallet">
    <template #actions>
      <UInput v-if="tab === 'flujo'" v-model="month" type="month" :max="chinaToday().slice(0, 7)" class="w-44" />
      <UButton v-if="tab === 'flujo' && data && !data.closed" color="primary" :disabled="!data.can_close_month" :title="data.close_month_blocker || ''" @click="openMonth">Cerrar mes</UButton>
    </template>
    <SupplierPaymentTabs v-model="tab" :items="[{ label: 'Flujo', value: 'flujo' }, { label: 'Cierres mensuales', value: 'cierres' }]" class="mb-4" />

    <ChinaCashHistory v-if="tab === 'cierres'" @view="viewMonth" />
    <template v-else>
      <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-3" />
      <p v-if="!data && loading" class="text-muted">Cargando…</p>
      <div v-if="data" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-end gap-3">
          <UFormField label="TC general del mes (RMB por USD)">
            <div class="flex gap-2"><UInput v-model="rate" type="number" step="0.0001" min="0" :disabled="data.closed" class="w-32" /><UButton v-if="!data.closed && Number(rate) !== data.exchange_rate" size="sm" @click="saveSettings({ exchange_rate: Number(rate) })">Guardar</UButton></div>
          </UFormField>
          <UFormField v-if="data.opening_editable" label="Saldo inicial">
            <div class="flex gap-2"><UInput v-model="opening" type="number" step="0.01" class="w-36" /><UButton v-if="opening !== '' && Number(opening) !== data.opening_balance" size="sm" @click="saveSettings({ opening_balance: Number(opening) })">Guardar</UButton></div>
          </UFormField>
          <USelect v-model="period" :items="periodItems" class="w-56" />
          <UBadge v-if="data.closed" color="neutral">Mes cerrado · solo lectura</UBadge>
        </div>
        <UAlert v-if="!data.exchange_rate && !data.closed" color="warning" variant="soft" title="Registra el TC del mes: sin él los cobros y fletes en USD no se proyectan ni se pueden pagar." />

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <UCard v-for="card in cards" :key="card.label">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">{{ card.label }}</p>
            <p class="mt-1 text-2xl font-bold" :class="card.color">{{ card.value }}</p>
            <p class="text-sm text-muted">{{ card.sub }}</p>
            <p v-if="card.compare" class="text-xs text-muted">{{ card.compare }}</p>
          </UCard>
        </div>

        <section>
          <h2 class="mb-2 text-lg font-bold">Semanas de {{ monthLabel(data.month) }}</h2>
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <UCard v-for="week in data.weeks" :key="week.starts_on" :class="week.overdue ? 'ring-error' : ''">
              <button type="button" class="w-full text-left" @click="period = period === week.starts_on ? ALL : week.starts_on">
                <p class="font-semibold" :class="period === week.starts_on ? 'text-primary' : ''">{{ dayLabel(week.starts_on) }} – {{ dayLabel(week.ends_on) }}</p>
                <p class="text-sm text-success">+{{ rmb(week.totals.income) }}</p>
                <p class="text-sm">−{{ rmb(week.totals.expense) }}</p>
                <div class="mt-2 flex h-14 items-end gap-1"><span class="w-4 rounded-t bg-success" :style="{ height: bar(week.totals.income) }" /><span class="w-4 rounded-t bg-success/30" :style="{ height: bar(week.totals.income_projected) }" /><span class="w-4 rounded-t bg-primary" :style="{ height: bar(week.totals.expense) }" /><span class="w-4 rounded-t bg-primary/30" :style="{ height: bar(week.totals.expense_projected) }" /></div>
              </button>
              <div class="mt-2 text-sm">
                <template v-if="week.closing"><p>Saldo <strong>{{ rmbSigned(week.closing.balance) }}</strong></p><a v-if="week.closing.screenshot_url" :href="week.closing.screenshot_url" target="_blank" rel="noopener" class="text-primary hover:underline">Ver pantallazo</a></template>
                <UButton v-else-if="week.can_close" size="sm" :color="week.overdue ? 'error' : 'primary'" @click="openWeek(week)">Cerrar semana</UButton>
                <p v-else class="text-muted">Se cierra el {{ dayLabel(week.due_on) }}</p>
              </div>
            </UCard>
          </div>
        </section>

        <section v-if="data.late.length" class="rounded-xl border border-error/40 bg-error/5 p-4">
          <h2 class="mb-2 text-lg font-bold text-error">Cobros y pagos atrasados</h2>
          <div v-for="(row, i) in data.late" :key="i" class="flex flex-wrap items-center gap-3 border-t border-error/20 py-2 text-sm">
            <UBadge color="error">{{ Math.abs(row.days || 0) }} d</UBadge><span class="min-w-48 flex-1"><strong>{{ row.type === 'out' ? 'Por pagar · ' : '' }}{{ row.title }}</strong> <span class="text-muted">{{ row.detail }} · venció {{ dayLabel(row.due_on) }}</span></span>
            <strong>{{ signed(row) }}</strong><UButton v-if="linkOf(row)" size="xs" variant="link" :to="linkOf(row)">Abrir →</UButton>
          </div>
        </section>

        <div class="flex flex-wrap gap-2"><UButton v-for="item in ORIGINS" :key="item" size="sm" :variant="origin === item ? 'solid' : 'outline'" color="neutral" @click="origin = item">{{ item }}</UButton></div>

        <section v-if="!data.closed" class="rounded-xl border border-default bg-default p-4">
          <h2 class="mb-2 text-lg font-bold">Por realizar</h2>
          <p v-if="!pendingRows.length" class="text-sm text-muted">Nada por realizar en el periodo.</p>
          <div v-for="(row, i) in pendingRows" :key="i" class="flex flex-wrap items-center gap-3 border-t border-default py-2 text-sm">
            <UBadge :color="row.days !== null && row.days !== undefined && row.days <= 3 ? 'primary' : 'neutral'" variant="soft">{{ countdown(row) }}</UBadge>
            <span class="min-w-48 flex-1"><strong>{{ row.type === 'out' ? 'Por pagar · ' : '' }}{{ row.title }}</strong> <span class="text-muted">{{ row.detail }}</span></span>
            <strong>{{ signed(row) }}</strong><UButton v-if="linkOf(row)" size="xs" variant="link" :to="linkOf(row)">Abrir →</UButton>
          </div>
        </section>

        <section class="rounded-xl border border-default bg-default p-4">
          <h2 class="mb-2 text-lg font-bold">Realizados · {{ realRows.length }}</h2>
          <p v-if="!realRows.length" class="text-sm text-muted">Sin movimientos reales en el periodo.</p>
          <div class="max-h-[440px] overflow-y-auto">
            <div v-for="(row, i) in realRows" :key="i" class="flex flex-wrap items-center gap-3 border-t border-default py-2 text-sm">
              <span class="w-16 text-muted">{{ dayLabel(row.date) }}</span><UBadge color="neutral" variant="soft">{{ row.origin }}</UBadge>
              <span class="min-w-48 flex-1"><strong>{{ row.title }}</strong> <span class="text-muted">{{ row.detail }}</span></span>
              <strong :class="row.type === 'in' ? 'text-success' : ''">{{ signed(row) }}</strong>
            </div>
          </div>
        </section>

        <div class="grid gap-4 lg:grid-cols-2">
          <UCard>
            <h2 class="text-lg font-bold">Costos fijos mensuales</h2>
            <p class="mb-2 text-sm text-muted">Se descuentan solos el último día del mes · {{ rmb(fixedTotal) }}</p>
            <div v-for="cost in data.fixed_costs" :key="cost.id" class="flex items-center gap-3 border-t border-default py-2 text-sm">
              <USwitch :model-value="cost.active" @update:model-value="(on: boolean) => act(() => ChinaCajaService.toggleFixedCost(cost.id, on))" /><span class="flex-1" :class="cost.active ? '' : 'text-muted line-through'">{{ cost.name }}</span><strong>{{ rmb(cost.amount) }}</strong>
              <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-x-mark" aria-label="Eliminar" @click="removeFixed(cost)" />
            </div>
            <form class="mt-3 flex gap-2" @submit.prevent="addFixed"><UInput v-model="fixed.name" placeholder="Nombre" class="flex-1" /><UInput v-model="fixed.amount" type="number" step="0.01" min="0" placeholder="RMB" class="w-28" /><UButton type="submit" :disabled="!fixed.name.trim() || !(Number(fixed.amount) > 0)">Agregar</UButton></form>
          </UCard>
          <UCard>
            <h2 class="text-lg font-bold">Inversiones anuales</h2>
            <p class="mb-2 text-sm text-muted">Pagado {{ rmb(investPaid) }} de {{ rmb(investTotal) }}</p>
            <UProgress class="mb-2" :model-value="investTotal ? investPaid / investTotal * 100 : 0" />
            <div v-for="row in data.investments" :key="row.id" class="flex items-center gap-3 border-t border-default py-2 text-sm">
              <span class="flex-1">{{ row.name }} <span class="text-muted">{{ dayLabel(row.due_on) }}</span></span><strong>{{ rmb(row.amount) }}</strong>
              <UBadge v-if="row.paid_on" color="success" variant="soft">Pagada</UBadge>
              <template v-else><UButton size="xs" variant="outline" @click="openInvest(row)">Marcar pagada</UButton><UButton size="xs" color="error" variant="ghost" icon="i-heroicons-x-mark" aria-label="Eliminar" @click="removeInvest(row)" /></template>
            </div>
            <form class="mt-3 flex flex-wrap gap-2" @submit.prevent="addInvest"><UInput v-model="invest.name" placeholder="Nombre" class="min-w-32 flex-1" /><UInput v-model="invest.due_on" type="date" class="w-36" /><UInput v-model="invest.amount" type="number" step="0.01" min="0" placeholder="RMB" class="w-28" /><UButton type="submit" :disabled="!invest.name.trim() || !invest.due_on || !(Number(invest.amount) > 0)">Agregar</UButton></form>
          </UCard>
        </div>
      </div>
    </template>

    <UModal :open="!!closingWeek" title="Cerrar semana" @update:open="(value: boolean) => { if (!value) closingWeek = null }">
      <template #body>
        <div v-if="closingWeek" class="flex flex-col gap-3">
          <p class="text-sm text-muted">{{ dayLabel(closingWeek.starts_on) }} – {{ dayLabel(closingWeek.ends_on) }}. Al cerrar queda en solo lectura.</p>
          <YuanFilePick label="Pantallazo del banco (obligatorio)" accept=".pdf,image/*" @pick="(file) => { screenshot = file }" />
          <UFormField label="Saldo del banco (RMB)"><UInput v-model="closingBalance" type="number" step="0.01" class="w-full" /></UFormField>
          <div v-if="closingWeek.usd_to_exchange.length" class="rounded-lg border border-default p-3 text-sm">
            <p class="mb-1 font-semibold">USD por cambiar</p>
            <div v-for="row in closingWeek.usd_to_exchange" :key="row.id" class="flex items-center gap-2 py-1"><span class="flex-1">{{ row.code }} · {{ row.operations.join(', ') }} · {{ row.client }}</span><strong>{{ usd(row.usd) }}</strong><UButton size="xs" variant="link" :to="`/operaciones-china?cobro=${row.id}`">Ir →</UButton></div>
            <p class="text-xs text-muted">Los que no se cambien pasan solos a la semana siguiente.</p>
          </div>
        </div>
      </template>
      <template #footer><UButton class="ml-auto" :disabled="!screenshot || closingBalance === ''" :loading="saving" @click="closeWeek">Cerrar semana</UButton></template>
    </UModal>
    <UModal v-model:open="monthOpen" title="Cerrar mes">
      <template #body><UFormField label="Saldo final escrito del estado de cuenta (RMB)" help="Será el saldo inicial del mes siguiente."><UInput v-model="closingBalance" type="number" step="0.01" class="w-full" /></UFormField></template>
      <template #footer><UButton class="ml-auto" :disabled="closingBalance === ''" :loading="saving" @click="closeMonth">Cerrar mes</UButton></template>
    </UModal>
    <UModal :open="!!paying" title="Marcar inversión como pagada" @update:open="(value: boolean) => { if (!value) paying = null }">
      <template #body>
        <div v-if="paying" class="flex flex-col gap-3">
          <UFormField :label="`Fecha de pago de ${paying.name}`"><UInput v-model="paidOn" type="date" class="w-full" /></UFormField>
          <UCheckbox v-model="again" label="¿Se vuelve a invertir?" />
          <div v-if="again" class="grid grid-cols-2 gap-2"><UInput v-model="againOn" type="date" /><UInput v-model="againAmount" type="number" step="0.01" min="0" placeholder="RMB" /></div>
        </div>
      </template>
      <template #footer><UButton class="ml-auto" :disabled="!paidOn || (again && (!againOn || !(Number(againAmount) > 0)))" :loading="saving" @click="payInvest">Guardar</UButton></template>
    </UModal>
  </SupplierPaymentPage>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ChinaCashHistory from '~/components/china-caja/ChinaCashHistory.vue'
import SupplierPaymentPage from '~/components/pago-proveedor/SupplierPaymentPage.vue'
import SupplierPaymentTabs from '~/components/pago-proveedor/SupplierPaymentTabs.vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { useModal } from '~/composables/commons/useModal'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaCashMonth, ChinaCashMovement, ChinaCashWeek } from '~/types/china-caja'
import { chinaToday, rmbSigned, variation } from '~/utils/chinaCaja'
import { dayLabel, monthLabel, rmb, usd } from '~/utils/yuanFormat'

definePageMeta({ middleware: 'auth' })

type Investment = ChinaCashMonth['investments'][number]
const ALL = 'mes'
const ORIGINS = ['Todos', 'Operación', 'Pago proveedor', 'Flete', 'Costo fijo', 'Inversión']
const route = useRoute()
const { showError, showConfirmation } = useModal()
const tab = ref('flujo')
const month = ref(/^20\d\d-(0[1-9]|1[0-2])$/.test(String(route.query.mes || '')) ? String(route.query.mes) : chinaToday().slice(0, 7))
const data = ref<ChinaCashMonth | null>(null)
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const period = ref(ALL)
const origin = ref('Todos')
const rate = ref('')
const opening = ref('')
const closingWeek = ref<ChinaCashWeek | null>(null)
const monthOpen = ref(false)
const closingBalance = ref('')
const screenshot = ref<File | null>(null)
const fixed = reactive({ name: '', amount: '' })
const invest = reactive({ name: '', due_on: '', amount: '' })
const paying = ref<Investment | null>(null)
const paidOn = ref('')
const again = ref(false)
const againOn = ref('')
const againAmount = ref('')

const week = computed(() => data.value?.weeks.find((item) => item.starts_on === period.value) || null)
const totals = computed(() => week.value?.totals ?? data.value!.totals)
const periodItems = computed(() => [{ label: 'Mes completo', value: ALL }, ...(data.value?.weeks || []).map((item) => ({ label: `${dayLabel(item.starts_on)} – ${dayLabel(item.ends_on)}`, value: item.starts_on }))])
const cards = computed(() => {
  const d = data.value!
  const t = totals.value
  const compare = (current: number, previous: number) => {
    const percent = week.value ? null : variation(current, previous)
    return percent === null ? '' : `${percent >= 0 ? '▲' : '▼'} ${Math.abs(percent)}% vs mes anterior`
  }
  return [
    { label: 'Saldo', value: d.balance === null ? '—' : rmbSigned(d.balance), sub: d.closed ? 'Saldo de cierre' : `Cierre proyectado ${d.projected_closing === null ? '—' : rmbSigned(d.projected_closing)}`, color: 'text-highlighted', compare: '' },
    { label: 'Utilidad', value: rmbSigned(t.profit), sub: `Proyectada ${rmbSigned(t.profit_projected)}`, color: t.profit < 0 ? 'text-error' : 'text-success', compare: '' },
    { label: 'Ingresos', value: rmb(t.income), sub: `Por ingresar ${rmb(t.income_projected)}`, color: 'text-success', compare: compare(t.income, d.previous_totals.income) },
    { label: 'Egresos', value: rmb(t.expense), sub: `Por salir ${rmb(t.expense_projected)}`, color: 'text-highlighted', compare: compare(t.expense, d.previous_totals.expense) }
  ]
})
const barMax = computed(() => Math.max(1, ...(data.value?.weeks || []).flatMap(({ totals: t }) => [t.income, t.income_projected, t.expense, t.expense_projected])))
const pendingRows = computed(() => (data.value?.pending || []).filter(visible))
const realRows = computed(() => (data.value?.real || []).filter(visible))
const fixedTotal = computed(() => (data.value?.fixed_costs || []).filter((row) => row.active).reduce((sum, row) => sum + row.amount, 0))
const investTotal = computed(() => (data.value?.investments || []).reduce((sum, row) => sum + row.amount, 0))
const investPaid = computed(() => (data.value?.investments || []).filter((row) => row.paid_on).reduce((sum, row) => sum + row.amount, 0))

function visible(row: ChinaCashMovement) {
  return (origin.value === 'Todos' || row.origin === origin.value) && (!week.value || (row.date >= week.value.starts_on && row.date <= week.value.ends_on))
}

function bar(value: number) {
  return `${Math.round(value / barMax.value * 100)}%`
}

function signed(row: ChinaCashMovement) {
  return `${row.type === 'in' ? '+' : '−'}${rmb(row.amount)}`
}

function countdown(row: ChinaCashMovement) {
  if (row.days === null || row.days === undefined) return 'Sin fecha'
  return row.days === 0 ? 'Vence hoy' : `Vence en ${row.days} d`
}

function linkOf(row: ChinaCashMovement) {
  if (row.link === 'operation') return `/operaciones-china?operacion=${row.link_id}`
  if (row.link === 'payment') return `/operaciones-china?cobro=${row.link_id}`
  if (row.link === 'container') return `/estado-contenedores-china?contenedor=${row.link_id}`
  return row.link === 'request' ? `/pago-proveedor/pagos-yuanes?solicitud=${row.link_id}` : undefined
}

let lastLoad = 0
async function load() {
  const current = ++lastLoad
  loading.value = true
  error.value = ''
  try {
    const response = (await ChinaCajaService.month(month.value)).data
    if (current !== lastLoad) return
    data.value = response
    rate.value = String(response.exchange_rate ?? '')
    opening.value = String(response.opening_balance ?? '')
  } catch (e: any) {
    if (current === lastLoad) error.value = e?.message || 'No se pudo cargar el flujo.'
  } finally {
    if (current === lastLoad) loading.value = false
  }
}

async function act(action: () => Promise<unknown>) {
  if (saving.value) return false
  saving.value = true
  try {
    await action()
    await load()
    return true
  } catch (e: any) {
    showError('Flujo de caja', e?.message || 'No se pudo guardar.')
    return false
  } finally {
    saving.value = false
  }
}

function saveSettings(body: { exchange_rate?: number; opening_balance?: number }) {
  return act(() => ChinaCajaService.settings(month.value, body))
}

function openWeek(target: ChinaCashWeek) {
  closingWeek.value = target
  closingBalance.value = ''
  screenshot.value = null
}

async function closeWeek() {
  if (await act(() => ChinaCajaService.closeWeek(month.value, closingWeek.value!.starts_on, Number(closingBalance.value), screenshot.value!))) closingWeek.value = null
}

function openMonth() {
  closingBalance.value = ''
  monthOpen.value = true
}

async function closeMonth() {
  if (await act(() => ChinaCajaService.closeMonth(month.value, Number(closingBalance.value)))) monthOpen.value = false
}

async function addFixed() {
  if (await act(() => ChinaCajaService.addFixedCost({ name: fixed.name.trim(), amount: Number(fixed.amount) }))) Object.assign(fixed, { name: '', amount: '' })
}

function removeFixed(row: { id: number; name: string }) {
  showConfirmation('¿Eliminar el costo fijo?', `${row.name}: ya no se descontará desde este mes.`, () => act(() => ChinaCajaService.removeFixedCost(row.id)))
}

async function addInvest() {
  if (await act(() => ChinaCajaService.addInvestment({ name: invest.name.trim(), due_on: invest.due_on, amount: Number(invest.amount) }))) Object.assign(invest, { name: '', due_on: '', amount: '' })
}

function removeInvest(row: Investment) {
  showConfirmation('¿Eliminar la inversión?', row.name, () => act(() => ChinaCajaService.removeInvestment(row.id)))
}

function openInvest(row: Investment) {
  paying.value = row
  paidOn.value = chinaToday()
  again.value = false
  againOn.value = ''
  againAmount.value = String(row.amount)
}

async function payInvest() {
  const body = { paid_on: paidOn.value, ...(again.value ? { again_on: againOn.value, again_amount: Number(againAmount.value) } : {}) }
  if (await act(() => ChinaCajaService.payInvestment(paying.value!.id, body))) paying.value = null
}

function viewMonth(value: string) {
  tab.value = 'flujo'
  month.value = value
}

watch(month, async () => {
  if (!month.value) return
  period.value = ALL
  await load()
  const target = data.value?.weeks.find((item) => item.starts_on === route.query.semana)
  if (target?.can_close) openWeek(target)
}, { immediate: true })
</script>
