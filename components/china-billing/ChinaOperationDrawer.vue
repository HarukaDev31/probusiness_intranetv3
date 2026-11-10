<template>
  <USlideover
    :open="!!operation"
    :title="operation ? `${operation.code} · ${operation.organization.name}` : ''"
    :description="operation?.description"
    :ui="{ content: 'max-w-lg' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <div v-if="operation" class="flex flex-col gap-5">
        <div class="flex items-center gap-2">
          <UBadge :color="CHINA_STATUS_COLOR[operation.status]" variant="soft" :label="CHINA_STATUS_LABEL[operation.status]" />
          <UBadge v-if="operation.transferred_to_code" color="neutral" variant="outline" :label="`Trasladada a ${operation.transferred_to_code}`" />
        </div>

        <UCard variant="subtle">
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div><dt class="text-muted">Servicio</dt><dd class="font-semibold">{{ usd(operation.service_amount) }}</dd></div>
            <div><dt class="text-muted">FOB</dt><dd class="font-semibold">{{ usd(operation.fob) }}</dd></div>
            <div><dt class="text-muted">Flete</dt><dd class="font-semibold">{{ usd(operation.freight) }}</dd></div>
            <div><dt class="text-muted">Costos adicionales</dt><dd class="font-semibold">{{ usd(operation.extras_amount) }}</dd></div>
            <div><dt class="text-muted">Total</dt><dd class="text-lg font-bold">{{ usd(operation.total) }}</dd></div>
            <div><dt class="text-muted">Recibido</dt><dd class="font-semibold">{{ usd(operation.received) }}</dd></div>
            <div><dt class="text-muted">Pendiente de pago</dt><dd class="font-semibold text-error">{{ usd(operation.pending) }}</dd></div>
            <div v-if="operation.difference"><dt class="text-muted">Diferencia</dt><dd class="font-semibold" :class="operation.difference > 0 ? 'text-error' : 'text-success'">{{ operation.difference > 0 ? 'Por cobrar' : 'A favor' }} {{ usd(Math.abs(operation.difference)) }}</dd></div>
          </dl>
          <p v-if="operation.shortfall_included" class="mt-2 text-xs text-error">Incluye diferencia de −{{ usd(operation.shortfall_included) }}</p>
        </UCard>

        <div>
          <p class="mb-2 text-sm font-medium text-highlighted">Costos adicionales</p>
          <p v-if="!operation.costs?.length" class="text-sm text-muted">Sin costos adicionales.</p>
          <div v-for="cost in operation.costs" :key="cost.id" class="flex justify-between border-b border-default py-1.5 text-sm">
            <span>{{ cost.name }}</span><span class="font-semibold">{{ usd(cost.amount) }}</span>
          </div>
        </div>

        <div>
          <p class="mb-2 text-sm font-medium text-highlighted">Pagos aplicados</p>
          <p v-if="!operation.payments?.length && !operation.credits?.length" class="text-sm text-muted">Aún sin pagos.</p>
          <div v-for="item in operation.payments" :key="item.payment_id" class="flex items-center justify-between border-b border-default py-1.5 text-sm">
            <span>{{ item.code }}</span>
            <span class="flex items-center gap-2"><UBadge :color="CHINA_STATUS_COLOR[item.status]" variant="soft" size="sm" :label="CHINA_STATUS_LABEL[item.status]" />{{ usd(item.amount) }}</span>
          </div>
          <div v-for="credit in operation.credits" :key="credit.id" class="flex items-center justify-between border-b border-default py-1.5 text-sm">
            <span>Saldo a favor aplicado</span>
            <span class="flex items-center gap-2">{{ usd(credit.amount) }}
              <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-arrow-uturn-left" aria-label="Devolver saldo a favor" @click="undoCredit(credit.id)" />
            </span>
          </div>
        </div>

        <UCard v-if="creditBalance > 0 && (operation.pending || 0) > 0" variant="subtle">
          <p class="mb-2 text-sm font-semibold text-highlighted">Aplicar saldo a favor ({{ usd(creditBalance) }} disponible)</p>
          <div class="flex gap-2">
            <UInputNumber v-model="creditAmount" :min="0" :max="Math.min(creditBalance, operation.pending || 0)" :step="1" class="flex-1" />
            <UButton color="primary" :loading="busy" @click="applyCredit">Aplicar</UButton>
          </div>
        </UCard>

        <UCard v-if="(operation.difference || 0) > 0 && !operation.transferred" variant="subtle">
          <p class="mb-2 text-sm font-semibold text-highlighted">Trasladar diferencia por cobrar</p>
          <USelectMenu v-model="targetId" :items="targetItems" value-key="value" placeholder="Operación pendiente del mismo cliente" class="mb-2 w-full" />
          <UButton block color="primary" :disabled="!targetId" :loading="busy" @click="transfer">Trasladar</UButton>
        </UCard>
        <UButton v-if="operation.transferred" color="neutral" variant="outline" icon="i-heroicons-arrow-uturn-left" :loading="busy" @click="undoTransfer">Deshacer traslado</UButton>

        <div class="flex flex-wrap gap-2">
          <UButton color="neutral" variant="outline" icon="i-heroicons-document-text" @click="emit('invoice', operation)">Ver factura</UButton>
          <UButton color="neutral" variant="outline" icon="i-heroicons-pencil-square" @click="emit('edit', operation)">Editar</UButton>
          <UButton color="error" variant="soft" icon="i-heroicons-trash" @click="remove">Eliminar</UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CHINA_STATUS_COLOR, CHINA_STATUS_LABEL } from '~/constants/chinaBilling'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaCredit, ChinaOperation } from '~/types/china-billing'

