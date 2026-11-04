<template>
  <SupplierPaymentWindow
    :open="deposit !== null"
    title="Validar depósito"
    :subtitle="subtitle"
    :code="requestCodes"
    hint="El importe del banco es el que cuenta para el pago. Guardar cambios no valida el depósito."
    wide
    @close="emit('close')"
  >
    <template #pill>
      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="deposit?.deadline_overdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'">
        {{ deposit?.status_label || 'Por validar' }}
      </span>
    </template>

    <div v-if="deposit" class="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <SupplierPaymentCard title="Comprobante">
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <img v-if="isImage" :src="deposit.voucher_url || ''" alt="Comprobante" class="max-h-80 w-full object-contain">
          <a v-else-if="deposit.voucher_url" :href="deposit.voucher_url" target="_blank" rel="noopener" class="block px-4 py-6 text-sm font-semibold text-primary-600">
            Abrir comprobante · {{ deposit.voucher_name }}
          </a>
          <p v-else class="px-4 py-6 text-sm text-gray-500">Sin comprobante.</p>
        </div>
        <p v-if="deposit.deadline_text" class="text-sm" :class="deposit.deadline_overdue ? 'font-semibold text-red-600' : 'text-gray-500'">
          {{ deposit.status === DEPOSIT_STATUS.OBSERVED ? 'Plazo para subsanar' : 'Plazo para validar' }}: {{ deposit.deadline_text }}
        </p>
      </SupplierPaymentCard>

      <div class="flex flex-col gap-3.5">
        <SupplierPaymentCard title="Datos registrados por Ventas">
          <template v-if="editing">
            <label class="text-sm text-gray-500">Banco
              <select v-model="form.bank" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900">
                <option :value="DEPOSIT_BANK.BCP">BCP</option>
                <option :value="DEPOSIT_BANK.INTERBANK">Interbank</option>
              </select>
            </label>
            <label class="text-sm text-gray-500">Fecha
              <input v-model="form.paid_on" type="date" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900">
            </label>
            <label class="text-sm text-gray-500">N.° de operación
              <input v-model="form.operation_number" type="text" class="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900">
            </label>
          </template>
          <template v-else>
            <SupplierPaymentFact label="Cliente" :value="deposit.client_name || '—'" />
            <SupplierPaymentFact label="Consolidado" :value="deposit.consolidation || '—'" />
            <SupplierPaymentFact label="Banco" :value="deposit.interbank ? `${deposit.bank_label} · Interbancaria` : deposit.bank_label" />
            <SupplierPaymentFact label="Fecha" :value="deposit.paid_on || '—'" />
            <SupplierPaymentFact label="N.° de operación" :value="deposit.operation_number || '—'" />
            <SupplierPaymentFact label="Código" :value="requestCodes" />
          </template>
          <p v-if="deposit.corrected_by_admin" class="text-xs text-gray-500">Corregido por Administración.</p>
          <p v-if="deposit.shared" class="text-xs text-gray-600">Voucher compartido con {{ deposit.providers.length }} proveedores. Se verifica una sola vez.</p>
          <p v-if="deposit.observation_detail || deposit.observation_reason" class="text-sm text-red-700">
            Observado<span v-if="reasonLabel">: {{ reasonLabel }}</span>
            <span v-if="deposit.observation_detail"> · {{ deposit.observation_detail }}</span>
          </p>
        </SupplierPaymentCard>

        <SupplierPaymentCard title="Importe">
          <div class="rounded-xl bg-gray-50 px-3 py-2">
            <p class="text-xs text-gray-500">Importe registrado (Ventas)</p>
            <p class="text-lg font-bold">${{ money(deposit.recorded_amount ?? deposit.amount) }}</p>
          </div>
          <label class="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2">
            <span class="text-xs text-primary-700">Importe ingresado (Banco)</span>
            <input v-model.number="bankAmount" type="number" min="0" step="0.01" class="mt-1 w-full bg-transparent text-lg font-bold text-primary-800 outline-none" :disabled="!deposit.can_validate">
          </label>
          <p v-if="deposit.recorded_amount != null" class="text-xs text-amber-700">
            Ventas registró ${{ money(deposit.recorded_amount) }} · se ajustó al importe del banco.
          </p>
        </SupplierPaymentCard>
      </div>
    </div>

    <div v-if="observing" class="space-y-3 rounded-2xl border border-red-200 bg-white p-4">
      <h4 class="text-sm font-bold text-red-700">Observar depósito</h4>
      <label class="block text-sm">
        <span class="mb-1 block text-gray-500">Motivo</span>
        <select v-model="reason" class="w-full rounded-lg border border-gray-300 px-2.5 py-1.5">
          <option v-for="item in reasons" :key="item.code" :value="item.code">{{ item.label }}</option>
          <option value="">Otro motivo</option>
        </select>
      </label>
      <label v-if="!reason" class="block text-sm">
        <span class="mb-1 block text-gray-500">Nuevo motivo</span>
        <input v-model="newLabel" type="text" class="w-full rounded-lg border border-gray-300 px-2.5 py-1.5" placeholder="Se guarda para la próxima vez">
      </label>
      <label class="block text-sm">
        <span class="mb-1 block text-gray-500">Detalle</span>
        <textarea v-model="detail" rows="2" class="w-full rounded-lg border border-gray-300 px-2.5 py-1.5" />
      </label>
    </div>
    <div v-if="extending" class="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <h4 class="text-sm font-bold text-amber-900">Extender el plazo de la observación</h4>
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-amber-900">Días adicionales</span>
        <input v-model.number="extendDays" type="number" min="1" max="60" class="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5">
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-amber-900">Motivo</span>
        <textarea v-model="extendReason" rows="2" class="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5" />
      </label>
    </div>
    <div v-if="cancelling" class="space-y-3 rounded-2xl border border-red-200 bg-white p-4">
      <h4 class="text-sm font-bold text-red-700">Anular el pago</h4>
      <p class="text-sm text-gray-600">El pago deja de continuar. Indica el motivo.</p>
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-red-700">Motivo</span>
        <textarea v-model="cancelReason" rows="2" class="w-full rounded-lg border border-gray-300 px-2.5 py-1.5" />
      </label>
    </div>

    <template #footer>
      <UButton v-if="deposit?.can_validate && !editing" color="neutral" variant="outline" @click="startEdit">Editar</UButton>
      <UButton v-if="editing" color="primary" variant="soft" :loading="saving" @click="saveDetails">Guardar cambios</UButton>
      <UButton v-if="editing" color="neutral" variant="ghost" @click="editing = false">Cancelar edición</UButton>
      <UButton v-if="deposit?.can_extend && !extending && !cancelling" color="neutral" variant="soft" @click="extending = true">Extender plazo</UButton>
      <UButton v-if="extending" color="primary" :loading="saving" @click="extendObservation">Confirmar extensión</UButton>
      <UButton v-if="deposit?.can_cancel_payment && !cancelling && !extending" color="error" variant="soft" @click="cancelling = true">Anular pago</UButton>
      <UButton v-if="cancelling" color="error" :loading="saving" @click="cancelPayment">Confirmar anulación</UButton>
      <UButton v-if="deposit?.can_undo && !extending && !cancelling" color="neutral" variant="soft" :loading="saving" @click="undo">
        Deshacer{{ deposit.undo_notifies_sales ? ' y avisar a Ventas' : '' }}
      </UButton>
      <UButton v-if="deposit?.can_validate && !observing" color="error" variant="soft" @click="observing = true">Observar</UButton>
      <UButton v-if="deposit?.can_validate && observing" color="error" :loading="saving" @click="observe">Confirmar observación</UButton>
      <UButton v-if="deposit?.can_validate && !observing" color="primary" :loading="saving" @click="validate">Validar depósito</UButton>
    </template>
  </SupplierPaymentWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SupplierPaymentCard from '~/components/pago-proveedor/SupplierPaymentCard.vue'
