<template>
  <UModal :open="payment !== null" class="w-full max-w-3xl" @update:open="(open) => !open && emit('close')">
    <template #header>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ payment?.can_approve ? 'Aprobación del pago' : 'Detalle del pago' }}</h3>
        <p class="text-sm text-gray-500">
          {{ payment?.client_name || 'Cliente' }} · {{ payment?.consolidation || 'Sin consolidado' }}
          <span v-if="payment?.installment_label"> · {{ payment.installment_label }}</span>
          <span v-if="payment?.request_code"> · {{ payment.request_code }}</span>
        </p>
      </div>
    </template>

    <template #body>
      <div v-if="payment" class="space-y-4">
        <div class="rounded-lg border border-gray-200 p-4">
          <h4 class="text-sm font-semibold text-gray-800">Solicitud</h4>
          <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt class="text-gray-500">Proveedor</dt><dd>{{ supplier }}</dd></div>
            <div><dt class="text-gray-500">Producto</dt><dd>{{ payment.product || '—' }}</dd></div>
            <div><dt class="text-gray-500">Tipo de pago</dt><dd>{{ payment.currency === 'RMB' ? 'RMB / Transferencia' : 'USD / T-T' }}</dd></div>
            <div><dt class="text-gray-500">Importe cobrado</dt><dd class="font-semibold">${{ money(payment.charged_amount) }}</dd></div>
          </dl>
        </div>

        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-800">Depósitos registrados</h4>
          <article v-for="deposit in payment.deposits" :key="deposit.id" class="rounded-lg border border-gray-200 p-3 text-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold">Abono #{{ deposit.id }} · {{ deposit.paid_on || 'Sin fecha' }}</p>
                <p class="text-gray-600">{{ deposit.bank_label }} · {{ deposit.operation_number }} · {{ deposit.status_label }}</p>
                <p v-if="deposit.recorded_amount != null" class="mt-1 text-amber-700">
                  Ventas registró ${{ money(deposit.recorded_amount) }} · se ajustó al importe del banco
                </p>
                <p v-if="deposit.shared" class="mt-1 text-gray-500">
                  Depósito compartido con {{ deposit.shared_count }} proveedor{{ deposit.shared_count === 1 ? '' : 'es' }} más
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold">${{ money(deposit.bank_amount) }}</p>
                <a v-if="deposit.voucher_url" :href="deposit.voucher_url" target="_blank" rel="noopener" class="text-xs text-primary-600">Ver</a>
              </div>
            </div>
          </article>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-gray-200 p-4">
            <p class="text-xs uppercase tracking-wide text-gray-500">Importe cobrado</p>
            <p class="mt-1 text-xl font-semibold">${{ money(payment.charged_amount) }}</p>
          </div>
          <div class="rounded-lg border border-gray-200 p-4">
            <p class="text-xs uppercase tracking-wide text-gray-500">Importe ingresado (banco)</p>
            <p class="mt-1 text-xl font-semibold">${{ money(payment.received_amount) }}</p>
          </div>
        </div>
        <p class="text-sm" :class="payment.difference < 0 ? 'font-semibold text-red-600' : 'text-gray-700'">
          {{ payment.comparison_label }}. Tolerancia ${{ money(payment.tolerance) }}.
        </p>
        <p class="text-sm" :class="payment.observation_for_admin ? 'font-semibold text-red-600' : 'text-gray-500'">{{ payment.observation }}</p>

        <label v-if="payment.can_approve && payment.needs_reason" class="block text-sm">
          <span class="mb-1 block text-gray-500">Motivo para asumir la diferencia</span>
          <textarea v-model="reason" rows="2" class="w-full rounded-md border border-gray-300 px-2 py-1.5" />
        </label>
        <label v-if="cancelling" class="block text-sm">
          <span class="mb-1 block text-gray-500">Motivo de la anulación</span>
          <textarea v-model="cancelReason" rows="2" class="w-full rounded-md border border-gray-300 px-2 py-1.5" />
        </label>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="emit('close')">Cerrar</UButton>
        <UButton v-if="payment?.can_extend" color="neutral" variant="soft" :loading="saving" @click="run('extend')">Extender plazo</UButton>
        <UButton v-if="payment?.can_cancel && !cancelling" color="error" variant="soft" @click="cancelling = true">Anular pago</UButton>
        <UButton v-if="cancelling" color="error" :loading="saving" @click="run('cancel')">Confirmar anulación</UButton>
        <UButton v-if="payment?.can_collect" color="neutral" variant="soft" :loading="saving" @click="run('collect')">Por cobrar</UButton>
        <UButton v-if="payment?.can_approve" color="primary" :loading="saving" @click="run('approve')">
          {{ payment.needs_reason ? 'Aprobar asumiendo la diferencia' : 'Aprobar pago' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentApproval } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{ payment: SupplierPaymentApproval | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { showSuccess, showError } = useModal()

const reason = ref('')
const cancelReason = ref('')
const cancelling = ref(false)
const saving = ref(false)

const supplier = computed(() => {
  if (!props.payment) return 'Proveedor'
  return props.payment.supplier_name
    ? `${props.payment.supplier_code || ''} · ${props.payment.supplier_name}`
    : (props.payment.supplier_code || 'Proveedor')
})

watch(() => props.payment?.id, () => {
  reason.value = ''
  cancelReason.value = ''
  cancelling.value = false
})

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function run(action: 'approve' | 'collect' | 'extend' | 'cancel') {
  if (!props.payment) return
  saving.value = true
  try {
    if (action === 'approve') await PagoProveedorService.approvePayment(props.payment.id, reason.value)
    if (action === 'collect') await PagoProveedorService.collectPayment(props.payment.id)
    if (action === 'extend') await PagoProveedorService.extendCollect(props.payment.id)
    if (action === 'cancel') await PagoProveedorService.cancelPayment(props.payment.id, cancelReason.value)
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
