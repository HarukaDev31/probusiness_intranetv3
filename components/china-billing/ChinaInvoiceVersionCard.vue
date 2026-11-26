<template>
  <!-- Mismo formato que las filas del historial de documentos (ChinaDocumentsModal). -->
  <div
    class="flex items-center gap-3 rounded-xl border px-3 py-2.5"
    :class="isCurrent ? 'border-primary/30 bg-primary/10' : 'border-default'"
    :title="`Generada por ${document.generated_by || 'Sistema'}`"
  >
    <UIcon name="i-heroicons-document-text" class="size-7 shrink-0" :class="isCurrent ? 'text-primary' : 'text-muted'" />
    <div class="min-w-0 flex-1">
      <p class="flex flex-wrap items-center gap-2 text-sm font-semibold text-highlighted">
        V{{ document.version }} · Factura N° {{ operation.code }}
        <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="CHINA_INVOICE_STATUS_PILL[document.status || 'reemplazada']">
          {{ CHINA_INVOICE_STATUS_LABEL[document.status || 'reemplazada'] }}
        </span>
      </p>
      <p class="text-xs text-muted">
        {{ shortDate(document.issued_on) }} ·
        <span :class="differs ? 'font-semibold text-warning' : ''">{{ usd(document.total) }}</span>
        <span v-if="differs" class="text-warning"> (actual {{ usd(operation.total) }})</span>
      </p>
      <p class="truncate text-xs text-muted">{{ reasonText }}</p>
    </div>
    <div class="flex shrink-0 items-center gap-1">
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        icon="i-heroicons-arrow-down-tray"
        :aria-label="`Descargar ${number} en PDF`"
        title="Descargar PDF"
        @click="emit('download', document)"
      />
      <UButton
        v-if="isCurrent"
        size="sm"
        color="error"
        variant="outline"
        icon="i-heroicons-no-symbol"
        :aria-label="`Anular ${number}`"
        title="Anular"
        :disabled="busy"
        @click="emit('annul', document)"
      />
      <UButton
        v-else-if="document.status === 'reemplazada' && !locked"
        size="sm"
        color="success"
        variant="outline"
        icon="i-heroicons-check"
        :aria-label="`Marcar ${number} como vigente`"
        :disabled="busy"
        @click="emit('mark-current', document)"
      >
        Vigente
      </UButton>
    </div>
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

function shortDate(date: string | null): string {
  const [year, month, day] = (date || '').slice(0, 10).split('-')
  return year ? `${day}/${month}/${year.slice(2)}` : '—'
}
</script>
