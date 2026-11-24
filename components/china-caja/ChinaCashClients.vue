<template>
  <section class="cc-card flex flex-col gap-3 px-5 py-[18px]">
    <div class="flex items-center justify-between gap-2.5">
      <span class="cc-title-row"><span class="cc-title">{{ title }}</span><ChinaInfo :topic="type === 'in' ? 'cliIn' : 'cliOut'" /></span>
      <span class="cc-sub whitespace-nowrap">{{ subtitle }}</span>
    </div>
    <div v-for="row in list" :key="row.name" class="flex flex-col gap-[5px]">
      <div class="flex items-baseline justify-between gap-2.5">
        <span class="flex min-w-0 flex-col"><span class="cc-cut text-sm font-medium">{{ row.name }}</span><span class="cc-sub cc-cut">{{ row.detail }}</span></span>
        <span class="flex flex-none items-center gap-1.5"><span class="rounded-[20px] bg-(--cc-soft) px-[7px] py-px text-[11px] text-(--cc-body)">{{ row.share }}%</span><span class="whitespace-nowrap text-[15px] font-bold" :class="type === 'in' ? 'cc-t-green' : 'cc-t-orange'">{{ type === 'in' ? '+' : '−' }}{{ money(row.amount) }}</span></span>
      </div>
      <span class="cc-track"><span :class="row.general ? 'bg-[#c5cdd9]' : type === 'in' ? 'bg-(--cc-green)' : 'bg-(--cc-orange)'" :style="{ width: `${row.width}%` }" /></span>
    </div>
    <span v-if="!list.length" class="text-sm text-(--cc-muted)">Sin movimientos en este periodo.</span>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChinaInfo from '~/components/china-caja/ChinaInfo.vue'
import type { ChinaClientTotal } from '~/types/china-caja'

const props = defineProps<{ title: string; subtitle: string; type: 'in' | 'out'; rows: ChinaClientTotal[]; money: (value: number) => string }>()

// Los clientes primero, de mayor a menor; lo general (fletes, costos fijos) al final.
const list = computed(() => {
  const rows = [...props.rows].sort((a, b) => Number(!a.client) - Number(!b.client) || b.amount - a.amount)
  const total = rows.reduce((sum, row) => sum + row.amount, 0) || 1
  const top = Math.max(1, ...rows.map((row) => row.amount))
  return rows.map((row) => ({
    name: row.client || (props.type === 'out' ? 'Fletes y gastos generales' : 'Otros ingresos'),
    general: !row.client, detail: row.detail, amount: row.amount,
    share: Math.round(row.amount / total * 100), width: Math.round(row.amount / top * 100)
  }))
})
</script>
