import { CotizacionProveedorService } from "~/services/cotizacion-proveedorService"
import type { CotizacionProveedor, ProveedoresResponse } from "~/types/cargaconsolidada/proveedores"
import type { FileItem } from "~/types/commons/file"
import type { FilterConfig, PaginationInfo } from "~/types/data-table"

export const useCotizacionProveedor = () => {
    const cotizacionProveedor = ref<CotizacionProveedor[]>([

    ])
    const loading = ref(false)
    const loadingInspeccion = ref(false)
    const loadingNotas = ref(false)
    const loadingDocumentos = ref(false)
    const error = ref<string | null>(null)
    const filterConfig = ref<FilterConfig[]>([
        {
            key: 'estado_china',
            label: 'Estado China',
            placeholder: 'Seleccionar estado',
            options: [
                {
                    label: 'Todos',
                    value: 'Todos'
                },
                {
                    label: 'NC',
                    value: 'NC'
                }, {
                    label: 'C',
                    value: 'C'
                }, {
                    label: 'R',
                    value: 'R'
                }, {
                    label: 'INSPECTION',
                    value: 'INSPECTION'
                }, {
                    label: 'LOADED',
                    value: 'LOADED' 
                }, {
                    label: 'NO LOADED',
                    value: 'NO LOADED'
                }
            ]
        }
    ])
    const pagination = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    })
    const search = ref('')
    const itemsPerPage = ref(10)
    const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
    const totalRecords = computed(() => pagination.value.total)
    const currentPage = computed(() => pagination.value.current_page)
    const filters = ref<FilterConfig[]>([])
    const documentosChina = ref<FileItem[]>([])
    const inspeccionChina = ref<FileItem[]>([])
    const notasChina = ref<string>('')
    const getCotizacionProveedor = async (id: number) => {
        loading.value = true
        try {
            const response = await CotizacionProveedorService.getCotizacionesProveedores(id)
            cotizacionProveedor.value = response.data
            filters.value = response.filters
        } catch (error: any) {
            error.value = error.message
        } finally {
            loading.value = false
        }
    }
    const getDocumentosChina = async (id: number) => {
        loadingDocumentos.value = true
        try {
            const response = await CotizacionProveedorService.getDocumentosChina(id)
            documentosChina.value = response.data
        } catch (error: any) {
            error.value = error.message
        } finally {
            loadingDocumentos.value = false
        }
    }
    const handleSearch = (value: string) => {
        search.value = value
    }
    const handlePageChange = (value: number) => {
        pagination.value.current_page = value
    }
    const handleItemsPerPageChange = (value: number) => {
        itemsPerPage.value = value
    }
    const handleFilterChange = (filterType: string, value: string) => {
        filters.value = filters.value.map(filter => filter.key === filterType ? { ...filter, value } : filter)
    }
    const getInspeccionChina = async (id: number) => {
        loadingInspeccion.value = true
        try {
            const response = await CotizacionProveedorService.getInspeccionChina(id)
            inspeccionChina.value = response.data
        } catch (error: any) {
            error.value = error.message
        } finally {
            loadingNotas.value = false
        }
    }
    const getNotasChina = async (id: number) => {
        loadingNotas.value = true
        try {
            const response = await CotizacionProveedorService.getNotasChina(id)
            notasChina.value = response.data.nota
        } catch (error: any) {
            error.value = error.message
        } finally {
            loadingNotas.value = false
        }
    }

    return {
        cotizacionProveedor,
        loading,
        error,
        getCotizacionProveedor,
        filterConfig,
        pagination,
        search,
        itemsPerPage,
        totalPages,
        totalRecords,
        currentPage,
        getDocumentosChina,
        documentosChina,
        handleSearch,
        handlePageChange,
        handleItemsPerPageChange,
        handleFilterChange,
        getInspeccionChina,
        inspeccionChina,
        getNotasChina,
        notasChina,
        loadingInspeccion,
        loadingNotas,
        loadingDocumentos
    }
}