const props = defineProps<{
  operation: ChinaOperation | null
  /** Operaciones cargadas en la lista, para elegir el destino del traslado. */
  siblings: ChinaOperation[]
  credits: ChinaCredit[]
}>()
const emit = defineEmits<{ close: []; changed: []; edit: [operation: ChinaOperation]; invoice: [operation: ChinaOperation] }>()

const { showError, showWarning, showConfirmation } = useModal()
const busy = ref(false)
const creditAmount = ref<number | null>(null)
const targetId = ref<number | null>(null)

const creditBalance = computed(() => props.credits.find((credit) => credit.organization_id === props.operation?.organization.id)?.balance ?? 0)
const targetItems = computed(() => props.siblings
  .filter((item) => !item.is_draft && item.id !== props.operation?.id && item.organization.id === props.operation?.organization.id && !item.transferred && (item.pending || 0) > 0)
  .map((item) => ({ value: item.id!, label: `${item.code} · pendiente ${usd(item.pending)}` })))

watch(() => props.operation?.id, () => {
  creditAmount.value = null
  targetId.value = null
})

async function run(action: () => Promise<unknown>) {
  busy.value = true
  try {
    const result: any = await action()
    if (result?.warning) showWarning('Operaciones', result.warning)
    emit('changed')
  } catch (error: any) {
    showError('Operaciones', error?.message || 'No se pudo completar la acción.')
  } finally {
    busy.value = false
  }
}

async function applyCredit() {
  if (!creditAmount.value) {
    showError('Operaciones', 'Indica el monto a aplicar.')
    return
  }
  await run(() => ChinaBillingService.applyCredit(props.operation!.id!, creditAmount.value!))
}
const transfer = () => run(() => ChinaBillingService.transferDifference(props.operation!.id!, targetId.value!))
const undoTransfer = () => run(() => ChinaBillingService.undoTransferDifference(props.operation!.id!))
const undoCredit = (id: number) => run(() => ChinaBillingService.undoCredit(id))

function remove() {
  showConfirmation(
    'Eliminar operación',
    'Lo que tenía pagado quedará sin asignar y pasará a saldo a favor del cliente.',
    async () => {
      await run(() => ChinaBillingService.deleteOperation(props.operation!.id!))
      emit('close')
    }
  )
}
</script>
