<template>
  <UModal :open="deposit !== null" class="w-full max-w-3xl" @update:open="(open) => !open && emit('close')">
    <template #header>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Validar depósito</h3>
        <p class="text-sm text-gray-500">
          {{ deposit?.client_name || 'Cliente' }} · {{ deposit?.consolidation || 'Sin consolidado' }}
          <span v-if="deposit?.deadline_text" :class="deposit.deadline_overdue ? 'font-semibold text-red-600' : ''">
            · Plazo para validar: {{ deposit.deadline_text }}
          </span>
        </p>
      </div>
    </template>

    <template #body>
      <div v-if="deposit" class="space-y-4">
        <div class="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img v-if="isImage" :src="deposit.voucher_url || ''" alt="Comprobante" class="max-h-72 w-full object-contain">
          <a v-else-if="deposit.voucher_url" :href="deposit.voucher_url" target="_blank" rel="noopener" class="block px-4 py-6 text-sm font-semibold text-primary-600">
            Abrir comprobante · {{ deposit.voucher_name }}
          </a>
          <p v-else class="px-4 py-6 text-sm text-gray-500">Sin comprobante.</p>
        </div>

        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-800">Datos registrados por Ventas</h4>
          <UButton v-if="deposit.can_validate && !editing" size="xs" color="neutral" variant="soft" @click="startEdit">Editar</UButton>
        </div>

        <div v-if="editing" class="grid gap-3 sm:grid-cols-3">
          <label class="text-sm">
            <span class="mb-1 block text-gray-500">Banco</span>
            <select v-model="form.bank" class="w-full rounded-md border border-gray-300 px-2 py-1.5">
              <option :value="DEPOSIT_BANK.BCP">BCP</option>
              <option :value="DEPOSIT_BANK.INTERBANK">Interbank</option>
            </select>
          </label>
          <label class="text-sm">
            <span class="mb-1 block text-gray-500">Fecha</span>
            <input v-model="form.paid_on" type="date" class="w-full rounded-md border border-gray-300 px-2 py-1.5">
          </label>
          <label class="text-sm">
            <span class="mb-1 block text-gray-500">N.° de operación</span>
            <input v-model="form.operation_number" type="text" class="w-full rounded-md border border-gray-300 px-2 py-1.5">
          </label>
          <div class="flex gap-2 sm:col-span-3">
            <UButton size="sm" color="primary" :loading="saving" @click="saveDetails">Guardar cambios</UButton>
            <UButton size="sm" color="neutral" variant="ghost" @click="editing = false">Cancelar</UButton>
          </div>
        </div>
        <dl v-else class="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt class="text-gray-500">Cliente</dt><dd>{{ deposit.client_name || '—' }}</dd></div>
          <div><dt class="text-gray-500">Consolidado</dt><dd>{{ deposit.consolidation || '—' }}</dd></div>
          <div><dt class="text-gray-500">Banco</dt><dd>{{ deposit.bank_label }} <span v-if="deposit.interbank" class="text-gray-500">· Interbancaria</span></dd></div>
          <div><dt class="text-gray-500">Fecha</dt><dd>{{ deposit.paid_on || '—' }}</dd></div>
          <div><dt class="text-gray-500">N.° de operación</dt><dd>{{ deposit.operation_number }}</dd></div>
          <div><dt class="text-gray-500">Código</dt><dd>{{ requestCodes }}</dd></div>
        </dl>

        <p v-if="deposit.corrected_by_admin" class="text-xs text-gray-500">Corregido por Administración.</p>
        <p v-if="deposit.recorded_amount != null" class="text-xs text-amber-700">
          Ventas registró ${{ money(deposit.recorded_amount) }} · se ajustó al importe del banco.
        </p>
        <p v-if="deposit.shared" class="text-xs text-gray-600">Voucher compartido con {{ deposit.providers.length }} proveedores. Se verifica una sola vez.</p>
        <p v-if="deposit.observation_detail || deposit.observation_reason" class="text-sm text-red-700">
          Observado<span v-if="reasonLabel">: {{ reasonLabel }}</span>
          <span v-if="deposit.observation_detail"> · {{ deposit.observation_detail }}</span>
        </p>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-gray-200 p-3">
            <p class="text-xs text-gray-500">Importe registrado (Ventas)</p>
            <p class="text-lg font-semibold">${{ money(deposit.recorded_amount ?? deposit.amount) }}</p>
          </div>
          <label class="rounded-lg border border-gray-200 p-3">
            <span class="text-xs text-gray-500">Importe ingresado (Banco)</span>
            <input v-model.number="bankAmount" type="number" min="0" step="0.01" class="mt-1 w-full text-lg font-semibold outline-none" :disabled="!deposit.can_validate">
          </label>
        </div>

        <div v-if="observing" class="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Motivo</span>
            <select v-model="reason" class="w-full rounded-md border border-gray-300 px-2 py-1.5">
              <option v-for="item in reasons" :key="item.code" :value="item.code">{{ item.label }}</option>
              <option value="">Otro motivo</option>
            </select>
          </label>
          <label v-if="!reason" class="block text-sm">
            <span class="mb-1 block font-medium">Nuevo motivo</span>
            <input v-model="newLabel" type="text" class="w-full rounded-md border border-gray-300 px-2 py-1.5" placeholder="Se guarda para la próxima vez">
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium">Detalle</span>
            <textarea v-model="detail" rows="2" class="w-full rounded-md border border-gray-300 px-2 py-1.5" />
          </label>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="emit('close')">Cerrar</UButton>
        <UButton v-if="deposit?.can_undo" color="neutral" variant="soft" :loading="saving" @click="undo">
          Deshacer{{ deposit.undo_notifies_sales ? ' y avisar a Ventas' : '' }}
        </UButton>
        <UButton v-if="deposit?.can_validate && !observing" color="error" variant="soft" @click="observing = true">Observar</UButton>
        <UButton v-if="deposit?.can_validate && observing" color="error" :loading="saving" @click="observe">Confirmar observación</UButton>
        <UButton v-if="deposit?.can_validate && !observing" color="primary" :loading="saving" @click="validate">Validar depósito</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DEPOSIT_BANK } from '~/constants/supplierPayment'
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
const saving = ref(false)
const bankAmount = ref(0)
const reason = ref('')
const newLabel = ref('')
const detail = ref('')
const form = ref({ bank: DEPOSIT_BANK.BCP, paid_on: '', operation_number: '' })

watch(() => props.deposit, (deposit) => {
  editing.value = false
  observing.value = false
  newLabel.value = ''
  detail.value = ''
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
</script>
