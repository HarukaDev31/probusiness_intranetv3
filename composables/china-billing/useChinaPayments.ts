import { computed, ref } from 'vue'
import { CHINA_STATUS, CHINA_STATUS_DOT, CHINA_STATUS_LABEL } from '~/constants/chinaBilling'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaCounts, ChinaPagination, ChinaPayment } from '~/types/china-billing'

/** Cobros registrados (PG-####) vistos por Almacén China. */
export function useChinaPayments() {
  const { showError } = useModal()
  const status = ref<string>(CHINA_STATUS.ALL)
  const search = ref('')
  const from = ref('')
  const to = ref('')
  const rows = ref<ChinaPayment[]>([])
  const counts = ref<ChinaCounts>({})
  const pagination = ref<ChinaPagination>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const loading = ref(false)
  let lastRequest = 0

  const states = computed(() => [CHINA_STATUS.ALL, CHINA_STATUS.TO_CONFIRM, CHINA_STATUS.CONFIRMED, CHINA_STATUS.IN_CASH].map((key) => ({
    key,
    label: key === CHINA_STATUS.ALL ? 'Todos los estados' : CHINA_STATUS_LABEL[key],
    count: counts.value[key] ?? 0,
    dot: CHINA_STATUS_DOT[key]
  })))

  async function load() {
    const current = ++lastRequest
    loading.value = true
    try {
      const response = await ChinaBillingService.listPayments({
        status: status.value,
        search: search.value.trim(),
        from: from.value,
        to: to.value,
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      })
      if (current !== lastRequest) return
      rows.value = response.data || []
      counts.value = response.counts || {}
      if (response.pagination) pagination.value = response.pagination
    } catch (error: any) {
      showError('Cobros', error?.message || 'No se pudo cargar la lista.')
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

  return { status, search, from, to, rows, counts, pagination, loading, states, load, reload, changeStatus }
}