import SupplierPaymentFact from '~/components/pago-proveedor/SupplierPaymentFact.vue'
import SupplierPaymentWindow from '~/components/pago-proveedor/SupplierPaymentWindow.vue'
import { DEPOSIT_BANK, DEPOSIT_STATUS } from '~/constants/supplierPayment'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentDeposit, SupplierPaymentObservationReason } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{
  deposit: SupplierPaymentDeposit | null
  reasons: SupplierPaymentObservationReason[]
}>()

const emit = defineEmits<{ close: []; saved: [] }>()
const { showError, showSuccess } = useModal()

const editing = ref(false)
const observing = ref(false)
const extending = ref(false)
const cancelling = ref(false)
const saving = ref(false)
const bankAmount = ref(0)
const reason = ref('')
const newLabel = ref('')
const detail = ref('')
const extendReason = ref('')
const extendDays = ref(7)
const cancelReason = ref('')
const form = ref({ bank: DEPOSIT_BANK.BCP, paid_on: '', operation_number: '' })

watch(() => props.deposit, (deposit) => {
  editing.value = false
  observing.value = false
  extending.value = false
  cancelling.value = false
  newLabel.value = ''
  detail.value = ''
  extendReason.value = ''
  extendDays.value = 7
  cancelReason.value = ''
  reason.value = props.reasons[0]?.code || ''
  if (!deposit) return
  bankAmount.value = deposit.bank_amount ?? deposit.amount
  form.value = {
    bank: deposit.bank,
    paid_on: deposit.paid_on || '',
    operation_number: deposit.operation_number
  }
}, { immediate: true })

