import { computed, ref } from 'vue'
import { useChinaAction } from '~/composables/china-caja/useChinaAction'
import { CHINA_CASH_ORIGINS, CHINA_CASH_PERIOD_MONTH } from '~/constants/chinaCaja'
import { ChinaCajaService } from '~/services/chinaCajaService'
import type { ChinaCashMonth, ChinaCashMovement } from '~/types/china-caja'
import { rmbSigned, variation } from '~/utils/chinaCaja'
import { dayLabel, rmb } from '~/utils/yuanFormat'

/** Flujo de caja de un mes. Saldos y totales vienen calculados del backend. */
export function useChinaCash(initialMonth: string) {
  const { run } = useChinaAction('Flujo de caja')
  const month = ref(initialMonth)
  const data = ref<ChinaCashMonth | null>(null)
  const loading = ref(false)
  const error = ref('')
  const period = ref<string>(CHINA_CASH_PERIOD_MONTH)
  const origin = ref(CHINA_CASH_ORIGINS[0]!)
  let lastRequest = 0

  const week = computed(() => data.value?.weeks.find((item) => item.starts_on === period.value) || null)
  const periodItems = computed(() => [
    { label: 'Mes completo', value: CHINA_CASH_PERIOD_MONTH },
    ...(data.value?.weeks || []).map((item) => ({ label: `${dayLabel(item.starts_on)} – ${dayLabel(item.ends_on)}`, value: item.starts_on }))
  ])
  const visible = (row: ChinaCashMovement) => (origin.value === CHINA_CASH_ORIGINS[0] || row.origin === origin.value)
    && (!week.value || (row.date >= week.value.starts_on && row.date <= week.value.ends_on))
  const pending = computed(() => (data.value?.pending || []).filter(visible))
  const real = computed(() => (data.value?.real || []).filter(visible))
  const cards = computed(() => {
    const current = data.value
    if (!current) return []
    const totals = week.value?.totals ?? current.totals
    const compare = (value: number, previous: number) => {
      const percent = week.value ? null : variation(value, previous)
      return percent === null ? '' : ` · ${percent >= 0 ? '▲' : '▼'} ${Math.abs(percent)}% vs mes anterior`
    }
    const optional = (value: number | null) => (value === null ? '—' : rmbSigned(value))
    return [
      { label: 'Saldo', value: optional(current.balance), sub: current.closed ? 'Saldo de cierre' : `Cierre proyectado ${optional(current.projected_closing)}`, tone: 'text-highlighted' },
      { label: 'Utilidad', value: rmbSigned(totals.profit), sub: `Proyectada ${rmbSigned(totals.profit_projected)}`, tone: totals.profit < 0 ? 'text-error' : 'text-success' },
      { label: 'Ingresos', value: rmb(totals.income), sub: `Por ingresar ${rmb(totals.income_projected)}${compare(totals.income, current.previous_totals.income)}`, tone: 'text-success' },
      { label: 'Egresos', value: rmb(totals.expense), sub: `Por salir ${rmb(totals.expense_projected)}${compare(totals.expense, current.previous_totals.expense)}`, tone: 'text-highlighted' }
    ]
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

  function save(action: () => Promise<unknown>, success: string) {
    return run(async () => {
      await action()
      await load()
    }, success)
  }

  return {
    month, data, loading, error, period, origin, periodItems, pending, real, cards, load,
    saveRate: (value: number) => save(() => ChinaCajaService.settings(month.value, { exchange_rate: value }), 'TC del mes guardado.'),
    saveOpening: (value: number) => save(() => ChinaCajaService.settings(month.value, { opening_balance: value }), 'Saldo inicial guardado.'),
    closeWeek: (startsOn: string, balance: number, screenshot: File) => save(() => ChinaCajaService.closeWeek(month.value, startsOn, balance, screenshot), 'Semana cerrada.'),
    closeMonth: (balance: number) => save(() => ChinaCajaService.closeMonth(month.value, balance), 'Mes cerrado.'),
    addFixedCost: (body: { name: string; amount: number }) => save(() => ChinaCajaService.addFixedCost(body), 'Costo fijo agregado.'),
    toggleFixedCost: (id: number, active: boolean) => save(() => ChinaCajaService.toggleFixedCost(id, active), active ? 'Costo fijo activado.' : 'Costo fijo pausado.'),
    removeFixedCost: (id: number) => save(() => ChinaCajaService.removeFixedCost(id), 'Costo fijo eliminado.'),
    addInvestment: (body: { name: string; amount: number; due_on: string }) => save(() => ChinaCajaService.addInvestment(body), 'Inversión agregada.'),
    payInvestment: (id: number, body: { paid_on: string; again_on?: string; again_amount?: number }) => save(() => ChinaCajaService.payInvestment(id, body), 'Inversión pagada.'),
    removeInvestment: (id: number) => save(() => ChinaCajaService.removeInvestment(id), 'Inversión eliminada.')
  }
}
