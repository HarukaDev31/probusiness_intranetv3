import { computed, ref } from 'vue'
import { CHINA_STATUS, CHINA_STATUS_DOT, CHINA_STATUS_LABEL } from '~/constants/chinaBilling'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type {
  ChinaCounts, ChinaCredit, ChinaOperation, ChinaOrganizationOption, ChinaPagination, ChinaSummary
} from '~/types/china-billing'

const emptySummary = (): ChinaSummary => ({
  operations_count: 0, services_amount: 0, receivable: 0, income_usd: 0, income_rmb: 0,
  total_billed: 0, paid: 0, in_confirmation: 0, balance_due: 0, credit_balance: 0
})

/** Lista de operaciones de Almacén China. Todos los montos y estados vienen calculados del backend. */
export function useChinaOperations() {
  const { showError } = useModal()
  const status = ref<string>(CHINA_STATUS.ALL)
  const search = ref('')
  const countryId = ref('')
  const from = ref('')
  const to = ref('')
  const rows = ref<ChinaOperation[]>([])
  const counts = ref<ChinaCounts>({})
  const summary = ref<ChinaSummary>(emptySummary())
  const credits = ref<ChinaCredit[]>([])
  const organizations = ref<ChinaOrganizationOption[]>([])
  const pagination = ref<ChinaPagination>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const loading = ref(false)
  let lastRequest = 0

  const countries = computed(() => {
    const seen = new Map<number, string>()
    organizations.value.forEach((org) => {
      if (org.country_id) seen.set(org.country_id, org.country)
    })
    return [...seen].map(([value, label]) => ({ value: String(value), label }))
  })

  const states = computed(() => [
    CHINA_STATUS.ALL, CHINA_STATUS.DRAFT, CHINA_STATUS.PENDING, CHINA_STATUS.TO_CONFIRM, CHINA_STATUS.CONFIRMED, CHINA_STATUS.IN_CASH
  ].map((key) => ({
    key,
    label: key === CHINA_STATUS.ALL ? 'Todos los estados' : CHINA_STATUS_LABEL[key],
    count: counts.value[key] ?? 0,
    dot: CHINA_STATUS_DOT[key]
  })))

  async function load() {
    const current = ++lastRequest
    loading.value = true
    try {
      const response = await ChinaBillingService.listOperations({
        status: status.value,
        search: search.value.trim(),
        country_id: countryId.value,
        from: from.value,
        to: to.value,
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      })
      if (current !== lastRequest) return
      rows.value = response.data || []
      counts.value = response.counts || {}
      summary.value = { ...emptySummary(), ...response.summary }
      credits.value = response.credits || []
      organizations.value = response.organizations || []
      if (response.pagination) pagination.value = response.pagination
    } catch (error: any) {
      showError('Operaciones', error?.message || 'No se pudo cargar la lista.')
    } finally {
      if (current === lastRequest) loading.value = false
    }
  }

  function reload() {
    pagination.value.current_page = 1
    return load()
  }

  function changeStatus(key: string) {
    status.value = key
    return reload()
  }

  return {
    status, search, countryId, from, to, rows, counts, summary, credits, organizations, countries,
    pagination, loading, states, load, reload, changeStatus
  }
}
