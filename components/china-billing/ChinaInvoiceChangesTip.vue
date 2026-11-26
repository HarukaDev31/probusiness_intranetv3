<template>
  <div class="flex flex-col gap-1.5 text-xs leading-4 text-slate-200">
    <span class="font-bold text-white">Cambios desde la V{{ version }}</span>
    <span v-for="change in operation.invoice?.changes || []" :key="change.field" class="grid grid-cols-[96px_auto_12px_auto] items-baseline gap-1.5">
      <span class="text-slate-400">{{ change.label }}</span>
      <span class="text-slate-400 line-through">{{ change.from }}</span>
      <span class="text-slate-400">→</span>
      <span class="font-bold text-amber-200">{{ change.to }}</span>
    </span>
    <span v-if="operation.invoice?.changed_at" class="border-t border-slate-700 pt-1.5 text-slate-400">
      Modificado el {{ shortDate(operation.invoice.changed_at) }}<template v-if="operation.invoice.changed_by"> por {{ operation.invoice.changed_by }}</template>.
    </span>
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
