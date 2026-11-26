<template>
  <!-- Mismo formato que el desglose del monto total en Operaciones (tooltip bg-inverted). -->
  <div class="min-w-56 space-y-1 text-xs text-inverted">
    <p class="font-semibold">Cambios desde la V{{ version }}</p>
    <div v-for="change in operation.invoice?.changes || []" :key="change.field" class="flex items-center justify-between gap-4">
      <span>{{ change.label }}</span>
      <span class="font-medium"><span class="line-through opacity-70">{{ change.from }}</span> → {{ change.to }}</span>
    </div>
    <p v-if="operation.invoice?.changed_at" class="mt-1 border-t border-current/30 pt-1 opacity-80">
      Modificado el {{ shortDate(operation.invoice.changed_at) }}<template v-if="operation.invoice.changed_by"> por {{ operation.invoice.changed_by }}</template>.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ChinaOperation } from '~/types/china-billing'

defineProps<{ operation: ChinaOperation; version: number }>()

function shortDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split('-')
  return year ? `${day}/${month}/${year.slice(2)}` : '—'
}
</script>
