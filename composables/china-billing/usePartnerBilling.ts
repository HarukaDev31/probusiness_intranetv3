import { computed, ref } from 'vue'
import { PARTNER_INVOICE_FILTER } from '~/constants/chinaBilling'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaCounts, ChinaOperation, ChinaPagination, ChinaPayment, ChinaSummary } from '~/types/china-billing'

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`

const emptySummary = (): ChinaSummary => ({
  operations_count: 0, services_amount: 0, receivable: 0, cashed_usd: 0, cashed_rmb: 0,
  total_billed: 0, paid: 0, in_confirmation: 0, balance_due: 0, credit_balance: 0
})

/** Vista del socio: sus facturas, sus pagos y los 5 indicadores (calculados en backend). */
export function usePartnerBilling() {
  const { showError } = useModal()
  const filter = ref<string>(PARTNER_INVOICE_FILTER.ALL)
  const invoices = ref<ChinaOperation[]>([])
  const payments = ref<ChinaPayment[]>([])
  const counts = ref<ChinaCounts>({})
  const summary = ref<ChinaSummary>(emptySummary())
  const invoicePagination = ref<ChinaPagination>({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
  const paymentPagination = ref<ChinaPagination>({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
  const loading = ref(false)

  const cards = computed(() => [
    { label: 'Total facturado', value: usd(summary.value.total_billed), sub: plural(counts.value.all ?? 0, 'consolidado cerrado', 'consolidados cerrados'), tone: '' },
    { label: 'Pagado', value: usd(summary.value.paid), sub: 'Confirmado por Pro Business', tone: 'text-success' },
    { label: 'En confirmación', value: usd(summary.value.in_confirmation), sub: 'Pagos enviados por confirmar', tone: 'text-info' },
    { label: 'Saldo por pagar', value: usd(summary.value.balance_due), sub: plural(counts.value.due ?? 0, 'factura pendiente', 'facturas pendientes'), tone: 'text-error' },
    {
      label: 'Saldo a favor',
      value: usd(summary.value.credit_balance),
      sub: summary.value.credit_balance > 0 ? 'Se aplicará en tu próxima factura' : '',
      tone: 'text-success'
    }
  ])

  const filters = computed(() => [
    { key: PARTNER_INVOICE_FILTER.ALL, label: 'Todas' },
    { key: PARTNER_INVOICE_FILTER.DUE, label: 'Por pagar' },
    { key: PARTNER_INVOICE_FILTER.TO_CONFIRM, label: 'Por confirmar' },
    { key: PARTNER_INVOICE_FILTER.PAID, label: 'Pagadas' }
  ].map((item) => ({ ...item, count: counts.value[item.key] ?? 0 })))

  async function loadInvoices() {
    loading.value = true
    try {
      const response = await ChinaBillingService.partnerInvoices({
        status: filter.value,
        page: invoicePagination.value.current_page,
        per_page: invoicePagination.value.per_page
      })
      invoices.value = response.data || []
      counts.value = response.counts || {}
      summary.value = { ...emptySummary(), ...response.summary }
      if (response.pagination) invoicePagination.value = response.pagination
    } catch (error: any) {
      showError('Pagos', error?.message || 'No se pudieron cargar las facturas.')
    } finally {
      loading.value = false
    }
  }

  async function loadPayments() {
    try {
      const response = await ChinaBillingService.partnerPayments({
        page: paymentPagination.value.current_page,
        per_page: paymentPagination.value.per_page
      })
      payments.value = response.data || []
      if (response.pagination) paymentPagination.value = response.pagination
    } catch (error: any) {
      showError('Pagos', error?.message || 'No se pudieron cargar tus pagos.')
    }
  }

  function loadAll() {
    return Promise.all([loadInvoices(), loadPayments()])
  }

  function changeFilter(key: string) {
    filter.value = key
    invoicePagination.value.current_page = 1
    return loadInvoices()
  }

  return {
    filter, invoices, payments, counts, summary, invoicePagination, paymentPagination, loading, cards, filters,
    loadInvoices, loadPayments, loadAll, changeFilter
  }
}
