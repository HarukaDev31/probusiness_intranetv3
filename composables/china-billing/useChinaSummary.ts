import { computed, ref } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaCredit, ChinaSummary } from '~/types/china-billing'

const emptySummary = (): ChinaSummary => ({
  operations_count: 0, services_amount: 0, receivable: 0, income_usd: 0, income_rmb: 0,
  total_billed: 0, paid: 0, in_confirmation: 0, balance_due: 0, credit_balance: 0
})

/** KPIs del encabezado de Operaciones y saldos a favor. Todo se calcula en el backend para el rango de fechas. */
export function useChinaSummary() {
  const { showError } = useModal()
  const from = ref('')
  const to = ref('')
  const summary = ref<ChinaSummary>(emptySummary())
  const credits = ref<ChinaCredit[]>([])
  const loading = ref(false)
  let lastRequest = 0

  const rangeLabel = computed(() => (from.value || to.value ? `${from.value || 'inicio'} – ${to.value || 'hoy'}` : 'todo el periodo'))

  const cards = computed(() => [
    { label: 'Cantidad de operaciones', value: String(summary.value.operations_count), tone: 'text-highlighted' },
    { label: 'Monto por servicios', value: usd(summary.value.services_amount), tone: 'text-success' },
    { label: 'Saldo por cobrar USD', value: usd(summary.value.receivable), tone: 'text-primary' },
    { label: 'Ingresado a caja USD', value: usd(summary.value.income_usd), tone: 'text-highlighted' },
    { label: 'Ingresado a caja RMB', value: rmb(summary.value.income_rmb), tone: 'text-highlighted' }
  ])

  async function load() {
    const current = ++lastRequest
    loading.value = true
    try {
      const response = await ChinaBillingService.summary({ from: from.value, to: to.value })
      if (current !== lastRequest) return
      summary.value = { ...emptySummary(), ...response.summary }
      credits.value = response.credits || []
    } catch (error: any) {
      showError('Operaciones', error?.message || 'No se pudo cargar el resumen.')
    } finally {
      if (current === lastRequest) loading.value = false
    }
  }

  return { from, to, summary, credits, loading, rangeLabel, cards, load }
}
