<template>
  <SupplierPaymentWindow
    :open="payment !== null"
    :title="payment?.can_approve ? 'Aprobación del pago' : 'Detalle del pago'"
    :subtitle="subtitle"
    :code="payment?.request_code"
    :hint="payment?.can_approve && !depositsOpen ? 'Aprobar asumiendo la diferencia es siempre una acción manual.' : undefined"
    wide
    @close="emit('close')"
  >
    <template #pill>
      <UBadge :color="pill.color" variant="soft" :label="pill.label" />
    </template>

    <template v-if="payment">
      <p v-if="depositsOpen" class="rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">Los depósitos de este pago se validan en <strong>Verificación</strong>. El pago llega aquí solo si, ya validados, necesita tu decisión.</p>
      <p v-if="payment.status === APPROVAL_STATUS.TO_COLLECT" class="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
        <strong>Por cobrar:</strong> Ventas debe cobrar ${{ money(payment.collect_amount ?? Math.abs(payment.difference)) }} al cliente y registrar su voucher.
        <strong v-if="payment.deadline_text">{{ payment.deadline_text }}.</strong>
        Si cambias de decisión, puedes aprobar el pago asumiendo la diferencia.
      </p>
      <p v-else-if="payment.status === APPROVAL_STATUS.APPROVED" class="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">✓ Pago aprobado. {{ payment.observation }}</p>

      <div class="grid gap-4 lg:grid-cols-3">
        <SupplierPaymentCard title="Solicitud" icon="i-lucide-file-text">
          <SupplierPaymentFact label="Cliente" :value="payment.client_name || '—'" />
          <SupplierPaymentFact label="Código de proveedor" :value="payment.supplier_code || '—'" />
          <SupplierPaymentFact v-if="payment.supplier_name" label="Proveedor" :value="payment.supplier_name" />
          <SupplierPaymentFact label="Producto" :value="payment.product || '—'" />
          <SupplierPaymentFact label="Tipo de pago" :value="payment.currency === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T'" />
          <SupplierPaymentFact label="Modalidad" :value="payment.modality_label || payment.installment_label || 'Total'" />
          <div class="mt-1">
            <SupplierPaymentFact v-if="payment.cargo_amount != null" label="Valor de carga" :value="`$${money(payment.cargo_amount)}`" />
            <SupplierPaymentFact v-if="payment.bank_fee_amount" label="Comisión bancaria / plataforma" :value="`$${money(payment.bank_fee_amount)}`" />
            <SupplierPaymentFact v-if="payment.admin_fee_amount" label="Comisión administrativa" :value="`$${money(payment.admin_fee_amount)}`" />
            <SupplierPaymentFact label="Importe cobrado" :value="`$${money(payment.charged_amount)}`" />
          </div>
        </SupplierPaymentCard>

        <SupplierPaymentCard title="Depósitos registrados" icon="i-lucide-landmark">
          <span v-if="validatedCount" class="w-fit rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-300">✓ {{ validatedCount }} validado{{ validatedCount > 1 ? 's' : '' }}</span>
          <article
            v-for="deposit in payment.deposits"
            :key="deposit.id"
            class="rounded-xl border p-3 text-sm"
            :class="deposit.status_label === 'Validado' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' : deposit.status_label === 'Observado' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30' : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'"
          >
            <div class="flex items-start justify-between gap-2">
              <strong>Abono {{ deposit.number ?? deposit.id }} · {{ fechaCorta(deposit.paid_on) }}</strong>
              <span class="whitespace-nowrap text-xs font-semibold">{{ deposit.status_label === 'Validado' ? '✓ Validado' : deposit.status_label }}</span>
            </div>
            <div class="mt-1 flex items-center gap-2 text-xs text-muted">
              {{ deposit.bank_label }} · N.° {{ deposit.operation_number || '—' }}
              <UButton v-if="deposit.voucher_url" size="xs" color="neutral" variant="outline" icon="i-lucide-eye" title="Ver voucher" :to="deposit.voucher_url" target="_blank" />
            </div>
            <div class="mt-1.5 flex justify-between gap-2 text-xs">
              <span class="text-muted">Importe ingresado (Banco)</span>
              <strong class="text-sm">${{ money(deposit.bank_amount) }}</strong>
            </div>
            <p v-if="deposit.shared" class="mt-1.5 text-xs text-muted">Depósito compartido con {{ deposit.shared_count }} proveedor{{ deposit.shared_count === 1 ? '' : 'es' }} más · aplicado aquí ${{ money(deposit.applied_amount) }}.</p>
          </article>
          <p
            v-for="deposit in adjustedDeposits"
            :key="`ajuste-${deposit.id}`"
            class="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
          >
            Ventas registró <strong>${{ money(deposit.recorded_amount) }}</strong> · se ajustó al importe del banco.
          </p>
          <p v-if="!payment.deposits.length" class="text-sm text-muted">Sin depósitos.</p>
        </SupplierPaymentCard>

        <SupplierPaymentCard title="Comparación de importes" icon="i-lucide-chart-no-axes-column">
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/30">
              <p class="text-[11px] font-semibold uppercase text-muted">Importe cobrado</p>
              <p class="mt-1 text-lg font-bold text-orange-600">${{ money(payment.charged_amount) }}</p>
            </div>
            <div class="rounded-lg border border-default p-3">
              <p class="text-[11px] font-semibold uppercase text-muted">Importe ingresado (Banco)</p>
              <p class="mt-1 text-lg font-bold">{{ depositsOpen ? '—' : `$${money(payment.received_amount)}` }}</p>
            </div>
          </div>
          <p class="rounded-lg p-3 text-sm" :class="comparison.clase">
            <strong v-if="comparison.titulo">{{ comparison.titulo }}</strong>{{ comparison.texto }}
          </p>
        </SupplierPaymentCard>
      </div>
    </template>

    <div v-if="payment?.can_approve && !depositsOpen && payment.needs_reason" class="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
      <div class="mb-2 flex items-center gap-3">
        <span class="flex size-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-600"><UIcon name="i-lucide-send" class="size-5" /></span>
        <h4 class="font-bold">Decisión</h4>
        <span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">Pendiente</span>
      </div>
      <p class="mb-3 text-sm text-muted">Aprueba asumiendo la diferencia (siempre es una acción manual y pide motivo) o márcala "Por cobrar" para que Ventas la cobre al cliente.</p>
      <label class="block text-sm">
        <span class="mb-1 block font-semibold">Motivo (obligatorio): Probusiness asume la diferencia y no se cobra al cliente</span>
        <textarea v-model="reason" rows="3" placeholder="Describe el motivo" class="w-full rounded-lg border border-default bg-default px-2.5 py-1.5" />
      </label>
    </div>
    <UCard v-if="extending" color="warning" variant="subtle">
      <label class="mb-3 block text-sm">
        <span class="mb-1 block font-semibold">Días adicionales</span>
        <UInput v-model.number="extendDays" type="number" min="1" max="60" class="w-full" />
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-semibold">Motivo para extender el plazo</span>
        <textarea v-model="extendReason" rows="2" class="w-full rounded-lg border border-default bg-default px-2.5 py-1.5" />
      </label>
    </UCard>
    <UCard v-if="cancelling" color="error" variant="subtle">
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-error">Motivo de la anulación</span>
        <textarea v-model="cancelReason" rows="2" class="w-full rounded-lg border border-default bg-default px-2.5 py-1.5" />
      </label>
    </UCard>
    <UCard v-if="markingError" color="warning" variant="subtle">
      <label class="block text-sm">
        <span class="mb-1 block font-semibold">Qué debe corregir Ventas (error de registro)</span>
        <textarea v-model="errorDetail" rows="2" class="w-full rounded-lg border border-default bg-default px-2.5 py-1.5" />
      </label>
    </UCard>

    <template #footer>
      <UButton color="neutral" variant="outline" @click="emit('close')">{{ payment?.can_approve ? 'Cancelar' : 'Cerrar' }}</UButton>
      <template v-if="depositsOpen">
        <UButton class="boton-naranja" to="/verificacion?tab=supplier-payment">Ir a Verificación</UButton>
      </template>
      <template v-else>
        <UButton v-if="payment?.can_extend && !extending && !cancelling" color="neutral" variant="outline" @click="extending = true">Extender plazo</UButton>
        <UButton v-if="extending" color="primary" :loading="saving" @click="run('extend')">Confirmar extensión</UButton>
        <UButton v-if="payment?.can_cancel && !cancelling && !extending" color="error" variant="outline" @click="cancelling = true">Anular pago</UButton>
        <UButton v-if="cancelling" color="error" :loading="saving" @click="run('cancel')">Confirmar anulación</UButton>
        <UButton v-if="payment?.can_mark_registration_error && !markingError" color="neutral" variant="outline" @click="markingError = true">Error de registro</UButton>
        <UButton v-if="markingError" color="warning" :loading="saving" @click="run('registration_error')">Confirmar error de registro</UButton>
        <UButton v-if="payment?.can_collect" color="neutral" variant="outline" :loading="saving" @click="run('collect')">Por cobrar</UButton>
        <UButton v-if="payment?.can_approve" class="boton-naranja" :loading="saving" @click="run('approve')">Aprobar pago</UButton>
      </template>
    </template>
  </SupplierPaymentWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { APPROVAL_STATUS } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentApproval } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{ payment: SupplierPaymentApproval | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { showSuccess, showError } = useModal()

const reason = ref('')
const cancelReason = ref('')
const errorDetail = ref('')
const extendReason = ref('')
const extendDays = ref(7)
const cancelling = ref(false)
const extending = ref(false)
const markingError = ref(false)
const saving = ref(false)

const deposits = computed(() => props.payment?.deposits || [])
const depositsOpen = computed(() => !!props.payment?.can_approve && deposits.value.some((deposit) => deposit.status_label !== 'Validado'))
const validatedCount = computed(() => deposits.value.filter((deposit) => deposit.status_label === 'Validado').length)
const adjustedDeposits = computed(() => deposits.value.filter((deposit) => deposit.recorded_amount != null && Math.abs(Number(deposit.recorded_amount) - Number(deposit.bank_amount)) > 0.004))
const pill = computed<{ color: 'error' | 'warning' | 'info' | 'success'; label: string }>(() => {
  const difference = Number(props.payment?.difference || 0)
  if (deposits.value.some((deposit) => deposit.status_label === 'Observado')) return { color: 'error', label: 'Depósito observado' }
  if (depositsOpen.value) return { color: 'warning', label: 'Depósito por validar' }
  if (difference < -0.004) return { color: 'error', label: `Faltan $${money(-difference)}` }
  if (difference > 0.004) return { color: 'info', label: `Sobran $${money(difference)}` }
  return { color: 'success', label: 'Importes coinciden' }
})
const comparison = computed(() => {
  const payment = props.payment
  const verde = 'bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300'
  const rojo = 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
  if (!payment) return { clase: verde, titulo: '', texto: '' }
  if (depositsOpen.value) return { clase: rojo, titulo: '', texto: 'Faltan validar depósitos (que el dinero ingresó al banco) antes de aprobar el pago.' }
  const difference = Number(payment.difference || 0)
  const monto = `$${money(Math.abs(difference))}`
  const tolerancia = `$${money(payment.tolerance)}`
  if (Math.abs(difference) <= 0.004) return { clase: verde, titulo: '✓ ', texto: 'Los importes coinciden.' }
  if (!payment.needs_reason) return { clase: verde, titulo: '', texto: `${difference < 0 ? 'Faltan' : 'Sobran'} ${monto}: dentro de la tolerancia de ${tolerancia}.` }
  if (difference < 0) return { clase: rojo, titulo: `Faltan ${monto}`, texto: `: supera la tolerancia de ${tolerancia}. Aprobar pago: lo asume Probusiness (motivo obligatorio). Por cobrar: Ventas cobra la diferencia al cliente.` }
  return { clase: rojo, titulo: `Sobran ${monto}`, texto: `: supera la tolerancia de ${tolerancia}. Aprobar el pago pide motivo.` }
})

function fechaCorta(fecha?: string | null) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha || '')
  return partes ? `${Number(partes[3])}/${Number(partes[2])}/${partes[1]}` : 'Sin fecha'
}

