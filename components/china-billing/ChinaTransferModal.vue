<template>
  <UModal
    :open="!!operation"
    :title="mode === 'credit' ? 'Trasladar saldo a favor' : 'Trasladar diferencia'"
    :description="description"
    :dismissible="!busy"
    :ui="{ content: 'w-full max-w-lg sm:max-w-lg', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' }"
    @update:open="(value: boolean) => !value && emit('close')"
  >
    <template #body>
      <div class="flex flex-col gap-2">
        <button
          v-for="option in options"
          :key="option.row.id!"
          type="button"
          :disabled="busy"
          class="flex items-center justify-between gap-3 rounded-xl border border-default px-4 py-3 text-left transition-colors hover:border-primary hover:bg-[#fff3ea]"
          @click="pick(option.row)"
        >
          <span class="flex flex-col">
            <span class="font-semibold text-highlighted">{{ option.row.code }} · {{ option.row.service_name }}</span>
            <span class="text-xs text-muted">{{ option.row.organization.name }} · {{ option.row.organization.country || '—' }} · {{ mode === 'credit' ? `pendiente ${usd(option.row.pending)}` : 'mismo cliente' }}</span>
          </span>
          <span class="font-semibold text-highlighted">{{ mode === 'credit' ? `Aplica ${usd(option.amount)}` : usd(option.row.total) }}</span>
        </button>
        <p v-if="!options.length" class="text-sm text-muted">Este cliente no tiene otras órdenes pendientes. Crea una nueva operación para él y vuelve a trasladar.</p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end">
        <UButton color="neutral" variant="outline" :disabled="busy" @click="emit('close')">Cancelar</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaOperation } from '~/types/china-billing'

const props = defineProps<{
  operation: ChinaOperation | null
  /** 'difference': pasa lo que falta por cobrar como costo de otra orden. 'credit': aplica el saldo a favor de la orden a otra. */
  mode: 'difference' | 'credit'
  siblings: ChinaOperation[]
}>()
const emit = defineEmits<{ close: []; done: [] }>()

const { showError } = useModal()
const busy = ref(false)

/** Lo que se traslada: la diferencia por cobrar o el saldo a favor (diferencia negativa). */
const amount = computed(() => Math.abs(props.operation?.difference ?? 0))

const description = computed(() => {
  if (!props.operation) return ''
  return props.mode === 'credit'
    ? `El cliente pagó ${usd(amount.value)} de más en ${props.operation.code}. Elige la factura del mismo cliente donde se descontará.`
    : `${usd(amount.value)} de ${props.operation.code} se agregará como costo en otra orden del mismo cliente y se cobrará en esa factura.`
})

const options = computed(() => props.siblings
  .filter((row) => !row.is_draft && row.id !== props.operation?.id && row.organization.id === props.operation?.organization.id && !row.transferred && (row.pending || 0) > 0)
  .map((row) => ({ row, amount: Math.min(amount.value, row.pending || 0) })))

async function pick(row: ChinaOperation) {
  if (!props.operation) return
  busy.value = true
  try {
    if (props.mode === 'credit') {
      await ChinaBillingService.applyCredit(row.id!, Math.min(amount.value, row.pending || 0), props.operation.id)
    } else {
      await ChinaBillingService.transferDifference(props.operation.id!, row.id!)
    }
    emit('done')
  } catch (error: any) {
    showError('Operaciones', error?.message || 'No se pudo trasladar.')
  } finally {
    busy.value = false
  }
}
</script>
