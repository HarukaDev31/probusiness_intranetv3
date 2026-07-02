import { ref } from 'vue'
import { CargosExtraService } from '~/services/cargaconsolidada/cotizacion-final/cargosExtraService'
import type { PaginationInfo } from '~/types/data-table'

export const useCargosExtra = () => {
  const cargosExtra = ref<any[]>([])
  const loadingCargosExtra = ref(false)
  const errorCargosExtra = ref<string | null>(null)
  const paginationCargosExtra = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 100,
    total: 0,
    from: 0,
    to: 0
  })
  const searchCargosExtra = ref('')
  const route = useRoute()
  const id = route.params.id
  const itemsPerPageCargosExtra = ref(100)
  const totalPagesCargosExtra = computed(() => Math.ceil((paginationCargosExtra.value.total || 0) / itemsPerPageCargosExtra.value))
  const totalRecordsCargosExtra = computed(() => paginationCargosExtra.value.total || 0)
  const currentPageCargosExtra = computed(() => paginationCargosExtra.value.current_page || 1)

  const getCargosExtra = async (idContenedor: number) => {
    try {
      loadingCargosExtra.value = true
      const params = {
        page: currentPageCargosExtra.value,
        per_page: itemsPerPageCargosExtra.value,
        search: searchCargosExtra.value
      }
      const response = await CargosExtraService.getCargosExtra(idContenedor, params)
      cargosExtra.value = response?.data || []
      paginationCargosExtra.value = response?.pagination || paginationCargosExtra.value
    } catch (err: any) {
      errorCargosExtra.value = err?.message || String(err)
    } finally {
      loadingCargosExtra.value = false
    }
  }

  const handleSearchCargosExtra = (search: string) => {
    searchCargosExtra.value = search
    getCargosExtra(Number(id))
  }

  const handlePageChangeCargosExtra = (page: number) => {
    paginationCargosExtra.value.current_page = page
    getCargosExtra(Number(id))
  }

  const handleItemsPerPageChangeCargosExtra = (items: number) => {
    itemsPerPageCargosExtra.value = items
    paginationCargosExtra.value.current_page = 1
    getCargosExtra(Number(id))
  }

  return {
    cargosExtra,
    loadingCargosExtra,
    errorCargosExtra,
    paginationCargosExtra,
    searchCargosExtra,
    itemsPerPageCargosExtra,
    totalPagesCargosExtra,
    totalRecordsCargosExtra,
    currentPageCargosExtra,
    getCargosExtra,
    handleSearchCargosExtra,
    handlePageChangeCargosExtra,
    handleItemsPerPageChangeCargosExtra
  }
}