const isImage = computed(() => /\.(png|jpe?g|webp|gif)(\?|$)/i.test(props.deposit?.voucher_url || ''))
const requestCodes = computed(() => {
  const codes = (props.deposit?.providers || []).map((provider) => provider.request_code).filter(Boolean)
  return codes.length ? codes.join(', ') : 'Pendiente'
})
const reasonLabel = computed(() => props.reasons.find((item) => item.code === props.deposit?.observation_reason)?.label || props.deposit?.observation_reason)
const subtitle = computed(() => {
  if (!props.deposit) return ''
  return `${props.deposit.client_name || 'Cliente'} · ${props.deposit.consolidation || 'Sin consolidado'}`
})

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function startEdit() {
  if (!props.deposit) return
  form.value = {
    bank: props.deposit.bank,
    paid_on: props.deposit.paid_on || '',
    operation_number: props.deposit.operation_number
  }
  editing.value = true
}

async function run(action: () => Promise<void>, success: string) {
  saving.value = true
  try {
    await action()
    showSuccess('Depósito', success)
    emit('saved')
    emit('close')
  } catch (error: any) {
    showError('Depósito', error?.data?.message || error?.message || 'No se pudo completar.')
  } finally {
    saving.value = false
  }
}

function saveDetails() {
  if (!props.deposit) return
  return run(
    () => PagoProveedorService.updateDeposit(props.deposit!.id, form.value).then(() => undefined),
    'Los datos quedaron corregidos. El depósito sigue sin validar.'
  )
}

function validate() {
  if (!props.deposit) return
  return run(
    () => PagoProveedorService.validateDeposit(props.deposit!.id, Number(bankAmount.value)).then(() => undefined),
    'Depósito validado.'
  )
}

function observe() {
  if (!props.deposit) return
  return run(
    () => PagoProveedorService.observeDeposit(props.deposit!.id, {
      reason: reason.value || undefined,
      detail: detail.value || undefined,
      new_label: reason.value ? undefined : newLabel.value
    }).then(() => undefined),
    'Depósito observado. Ventas puede corregir el voucher.'
  )
}

function undo() {
  if (!props.deposit) return
  return run(
    () => PagoProveedorService.undoDeposit(props.deposit!.id).then(() => undefined),
    'La verificación quedó deshecha.'
  )
}

function extendObservation() {
  if (!props.deposit) return
  if (!extendReason.value.trim()) {
    showError('Extender plazo', 'Indica el motivo.')
    return
  }
  return run(
    () => PagoProveedorService.extendDepositObservation(props.deposit!.id, {
      reason: extendReason.value.trim(),
      days: Number(extendDays.value) || 7
    }).then(() => undefined),
    'Plazo extendido. Ventas puede seguir corrigiendo el voucher.'
  )
}

function cancelPayment() {
  if (!props.deposit) return
  if (!cancelReason.value.trim()) {
    showError('Anular pago', 'Indica el motivo.')
    return
  }
  return run(
    () => PagoProveedorService.cancelDepositPayment(props.deposit!.id, cancelReason.value.trim()).then(() => undefined),
    'Pago anulado.'
  )
}
</script>
