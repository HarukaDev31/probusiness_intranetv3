import { computed, ref } from 'vue'
import { useChinaAction } from '~/composables/china-caja/useChinaAction'
import { CHINA_ALL_ORIGINS, CHINA_CASH_ORIGINS, CHINA_CASH_PERIOD_MONTH, CHINA_CURRENCY } from '~/constants/chinaCaja'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaCashMonth, ChinaCashMovement, ChinaClientTotal, ChinaKpiCard } from '~/types/china-caja'
import { chinaMonthName, chinaMonthShort, previousChinaMonth, variation, variationText, variationTone, weekRange } from '~/utils/chinaCaja'

/** Flujo de caja de un mes. Saldos y totales vienen calculados del backend. */
export function useChinaCash(initialMonth: string) {
  const { run } = useChinaAction('Flujo de caja')
  const month = ref(initialMonth)
  const data = ref<ChinaCashMonth | null>(null)
  const loading = ref(false)
  const error = ref('')
  const period = ref<string>(CHINA_CASH_PERIOD_MONTH)
  const origin = ref<string>(CHINA_ALL_ORIGINS)
  const currency = ref<string>(CHINA_CURRENCY.RMB)
  let lastRequest = 0

  /** Los montos se guardan en RMB; en USD se ven al TC general del mes. */
  function money(value: number): string {
    const rate = data.value?.exchange_rate
    const whole = (amount: number) => Math.round(Math.abs(amount)).toLocaleString('en-US')
    if (currency.value === CHINA_CURRENCY.USD) return rate ? `$${whole(value / rate)}` : '—'
    return `¥${whole(value)}`
  }
  const signed = (value: number) => `${value < 0 ? '−' : ''}${money(value)}`

  const week = computed(() => data.value?.weeks.find((item) => item.starts_on === period.value) || null)
  const inPeriod = (row: ChinaCashMovement) => !week.value || (row.date >= week.value.starts_on && row.date <= week.value.ends_on)
  const byOrigin = (row: ChinaCashMovement) => origin.value === CHINA_ALL_ORIGINS || row.origin === origin.value
  const periodRows = computed(() => [...(data.value?.real || []), ...(data.value?.pending || []), ...(data.value?.late || [])].filter(inPeriod))
  const late = computed(() => [...(data.value?.late || [])].sort((a, b) => (a.days || 0) - (b.days || 0)))
  const pending = computed(() => (data.value?.pending || []).filter((row) => inPeriod(row) && byOrigin(row))
    .sort((a, b) => (a.days ?? Number.MAX_SAFE_INTEGER) - (b.days ?? Number.MAX_SAFE_INTEGER)))
  const real = computed(() => (data.value?.real || []).filter((row) => inPeriod(row) && byOrigin(row)).sort((a, b) => a.date.localeCompare(b.date)))
  const origins = computed(() => CHINA_CASH_ORIGINS.map((label) => ({
    label, count: label === CHINA_ALL_ORIGINS ? periodRows.value.length : periodRows.value.filter((row) => row.origin === label).length
  })))
  const periodLabel = computed(() => (week.value ? `Semana ${week.value.index + 1} · ${weekRange(week.value)}` : `${chinaMonthName(month.value)} ${month.value.slice(0, 4)}`))
  const scopeLabel = computed(() => (week.value ? `SEMANA ${week.value.index + 1}` : 'MES'))

  const clients = (type: 'in' | 'out') => computed<ChinaClientTotal[]>(() => {
    const groups = new Map<string, { client: string | null; amount: number; real: number; count: number }>()
    periodRows.value.filter((row) => row.type === type).forEach((row) => {
      const item = groups.get(row.client || '') || { client: row.client, amount: 0, real: 0, count: 0 }
      item.amount += row.amount
      item.count++
      if (row.real) item.real += row.amount
      groups.set(row.client || '', item)
    })
    return [...groups.values()].map((item) => ({
      client: item.client,
      amount: item.amount,
      detail: `${item.count} ${item.count === 1 ? 'movimiento' : 'movimientos'} · real ${money(item.real)}${item.amount - item.real > 0 ? ` · por ${type === 'in' ? 'ingresar' : 'salir'} ${money(item.amount - item.real)}` : ''}`
    }))
  })

  const cards = computed<{ cash: ChinaKpiCard; operation: ChinaKpiCard[]; movements: ChinaKpiCard } | null>(() => {
    const current = data.value
    if (!current) return null
    const totals = week.value?.totals ?? current.totals
    const previous = week.value ? current.previous_weeks[week.value.index] : current.previous_totals
    const previousName = chinaMonthShort(previousChinaMonth(month.value))
    const against = week.value ? `semana ${week.value.index + 1} de ${previousName}` : previousName
    const compare = (value: number, before: number, upIsGood: boolean) => {
      const percent = variation(value, before)
      return percent === null ? { compare: `Sin dato de ${against}`, compareTone: 'cc-t-faint' } : { compare: `${variationText(percent)} vs ${against} (total)`, compareTone: variationTone(percent, upIsGood) }
    }
    const closings = current.weeks.filter((item) => item.closing)
    const last = closings[closings.length - 1]
    const unclosed = current.weeks.filter((item) => !item.closing && item.ends_on < current.today && !current.closed).length
    const negative = (current.closed ? totals.profit : totals.profit_projected) < 0
    const pendingCount = periodRows.value.filter((row) => !row.real).length
    const balance = last?.closing ? last.closing.balance : current.opening_balance

    return {
      cash: {
        label: 'SALDO EN CAJA', icon: 'i-lucide-landmark', iconBg: 'bg-(--cc-empty)', accent: 'var(--cc-ink)', tone: 'cc-t-ink', info: 'saldo',
        value: balance === null ? '—' : signed(balance),
        sub: last ? `Cierre semana ${last.index + 1} · ${Number(last.ends_on.slice(8))} ${chinaMonthShort(current.month)}` : 'Saldo inicial del mes · aún sin cierres',
        compare: last ? (unclosed ? `${unclosed} ${unclosed === 1 ? 'semana' : 'semanas'} sin cerrar` : 'Todas las semanas cerradas') : '',
        compareTone: unclosed ? 'cc-t-deep' : 'cc-t-green'
      },
      operation: [
        {
          label: `UTILIDAD · ${scopeLabel.value}`, icon: 'i-lucide-trending-up', iconBg: negative ? 'bg-(--cc-red-bg)' : 'bg-(--cc-green-bg)', accent: totals.profit < 0 ? 'var(--cc-red)' : 'var(--cc-green)',
          tone: totals.profit < 0 ? 'cc-t-red' : 'cc-t-green', info: 'util', value: signed(totals.profit), sub: 'Realizada · ingresos − egresos',
          compare: current.closed ? '' : `Proyectada ${week.value ? 'fin de semana' : 'fin de mes'}: ${signed(totals.profit_projected)} · ${totals.profit_projected < 0 ? 'no cubre costos' : 'cubre costos'}`,
          compareTone: totals.profit_projected < 0 ? 'cc-t-red' : 'cc-t-green'
        },
        {
          label: `INGRESOS · ${scopeLabel.value}`, icon: 'i-lucide-arrow-up', iconBg: 'bg-(--cc-green-bg)', accent: 'var(--cc-green)', tone: 'cc-t-green', info: 'ingresos',
          value: `+${money(totals.income)}`, sub: current.closed ? 'Todo confirmado' : `+ ${money(totals.income_projected)} por ingresar`,
          ...compare(totals.income + totals.income_projected, (previous?.income || 0) + (previous?.income_projected || 0), true)
        },
        {
          label: `EGRESOS · ${scopeLabel.value}`, icon: 'i-lucide-arrow-down', iconBg: 'bg-(--cc-orange-pale)', accent: 'var(--cc-orange)', tone: 'cc-t-orange', info: 'egresos',
          value: `−${money(totals.expense)}`, sub: current.closed ? 'Todo confirmado' : `+ ${money(totals.expense_projected)} por salir`,
          ...compare(totals.expense + totals.expense_projected, (previous?.expense || 0) + (previous?.expense_projected || 0), false)
        }
      ],
      movements: {
        label: `TOTAL MOVIMIENTOS · ${scopeLabel.value}`, icon: 'i-lucide-align-left', iconBg: 'bg-(--cc-soft)', accent: 'var(--cc-ink)', tone: 'cc-t-ink', info: 'movs',
        value: String(periodRows.value.length - pendingCount), sub: `Realizados · ${pendingCount} por realizar`
      }
    }
  })

  async function load() {
    const current = ++lastRequest
    loading.value = true
    error.value = ''
    try {
      const response = (await ChinaCajaService.month(month.value)).data
      // Una respuesta tardía no pisa la del mes elegido después.
      if (current === lastRequest) data.value = response
    } catch (e: unknown) {
      if (current === lastRequest) error.value = e instanceof Error ? e.message : 'No se pudo cargar el flujo.'
    } finally {
      if (current === lastRequest) loading.value = false
    }
  }

  function save(action: () => Promise<unknown>, success = '') {
    return run(async () => {
      await action()
      await load()
    }, success)
  }

  return {
    month, data, loading, error, period, origin, currency, origins, periodLabel, pending, late, real, cards, money, signed, load,
    incomeClients: clients('in'), expenseClients: clients('out'),
    saveRate: (value: number) => save(() => ChinaCajaService.settings(month.value, { exchange_rate: value })),
    saveOpening: (value: number) => save(() => ChinaCajaService.settings(month.value, { opening_balance: value })),
    closeWeek: (startsOn: string, balance: number, screenshot: File) => save(() => ChinaCajaService.closeWeek(month.value, startsOn, balance, screenshot), 'Semana cerrada.'),
    closeMonth: (balance: number) => save(() => ChinaCajaService.closeMonth(month.value, balance), 'Mes cerrado.'),
    addFixedCost: (body: { name: string; amount: number }) => save(() => ChinaCajaService.addFixedCost(body)),
    toggleFixedCost: (id: number, active: boolean) => save(() => ChinaCajaService.toggleFixedCost(id, active)),
    removeFixedCost: (id: number) => save(() => ChinaCajaService.removeFixedCost(id)),
    addInvestment: (body: { name: string; amount: number; due_on: string; previous_id?: number }) => save(() => ChinaCajaService.addInvestment(body)),
    payInvestment: (id: number) => save(() => ChinaCajaService.payInvestment(id)),
    removeInvestment: (id: number) => save(() => ChinaCajaService.removeInvestment(id))
  }
}