const subtitle = computed(() => {
  if (!props.payment) return ''
  return `${props.payment.client_name || 'Cliente'} · Consolidado ${props.payment.consolidation || '—'}`
})

watch(() => props.payment?.id, () => {
  reason.value = ''
  cancelReason.value = ''
  errorDetail.value = ''
  extendReason.value = ''
  extendDays.value = 7
  cancelling.value = false
  extending.value = false
  markingError.value = false
})

function money(value?: number | null) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function run(action: 'approve' | 'collect' | 'extend' | 'cancel' | 'registration_error') {
  if (!props.payment) return
  if (action === 'approve' && props.payment.needs_reason && !reason.value.trim()) {
    showError('Aprobar pago', 'Indica el motivo para asumir la diferencia.')
    return
  }
  if (action === 'registration_error' && !errorDetail.value.trim()) {
    showError('Error de registro', 'Indica qué debe corregir Ventas.')
    return
  }
  if (action === 'extend' && !extendReason.value.trim()) {
    showError('Extender plazo', 'Indica el motivo.')
    return
  }
  if (action === 'cancel' && !cancelReason.value.trim()) {
    showError('Anular pago', 'Indica el motivo.')
    return
  }
  saving.value = true
  try {
    if (action === 'approve') await PagoProveedorService.approvePayment(props.payment.id, reason.value)
    if (action === 'collect') await PagoProveedorService.collectPayment(props.payment.id)
    if (action === 'extend') {
      await PagoProveedorService.extendCollect(props.payment.id, {
        reason: extendReason.value.trim(),
        days: Number(extendDays.value) || 7
      })
    }
    if (action === 'cancel') await PagoProveedorService.cancelPayment(props.payment.id, cancelReason.value)
    if (action === 'registration_error') await PagoProveedorService.markRegistrationError(props.payment.id, errorDetail.value)
    showSuccess('Aprobación', 'El pago quedó actualizado.')
    emit('saved')
    emit('close')
  } catch (error: any) {
    showError('Aprobación', error?.data?.message || error?.message || 'No se pudo completar la operación.')
  } finally {
    saving.value = false
  }
}
</script>


<style scoped>
.boton-naranja {
  background: #f97316 !important;
  color: #fff !important;
}
.boton-naranja:disabled {
  opacity: 0.5;
}
</style>
