<template>
  <div
    class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 rounded-[10px] px-3 py-2.5"
    :class="isCurrent ? 'border-[1.5px] border-success bg-default' : 'border border-default bg-elevated/60'"
    :title="`Generada por ${document.generated_by || 'Sistema'}`"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-1.5">
      <span class="text-sm font-bold text-highlighted">V{{ document.version }}</span>
      <span class="text-[13px] font-semibold text-highlighted">Factura N° {{ operation.code }}</span>
      <span class="inline-flex h-5 items-center rounded-full px-[7px] text-[11px] font-semibold" :class="CHINA_INVOICE_STATUS_PILL[document.status || 'reemplazada']">
        {{ CHINA_INVOICE_STATUS_LABEL[document.status || 'reemplazada'] }}
      </span>
    </div>
    <div class="col-start-2 row-span-3 row-start-1 flex items-center gap-1">
      <button
        type="button"
        class="grid size-8 place-items-center rounded-lg border border-default bg-default text-highlighted hover:bg-elevated"
        :aria-label="`Descargar ${number} en PDF`"
        title="Descargar PDF"
        @click="emit('download', document)"
      >
        <UIcon name="i-heroicons-arrow-down-tray" class="size-[15px]" />
      </button>
      <button
        v-if="isCurrent"
        type="button"
        class="grid size-8 place-items-center rounded-lg border border-default bg-default text-error hover:bg-elevated disabled:opacity-50"
        :aria-label="`Anular ${number}`"
        title="Anular"
        :disabled="busy"
        @click="emit('annul', document)"
      >
        <UIcon name="i-heroicons-no-symbol" class="size-[15px]" />
      </button>
      <button
        v-else-if="document.status === 'reemplazada' && !locked"
        type="button"
        class="inline-flex h-8 items-center gap-1 rounded-lg border border-default bg-default px-2.5 text-xs font-semibold hover:border-success hover:text-success disabled:opacity-50"
        :aria-label="`Marcar ${number} como vigente`"
        :disabled="busy"
        @click="emit('mark-current', document)"
      >
        <UIcon name="i-heroicons-check" class="size-[15px]" />Vigente
      </button>
    </div>
    <div class="col-start-1 text-xs text-muted">
      Fecha <b class="font-semibold text-highlighted">{{ shortDate(document.issued_on) }}</b> ·
      Importe <b class="font-semibold" :class="differs ? 'text-amber-700 dark:text-amber-300' : 'text-highlighted'">{{ usd(document.total) }}</b>
      <span v-if="differs" class="text-amber-700 dark:text-amber-300">(actual {{ usd(operation.total) }})</span>
    </div>
    <div class="col-start-1 truncate text-xs text-muted">{{ reasonText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CHINA_INVOICE_STATUS_LABEL, CHINA_INVOICE_STATUS_PILL } from '~/composables/china-billing/useChinaInvoices'
import type { ChinaDocument, ChinaOperation } from '~/types/china-billing'
import { usd } from '~/utils/yuanFormat'

const props = defineProps<{ document: ChinaDocument; operation: ChinaOperation; locked: boolean; busy: boolean }>()
const emit = defineEmits<{ download: [document: ChinaDocument]; annul: [document: ChinaDocument]; 'mark-current': [document: ChinaDocument] }>()

const isCurrent = computed(() => props.document.status === 'vigente')
const number = computed(() => props.document.number || `${props.operation.code}-v${props.document.version}`)
const differs = computed(() => props.document.total !== null && Math.abs(Number(props.document.total) - Number(props.operation.total)) >= 0.005)
const reasonText = computed(() => {
  if (props.document.status === 'anulada') return `Anulada: ${props.document.status_reason || 'sin motivo'}`
  if (isCurrent.value && props.document.status_reason) return props.document.status_reason
  return props.document.reason || 'Emisión inicial'
})

/** «22/11/26», como en la maqueta. */
function shortDate(date: string | null): string {
  const [year, month, day] = (date || '').slice(0, 10).split('-')
  return year ? `${day}/${month}/${year.slice(2)}` : '—'
}
</script>
