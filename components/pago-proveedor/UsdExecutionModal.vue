<template>
  <SupplierPaymentWindow
    :open="payment !== null"
    :title="payment?.can_register ? 'Ejecución de pago' : 'Pago ejecutado'"
    :subtitle="subtitle"
    :code="payment?.request_code"
    hint="Primero adjunta la constancia, después envía el aviso al cliente y recién entonces registra la transferencia."
    wide
    @close="emit('close')"
  >
    <template #pill>
      <UBadge color="info" variant="soft" label="USD / T-T" />
    </template>

    <div v-if="payment" class="grid gap-4 lg:grid-cols-3">
      <SupplierPaymentCard title="Solicitud">
        <SupplierPaymentFact label="Cliente" :value="payment.client_name || '—'" />
        <SupplierPaymentFact label="Consolidado" :value="payment.consolidation || '—'" />
        <SupplierPaymentFact label="Proveedor" :value="supplier" />
        <SupplierPaymentFact label="Producto" :value="payment.product || '—'" />
        <SupplierPaymentFact v-if="payment.supplier_payment_label" label="Pago" :value="payment.supplier_payment_label" />
        <SupplierPaymentFact v-if="payment.installment_label" label="Cuota" :value="payment.installment_label" />
      </SupplierPaymentCard>

      <SupplierPaymentCard title="Importe al proveedor">
        <p class="text-3xl font-bold text-primary">${{ money(payment.cargo_amount) }}</p>
        <p class="text-xs text-muted">Valor de la carga, sin comisiones.</p>
      </SupplierPaymentCard>

      <SupplierPaymentCard title="Comisiones del pago">
        <SupplierPaymentFact label="Bancaria cobrada" :value="`$${money(payment.charged_bank_fee)}`" />
        <SupplierPaymentFact label="Bancaria real">
          <UInput v-if="payment.can_register" v-model.number="realFee" type="number" min="0" step="0.01" class="w-28" />
          <template v-else>${{ money(payment.real_bank_fee || 0) }}</template>
        </SupplierPaymentFact>
        <SupplierPaymentFact label="Administrativa" :value="`$${money(payment.charged_admin_fee)}`" />
        <SupplierPaymentFact label="Diferencia bancaria" :value="`$${money(shownDifference)}`" />
        <SupplierPaymentFact label="Ganancia de Pro Business" :value="`$${money(shownProfit)}`" :value-class="profitClass" />
        <p class="text-xs text-muted">La diferencia positiva es ganancia.</p>
      </SupplierPaymentCard>
    </div>

    <UCard v-if="payment">
      <div class="mb-2 flex items-center justify-between gap-3">
        <h4 class="text-[15px] font-bold">Datos bancarios del proveedor</h4>
        <UButton size="xs" color="neutral" variant="soft" @click="copy(payment.bank_copy_text)">Copiar datos</UButton>
      </div>
      <div class="grid gap-x-6 sm:grid-cols-2">
        <div v-for="field in bankFields" :key="field.label" class="flex items-center justify-between gap-3 border-b border-default py-1.5">
          <span class="text-xs text-muted">{{ field.label }}</span>
          <span class="flex items-center gap-2 text-right text-sm font-bold text-highlighted">
            {{ field.value || '—' }}
            <UButton v-if="field.value" size="xs" color="primary" variant="link" @click="copy(field.value)">Copiar</UButton>
          </span>
        </div>
      </div>
    </UCard>

    <UCard v-if="payment">
      <h4 class="text-[15px] font-bold">Constancia del pago</h4>
      <a v-if="payment.receipt_url" :href="payment.receipt_url" target="_blank" rel="noopener" class="mt-2 block text-sm font-semibold text-primary">
        {{ payment.receipt_name || 'Ver constancia' }}
      </a>
      <UFormField v-else label="Adjuntar constancia" class="mt-2">
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" class="block text-sm text-highlighted" @change="onFile">
      </UFormField>
    </UCard>

    <UCard v-if="payment?.can_register">
      <div class="mb-2 flex items-center justify-between gap-3">
        <h4 class="text-[15px] font-bold">Aviso al cliente</h4>
        <UButton size="xs" color="neutral" variant="soft" :disabled="!receipt" @click="copy(notice)">Copiar</UButton>
      </div>
      <UCard variant="subtle">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <pre class="whitespace-pre-wrap font-sans text-sm" v-html="whatsappHtml(notice) || 'Cargando aviso…'" />
      </UCard>
      <p v-if="!receipt" class="mt-2 text-xs text-warning">Adjunta la constancia para habilitar el aviso.</p>
      <UButton class="mt-3" size="sm" color="primary" variant="soft" :loading="saving" :disabled="!receipt || noticeReady" @click="sendNotice">
        {{ noticeReady ? 'Aviso enviado' : 'Enviar aviso al cliente' }}
      </UButton>
    </UCard>

    <template #footer>
      <UButton v-if="payment?.can_register" color="primary" :loading="saving" :disabled="!canSave" @click="save">
        Registrar pago
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
import type { SupplierPaymentExecution } from '~/types/pago-proveedor'
import { useModal } from '~/composables/commons/useModal'

const props = defineProps<{ payment: SupplierPaymentExecution | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { showSuccess, showError } = useModal()

const realFee = ref<number | null>(null)
const receipt = ref<File | null>(null)
const saving = ref(false)
const notice = ref('')
const noticeReady = ref(false)

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

const profitClass = computed(() => shownProfit.value > 0.004 ? 'text-success' : (shownProfit.value < -0.004 ? 'text-error' : 'text-highlighted'))
const canSave = computed(() => props.payment?.can_register && noticeReady.value && receipt.value !== null && realFee.value !== null && realFee.value >= 0 && !Number.isNaN(realFee.value))

watch(() => props.payment?.provider_id, async () => {
  realFee.value = props.payment?.real_bank_fee ?? null
  receipt.value = null
  notice.value = ''
  noticeReady.value = false
  if (!props.payment?.can_register) return
  try {
    const response = await PagoProveedorService.executionNoticeText(props.payment.provider_id, props.payment.cargo_amount)
    notice.value = response.data?.message || ''
  } catch {
    notice.value = ''
  }
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

async function sendNotice() {
  if (!props.payment || noticeReady.value) return
  saving.value = true
  try {
    await PagoProveedorService.confirmExecutionNotice(props.payment.provider_id, props.payment.cargo_amount)
    noticeReady.value = true
    showSuccess('Aviso', 'Listo. Ya puedes registrar la transferencia.')
  } catch (error: any) {
    showError('Aviso', error?.data?.message || error?.message || 'No se pudo guardar el aviso.')
  } finally {
    saving.value = false
  }
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
    showError('Ejecución de pago', error?.data?.message || error?.message || 'No se pudo registrar el pago.')
  } finally {
    saving.value = false
  }
}
</script>
