import { ref } from 'vue'
import { GeneralService } from '~/services/cargaconsolidada/cotizacion-final/generalService'
import type { PaginationInfo } from '~/types/data-table'

export const useGeneral = () => {
    const general = ref<any[]>([])
    const loadingGeneral = ref(false)
    const error = ref<string | null>(null)
    const paginationGeneral = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    })
    const searchGeneral = ref('')
    const itemsPerPageGeneral = ref(10)
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
    const getGeneral = async (id: number) => {
        try {
            loadingGeneral.value = true
            const response = await GeneralService.getGeneral(id)
            general.value = response.data
            paginationGeneral.value = response.pagination
        } catch (err) {
            error.value = err as string
        } finally {
            loadingGeneral.value = false
        }
    }
    const updateEstadoCotizacionFinal = async (idCotizacion: number, estado: string) => {
        try {
            const response = await GeneralService.updateEstadoCotizacionFinal(idCotizacion, estado)
            return response
        } catch (err) {
            error.value = err as string
        }
    }
    const uploadFacturaComercial = async (data: any) => {
        try {
            const response = await GeneralService.uploadFacturaComercial(data)
            return response
        } catch (err) {
            error.value = err as string
        }
    }
    const uploadPlantillaFinal = async (data: any) => {
        try {
            const response = await GeneralService.uploadPlantillaFinal(data)
            return response
        } catch (err) {
            error.value = err as string
        }
    }
    const downloadPlantillaGeneral = async (idContenedor: number) => {
        try {
            const response = await GeneralService.downloadPlantillaGeneral(idContenedor)
            const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `plantilla_general_${idContenedor}.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            return { success: true }
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
        updateEstadoCotizacionFinal,
        uploadFacturaComercial,
        uploadPlantillaFinal,
        downloadPlantillaGeneral    
    }
}   