import { ref, computed } from 'vue'
import { GeneralService, type SolicitarDocumentosRequest, type SolicitarDocumentosResponse, type GetProveedoresItemsResponse, type ProveedorItem, type GetProveedoresPendingDocumentsResponse, type EnviarRecordatoriosRequest, type EnviarRecordatoriosResponse } from '~/services/cargaconsolidada/clientes/generalService'
import type { Header, PaginationInfo } from '~/types/data-table'
import { useRoute } from '#app'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'

const { withSpinner } = useSpinner()

export const useGeneral = () => {
    const { currentRole } = useUserRole()
    const headers = ref<Header[]>([])
    const carga = ref<string | null>(null)
    const route = useRoute()
    const id = route.params.id
    const clientes = ref<any[]>([])
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
    const loadingHeaders = ref(false)
    const fecha_documentacion_max = ref<string | null>(null)
    const searchGeneral = ref('')
    const itemsPerPageGeneral = ref(100)
    const totalPagesGeneral = computed(() => Math.ceil(paginationGeneral.value.total / itemsPerPageGeneral.value))
    const totalRecordsGeneral = computed(() => paginationGeneral.value.total)
    const currentPageGeneral = computed(() => paginationGeneral.value.current_page)
    const filtersGeneral = ref<any>({})
    const handlePageGeneralChange = (page: number) => {
        paginationGeneral.value.current_page = page
        getClientes(Number(id))
    }
    const handleItemsPerPageChangeGeneral = (itemsPerPage: number) => {
        itemsPerPageGeneral.value = itemsPerPage
        getClientes(Number(id))
    }
    const handleFilterChangeGeneral = (filter: any) => {
        filtersGeneral.value = filter
        getClientes(Number(id))
    }
    const handleSearchGeneral = (search: string) => {
        searchGeneral.value = search
        getClientes(Number(id))
    }
    const getClientes = async (id: number) => {
        try {
            loadingGeneral.value = true
            const response = await GeneralService.getClientes(id,
                filtersGeneral.value,
                searchGeneral.value,
                itemsPerPageGeneral.value,
                currentPageGeneral.value,
                currentRole.value
            )
            clientes.value = response.data
            paginationGeneral.value = response.pagination
        } catch (err) {
            error.value = err as string
        } finally {
            loadingGeneral.value = false
        }
    }
    const updateEstadoCliente = async (data: any) => {
        try {
            const response = await GeneralService.updateEstadoCliente(data)
            return response
        } catch (err) {
            error.value = err as string
        }
    }
    const getHeaders = async (id: number) => {
        try {
            loadingHeaders.value = true
            const response = await GeneralService.getHeaders(id)
            // Ensure headers is always an array: backend may return an object or an array
            headers.value = Array.isArray(response.data) ? response.data : Object.values(response.data)
            carga.value = response.carga
            // Fecha máxima de documentación (puede venir en la raíz o en data)
            const respAny: any = response
            fecha_documentacion_max.value = respAny.fecha_documentacion_max ?? respAny.data?.fecha_documentacion_max ?? null
        } catch (err) {
            error.value = err as string
        } finally {
            loadingHeaders.value = false
        }
    }
    const handleUpdateStatusClienteDoc = async (data: any) => {
        try {
            const response = await GeneralService.updateStatusClienteDoc(data)
            return response
        } catch (err) {
            error.value = err as string
        }
    }
    const exportData = async (id?: number) => {
            loadingGeneral.value = true
            error.value = null
            try {
                await withSpinner(async () => {
                    const generalId = id ?? Number(route.params.id)
                    if (!generalId) throw new Error('ID de contenedor inválido para exportar')
                    const blob = await GeneralService.exportClientes(generalId)
                    const cargaid = await GeneralService.getHeaders(generalId)
                    carga.value = cargaid.carga // Asignar el valor correcto de tipo string
                    //crear archivo y descargarlo
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `clientes_#${carga.value}_${new Date().toISOString().split('T')[0]}.xlsx`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                }, 'Exportando clientes...')
                return { success: true }
            } catch (error: any) {
                error.value = error.message || 'Error al exportar clientes'
                return { success: false, error: error.message }
            } finally {
                loadingGeneral.value = false
            }
        }
    
    /**
     * Método para obtener proveedores y sus items para categorización
     * @param idCotizacion - ID de la cotización
     * @returns Response con lista de proveedores e items
     */
    const getProveedoresItems = async (idCotizacion: number): Promise<GetProveedoresItemsResponse> => {
        try {
            loadingGeneral.value = true
            const response = await GeneralService.getProveedoresItems(idCotizacion)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al obtener proveedores e items'
            return { success: false, data: [], message: error.value }
        } finally {
            loadingGeneral.value = false
        }
    }

    /**
     * Método para solicitar documentos/categorización con selección de tipo de producto
     * @param idCotizacion - ID de la cotización
     * @param data - Datos con lista de proveedores y sus items con tipo_producto_seleccionado
     * @returns Response del servicio
     */
    const solicitarDocumentos = async (idCotizacion: number, data: SolicitarDocumentosRequest,validate_max_date:boolean): Promise<SolicitarDocumentosResponse> => {
        try {
            loadingGeneral.value = true
            const response = await GeneralService.solicitarDocumentos(idCotizacion, data,validate_max_date)
            return response
        } catch (err: any) {
            console.log(err)
            error.value = err || 'Error al solicitar documentos'
            throw err
        } finally {
            loadingGeneral.value = false
        }
    }
    const getProveedoresPendingDocuments = async (idCotizacion: number): Promise<GetProveedoresPendingDocumentsResponse> => {
        try {
            loadingGeneral.value = true
            const response = await GeneralService.getProveedoresPendingDocuments(idCotizacion)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al obtener proveedores pendientes de documentos'
            return { success: false, data: [], message: error.value }
        } finally {
            loadingGeneral.value = false
        }
    }

    /**
     * Enviar recordatorios de documentos por proveedor
     */
    const enviarRecordatorios = async (data: EnviarRecordatoriosRequest): Promise<EnviarRecordatoriosResponse> => {
        try {
            loadingGeneral.value = true
            const response = await GeneralService.enviarRecordatorios(data)
            return response
        } catch (err: any) {
            error.value = err.message || 'Error al enviar recordatorios'
            return { success: false, message: error.value }
        } finally {
            loadingGeneral.value = false
        }
    }

    return {
        clientes,
        loadingGeneral,
        error,
        paginationGeneral,
        searchGeneral,
        itemsPerPageGeneral,
        totalPagesGeneral,
        currentPageGeneral,
        filtersGeneral,
        getClientes,
        totalRecordsGeneral,
        updateEstadoCliente,
        handlePageGeneralChange,
        handleItemsPerPageChangeGeneral,
        handleFilterChangeGeneral,
        handleSearchGeneral,
        getHeaders,
        headers,
        carga,
        fecha_documentacion_max,
        loadingHeaders,
        handleUpdateStatusClienteDoc,
        exportData,
        getProveedoresItems,
        solicitarDocumentos,
        getProveedoresPendingDocuments,
        enviarRecordatorios
    }
}   