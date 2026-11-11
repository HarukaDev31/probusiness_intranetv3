import { ref } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaClient, ChinaCounts, ChinaOrganizationOption, ChinaPagination } from '~/types/china-billing'

/** Clientes de Almacén China (socios e importadores). Totales y conteos vienen calculados del backend. */
export function useChinaClients() {
  const { showError } = useModal()
  const type = ref('all')
  const search = ref('')
  const rows = ref<ChinaClient[]>([])
  const counts = ref<ChinaCounts>({})
  const organizations = ref<ChinaOrganizationOption[]>([])
  const pagination = ref<ChinaPagination>({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const loading = ref(false)
  let lastRequest = 0

  async function load() {
    const current = ++lastRequest
    loading.value = true
    try {
      const response = await ChinaBillingService.listClients({
        type: type.value,
        search: search.value.trim(),
        page: pagination.value.current_page,
        per_page: pagination.value.per_page
      })
      if (current !== lastRequest) return
      rows.value = response.data || []
      counts.value = response.counts || {}
      organizations.value = response.organizations || []
      if (response.pagination) pagination.value = response.pagination
    } catch (error: any) {
      showError('Clientes', error?.message || 'No se pudo cargar la lista.')
    } finally {
      if (current === lastRequest) loading.value = false
    }
  }

  function reload() {
    pagination.value.current_page = 1
    return load()
  }

  function changeType(value: string) {
    type.value = value
    return reload()
  }

  return { type, search, rows, counts, organizations, pagination, loading, load, reload, changeType }
}
