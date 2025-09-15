import { ref } from 'vue'
import type { PaginationInfo } from '~/types/data-table'
import { PagosService } from '~/services/cargaconsolidada/clientes/pagosService'
import type { Pagos } from '~/types/cargaconsolidada/clientes/pagos'
import { useRoute } from '#app'
import { useSpinner } from '../composables/commons/useSpinner'
const { withSpinner } = useSpinner()
export const usePagos = () => {
    const route = useRoute()
    const id = route.params.id
    const clientesPagos = ref<Pagos[]>([])
    const loadingPagos = ref(false)
    const error = ref<string | null>(null)
    const paginationPagos = ref<PaginationInfo>({
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 0,
        from: 0,
        to: 0
    })
    const searchPagos = ref('')
    const itemsPerPagePagos = ref(100)
    const totalPagesPagos = computed(() => Math.ceil(paginationPagos.value.total / itemsPerPagePagos.value))
    const totalRecordsPagos = computed(() => paginationPagos.value.total)
    const currentPagePagos = computed(() => paginationPagos.value.current_page)
    const filtersPagos = ref<any>({})
    const filterConfig = ref<any>({
    })
    const handlePagePagosChange = (page: number) => {
        paginationPagos.value.current_page = page
        getClientesPagos(Number(id))
    }
    const handleItemsPerPageChangePagos = (itemsPerPage: number) => {
        itemsPerPagePagos.value = itemsPerPage
        getClientesPagos(Number(id))
    }
    const handleFilterChangePagos = (filter: any) => {
        filtersPagos.value = filter
        getClientesPagos(Number(id))
    }
    const handleSearchPagos = (search: string) => {
        searchPagos.value = search
        getClientesPagos(Number(id))
    }
    const getClientesPagos = async (idConsolidado: number) => {
        try {
            loadingPagos.value = true
            const response = await PagosService.getClientes(idConsolidado,
                filtersPagos.value,
                searchPagos.value,
                itemsPerPagePagos.value,
                currentPagePagos.value
            )
            clientesPagos.value = response.data
            paginationPagos.value = response.pagination
        } catch (err) {
            error.value = err as string
        } finally {
            loadingPagos.value = false
        }
    }
    const registrarPago = async (formData: FormData) => {
        try{
            const response = await PagosService.registrarPago(formData)
            return response
        }catch(err){
            error.value = err as string
        }finally{
            loadingPagos.value = false
        }
    }
    const deletePago = async (pagoId: number) => {
        try{
            const response = await PagosService.deletePago(pagoId)
            return response
        }catch(err){
            error.value = err as string
        }
    }

    const exportData = async () => {
        error.value = null
        try {
            await withSpinner(async () => {
                const pagosId = id ?? Number(route.params.id)
                if (!pagosId) throw new Error('ID de pagos inválido para exportar')
                const blob = await PagosService.exportPagosClientes(pagosId)
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `clientes_pagos_${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            })
        } catch (err) {
            error.value = err as string
        }
    }

    return {
        clientesPagos,
        loadingPagos,
        error,
        paginationPagos,
        searchPagos,
        itemsPerPagePagos,
        totalPagesPagos,
        currentPagePagos,
        filtersPagos,
        filterConfig,
        getClientesPagos,
        totalRecordsPagos,
        handlePagePagosChange,
        handleItemsPerPageChangePagos,
        handleFilterChangePagos,
        handleSearchPagos,
        registrarPago,
        deletePago,
        exportData
    }
}   