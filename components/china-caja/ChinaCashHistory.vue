<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <USelect v-model="year" :items="years" class="w-28" />
      <USelect v-model="grain" :items="CHINA_CASH_GRAINS" class="w-36" />
    </div>
    <UAlert v-if="error" color="error" variant="soft" :title="error" />
    <ChinaSummaryCards :cards="cards" />
    <DataTable keep-spanish-headers :fill-viewport="false" :data="periods" :columns="columns" :loading="loading" :current-page="1" :total-pages="1" :total-records="periods.length" :items-per-page="Math.max(1, periods.length)" :show-pagination="false" :show-filters="false" :show-primary-search="false" :show-export="false" empty-state-message="Sin movimientos en el año." />
    <UCard v-if="periods.length > 1">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <p class="font-semibold text-highlighted">Comparar</p>
        <USelect v-model="first" :items="labels" class="w-44" />
        <span class="text-muted">con</span>
        <USelect v-model="second" :items="labels" class="w-44" />
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <div v-for="row in comparison" :key="row.label">
          <p class="text-xs uppercase text-muted">{{ row.label }}</p>
          <p class="font-bold" :class="row.good ? 'text-success' : 'text-error'">{{ rmbSigned(row.difference) }} <span v-if="row.percent !== null">({{ row.percent }}%)</span></p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import ChinaSummaryCards from '~/components/china-caja/ChinaSummaryCards.vue'
import { useChinaCashHistory } from '~/composables/china-caja/useChinaCashHistory'
import { CHINA_CASH_GRAINS } from '~/constants/chinaCaja'
import { rmbSigned } from '~/utils/chinaCaja'
import { UBadge, UButton } from '#components'

const emit = defineEmits<{ view: [month: string] }>()
const { years, year, grain, loading, error, periods, labels, cards, first, second, comparison } = useChinaCashHistory()

type Period = (typeof periods.value)[number]
const money = (value: number | null) => (value === null ? '—' : rmbSigned(value))
const columns: TableColumn<Period>[] = [
  { accessorKey: 'label', header: 'Periodo' },
  { id: 'closed', header: 'Estado', cell: ({ row }) => h(UBadge, { color: row.original.closed ? 'neutral' : 'primary', variant: 'soft' }, () => (row.original.closed ? 'Cerrado' : 'Abierto')) },
  { id: 'opening', header: 'Inicial', cell: ({ row }) => money(row.original.opening) },
  { id: 'income', header: 'Ingresos', cell: ({ row }) => money(row.original.income) },
  { id: 'expense', header: 'Egresos', cell: ({ row }) => money(row.original.expense) },
  { id: 'profit', header: 'Utilidad', cell: ({ row }) => h('span', { class: row.original.profit < 0 ? 'text-error' : 'text-success' }, money(row.original.profit)) },
  { id: 'calculated', header: 'Sistema', cell: ({ row }) => money(row.original.calculated) },
  { id: 'bank', header: 'Banco', cell: ({ row }) => money(row.original.bank) },
  { id: 'difference', header: 'Diferencia', cell: ({ row }) => (row.original.difference === 0 ? 'Cuadra' : money(row.original.difference)) },
  { id: 'actions', header: 'Acciones', cell: ({ row }) => (row.original.month ? h(UButton, { size: 'xs', variant: 'link', onClick: () => emit('view', row.original.month) }, () => 'Ver mes') : null) }
]
</script>
