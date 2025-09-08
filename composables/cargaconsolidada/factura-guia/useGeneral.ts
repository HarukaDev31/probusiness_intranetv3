import { ref } from 'vue'
import type { PaginationInfo } from '~/types/data-table'
import { GeneralService } from '~/services/cargaconsolidada/factura-guia/generalService'
import type { General } from '~/types/cargaconsolidada/factura-guia/general'

export const useGeneral  = () => {
    const general = ref<General[]>([])
    const loadingGeneral = ref(false)
    const error = ref<string | null>(null)
    const paginationGeneral = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 0,
        from: 0,
        to: 0
    })
    const searchGeneral = ref('')
    const itemsPerPageGeneral = ref(100)
    const totalPagesGeneral = computed(() => Math.ceil(paginationGeneral.value.total / itemsPerPageGeneral.value))
    const totalRecordsGeneral = computed(() => paginationGeneral.value.total)
    const currentPageGeneral = computed(() => paginationGeneral.value.current_page)
    const filtersGeneral = ref<any>({})
    const filterConfigGeneral = ref<any>([

        {
            key: 'estado_cotizacion_final',
            label: 'Estado de cotización',
            placeholder: 'Seleccionar estado de cotización',
            options: [
                { label: 'Todos', value: 'todos' },
                { label: 'PENDIENTE', value: 'PENDIENTE' },
                { label: 'COTIZADO', value: 'COTIZADO' },
                { label: 'PAGADO', value: 'PAGADO' },
                { label: 'AJUSTADO', value: 'AJUSTADO' },
                { label: 'SOBREPAGO', value: 'SOBREPAGO' },
            ]
        }
    ])
    const headers = ref<any[]>([])
    const carga = ref<string | null>(null)
    const loadingHeaders = ref(false)
    const getGeneral = async (id: number) => {
        try {
            loadingGeneral.value = true
            const params = {
                page: currentPageGeneral.value,
                per_page: itemsPerPageGeneral.value,
                search: searchGeneral.value,
                filters: filtersGeneral.value
            }
            const response = await GeneralService.getGeneral(id, params)
            general.value = response.data
            paginationGeneral.value = response.pagination
        } catch (err) {
            error.value = err as string
        } finally {
            loadingGeneral.value = false
        }
    }
    const getHeaders = async (id: number) => {
        try {
            loadingHeaders.value = true
            const response = await GeneralService.getHeaders(id)
            headers.value = response.data
            carga.value = response.carga
            loadingHeaders.value = false
        } catch (err) {
            loadingHeaders.value = false
            error.value = err as string
        }
    }
    const uploadFacturaComercial = async (data: any) => {
        try {
            const formData = new FormData()
            formData.append('file', data.file)
            formData.append('idCotizacion', data.idCotizacion)
            const response = await GeneralService.uploadFacturaComercial(formData)
            return response
        } catch (err) {
            error.value = err as string
        }
    }
    const uploadGuiaRemision = async (data: any) => {
        try {
            const formData = new FormData()
            formData.append('file', data.file)
            formData.append('idCotizacion', data.idCotizacion)
            const response = await GeneralService.uploadGuiaRemision(formData)
            return response
        } catch (err) {
            error.value = err as string
        }
    }

    return {
        general,
        loadingGeneral,
        error,
        paginationGeneral,
        searchGeneral,
        itemsPerPageGeneral,
        totalPagesGeneral,
        currentPageGeneral,
        filtersGeneral,
        filterConfigGeneral,
        getGeneral,
        totalRecordsGeneral,
        uploadFacturaComercial,
        uploadGuiaRemision,
        headers,
        carga,
        loadingHeaders,
        getHeaders
    }
}   