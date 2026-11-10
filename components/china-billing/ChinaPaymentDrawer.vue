<template>
  <USlideover
    :open="!!payment"
    :title="payment ? `Pago ${payment.code}` : ''"
    :description="payment ? `${payment.organization.name} · ${payment.paid_on}` : ''"
    :ui="{ content: 'max-w-lg' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <div v-if="payment" class="flex flex-col gap-5">
        <UStepper :items="steps" :model-value="stepIndex" disabled size="sm" />

        <UCard variant="subtle">
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div><dt class="text-muted">Enviado</dt><dd class="font-semibold">{{ usd(payment.amount_sent) }}</dd></div>
            <div><dt class="text-muted">Asignado a operaciones</dt><dd class="font-semibold">{{ usd(payment.allocated) }}</dd></div>
            <div v-if="payment.amount_received !== null"><dt class="text-muted">Recibido</dt><dd class="font-semibold">{{ usd(payment.amount_received) }}</dd></div>
            <div v-if="payment.shortfall > 0"><dt class="text-muted">Faltante</dt><dd class="font-semibold text-error">−{{ usd(payment.shortfall) }}</dd></div>
            <div v-if="payment.credit_generated > 0"><dt class="text-muted">Saldo a favor generado</dt><dd class="font-semibold text-success">{{ usd(payment.credit_generated) }}</dd></div>
            <div v-if="payment.yuan_amount"><dt class="text-muted">RMB (TC {{ payment.exchange_rate }})</dt><dd class="font-semibold">{{ rmb(payment.yuan_amount) }}</dd></div>
          </dl>
          <div class="mt-3 flex flex-wrap gap-2">
            <UButton v-if="payment.receipt_url" size="xs" color="neutral" variant="outline" icon="i-heroicons-document-text" @click="viewer = { url: payment.receipt_url, name: payment.receipt_name }">Ver comprobante</UButton>
            <UButton v-if="payment.cash_voucher_url" size="xs" color="neutral" variant="outline" icon="i-heroicons-document-text" @click="viewer = { url: payment.cash_voucher_url, name: payment.cash_voucher_name }">Ver voucher del cambio</UButton>
          </div>
        </UCard>

        <div>
          <p class="mb-2 text-sm font-medium text-highlighted">Distribución</p>
          <p v-if="!payment.allocations.length" class="text-sm text-muted">Sin operaciones asignadas: todo queda como saldo a favor al confirmar.</p>
          <div v-for="allocation in payment.allocations" :key="allocation.operation_id" class="flex justify-between border-b border-default py-1.5 text-sm">
            <span>{{ allocation.code }}</span>
            <span class="font-semibold">{{ usd(allocation.amount) }}</span>
          </div>
        </div>

        <UCard v-if="payment.status === CHINA_STATUS.TO_CONFIRM" variant="subtle">
          <p class="mb-3 text-sm font-semibold text-highlighted">Paso 2 · Confirmar ingreso</p>
          <UFormField label="Monto realmente recibido (USD)">
            <UInputNumber v-model="received" :min="0" :step="1" class="w-full" />
          </UFormField>
          <UFormField v-if="needsShortfall" label="¿En qué operación se carga la diferencia?" class="mt-3">
            <USelectMenu v-model="shortfallOperationId" :items="shortfallItems" value-key="value" placeholder="Elige la operación" class="w-full" />
          </UFormField>
          <UButton class="mt-3" block color="primary" :loading="busy" @click="confirm">Confirmar ingreso</UButton>
        </UCard>

        <UCard v-else-if="payment.status === CHINA_STATUS.CONFIRMED" variant="subtle">
          <p class="mb-3 text-sm font-semibold text-highlighted">Paso 3 · Pasar a RMB</p>
          <UFormField label="Tipo de cambio">
            <UInputNumber v-model="exchangeRate" :min="0" :step="0.0001" class="w-full" />
          </UFormField>
          <div class="mt-3">
            <YuanFilePick label="Voucher del cambio (opcional)" :accept="RECEIPT_ACCEPT" @pick="voucher = $event" />
          </div>
          <UButton class="mt-3" block color="primary" :loading="busy" @click="cash">Pasar a caja</UButton>
        </UCard>

        <div class="flex flex-wrap gap-2">
          <UButton v-if="payment.status === CHINA_STATUS.TO_CONFIRM" color="neutral" variant="outline" icon="i-heroicons-pencil-square" @click="emit('edit', payment)">Editar</UButton>
          <UButton v-if="payment.status === CHINA_STATUS.CONFIRMED" color="neutral" variant="outline" icon="i-heroicons-arrow-uturn-left" :loading="busy" @click="run(() => ChinaBillingService.unconfirmPayment(payment!.id))">Deshacer confirmación</UButton>
          <UButton v-if="payment.status === CHINA_STATUS.IN_CASH" color="neutral" variant="outline" icon="i-heroicons-arrow-uturn-left" :loading="busy" @click="run(() => ChinaBillingService.uncashPayment(payment!.id))">Deshacer paso a caja</UButton>
          <UButton color="error" variant="soft" icon="i-heroicons-trash" @click="remove">Eliminar pago</UButton>
        </div>
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
import type { ChinaPayment } from '~/types/china-billing'

const props = defineProps<{ payment: ChinaPayment | null }>()
const emit = defineEmits<{ close: []; changed: []; edit: [payment: ChinaPayment] }>()

const { showError, showConfirmation } = useModal()
const busy = ref(false)
const received = ref<number | null>(null)
const shortfallOperationId = ref<number | null>(null)
const exchangeRate = ref<number | null>(null)
const voucher = ref<File | null>(null)
const viewer = ref<{ url: string; name?: string | null } | null>(null)

const steps = [
  { title: 'Registrado', icon: 'i-heroicons-document-plus' },
  { title: 'Confirmado', icon: 'i-heroicons-check-circle' },
  { title: 'En caja', icon: 'i-heroicons-banknotes' }
]
const stepIndex = computed(() => ({ [CHINA_STATUS.TO_CONFIRM]: 0, [CHINA_STATUS.CONFIRMED]: 1, [CHINA_STATUS.IN_CASH]: 2 }[props.payment?.status || ''] ?? 0))

/** El backend vuelve a validar; esto solo decide si se muestra el selector de operación. */
const needsShortfall = computed(() => !!props.payment && received.value !== null && received.value < props.payment.allocated)
const shortfallItems = computed(() => (props.payment?.allocations || []).map((allocation) => ({
  value: allocation.operation_id,
  label: `${allocation.code} · ${usd(allocation.amount)}`
})))

watch(() => props.payment?.id, () => {
  received.value = props.payment?.amount_sent ?? null
  shortfallOperationId.value = null
  exchangeRate.value = null
  voucher.value = null
})

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
  await run(() => ChinaBillingService.confirmPayment(props.payment!.id, received.value!, shortfallOperationId.value))
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
    'Eliminar pago',
    'Se quitará de sus operaciones, de caja si estaba allí, y se anulará el saldo a favor que se haya aplicado desde este pago.',
    async () => {
      await run(() => ChinaBillingService.deletePayment(props.payment!.id))
      emit('close')
    }
  )
}
</script>
