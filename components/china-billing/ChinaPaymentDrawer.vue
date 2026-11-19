<template>
  <!-- #1917/#1918: en la maqueta es una ventana lateral, no emergente. -->
  <USlideover
    :open="!!payment"
    side="right"
    :ui="{ content: 'w-full max-w-xl sm:max-w-xl', body: 'bg-elevated/40' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #header>
      <div v-if="payment" class="flex w-full items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-muted">{{ payment.code }} · {{ dayLabel(payment.paid_on) }}</p>
          <p class="truncate text-2xl font-bold text-highlighted">{{ formatNombreEmpresa(payment.organization.name) }}</p>
          <p class="text-sm text-muted">{{ payment.organization.country || '—' }} · Enviado <strong class="text-highlighted">{{ usd(payment.amount_sent) }}</strong></p>
        </div>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Cerrar" @click="emit('close')" />
      </div>
    </template>
    <template #body>
      <div v-if="payment" class="flex flex-col gap-5">
        <!-- Avance: Por confirmar → Confirmado → En caja -->
        <div class="flex items-start px-1">
          <div v-for="(step, index) in steps" :key="step.label" class="flex flex-1 flex-col last:flex-none">
            <div class="flex items-center">
              <span class="size-3.5 flex-none rounded-full" :class="index + 1 <= stepIndex ? 'bg-primary' : 'bg-[#d5dbe6]'" />
              <span v-if="index < steps.length - 1" class="mx-2 h-0.5 flex-1 rounded" :class="index + 1 < stepIndex ? 'bg-primary' : 'bg-[#e6e9f0]'" />
            </div>
            <span class="mt-2 text-sm font-medium" :class="index + 1 <= stepIndex ? 'text-highlighted' : 'text-muted'">{{ step.label }}</span>
          </div>
        </div>

        <!-- 1 · Pago del cliente -->
        <section class="rounded-xl border border-default bg-default p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="font-semibold text-highlighted">1 · Pago del cliente</p>
            <span class="text-xs font-medium text-success">Registrado</span>
          </div>
          <div class="mb-3 flex items-center gap-2 rounded-lg bg-elevated/60 px-3 py-2 text-sm">
            <UIcon :name="payment.receipt_name ? 'i-heroicons-paper-clip' : 'i-heroicons-document-text'" class="size-4" :class="payment.receipt_name ? 'text-primary' : 'text-muted'" />
            <span class="flex-1 truncate">{{ payment.receipt_name || 'Sin comprobante adjunto' }}</span>
            <template v-if="payment.status === CHINA_STATUS.TO_CONFIRM">
              <UButton size="xs" color="primary" variant="link" class="px-0" :loading="busy" @click="receiptInput?.click()">{{ payment.receipt_name ? 'Reemplazar' : 'Adjuntar' }}</UButton>
              <UButton v-if="payment.receipt_name" size="xs" color="error" variant="link" class="px-0" :disabled="busy" @click="removeReceipt">Eliminar</UButton>
              <input ref="receiptInput" type="file" class="hidden" :accept="RECEIPT_ACCEPT" @change="replaceReceipt" />
            </template>
          </div>
          <div v-for="allocation in payment.allocations" :key="allocation.operation_id" class="flex items-center justify-between border-b border-default py-2 text-sm">
            <span class="flex flex-col">
              <span class="font-semibold text-highlighted">{{ allocation.code }}</span>
              <span class="text-xs text-muted">{{ allocation.label }}</span>
              <span v-if="shortfallNote(allocation)" class="text-xs text-error">{{ shortfallNote(allocation) }}</span>
            </span>
            <span class="font-semibold text-highlighted">{{ usd(allocation.real_amount ?? allocation.amount) }}</span>
          </div>
          <div v-if="(payment.unassigned || 0) > 0" class="flex items-center justify-between py-2 text-sm text-success">
            <span>Sin asignar · saldo a favor al confirmar</span>
            <span class="font-semibold">{{ usd(payment.unassigned) }}</span>
          </div>
          <UButton v-if="payment.status === CHINA_STATUS.TO_CONFIRM" class="mt-2 px-0 font-semibold" size="sm" color="primary" variant="link" @click="emit('edit', payment)">Editar monto y distribución</UButton>
        </section>

        <!-- 2 · Confirmar ingreso -->
        <section class="rounded-xl border border-default bg-default p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="font-semibold text-highlighted">2 · Confirmar ingreso</p>
            <span class="text-xs font-medium" :class="stepIndex >= 2 ? 'text-success' : 'text-primary'">{{ stepIndex >= 2 ? 'Completado' : 'En curso' }}</span>
          </div>

          <template v-if="payment.status === CHINA_STATUS.TO_CONFIRM">
            <div class="mb-3 flex items-center gap-3 rounded-lg bg-elevated/60 p-3">
              <img v-if="receiptIsImage" :src="payment.receipt_url!" alt="Comprobante" class="h-16 w-24 flex-none cursor-pointer rounded-lg object-cover ring ring-default" @click="viewer = { url: payment.receipt_url!, name: payment.receipt_name }">
              <span v-else class="grid size-14 flex-none place-items-center rounded-lg bg-default text-xs font-semibold text-primary ring ring-default">{{ receiptExtension }}</span>
              <div class="flex flex-col gap-1 text-sm">
                <span class="text-xs uppercase tracking-wider text-muted">Comprobante del cliente · {{ usd(payment.amount_sent) }}</span>
                <span class="truncate">{{ payment.receipt_name || 'Sin comprobante adjunto' }}</span>
                <UButton size="sm" class="self-start" color="primary" variant="outline" icon="i-heroicons-eye" :disabled="!payment.receipt_url" @click="payment.receipt_url && (viewer = { url: payment.receipt_url, name: payment.receipt_name })">Ver comprobante</UButton>
                <span v-if="!payment.receipt_url" class="text-xs text-muted">Sin comprobante: confirma contra el estado de cuenta del banco.</span>
              </div>
            </div>
            <UFormField label="Monto real recibido en el banco (USD)">
              <UInputNumber :ui="{ increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' }" v-model="received" :min="0" :step="0.01" class="w-full" />
            </UFormField>
            <div v-if="needsShortfall" class="mt-3 rounded-lg border border-error/30 bg-error/5 p-3">
              <p class="mb-2 text-sm text-error">Llegaron <strong>{{ usd(shortfallAmount) }}</strong> menos. ¿A qué operación cargas la diferencia?</p>
              <button
                v-for="item in shortfallItems"
                :key="item.value"
                type="button"
                class="mb-1.5 flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm"
                :class="shortfallOperationId === item.value ? 'border-primary bg-primary/5' : 'border-default bg-default'"
                @click="shortfallOperationId = item.value"
              >
                <span class="size-3.5 flex-none rounded-full border" :class="shortfallOperationId === item.value ? 'border-primary bg-primary' : 'border-[#d5dbe6]'" />
                <span class="flex flex-1 flex-col"><span class="font-semibold text-highlighted">{{ item.code }}</span><span class="text-xs text-muted">{{ item.label }}</span></span>
                <span class="font-semibold text-highlighted">{{ usd(item.amount) }}</span>
              </button>
            </div>
            <p v-if="liveExcess > 0" class="mt-3 rounded-lg bg-[#eef8f2] px-3 py-2 text-sm text-success">{{ usd(liveExcess) }} quedará como saldo a favor de {{ formatNombreEmpresa(payment.organization.name) }}.</p>
            <UButton class="mt-3" block color="primary" :loading="busy" :disabled="!received || (needsShortfall && !shortfallOperationId)" @click="confirm">Confirmar ingreso</UButton>
          </template>

          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-elevated/60 px-3 py-2"><p class="text-xs uppercase tracking-wider text-muted">Recibido</p><p class="text-lg font-bold text-highlighted">{{ usd(payment.amount_received || 0) }}</p></div>
              <div class="rounded-lg bg-elevated/60 px-3 py-2">
                <p class="text-xs uppercase tracking-wider text-muted">Diferencia</p>
                <p class="text-lg font-bold" :class="payment.shortfall > 0 ? 'text-error' : 'text-highlighted'">{{ payment.shortfall > 0 ? `−${usd(payment.shortfall)}` : usd(0) }}</p>
                <p v-if="payment.shortfall > 0 && shortfallCode" class="text-xs text-muted">Cargada a {{ shortfallCode }}</p>
              </div>
            </div>
            <p v-if="payment.credit_generated > 0" class="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">Saldo a favor generado: <strong>{{ usd(payment.credit_generated) }}</strong></p>
            <UButton v-if="payment.status === CHINA_STATUS.CONFIRMED && payment.credit_used <= 0" class="mt-3 px-0 font-semibold" size="sm" color="primary" variant="link" :loading="busy" @click="run(() => ChinaBillingService.unconfirmPayment(payment!.id))">Editar monto recibido</UButton>
          </template>
        </section>

        <!-- 3 · Cambio a RMB -->
        <section class="rounded-xl border border-default bg-default p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="font-semibold text-highlighted">3 · Cambio a RMB</p>
            <span class="text-xs font-medium" :class="stepIndex >= 3 ? 'text-success' : stepIndex === 2 ? 'text-primary' : 'text-muted'">{{ stepIndex >= 3 ? 'Completado' : stepIndex === 2 ? 'En curso' : 'Bloqueado' }}</span>
          </div>

          <p v-if="stepIndex < 2" class="text-sm text-muted">Disponible cuando se confirme el ingreso.</p>

          <template v-else-if="payment.status === CHINA_STATUS.CONFIRMED">
            <div class="grid grid-cols-2 items-end gap-3">
              <div class="rounded-lg bg-elevated/60 px-3 py-2"><p class="text-xs text-muted">Monto confirmado (USD)</p><p class="text-lg font-bold text-highlighted">{{ usd(payment.amount_received || 0) }}</p></div>
              <UFormField label="Tipo de cambio del banco"><UInputNumber :ui="{ increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' }" v-model="exchangeRate" :min="0" :step="0.0001" class="w-full" /></UFormField>
            </div>
            <div class="mt-3 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-3 text-sm">
              <span class="text-highlighted">Ingresa a caja</span>
              <span class="text-xl font-bold text-highlighted">{{ yuanPreview }}</span>
            </div>
            <div class="mt-3"><YuanFilePick label="Adjuntar boucher del cambio (opcional)" :accept="RECEIPT_ACCEPT" @pick="voucher = $event" /></div>
            <UButton class="mt-3" block color="primary" :loading="busy" :disabled="!exchangeRate" @click="cash">Pasar a caja</UButton>
          </template>

          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-elevated/60 px-3 py-2"><p class="text-xs uppercase tracking-wider text-muted">Tipo de cambio</p><p class="text-lg font-bold text-highlighted">{{ payment.exchange_rate }}</p></div>
              <div class="rounded-lg bg-elevated/60 px-3 py-2"><p class="text-xs uppercase tracking-wider text-muted">En caja</p><p class="text-lg font-bold text-highlighted">{{ rmb(payment.yuan_amount || 0) }}</p></div>
            </div>
            <div class="mt-3 flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-document-text" class="size-4 text-muted" />
              <span class="flex-1 truncate">{{ payment.cash_voucher_name || 'Sin boucher adjunto' }}</span>
              <UButton v-if="payment.cash_voucher_url" size="xs" color="primary" variant="link" icon="i-heroicons-eye" @click="viewer = { url: payment.cash_voucher_url, name: payment.cash_voucher_name }">Ver</UButton>
            </div>
            <UButton class="mt-3" size="sm" color="neutral" variant="outline" :loading="busy" @click="run(() => ChinaBillingService.uncashPayment(payment!.id))">Deshacer cambio</UButton>
          </template>
        </section>

        <!-- Eliminar -->
        <section class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3c9c5] bg-[#fdf1f0] p-4">
          <div class="flex flex-1 flex-col text-sm">
            <span class="font-semibold text-highlighted">¿Registraste este pago por error?</span>
            <span class="text-xs text-muted">{{ deleteText }}</span>
          </div>
          <UButton color="error" variant="outline" icon="i-heroicons-trash" @click="remove">Eliminar pago</UButton>
        </section>
      </div>
    </template>
  </USlideover>
  <VoucherViewerModal :open="!!viewer" :url="viewer?.url || null" :name="viewer?.name" @close="viewer = null" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VoucherViewerModal from '~/components/pago-proveedor/VoucherViewerModal.vue'
import YuanFilePick from '~/components/pago-proveedor/YuanFilePick.vue'
import { CHINA_STATUS, RECEIPT_ACCEPT } from '~/constants/chinaBilling'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaPayment, ChinaPaymentAllocation } from '~/types/china-billing'
import { formatNombreEmpresa } from '~/utils/formatters'

