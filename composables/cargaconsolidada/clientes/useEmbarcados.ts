import { ref, computed } from 'vue'
import type { Header, PaginationInfo } from '~/types/data-table'
import { useRoute } from '#app'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { EmbarcadosService } from '~/services/cargaconsolidada/clientes/embarcadosService'

const { withSpinner } = useSpinner()
const { showConfirmation, showSuccess, showError } = useModal()

export const useEmbarcados = (opts?: {
    refresh?: (id: number) => Promise<void>
    clientsRef?: { value: any[] }
}) => {
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
    const clientsRef = opts?.clientsRef ?? clientesEmbarcados

    const findCliente = (id_cotizacion: number) => {
        return clientsRef.value?.find((c: any) => Number(c.id_cotizacion) === Number(id_cotizacion) || Number(c.id) === Number(id_cotizacion))
    }

    const getFirstUrl = (cliente: any, keys: string[]) => {
        if (!cliente) return null
        const provs = cliente.proveedores ?? []
        for (const p of provs) {
            for (const k of keys) {
                if (p && p[k]) return p[k]
            }
        }
        for (const k of keys) {
            if (cliente[k]) return cliente[k]
        }
        return null
    }

    const handleDownloadFacturaComercial = async (id_cotizacion: number) => {
        try {
            const cliente = findCliente(id_cotizacion)
            const url = getFirstUrl(cliente, ['factura_comercial', 'factura', 'factura_comercial_url'])
            if (url) { window.open(url, '_blank'); return }
            showError('Archivo no disponible', 'No se encontró la factura comercial para este cliente.')
        } catch (err) {
            console.error('handleDownloadFacturaComercial', err)
            showError('Error', 'No se pudo descargar la factura comercial')
        }
    }

    const deleteFacturaComercial = async (idProveedor: number) => {
        try {
            await showConfirmation(
                'Confirmar eliminación',
                '¿Está seguro que desea eliminar la factura comercial?',
                async () => {
                    await withSpinner(async () => {
                        await EmbarcadosService.deleteFacturaComercial(Number(idProveedor))
                        await getEmbarcados(Number(route.params.id))
                        showSuccess('Eliminado', 'Factura comercial eliminada correctamente')
                    }, 'Eliminando factura...')
                }
            )
        } catch (err) {
            console.error('deleteFacturaComercial', err)
            showError('Error', 'No se pudo eliminar la factura comercial')
        }
    }

    const handleUploadFacturaComercial = async (idProveedor: number) => {
        try {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.pdf,.jpg,.png'
            input.onchange = async (e: Event) => {
                const target = e.target as HTMLInputElement
                const file = target.files && target.files[0]
                if (!file) return
                try {
                    await withSpinner(async () => {
                        const res = await EmbarcadosService.uploadFacturaComercial(Number(idProveedor), file)
                        if (res && (res.status === 'success' || res.url)) {
                            await getEmbarcados(Number(route.params.id))
                            showSuccess('Subida Exitosa', res.message || 'Factura comercial subida correctamente')
                        } else {
                            showError('Error', res?.message || 'No se pudo subir la factura comercial')
                        }
                    }, 'Subiendo factura...')
                } catch (err) {
                    console.error('handleUploadFacturaComercial', err)
                    showError('Error', 'No se pudo subir la factura comercial')
                }
            }
            input.click()
        } catch (err) {
            console.error('handleUploadFacturaComercial', err)
            showError('Error', 'No se pudo subir la factura comercial')
        }
    }

    const handleDownloadPackingList = async (id_cotizacion: number) => {
        try {
            const cliente = findCliente(id_cotizacion)
            const url = getFirstUrl(cliente, ['packing_list', 'packinglist', 'packing_list_url'])
            if (url) { window.open(url, '_blank'); return }
            showError('Archivo no disponible', 'No se encontró el packing list para este cliente.')
        } catch (err) {
            console.error('handleDownloadPackingList', err)
            showError('Error', 'No se pudo descargar el packing list')
        }
    }

    const deletePackingList = async (idProveedor: number) => {
        try {
            await showConfirmation(
                'Confirmar eliminación',
                '¿Está seguro que desea eliminar el packing list?',
                async () => {
                    await withSpinner(async () => {
                        await EmbarcadosService.deletePackingList(Number(idProveedor))
                        await getEmbarcados(Number(route.params.id))
                        showSuccess('Eliminado', 'Packing list eliminado correctamente')
                    }, 'Eliminando packing list...')
                }
            )
        } catch (err) {
            console.error('deletePackingList', err)
            showError('Error', 'No se pudo eliminar el packing list')
        }
    }

    const handleUploadPackingList = async (idProveedor: number) => {
        try {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.pdf,.xlsx'
            input.onchange = async (e: Event) => {
                const target = e.target as HTMLInputElement
                const file = target.files && target.files[0]
                if (!file) return
                try {
                    await withSpinner(async () => {
                        const res = await EmbarcadosService.uploadPackingList(Number(idProveedor), file)
                        if (res && (res.status === 'success' || res.url)) {
                            await getEmbarcados(Number(route.params.id))
                            showSuccess('Subida Exitosa', res.message || 'Packing list subido correctamente')
                        } else {
                            showError('Error', res?.message || 'No se pudo subir el packing list')
                        }
                    }, 'Subiendo packing list...')
                } catch (err) {
                    console.error('handleUploadPackingList', err)
                    showError('Error', 'No se pudo subir el packing list')
                }
            }
            input.click()
        } catch (err) {
            console.error('handleUploadPackingList', err)
            showError('Error', 'No se pudo subir el packing list')
        }
    }

    const deleteExcelConfirmacion = async (idProveedor: number) => {
        try {
            await showConfirmation(
                'Confirmar eliminación',
                '¿Está seguro que desea eliminar el Excel de confirmación?',
                async () => {
                    await withSpinner(async () => {
                        await EmbarcadosService.deleteExcelConfirmacion(Number(idProveedor))
                        await getEmbarcados(Number(route.params.id))
                        showSuccess('Eliminado', 'Excel de confirmación eliminado correctamente')
                    }, 'Eliminando excel...')
                }
            )
        } catch (err) {
            console.error('deleteExcelConfirmacion', err)
            showError('Error', 'No se pudo eliminar el Excel de confirmación')
        }
    }

    const handleUploadExcelConfirmacion = async (idProveedor: number) => {
        try {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.xlsx,.xls'
            input.onchange = async (e: Event) => {
                const target = e.target as HTMLInputElement
                const file = target.files && target.files[0]
                if (!file) return
                try {
                    await withSpinner(async () => {
                        const res = await EmbarcadosService.uploadExcelConfirmacion(Number(idProveedor), file)
                        if (res && (res.status === 'success' || res.url)) {
                            await getEmbarcados(Number(route.params.id))
                            showSuccess('Subida Exitosa', res.message || 'Excel subido correctamente')
                        } else {
                            showError('Error', res?.message || 'No se pudo subir el excel')
                        }
                    }, 'Subiendo excel...')
                } catch (err) {
                    console.error('handleUploadExcelConfirmacion', err)
                    showError('Error', 'No se pudo subir el Excel de confirmación')
                }
            }
            input.click()
        } catch (err) {
            console.error('handleUploadExcelConfirmacion', err)
            showError('Error', 'No se pudo subir el Excel de confirmación')
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
        getHeadersEmbarcados,
        findCliente,
        getFirstUrl,
        handleDownloadFacturaComercial,
        deleteFacturaComercial,
        handleUploadFacturaComercial,
        handleDownloadPackingList,
        deletePackingList,
        handleUploadPackingList,
        deleteExcelConfirmacion,
        handleUploadExcelConfirmacion
    }
}
