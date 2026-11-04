<template>
  <SupplierPaymentWindow
    :open="payment !== null"
    :title="payment?.can_approve ? 'Aprobación del pago' : 'Detalle del pago'"
    :subtitle="subtitle"
    :code="payment?.request_code"
    :hint="payment?.observation"
    wide
    @close="emit('close')"
  >
    <template #pill>
      <span
        class="rounded-full px-2.5 py-1 text-xs font-bold"
        :class="payment && payment.difference < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'"
      >
        {{ payment?.status_label || 'Pendiente' }}
      </span>
    </template>

    <div v-if="payment" class="grid gap-4 lg:grid-cols-3">
      <SupplierPaymentCard title="Solicitud">
        <SupplierPaymentFact label="Cliente" :value="payment.client_name || '—'" />
        <SupplierPaymentFact label="Consolidado" :value="payment.consolidation || '—'" />
        <SupplierPaymentFact label="Proveedor" :value="supplier" />
        <SupplierPaymentFact label="Producto" :value="payment.product || '—'" />
        <SupplierPaymentFact label="Tipo de pago" :value="payment.currency === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T'" />
        <SupplierPaymentFact v-if="payment.installment_label" label="Cuota" :value="payment.installment_label" />
      </SupplierPaymentCard>

      <SupplierPaymentCard title="Depósitos registrados">
        <article v-for="deposit in payment.deposits" :key="deposit.id" class="border-b border-gray-100 py-2 last:border-0">
          <div class="flex items-start justify-between gap-2 text-sm">
            <div>
              <p class="font-bold">Abono #{{ deposit.id }} · {{ deposit.paid_on || 'Sin fecha' }}</p>
              <p class="text-xs text-gray-500">{{ deposit.bank_label }} · {{ deposit.operation_number }} · {{ deposit.status_label }}</p>
              <p v-if="deposit.shared" class="text-xs text-gray-500">
                Compartido con {{ deposit.shared_count }} proveedor{{ deposit.shared_count === 1 ? '' : 'es' }} más
              </p>
            </div>
            <div class="text-right">
              <p class="font-bold">${{ money(deposit.bank_amount) }}</p>
              <a v-if="deposit.voucher_url" :href="deposit.voucher_url" target="_blank" rel="noopener" class="text-xs font-semibold text-primary-600">Ver</a>
            </div>
          </div>
          <p v-if="deposit.recorded_amount != null" class="mt-1 text-xs text-amber-700">
            Ventas registró ${{ money(deposit.recorded_amount) }} · se ajustó al importe del banco
          </p>
        </article>
        <p v-if="!payment.deposits.length" class="text-sm text-gray-400">Sin depósitos.</p>
      </SupplierPaymentCard>

      <SupplierPaymentCard title="Comparación de importes">
        <div class="rounded-xl bg-gray-50 px-3 py-2">
          <p class="text-xs uppercase tracking-wide text-gray-500">Importe cobrado</p>
          <p class="text-xl font-bold">${{ money(payment.charged_amount) }}</p>
        </div>
        <div class="rounded-xl bg-primary-50 px-3 py-2">
          <p class="text-xs uppercase tracking-wide text-primary-700">Importe ingresado (banco)</p>
          <p class="text-xl font-bold text-primary-800">${{ money(payment.received_amount) }}</p>
        </div>
        <p class="text-sm" :class="payment.difference < 0 ? 'font-semibold text-red-600' : 'text-gray-700'">
          {{ payment.comparison_label }}. Tolerancia ${{ money(payment.tolerance) }}.
        </p>
        <p v-if="payment.deadline_text" class="text-xs" :class="payment.deadline_overdue ? 'font-semibold text-red-600' : 'text-gray-500'">
          {{ payment.deadline_text }}
        </p>
      </SupplierPaymentCard>
    </div>

    <div v-if="payment?.can_approve && payment.needs_reason" class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-amber-900">Motivo para asumir la diferencia</span>
        <textarea v-model="reason" rows="2" class="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5" />
      </label>
    </div>
    <div v-if="extending" class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <label class="mb-3 block text-sm">
        <span class="mb-1 block font-semibold text-amber-900">Días adicionales</span>
        <input v-model.number="extendDays" type="number" min="1" max="60" class="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5">
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-amber-900">Motivo para extender el plazo</span>
        <textarea v-model="extendReason" rows="2" class="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5" />
      </label>
    </div>
    <div v-if="cancelling" class="rounded-2xl border border-red-200 bg-white p-4">
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-red-700">Motivo de la anulación</span>
        <textarea v-model="cancelReason" rows="2" class="w-full rounded-lg border border-gray-300 px-2.5 py-1.5" />
      </label>
    </div>
    <div v-if="markingError" class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-amber-900">Qué debe corregir Ventas (error de registro)</span>
        <textarea v-model="errorDetail" rows="2" class="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5" />
      </label>
    </div>

    <template #footer>
      <UButton v-if="payment?.can_extend && !extending && !cancelling" color="neutral" variant="soft" @click="extending = true">Extender plazo</UButton>
      <UButton v-if="extending" color="primary" :loading="saving" @click="run('extend')">Confirmar extensión</UButton>
      <UButton v-if="payment?.can_cancel && !cancelling && !extending" color="error" variant="soft" @click="cancelling = true">Anular pago</UButton>
      <UButton v-if="cancelling" color="error" :loading="saving" @click="run('cancel')">Confirmar anulación</UButton>
      <UButton v-if="payment?.can_mark_registration_error && !markingError" color="neutral" variant="soft" @click="markingError = true">Error de registro</UButton>
      <UButton v-if="markingError" color="warning" :loading="saving" @click="run('registration_error')">Confirmar error de registro</UButton>
      <UButton v-if="payment?.can_collect" color="neutral" variant="soft" :loading="saving" @click="run('collect')">Por cobrar</UButton>
      <UButton v-if="payment?.can_approve" color="primary" :loading="saving" @click="run('approve')">
        {{ payment.needs_reason ? 'Aprobar asumiendo la diferencia' : 'Aprobar pago' }}
      </UButton>
    </template>
  </SupplierPaymentWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
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

const supplier = computed(() => {
  if (!props.payment) return 'Proveedor'
  return props.payment.supplier_name
    ? `${props.payment.supplier_code || ''} · ${props.payment.supplier_name}`
    : (props.payment.supplier_code || 'Proveedor')
})

const subtitle = computed(() => {
  if (!props.payment) return ''
  const parts = [props.payment.client_name || 'Cliente', props.payment.consolidation || 'Sin consolidado']
  if (props.payment.installment_label) parts.push(props.payment.installment_label)
  return parts.join(' · ')
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

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function run(action: 'approve' | 'collect' | 'extend' | 'cancel' | 'registration_error') {
  if (!props.payment) return
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
    showError('Aprobación', error?.data?.message || 'No se pudo completar la operación.')
  } finally {
    saving.value = false
  }
}
</script>
