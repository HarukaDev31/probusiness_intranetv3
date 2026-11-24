<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <USelect v-model="year" :items="years" class="w-28" />
      <UButton v-for="item in GRAINS" :key="item.value" size="sm" :variant="grain === item.value ? 'solid' : 'outline'" color="neutral" @click="grain = item.value">{{ item.label }}</UButton>
    </div>
    <p v-if="loading" class="text-sm text-muted">Cargando…</p>
    <p v-else-if="error" class="text-sm text-error">{{ error }}</p>
    <p v-else-if="!periods.length" class="rounded-xl border border-default bg-default p-8 text-center text-muted">Sin movimientos en {{ year }}.</p>
    <template v-else>
      <div class="grid gap-3 sm:grid-cols-4">
        <UCard v-for="card in cards" :key="card.label"><p class="text-xs uppercase text-muted">{{ card.label }}</p><p class="text-xl font-bold" :class="card.color">{{ rmbSigned(card.value) }}</p></UCard>
      </div>
      <div class="overflow-x-auto rounded-xl border border-default bg-default">
        <table class="w-full min-w-[820px] text-sm">
          <thead class="bg-elevated/60 text-left text-xs uppercase text-muted"><tr><th class="p-3">Periodo</th><th class="p-3 text-right">Inicial</th><th class="p-3 text-right">Ingresos</th><th class="p-3 text-right">Egresos</th><th class="p-3 text-right">Utilidad</th><th class="p-3 text-right">Sistema</th><th class="p-3 text-right">Banco</th><th class="p-3 text-right">Diferencia</th><th class="p-3" /></tr></thead>
          <tbody>
            <tr v-for="row in periods" :key="row.label" class="border-t border-default">
              <td class="p-3 font-semibold">{{ row.label }} <UBadge size="sm" :color="row.closed ? 'neutral' : 'primary'" variant="soft">{{ row.closed ? 'Cerrado' : 'Abierto' }}</UBadge></td>
              <td class="p-3 text-right">{{ money(row.opening) }}</td>
              <td class="p-3 text-right text-success">{{ rmb(row.income) }}</td>
              <td class="p-3 text-right">{{ rmb(row.expense) }}</td>
              <td class="p-3 text-right font-semibold" :class="row.profit < 0 ? 'text-error' : 'text-success'">{{ rmbSigned(row.profit) }}</td>
              <td class="p-3 text-right">{{ money(row.calculated) }}</td>
              <td class="p-3 text-right">{{ money(row.bank) }}</td>
              <td class="p-3 text-right" :class="row.difference ? 'text-error' : 'text-success'">{{ row.difference === 0 ? 'Cuadra' : money(row.difference) }}</td>
              <td class="p-3"><UButton v-if="row.month" size="xs" variant="link" @click="emit('view', row.month)">Ver mes</UButton></td>
            </tr>
          </tbody>
        </table>
      </div>
      <UCard v-if="periods.length > 1">
        <div class="mb-3 flex flex-wrap items-center gap-2"><p class="font-semibold">Comparar</p><USelect v-model="a" :items="labels" class="w-44" /><span>contra</span><USelect v-model="b" :items="labels" class="w-44" /></div>
        <div class="grid gap-3 sm:grid-cols-3">
          <div v-for="row in comparison" :key="row.label"><p class="text-xs uppercase text-muted">{{ row.label }}</p><p class="font-bold" :class="row.good ? 'text-success' : 'text-error'">{{ rmbSigned(row.diff) }} <span v-if="row.percent !== null">({{ row.percent }}%)</span></p></div>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaCashHistory } from '~/types/china-caja'
import { chinaToday, rmbSigned, variation } from '~/utils/chinaCaja'
import { monthLabel, rmb } from '~/utils/yuanFormat'

const emit = defineEmits<{ view: [month: string] }>()
const GRAINS = [{ label: 'Mensual', value: 1 }, { label: 'Trimestral', value: 3 }, { label: 'Semestral', value: 6 }]
const thisYear = Number(chinaToday().slice(0, 4))
const years = Array.from({ length: Math.max(1, thisYear - 2025) }, (_, i) => thisYear - i)
const year = ref(thisYear)
const grain = ref(1)
const rows = ref<ChinaCashHistory[]>([])
const loading = ref(true)
const error = ref('')
const a = ref('')
const b = ref('')

const periods = computed(() => {
  const groups = new Map<number, ChinaCashHistory[]>()
  rows.value.forEach((row) => {
    const key = Math.floor((Number(row.month.slice(5)) - 1) / grain.value)
    groups.set(key, [...(groups.get(key) || []), row])
  })
  return [...groups].map(([key, list]) => {
    const last = list[list.length - 1]!
    const closed = list.length === grain.value && list.every((row) => row.closed)
    return {
      label: grain.value === 1 ? monthLabel(last.month) : `${grain.value === 3 ? 'T' : 'S'}${key + 1} ${year.value}`,
      month: grain.value === 1 ? last.month : '',
      closed, opening: list[0]!.opening,
      income: list.reduce((sum, row) => sum + row.income, 0), expense: list.reduce((sum, row) => sum + row.expense, 0),
      profit: list.reduce((sum, row) => sum + row.profit, 0),
      calculated: last.calculated, bank: closed ? last.bank : null,
      difference: closed ? list.reduce((sum, row) => sum + (row.difference || 0), 0) : null
    }
  }).reverse()
})
const labels = computed(() => periods.value.map((row) => row.label))
const cards = computed(() => {
  const income = rows.value.reduce((sum, row) => sum + row.income, 0)
  const expense = rows.value.reduce((sum, row) => sum + row.expense, 0)
  return [
    { label: 'Ingresos del año', value: income, color: 'text-success' }, { label: 'Egresos del año', value: expense, color: 'text-highlighted' },
    { label: 'Utilidad', value: income - expense, color: income < expense ? 'text-error' : 'text-success' },
    { label: 'Promedio por periodo', value: (income - expense) / Math.max(1, periods.value.length), color: 'text-highlighted' }
  ]
})
const comparison = computed(() => {
  const first = periods.value.find((row) => row.label === a.value)
  const second = periods.value.find((row) => row.label === b.value)
  if (!first || !second) return []
  return ([['Ingresos', 'income', 1], ['Egresos', 'expense', -1], ['Utilidad', 'profit', 1]] as const).map(([label, key, sign]) => ({
    label, diff: second[key] - first[key], percent: variation(second[key], first[key]), good: (second[key] - first[key]) * sign >= 0
  }))
})
watch(labels, (value) => { b.value = value[0] || ''; a.value = value[1] || '' })

function money(value: number | null) {
  return value === null ? '—' : rmbSigned(value)
}

watch(year, async (value) => {
  loading.value = true
  error.value = ''
  try {
    rows.value = (await ChinaCajaService.history(value)).data
  } catch (e: any) {
    error.value = e?.message || 'No se pudieron cargar los cierres.'
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>
