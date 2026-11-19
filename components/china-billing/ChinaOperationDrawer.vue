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
            <span class="flex flex-1 flex-col"><span class="font-semibold">Saldo a favor</span><span class="text-xs text-muted">{{ creditOrigin(credit) }}</span></span>
            <span class="font-semibold">{{ usd(credit.amount) }}</span>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="CHINA_STATUS_PILL[CHINA_STATUS.CONFIRMED]">{{ CHINA_STATUS_LABEL[CHINA_STATUS.CONFIRMED] }}</span>
            <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash" aria-label="Quitar saldo a favor" @click="undoCredit(credit.id)" />
          </div>
          <p v-if="!operation.payments?.length && !operation.credits?.length" class="text-sm text-muted">Aún no hay pagos aplicados a esta operación.</p>
          <UButton v-if="(operation.pending || 0) > 0" class="mt-3 w-full justify-center" color="primary" @click="emit('register-payment', operation)">Registrar pago</UButton>
        </UCard>

        <UCard v-if="creditBalance > 0 && (operation.pending || 0) > 0" class="ring-1 ring-success/40" :ui="{ root: 'bg-success/5', body: 'p-4 sm:p-4' }">
          <div class="mb-2 flex items-center justify-between gap-3 text-sm">
            <span class="font-semibold text-highlighted">Aplicar saldo a favor</span>
            <span class="font-semibold text-success">{{ usd(creditBalance) }} disponible</span>
          </div>
          <div class="flex gap-2" @input="onCreditTyping" @focusout="onCreditBlur">
            <UInputNumber :ui="{ increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' }" v-model="creditAmount" :min="0" :max="creditMax" :step="0.01" class="flex-1" />
            <UButton color="primary" :loading="busy" :disabled="!liveCredit || liveCredit > creditMax" @click="applyCredit">Aplicar</UButton>
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

const props = defineProps<{ operation: ChinaOperation | null; credits: ChinaCredit[]; operations?: ChinaOperation[] }>()
const emit = defineEmits<{
  close: []
  changed: []
  'register-payment': [operation: ChinaOperation]
  'open-payment': [paymentId: number]
}>()

const { showError, showConfirmation } = useModal()
const busy = ref(false)
const creditAmount = ref<number | null>(null)
const creditTyping = ref(false)
const creditDraft = ref<number | null>(null)
const liveCredit = computed(() => creditTyping.value ? creditDraft.value : creditAmount.value)

function sameClient(row: ChinaOperation, operation: ChinaOperation) {
  if (Number(row.organization.id) === Number(operation.organization.id)) return true
  return formatNombreEmpresa(row.organization.name).toLocaleLowerCase('es-PE') === formatNombreEmpresa(operation.organization.name).toLocaleLowerCase('es-PE')
}

const creditBalance = computed(() => {
  const operation = props.operation
  if (!operation) return 0
  const name = formatNombreEmpresa(operation.organization.name).toLocaleLowerCase('es-PE')
  const listed = props.credits.find((credit) => Number(credit.organization_id) === Number(operation.organization.id))
    ?? props.credits.find((credit) => formatNombreEmpresa(credit.name).toLocaleLowerCase('es-PE') === name)
  if ((listed?.balance || 0) > 0) return listed!.balance
  return (props.operations || [])
    .filter((row) => row.id !== operation.id && sameClient(row, operation) && !row.transferred && (row.difference ?? 0) < -0.004)
    .reduce((sum, row) => sum + Math.abs(row.difference || 0), 0)
})
const creditMax = computed(() => Math.min(creditBalance.value, props.operation?.pending || 0))

watch(() => props.operation?.id, () => {
  creditAmount.value = null
  creditTyping.value = false
  creditDraft.value = null
})

function parseTyped(raw: string): number | null {
  const text = raw.replace(/\s/g, '').replace(',', '.')
  if (text === '' || text === '-' || text === '.' || text === '-.') return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

function onCreditTyping(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  creditTyping.value = true
  creditDraft.value = parseTyped(target.value)
}

function onCreditBlur() {
  creditTyping.value = false
  creditDraft.value = null
}

function creditOrigin(credit: { payment_code?: string | null; applied_on?: string | null }) {
  if (!credit.payment_code) return 'Aplicado a esta operación'
  if (!credit.applied_on) return `Desde ${credit.payment_code}`
  const [year, month, day] = credit.applied_on.split('-')
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const label = year ? `${Number(day)} ${months[Number(month) - 1] || ''}` : ''
  return `Desde ${credit.payment_code}${label ? ` · ${label}` : ''}`
}

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
  if (creditTyping.value && creditDraft.value !== null) creditAmount.value = creditDraft.value
  if (!liveCredit.value) return
  await run(async () => {
    await ChinaBillingService.applyCredit(props.operation!.id!, liveCredit.value!)
    creditAmount.value = null
    creditTyping.value = false
    creditDraft.value = null
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
