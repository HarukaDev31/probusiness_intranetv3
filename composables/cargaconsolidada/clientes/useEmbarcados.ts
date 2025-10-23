import { ref, computed } from 'vue'
import type { Header, PaginationInfo } from '~/types/data-table'
import { useRoute } from '#app'
import { useSpinner } from '~/composables/commons/useSpinner'
import { EmbarcadosService } from '~/services/cargaconsolidada/clientes/embarcadosService'

const { withSpinner } = useSpinner()

export const useEmbarcados = () => {
    const headersEmbarcados = ref<Header[]>([])
    const cargaEmbarcados = ref<string | null>(null)
    const route = useRoute()
    const id = route.params.id
    const clientesEmbarcados = ref<any[]>([])
    const loadingEmbarcados = ref(false)
    const errorEmbarcados = ref<string | null>(null)
    const paginationEmbarcados = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 0,
        from: 0,
        to: 0
    })
    const loadingHeaders = ref(false)
    const searchEmbarcados = ref('')
    const itemsPerPageEmbarcados = ref(100)
    const totalPagesEmbarcados = computed(() => Math.ceil(paginationEmbarcados.value.total / itemsPerPageEmbarcados.value))
    const totalRecordsEmbarcados = computed(() => paginationEmbarcados.value.total)
    const currentPageEmbarcados = computed(() => paginationEmbarcados.value.current_page)
    const filtersEmbarcados = ref<any>({})
    const handlePageEmbarcadosChange = (page: number) => {
        paginationEmbarcados.value.current_page = page
        getEmbarcados(Number(id))
    }
    const handleItemsPerPageChangeEmbarcados = (itemsPerPage: number) => {
        itemsPerPageEmbarcados.value = itemsPerPage
        getEmbarcados(Number(id))
    }
    const handleFilterChangeEmbarcados = (filter: any) => {
        filtersEmbarcados.value = filter
        getEmbarcados(Number(id))
    }
    const handleSearchEmbarcados = (search: string) => {
        searchEmbarcados.value = search
        getEmbarcados(Number(id))
    }
    const getEmbarcados = async (id: number) => {
        try {
            loadingEmbarcados.value = true
            const response = await EmbarcadosService.getEmbarcados(id,
                filtersEmbarcados.value,
                searchEmbarcados.value,
                itemsPerPageEmbarcados.value,
                currentPageEmbarcados.value
            )

            // normalize payload: some endpoints return { data: [...], pagination: {...} }
            // others return the array directly. Be defensive and avoid setting
            // pagination to undefined (which breaks computed getters).
            const respData = response?.data ?? response
            const items = Array.isArray(respData) ? respData : (respData?.data ?? respData ?? [])

            clientesEmbarcados.value = items

            // Only overwrite pagination when the backend actually provides it
            if (response?.pagination) {
                paginationEmbarcados.value = response.pagination
            } else if (respData?.pagination) {
                paginationEmbarcados.value = respData.pagination
            }
        } catch (error) {
            errorEmbarcados.value = error as string
        } finally {
            loadingEmbarcados.value = false
        }
    }
    const getHeadersEmbarcados = async (id: number) => {
        try {
            loadingHeaders.value = true
            const response = await EmbarcadosService.getHeaders(id)
            // response may be either an array of headers or an object { data, carga }
            headersEmbarcados.value = Array.isArray(response) ? response : (response as any).data ?? []
            // safely read carga if present on the response object
            cargaEmbarcados.value = (response as any).carga ?? null
        } catch (error) {
            errorEmbarcados.value = String(error)
        } finally {
            loadingHeaders.value = false
        }
    }
    return {
        clientesEmbarcados,
        loadingEmbarcados,
        errorEmbarcados,
        paginationEmbarcados,
        searchEmbarcados,
        itemsPerPageEmbarcados,
        totalPagesEmbarcados,
        currentPageEmbarcados,
        filtersEmbarcados,
        getEmbarcados,
        totalRecordsEmbarcados,
        handlePageEmbarcadosChange,
        handleItemsPerPageChangeEmbarcados,
        handleFilterChangeEmbarcados,
        handleSearchEmbarcados,
        headersEmbarcados,
        cargaEmbarcados,
        loadingHeaders,
        getHeadersEmbarcados
    }
}
