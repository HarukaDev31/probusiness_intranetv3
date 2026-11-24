import { computed, ref, watch } from 'vue'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaCashHistory } from '~/types/china-caja'
import { chinaToday, rmbSigned, variation } from '~/utils/chinaCaja'
import { monthLabel } from '~/utils/yuanFormat'

/** Cierres del año, agrupados por mes, trimestre o semestre. */
export function useChinaCashHistory() {
  const thisYear = Number(chinaToday().slice(0, 4))
  const years = Array.from({ length: Math.max(1, thisYear - 2025) }, (_, index) => thisYear - index)
  const year = ref(thisYear)
  const grain = ref(1)
  const rows = ref<ChinaCashHistory[]>([])
  const loading = ref(true)
  const error = ref('')
  const first = ref('')
  const second = ref('')

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
        closed,
        opening: list[0]!.opening,
        income: list.reduce((sum, row) => sum + row.income, 0),
        expense: list.reduce((sum, row) => sum + row.expense, 0),
        profit: list.reduce((sum, row) => sum + row.profit, 0),
        calculated: last.calculated,
        bank: closed ? last.bank : null,
        difference: closed ? list.reduce((sum, row) => sum + (row.difference || 0), 0) : null
      }
    }).reverse()
  })
  const labels = computed(() => periods.value.map((row) => row.label))
  const cards = computed(() => {
    const income = rows.value.reduce((sum, row) => sum + row.income, 0)
    const expense = rows.value.reduce((sum, row) => sum + row.expense, 0)
    return [
      { label: 'Ingresos del año', value: rmbSigned(income), tone: 'text-success' },
      { label: 'Egresos del año', value: rmbSigned(expense), tone: 'text-highlighted' },
      { label: 'Utilidad', value: rmbSigned(income - expense), tone: income < expense ? 'text-error' : 'text-success' },
      { label: 'Promedio por periodo', value: rmbSigned((income - expense) / Math.max(1, periods.value.length)), tone: 'text-highlighted' }
    ]
  })
  const comparison = computed(() => {
    const a = periods.value.find((row) => row.label === first.value)
    const b = periods.value.find((row) => row.label === second.value)
    if (!a || !b) return []
    return ([['Ingresos', 'income', 1], ['Egresos', 'expense', -1], ['Utilidad', 'profit', 1]] as const).map(([label, key, sign]) => ({
      label, difference: b[key] - a[key], percent: variation(b[key], a[key]), good: (b[key] - a[key]) * sign >= 0
    }))
  })
  watch(labels, (value) => {
    second.value = value[0] || ''
    first.value = value[1] || ''
  })

  watch(year, async (value) => {
    loading.value = true
    error.value = ''
    try {
      rows.value = (await ChinaCajaService.history(value)).data
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'No se pudieron cargar los cierres.'
    } finally {
      loading.value = false
    }
  }, { immediate: true })

  return { years, year, grain, loading, error, periods, labels, cards, first, second, comparison }
}