const props = defineProps<{ payment: ChinaPayment | null }>()
const emit = defineEmits<{ close: []; changed: []; edit: [payment: ChinaPayment] }>()

const { showError, showConfirmation } = useModal()
const busy = ref(false)
const received = ref<number | null>(null)
const shortfallOperationId = ref<number | null>(null)
const exchangeRate = ref<number | null>(null)
const voucher = ref<File | null>(null)
const viewer = ref<{ url: string; name?: string | null } | null>(null)

const steps = [{ label: 'Por confirmar' }, { label: 'Confirmado' }, { label: 'En caja' }]
const stepIndex = computed(() => ({ [CHINA_STATUS.TO_CONFIRM]: 1, [CHINA_STATUS.CONFIRMED]: 2, [CHINA_STATUS.IN_CASH]: 3 }[props.payment?.status || ''] ?? 1))

const receiptExtension = computed(() => (props.payment?.receipt_name?.split('.').pop() || 'SIN ARCHIVO').toUpperCase())

/** Vista previa mientras se escribe; el backend vuelve a calcular y valida al confirmar. */
// Igual que el back (ChinaBillingCalculator::expectedShortfall): la diferencia es lo enviado menos lo recibido,
// con tope en lo asignado; se carga a una operación y lo no asignado sigue como saldo a favor.
const shortfallAmount = computed(() => {
  const p = props.payment
  if (!p || received.value === null || p.allocated <= 0) return 0
  return round2(Math.min(p.allocated, Math.max(0, Math.max(p.amount_sent, p.allocated) - received.value)))
})
const needsShortfall = computed(() => shortfallAmount.value > 0 && !!props.payment?.allocations.length)
const liveExcess = computed(() => (props.payment && received.value !== null ? round2(Math.max(0, received.value + shortfallAmount.value - props.payment.allocated)) : 0))
const receiptIsImage = computed(() => !!props.payment?.receipt_url && /\.(png|jpe?g|webp|gif)$/i.test(props.payment.receipt_name || props.payment.receipt_url || ''))
const receiptInput = ref<HTMLInputElement | null>(null)

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function paymentPayload(extra: { receipt?: File | null; remove_receipt?: boolean }) {
  const p = props.payment!
  return {
    paid_on: p.paid_on || '',
    amount_sent: p.amount_sent,
    allocations: p.allocations.map((a) => ({ operation_id: a.operation_id, amount: a.amount })),
    receipt: extra.receipt ?? null,
    remove_receipt: extra.remove_receipt
  }
}

