import { computed, ref, watch } from 'vue'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaCashHistory, ChinaKpiCard } from '~/types/china-caja'
import { chinaMonthName, chinaToday, nextChinaMonth, previousChinaMonth, variation, variationText, variationTone } from '~/utils/chinaCaja'

const FIRST_YEAR = 2025
const GRAIN_NAME: Record<number, { unit: string; title: string }> = {
  1: { unit: 'mes', title: 'Meses' }, 3: { unit: 'trimestre', title: 'Trimestres' }, 6: { unit: 'semestre', title: 'Semestres' }
}
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface Cell { text: string; tone: string; open: boolean }
interface MatrixRow { label: string; cells: Cell[]; total: string; totalTone: string; weight: string; small: boolean; strong: boolean }

/** Cierres del año, agrupados por mes, trimestre o semestre. `money` viene de la moneda elegida. */
export function useChinaCashHistory(money: (value: number) => string, signed: (value: number) => string) {
  const currentMonth = chinaToday().slice(0, 7)
  const thisYear = Number(currentMonth.slice(0, 4))
  const years = Array.from({ length: Math.max(1, thisYear - FIRST_YEAR + 1) }, (_, index) => thisYear - index)
  const year = ref(thisYear)
  const grain = ref(1)
  const data = ref<ChinaCashHistory>({ rows: [], clients: { in: [], out: [] }, movements: { in: 0, out: 0 } })
  const loading = ref(true)
  const error = ref('')
  const unit = computed(() => GRAIN_NAME[grain.value]!.unit)
  const title = computed(() => `${GRAIN_NAME[grain.value]!.title} ${year.value}`)

  const periods = computed(() => {
    const groups = new Map<number, ChinaCashHistory['rows']>()
    data.value.rows.forEach((row) => {
      const key = Math.floor((Number(row.month.slice(5)) - 1) / grain.value)
      groups.set(key, [...(groups.get(key) || []), row])
    })
    return [...groups].map(([key, list]) => {
      const last = list[list.length - 1]!
      const closed = list.length === grain.value && list.every((row) => row.closed)
      const sum = (pick: (row: (typeof list)[number]) => number) => list.reduce((total, row) => total + pick(row), 0)
      const from = key * grain.value
      const letter = grain.value === 3 ? 'T' : 'S'
      const differences = sum((row) => (row.bank ?? row.final) - row.final)
      return {
        label: grain.value === 1 ? chinaMonthName(last.month) : `${letter}${key + 1} · ${MONTH_SHORT[from]}–${MONTH_SHORT[from + grain.value - 1]}`,
        short: grain.value === 1 ? MONTH_SHORT[from]! : `${letter}${key + 1}`,
        month: grain.value === 1 ? last.month : '',
        closed, opening: list[0]!.opening, final: last.final, bank: closed ? last.final + differences : null,
        income: sum((row) => row.income), incomeProjected: sum((row) => row.income_projected),
        expense: sum((row) => row.expense), expenseProjected: sum((row) => row.expense_projected),
        incomeTotal: sum((row) => row.income + row.income_projected), expenseTotal: sum((row) => row.expense + row.expense_projected),
        profit: sum((row) => row.profit)
      }
    })
  })

  const totals = computed(() => {
    const sum = (pick: (row: (typeof periods.value)[number]) => number) => periods.value.reduce((total, row) => total + pick(row), 0)
    const profit = sum((row) => row.profit)
    return { income: sum((row) => row.incomeTotal), expense: sum((row) => row.expenseTotal), profit, average: profit / Math.max(1, periods.value.length) }
  })

  const matrix = computed<MatrixRow[]>(() => {
    const list = periods.value
    if (!list.length) return []
    const profitTone = (value: number) => (value < 0 ? 'cc-t-red' : 'cc-t-green')
    const finalTone = (value: number) => (value < 0 ? 'cc-t-red' : 'cc-t-ink')
    const row = (label: string, cell: (period: (typeof list)[number], index: number) => [string, string], options: Partial<MatrixRow> = {}): MatrixRow => ({
      label, total: '', totalTone: '', weight: 'font-normal', small: false, strong: false, ...options,
      cells: list.map((period, index) => ({ text: cell(period, index)[0], tone: cell(period, index)[1], open: !period.closed }))
    })
    const percent = (index: number, key: 'incomeTotal' | 'expenseTotal', upIsGood: boolean): [string, string] => {
      const value = index ? variation(list[index]![key], list[index - 1]![key]) : null
      return [variationText(value), variationTone(value, upIsGood)]
    }
    const last = list[list.length - 1]!
    const cuadra = (period: (typeof list)[number]) => period.bank !== null && Math.abs(period.bank - period.final) < 1
    return [
      row('Saldo inicial', (p) => [signed(p.opening), 'cc-t-body'], { total: signed(list[0]!.opening), totalTone: 'cc-t-body' }),
      row('Ingresos', (p) => [money(p.incomeTotal), 'cc-t-green'], { weight: 'font-semibold', total: money(totals.value.income), totalTone: 'cc-t-green' }),
      row('% vs anterior', (_, i) => percent(i, 'incomeTotal', true), { small: true }),
      row('Egresos', (p) => [money(p.expenseTotal), 'cc-t-orange'], { weight: 'font-semibold', total: money(totals.value.expense), totalTone: 'cc-t-orange' }),
      row('% vs anterior', (_, i) => percent(i, 'expenseTotal', false), { small: true }),
      row('Utilidad', (p) => [signed(p.profit), profitTone(p.profit)], { weight: 'font-bold', strong: true, total: signed(totals.value.profit), totalTone: profitTone(totals.value.profit) }),
      row('Saldo final', (p) => [signed(p.final), finalTone(p.final)], { weight: 'font-bold', total: signed(last.final), totalTone: finalTone(last.final) }),
      row('Según banco', (p) => (p.bank === null ? ['Pendiente', 'cc-t-faint'] : [`${cuadra(p) ? '✓ ' : ''}${signed(p.bank)}`, cuadra(p) ? 'cc-t-green' : 'cc-t-red'])),
      row('diferencia', (p) => {
        if (p.bank === null) return ['—', 'cc-t-faint']
        if (cuadra(p)) return ['Cuadra', 'cc-t-green']
        return [`${p.bank > p.final ? '+' : ''}${signed(p.bank - p.final)}`, 'cc-t-red']
      }, { small: true })
    ]
  })

  const bars = computed(() => {
    const top = Math.max(1, ...periods.value.map((row) => Math.max(row.incomeTotal, row.expenseTotal)))
    const topProfit = Math.max(1, ...periods.value.map((row) => Math.abs(row.profit)))
    const px = (value: number, height: number, max: number) => `${Math.round(value / max * height)}px`
    let accumulated = 0
    return periods.value.map((row) => {
      accumulated += row.profit
      return {
        label: row.short,
        incomeReal: px(row.income, 190, top), incomeProjected: px(row.incomeProjected, 190, top), expenseReal: px(row.expense, 190, top), expenseProjected: px(row.expenseProjected, 190, top),
        income: row.incomeTotal, expense: row.expenseTotal, profit: row.profit, accumulated, projected: row.incomeProjected + row.expenseProjected > 0,
        up: row.profit > 0 ? px(row.profit, 80, topProfit) : '0px', down: row.profit < 0 ? px(-row.profit, 80, topProfit) : '0px'
      }
    })
  })

  /** Mes en curso (o el año completo, si es uno anterior). */
  const heading = computed(() => {
    if (year.value !== thisYear) return `Año ${year.value} · cerrado`
    const row = data.value.rows.find((item) => item.month === currentMonth)
    return `${chinaMonthName(currentMonth)} ${thisYear} · ${row?.closed ? 'cerrado' : 'abierto, montos proyectados a fin de mes'}`
  })
  const cards = computed<ChinaKpiCard[]>(() => {
    const list = data.value.rows
    const past = year.value !== thisYear
    const row = past ? null : list.find((item) => item.month === currentMonth)
    const first = past ? list[0] : row
    const last = past ? list[list.length - 1] : row
    const income = past ? totals.value.income : (row?.income || 0) + (row?.income_projected || 0)
    const expense = past ? totals.value.expense : (row?.expense || 0) + (row?.expense_projected || 0)
    const change = income - expense
    const { in: incomes, out: expenses } = data.value.movements
    // En Cierres la maqueta no lleva íconos en las tarjetas.
    const icon = { icon: '', iconBg: '' }
    return [
      { ...icon, label: 'SALDO INICIAL', value: signed(first?.opening || 0), sub: past ? `Inicio de ${year.value}` : `Viene del cierre de ${chinaMonthName(previousChinaMonth(currentMonth)).toLowerCase()}`, accent: 'var(--cc-ink)', tone: 'cc-t-ink', info: 'ch0' },
      { ...icon, label: 'VARIACIÓN DE CAJA', value: `${change >= 0 ? '+' : ''}${signed(change)}`, sub: `+${money(income)} ingresos · −${money(expense)} egresos`, accent: change >= 0 ? 'var(--cc-green)' : 'var(--cc-red)', tone: change >= 0 ? 'cc-t-green' : 'cc-t-red', info: 'ch1' },
      { ...icon, label: 'SALDO FINAL', value: signed(last?.final || 0), sub: past ? `Pasó como saldo inicial de ${year.value + 1}` : `Pasa como saldo inicial de ${chinaMonthName(nextChinaMonth(currentMonth)).toLowerCase()}`, accent: 'var(--cc-orange)', tone: (last?.final || 0) < 0 ? 'cc-t-red' : 'cc-t-ink', info: 'ch2' },
      { ...icon, label: 'TOTAL OPERACIONES', value: past ? '—' : String(incomes + expenses), sub: past ? `Cierre de ${year.value}` : `${incomes} ingresos · ${expenses} egresos · ${chinaMonthName(currentMonth).toLowerCase()}`, accent: '#1d4f91', tone: 'cc-t-ink', info: 'movs' }
    ]
  })
  const clients = (type: 'in' | 'out') => computed(() => data.value.clients[type].map((row) => ({ client: row.client, amount: row.amount, detail: `${row.movements} movimientos en el periodo` })))

  async function load() {
    loading.value = true
    error.value = ''
    const requested = year.value
    try {
      const response = (await ChinaCajaService.history(requested)).data
      if (requested === year.value) data.value = response
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'No se pudieron cargar los cierres.'
    } finally {
      loading.value = false
    }
  }
  watch(year, load, { immediate: true })

  return { years, year, grain, unit, title, heading, loading, error, periods, matrix, bars, totals, cards, incomeClients: clients('in'), expenseClients: clients('out'), load }
}
