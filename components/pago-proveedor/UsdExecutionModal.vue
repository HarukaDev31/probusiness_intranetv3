<template>
  <UModal :open="payment !== null" class="w-full max-w-3xl" @update:open="(open) => !open && emit('close')">
    <template #header>
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ payment?.can_register ? 'Ejecución de pago' : 'Pago ejecutado' }}</h3>
        <p class="text-sm text-gray-500">
          {{ payment?.client_name || 'Cliente' }} · {{ payment?.consolidation || 'Sin consolidado' }}
          <span v-if="payment?.installment_label"> · {{ payment.installment_label }}</span>
          <span v-if="payment?.request_code"> · {{ payment.request_code }}</span>
        </p>
      </div>
    </template>

    <template #body>
      <div v-if="payment" class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-gray-200 p-4 text-sm">
            <h4 class="font-semibold text-gray-800">Solicitud</h4>
            <p class="mt-2">{{ supplier }}</p>
            <p class="text-gray-600">{{ payment.product || '—' }} · USD / T-T</p>
            <p v-if="payment.supplier_payment_label" class="text-gray-500">{{ payment.supplier_payment_label }}</p>
          </div>
          <div class="rounded-lg border border-gray-200 p-4">
            <p class="text-xs uppercase tracking-wide text-gray-500">Importe a pagar al proveedor</p>
            <p class="mt-1 text-2xl font-semibold">${{ money(payment.cargo_amount) }}</p>
            <p class="mt-1 text-xs text-gray-500">Valor de la carga, sin comisiones.</p>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-sm font-semibold text-gray-800">Datos bancarios del proveedor</h4>
            <UButton size="xs" color="neutral" variant="soft" @click="copy(payment.bank_copy_text)">Copiar datos</UButton>
          </div>
          <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div v-for="field in bankFields" :key="field.label" class="flex items-start justify-between gap-2">
              <div>
                <dt class="text-gray-500">{{ field.label }}</dt>
                <dd>{{ field.value || '—' }}</dd>
              </div>
              <button v-if="field.value" type="button" class="text-xs text-primary-600" @click="copy(field.value)">Copiar</button>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-gray-200 p-4 text-sm">
          <h4 class="font-semibold text-gray-800">Comisiones del pago</h4>
          <dl class="mt-3 grid gap-2 sm:grid-cols-2">
            <div><dt class="text-gray-500">Bancaria cobrada</dt><dd>${{ money(payment.charged_bank_fee) }}</dd></div>
            <div>
              <dt class="text-gray-500">Bancaria real</dt>
              <dd v-if="payment.can_register">
                <input v-model.number="realFee" type="number" min="0" step="0.01" class="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5">
              </dd>
              <dd v-else>${{ money(payment.real_bank_fee || 0) }}</dd>
            </div>
            <div><dt class="text-gray-500">Administrativa</dt><dd>${{ money(payment.charged_admin_fee) }}</dd></div>
            <div>
              <dt class="text-gray-500">Ganancia de Pro Business</dt>
              <dd class="font-semibold" :class="profitClass">${{ money(shownProfit) }}</dd>
            </div>
          </dl>
          <p class="mt-2 text-gray-500">Diferencia bancaria ${{ money(shownDifference) }}. Positiva es ganancia.</p>
        </div>

        <div class="rounded-lg border border-gray-200 p-4 text-sm">
          <h4 class="font-semibold text-gray-800">Constancia del pago</h4>
          <a v-if="payment.receipt_url" :href="payment.receipt_url" target="_blank" rel="noopener" class="mt-2 block text-primary-600">
            {{ payment.receipt_name || 'Ver constancia' }}
          </a>
          <label v-else class="mt-2 block">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" class="text-sm" @change="onFile">
          </label>
          <p class="mt-2 text-gray-500">El aviso al cliente por WhatsApp queda para el final. Con la constancia y la comisión real ya se puede registrar la transferencia.</p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="emit('close')">Cerrar</UButton>
        <UButton v-if="payment?.can_register" color="primary" :loading="saving" :disabled="!canSave" @click="save">
          Registrar pago
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentExecution } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{ payment: SupplierPaymentExecution | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { showSuccess, showError } = useModal()

const realFee = ref<number | null>(null)
const receipt = ref<File | null>(null)
const saving = ref(false)

const supplier = computed(() => {
  if (!props.payment) return 'Proveedor'
  return props.payment.supplier_name
    ? `${props.payment.supplier_code || ''} · ${props.payment.supplier_name}`
    : (props.payment.supplier_code || 'Proveedor')
})

const bankFields = computed(() => {
  const bank = props.payment?.bank
  if (!bank) return []
  const rows = [
    { label: 'Beneficiario', value: bank.beneficiary_name },
    { label: 'Cuenta', value: bank.beneficiary_account },
    { label: 'Dirección', value: bank.beneficiary_address },
    { label: 'País', value: bank.beneficiary_country },
    { label: 'Ciudad', value: bank.beneficiary_city },
    { label: 'Banco', value: bank.bank_name },
    { label: bank.bank_code_type || 'Código', value: bank.bank_code },
    { label: 'Dirección del banco', value: bank.bank_address },
    { label: 'País del banco', value: bank.bank_country },
    { label: 'Ciudad del banco', value: bank.bank_city }
  ]
  if (bank.uses_intermediary) {
    rows.push(
      { label: 'Intermediario', value: bank.intermediary_name },
      { label: bank.intermediary_code_type || 'Código intermediario', value: bank.intermediary_code },
      { label: 'Dirección intermediario', value: bank.intermediary_address },
      { label: 'País intermediario', value: bank.intermediary_country },
      { label: 'Ciudad intermediario', value: bank.intermediary_city }
    )
  }
  return rows
})

const shownDifference = computed(() => {
  if (!props.payment) return 0
  if (!props.payment.can_register) return props.payment.bank_difference || 0
  if (realFee.value === null || Number.isNaN(realFee.value)) return 0
  return Math.round((props.payment.charged_bank_fee - realFee.value) * 100) / 100
})

const shownProfit = computed(() => {
  if (!props.payment) return 0
  if (!props.payment.can_register) return props.payment.profit || 0
  return Math.round((shownDifference.value + props.payment.charged_admin_fee) * 100) / 100
})

const profitClass = computed(() => shownProfit.value > 0.004 ? 'text-green-700' : (shownProfit.value < -0.004 ? 'text-red-600' : 'text-gray-800'))
const canSave = computed(() => props.payment?.can_register && receipt.value !== null && realFee.value !== null && realFee.value >= 0 && !Number.isNaN(realFee.value))

watch(() => props.payment?.provider_id, () => {
  realFee.value = props.payment?.real_bank_fee ?? null
  receipt.value = null
})

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function copy(value: string | null) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    showSuccess('Datos bancarios', 'Listo para pegar en el banco.')
  } catch {
    showError('Datos bancarios', 'No se pudo copiar.')
  }
}

function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  receipt.value = input.files?.[0] || null
}

async function save() {
  if (!props.payment || realFee.value === null || !receipt.value) return
  saving.value = true
  try {
    await PagoProveedorService.registerExecution(props.payment.provider_id, realFee.value, receipt.value)
    showSuccess('Ejecución de pago', 'La transferencia quedó registrada.')
    emit('saved')
    emit('close')
  } catch (error: any) {
    showError('Ejecución de pago', error?.data?.message || 'No se pudo registrar el pago.')
  } finally {
    saving.value = false
  }
}
</script>