async function replaceReceipt(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  input.value = ''
  if (!file || !props.payment) return
  await run(() => ChinaBillingService.updatePayment(props.payment!.id, paymentPayload({ receipt: file })))
}

function removeReceipt() {
  showConfirmation('Eliminar comprobante', `¿Quitar el comprobante de ${props.payment?.code}?`, async () => {
    await run(() => ChinaBillingService.updatePayment(props.payment!.id, paymentPayload({ remove_receipt: true })))
  })
}
const shortfallItems = computed(() => (props.payment?.allocations || [])
  .filter((allocation) => allocation.amount >= shortfallAmount.value)
  .map((allocation) => ({ value: allocation.operation_id, code: allocation.code, label: allocation.label || '', amount: allocation.amount })))
const shortfallCode = computed(() => props.payment?.allocations.find((a) => a.operation_id === props.payment?.shortfall_operation_id)?.code || '')
const yuanPreview = computed(() => (props.payment && exchangeRate.value ? rmb((props.payment.amount_received || 0) * exchangeRate.value) : '—'))

const deleteText = computed(() => {
  const codes = props.payment?.allocations.map((a) => a.code).join(', ') || 'las operaciones'
  return `Se quitará de ${codes} y volverán a Pendiente (si no tienen otros pagos).${props.payment?.status === CHINA_STATUS.IN_CASH ? ` También sale de caja ${rmb(props.payment.yuan_amount || 0)}.` : ''}${(props.payment?.credit_used || 0) > 0 ? ` Se anulará el saldo a favor aplicado desde este pago (${usd(props.payment!.credit_used)}).` : ''}`
})

