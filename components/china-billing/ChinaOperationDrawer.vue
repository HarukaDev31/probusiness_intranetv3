<template>
  <!-- Al hacer clic en Pendiente la ficha sale al costado, como en la maqueta. -->
  <USlideover
    :open="!!operation"
    side="right"
    :ui="{ content: 'w-full max-w-xl sm:max-w-xl', body: 'bg-elevated/40' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #header>
      <div v-if="operation" class="flex w-full items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-muted">{{ operation.code }} · {{ operation.service_name }}</p>
          <p class="truncate text-2xl font-bold text-highlighted">{{ formatNombreEmpresa(operation.organization.name) }}</p>
          <p class="text-sm text-muted">{{ operation.organization.country || '—' }} · {{ operation.description }}</p>
        </div>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Cerrar" @click="emit('close')" />
      </div>
    </template>
    <template #body>
      <div v-if="operation" class="flex flex-col gap-5">
        <div class="grid grid-cols-3 gap-3">
          <UCard variant="subtle" :ui="{ body: 'px-4 py-3 sm:px-4 sm:py-3' }">
            <p class="text-xs uppercase tracking-wider text-muted">Total</p>
            <p class="text-xl font-bold text-highlighted">{{ usd(operation.total) }}</p>
          </UCard>
          <UCard variant="subtle" :ui="{ body: 'px-4 py-3 sm:px-4 sm:py-3' }">
            <p class="text-xs uppercase tracking-wider text-muted">Recibido</p>
            <p class="text-xl font-bold text-success">{{ usd(operation.received || 0) }}</p>
          </UCard>
          <UCard variant="subtle" :ui="{ body: 'px-4 py-3 sm:px-4 sm:py-3' }">
            <p class="text-xs uppercase tracking-wider text-muted">Pendiente</p>
            <p class="text-xl font-bold text-primary">{{ usd(operation.pending || 0) }}</p>
          </UCard>
        </div>

        <UCard :ui="{ body: 'p-4 sm:p-4' }">
          <p class="mb-2 text-sm font-semibold text-highlighted">Pagos aplicados</p>
          <div v-for="item in operation.payments" :key="item.payment_id" class="flex items-center gap-3 border-b border-default py-2.5 text-sm">
            <button type="button" class="flex flex-1 flex-col text-left hover:text-primary" @click="emit('open-payment', item.payment_id)">
              <span class="font-semibold">{{ item.code }}</span>
              <span class="text-xs text-muted">clic para gestionar</span>
            </button>
            <span class="font-semibold">{{ usd(item.amount) }}</span>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="CHINA_STATUS_PILL[item.status]">{{ CHINA_STATUS_LABEL[item.status] }}</span>
            <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash" aria-label="Eliminar pago" @click="removePayment(item)" />
          </div>
          <div v-for="credit in operation.credits" :key="credit.id" class="flex items-center gap-3 border-b border-default py-2.5 text-sm">
            <span class="flex flex-1 flex-col"><span class="font-semibold">Saldo a favor</span><span class="text-xs text-muted">Aplicado a esta operación</span></span>
            <span class="font-semibold">{{ usd(credit.amount) }}</span>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="CHINA_STATUS_PILL[CHINA_STATUS.CONFIRMED]">{{ CHINA_STATUS_LABEL[CHINA_STATUS.CONFIRMED] }}</span>
            <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash" aria-label="Quitar saldo a favor" @click="undoCredit(credit.id)" />
          </div>
          <p v-if="!operation.payments?.length && !operation.credits?.length" class="text-sm text-muted">Aún no hay pagos aplicados a esta operación.</p>
          <UButton v-if="(operation.pending || 0) > 0" class="mt-3 w-full justify-center" color="primary" @click="emit('register-payment', operation)">Registrar pago</UButton>
        </UCard>

        <UCard v-if="creditBalance > 0 && (operation.pending || 0) > 0" variant="subtle" :ui="{ body: 'p-4 sm:p-4' }">
          <div class="mb-2 flex items-center justify-between text-sm">
            <span class="font-semibold text-success">Aplicar saldo a favor</span>
            <span class="text-muted">{{ usd(creditBalance) }} disponible</span>
          </div>
          <div class="flex gap-2">
            <UInputNumber :ui="{ increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' }" v-model="creditAmount" :min="0" :max="creditMax" :step="0.01" class="flex-1" />
            <UButton color="primary" :loading="busy" :disabled="!creditAmount || creditAmount > creditMax" @click="applyCredit">Aplicar</UButton>
          </div>
          <p class="mt-1 text-xs text-muted">Máximo {{ usd(creditMax) }} para esta operación.</p>
        </UCard>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CHINA_STATUS, CHINA_STATUS_LABEL, CHINA_STATUS_PILL } from '~/constants/chinaBilling'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaCredit, ChinaOperation, ChinaOperationPaymentRef } from '~/types/china-billing'
import { formatNombreEmpresa } from '~/utils/formatters'

const props = defineProps<{ operation: ChinaOperation | null; credits: ChinaCredit[] }>()
const emit = defineEmits<{
  close: []
  changed: []
  'register-payment': [operation: ChinaOperation]
  'open-payment': [paymentId: number]
}>()

const { showError, showConfirmation } = useModal()
const busy = ref(false)
const creditAmount = ref<number | null>(null)

const creditBalance = computed(() => props.credits.find((credit) => credit.organization_id === props.operation?.organization.id)?.balance ?? 0)
const creditMax = computed(() => Math.min(creditBalance.value, props.operation?.pending || 0))

watch(() => props.operation?.id, () => { creditAmount.value = null })

async function run(action: () => Promise<unknown>) {
  busy.value = true
  try {
    await action()
    emit('changed')
  } catch (error: any) {
    showError('Operaciones', error?.message || 'No se pudo completar la acción.')
  } finally {
    busy.value = false
  }
}

async function applyCredit() {
  if (!creditAmount.value) return
  await run(async () => {
    await ChinaBillingService.applyCredit(props.operation!.id!, creditAmount.value!)
    creditAmount.value = null
  })
}

const undoCredit = (id: number) => run(() => ChinaBillingService.undoCredit(id))

function removePayment(item: ChinaOperationPaymentRef) {
  showConfirmation(
    `¿Eliminar ${item.code}?`,
    `Por ${usd(item.amount)}. Se quitará de sus operaciones, de caja si estaba allí, y se anulará el saldo a favor aplicado desde este pago.`,
    () => run(() => ChinaBillingService.deletePayment(item.payment_id))
  )
}
</script>