function shortfallNote(allocation: ChinaPaymentAllocation): string {
  if (!props.payment || props.payment.shortfall_operation_id !== allocation.operation_id || props.payment.shortfall <= 0) return ''
  return `Incluye diferencia de −${usd(props.payment.shortfall)}`
}

watch(() => props.payment?.id, () => {
  received.value = props.payment?.amount_received ?? props.payment?.amount_sent ?? null
  shortfallOperationId.value = props.payment?.allocations[0]?.operation_id ?? null
  exchangeRate.value = props.payment?.exchange_rate ?? null
  voucher.value = null
}, { immediate: true })

async function run(action: () => Promise<unknown>) {
  busy.value = true
  try {
    await action()
    emit('changed')
  } catch (error: any) {
    showError('Cobros', error?.message || 'No se pudo completar la acción.')
  } finally {
    busy.value = false
  }
}

async function confirm() {
  if (!received.value) {
    showError('Cobros', 'Indica el monto recibido.')
    return
  }
  await run(() => ChinaBillingService.confirmPayment(props.payment!.id, received.value!, needsShortfall.value ? shortfallOperationId.value : null))
}

async function cash() {
  if (!exchangeRate.value) {
    showError('Cobros', 'Indica el tipo de cambio.')
    return
  }
  await run(() => ChinaBillingService.cashPayment(props.payment!.id, exchangeRate.value!, voucher.value))
}

function remove() {
  showConfirmation(
    `¿Eliminar ${props.payment?.code}?`,
    `De ${props.payment?.organization.name} por ${usd(props.payment?.amount_sent)}. Esta acción no se puede deshacer.`,
    async () => {
      await run(() => ChinaBillingService.deletePayment(props.payment!.id))
      emit('close')
    }
  )
}
</script>
