    <!--3 tabs:general,variacion,pagos and 3 tables-->
    <template>
        <div class="p-0 md:p-6">
            <DataTable v-if="tab === 'general'" title="" icon="" :data="clientes" :columns="getColumnsGeneral()"
                :loading="loadingGeneral || loadingHeaders" :current-page="currentPageGeneral"
                :total-pages="totalPagesGeneral" :total-records="totalRecordsGeneral"
                :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral" :show-secondary-search="false"
                :show-filters="false" :filters-value="filtersGeneral"
                :show-export="(currentId == ID_JEFEVENTAS) ? true : false" :show-body-top="true"
                :show-pagination="false" @export="exportData"
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchGeneral" @page-change="handlePageGeneralChange"
                @items-per-page-change="handleItemsPerPageChangeGeneral" @filter-change="handleFilterChangeGeneral"
                :hide-back-button="false"
                :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole === ROLES.DOCUMENTACION || currentRole === ROLES.JEFE_IMPORTACIONES || currentRole == ROLES.ADMINISTRACION) ? `/cargaconsolidada/coordinacion/abiertos/pasos/${id}` : `/cargaconsolidada/coordinacion/abiertos`">
                <template #body-top>
                    <div class="flex items-center justify-between w-full gap-4">
                        <div class="flex flex-col gap-2 w-full">
                            <SectionHeader :title="`Clientes #${carga}`" :headers="headers"
                                :loading="loadingGeneral || loadingHeaders" />
                            <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                                <UTabs v-model="tab" :items="tabs" size="xs" variant="pill" class="mb-4 md:w-100 h-15"
                                    color="neutral" />

                            </div>
                        </div>
                    </div>
                </template>

            </DataTable>
            <DataTable v-if="tab === 'embarcados'" title="" icon="" :data="clientesEmbarcados"
                :columns="getColumnsEmbarcados()" :loading="loadingEmbarcados || loadingHeaders"
                :current-page="currentPageEmbarcados" :total-pages="totalPagesEmbarcados"
                :total-records="totalRecordsEmbarcados" :items-per-page="itemsPerPageEmbarcados"
                :search-query-value="searchEmbarcados" :show-secondary-search="false" :show-filters="false"
                :filters-value="filtersEmbarcados" :show-export="false" :show-body-top="true" :hide-back-button="false"
                :show-pagination="false" @export="exportData"
                :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole === ROLES.DOCUMENTACION || currentRole === ROLES.JEFE_IMPORTACIONES || currentRole == ROLES.ADMINISTRACION) ? `/cargaconsolidada/coordinacion/abiertos/pasos/${id}` : `/cargaconsolidada/coordinacion/abiertos`">
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchEmbarcados" @page-change="handlePageEmbarcadosChange"
                @items-per-page-change="handleItemsPerPageChangeEmbarcados"
                @filter-change="handleFilterChangeEmbarcados">
                <template #body-top>
                    <div class="flex items-center justify-between w-full gap-4">
                        <div class="flex flex-col gap-2 w-full">
                            <SectionHeader :title="`Clientes #${carga}`" :headers="headers"
                                :loading="loadingEmbarcados || loadingHeaders" />
                            <div class="flex justify-between">
                                <UTabs v-model="tab" :items="tabs" size="xs" variant="pill" class="md:mb-4 w-100 h-15"
                                    color="neutral" />
                                <div
                                    class="hidden md:flex flex-row items-center gap-2 bg-white dark:bg-gray-800 shadow-sm rounded p-3 mb-0 md:mb-4">
                                    <div class="flex flex-col mr-2 space-y-1">
                                        <div class="text-xs font-semibold text-orange-600">F. Max. Documentacion</div>
                                        <div class="flex items-center gap-2">
                                            <input type="date" v-model="fMaxDocumentacion"
                                                class="text-sm text-gray-700 dark:text-gray-400 bg-transparent outline-none" />
                                            <UButton size="xs" variant="outline" color="primary"
                                                icon="material-symbols:save-outline"
                                                @click="handleSaveFMaxDocumentacion" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
                <!-- Mobile: compact date control next to back button -->
                <template #back-extra>
                    <div class="bg-white dark:bg-gray-800 flex items-center gap-2 p-2 rounded shadow-sm md:hidden">
                        <div class="text-xs font-semibold text-orange-600">F. Max. Doc</div>
                        <input type="date" v-model="fMaxDocumentacion"
                            class="text-sm text-gray-700 dark:text-gray-400 bg-transparent outline-none border border-gray-200 dark:border-gray-700 rounded px-2 py-1 w-28" />
                        <UButton size="xs" variant="outline" color="primary" icon="material-symbols:save-outline"
                            aria-label="Guardar fecha" @click="handleSaveFMaxDocumentacion" />
                    </div>
                </template>
            </DataTable>
            <DataTable v-if="tab === 'variacion'" title="" icon="" :data="clientesVariacion" :columns="columnsVariacion"
                :loading="loadingVariacion || loadingHeaders" :current-page="currentPageVariacion"
                :total-pages="totalPagesVariacion" :total-records="totalRecordsVariacion"
                :items-per-page="itemsPerPageVariacion" :search-query-value="searchVariacion"
                :show-secondary-search="false" :show-filters="false" :filters-value="filtersVariacion"
                :show-export="false" :show-body-top="true" :hide-back-button="false" :show-pagination="false"
                @export="exportData"
                :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole === ROLES.DOCUMENTACION || currentRole === ROLES.JEFE_IMPORTACIONES) ? `/cargaconsolidada/coordinacion/abiertos/pasos/${id}` : `/cargaconsolidada/coordinacion/abiertos`"
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchVariacion" @page-change="handlePageVariacionChange"
                @items-per-page-change="handleItemsPerPageChangeVariacion" @filter-change="handleFilterChangeVariacion">
                <template #body-top>
                    <div class="flex items-center justify-between w-full gap-4">
                        <div class="flex flex-col gap-2 w-full">
                            <SectionHeader :title="`Clientes #${carga}`" :headers="headers"
                                :loading="loadingVariacion || loadingHeaders" />
                            <div class="flex justify-between">
                                <UTabs v-model="tab" :items="tabs" size="xs" variant="pill" class="md:mb-4 w-100 h-15"
                                    color="neutral" />

                            </div>
                        </div>
                    </div>
                </template>
            </DataTable>
            <DataTable v-if="tab === 'pagos'" title="" icon="" :data="clientesPagos" :columns="columnsPagos"
                :loading="loadingPagos || loadingHeaders" :current-page="currentPagePagos"
                :total-pages="totalPagesPagos" :total-records="totalRecordsPagos" :items-per-page="itemsPerPagePagos"
                :search-query-value="searchPagos" :show-secondary-search="false" :show-filters="false"
                :filters-value="filtersPagos" :show-export="false" :hide-back-button="false" :show-body-top="true"
                :show-pagination="false" @export="exportData"
                :previous-page-url="(currentRole == ROLES.COORDINACION || currentRole == ROLES.JEFE_IMPORTACIONES || currentId == ID_JEFEVENTAS) ? `/cargaconsolidada/coordinacion/abiertos/pasos/${id}` : `/cargaconsolidada/coordinacion/abiertos`"
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchPagos" @page-change="handlePagePagosChange"
                @items-per-page-change="handleItemsPerPageChangePagos" @filter-change="handleFilterChangePagos">
                <template #body-top>
                    <div class="flex items-center justify-between w-full gap-4">
                        <div class="flex flex-col gap-2 w-full">
                            <SectionHeader :title="`Clientes #${carga}`" :headers="headers"
                                :loading="loadingPagos || loadingHeaders" />
                            <div class="flex justify-between">
                                <UTabs v-model="tab" :items="tabs" size="xs" variant="pill" class="md:mb-4 w-100 h-15"
                                    color="neutral" />

                            </div>
                        </div>
                    </div>
                </template>
            </DataTable>
        </div>
    </template>
<script setup lang="ts">
import { ref, h, computed } from 'vue'
import ModalAcciones from '~/components/cargaconsolidada/clientes/ModalAcciones.vue'
import { formatDate, formatCurrency } from '~/utils/formatters'
import { formatDateForInput } from '~/utils/data-table'
import { useGeneral } from '~/composables/cargaconsolidada/clientes/useGeneral'
import { useEmbarcados } from '~/composables/cargaconsolidada/clientes/useEmbarcados'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
import { useCotizacion } from '~/composables/cargaconsolidada/useCotizacion'
import { useVariacion } from '~/composables/cargaconsolidada/clientes/useVariacion'
import { usePagos } from '~/composables/cargaconsolidada/clientes/usePagos'
import { USelect, UInput, UButton, UIcon, UBadge } from '#components'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
import type { TableColumn } from '@nuxt/ui'
import PagoGrid from '~/components/PagoGrid.vue'
import { STATUS_BG_CLASSES, STATUS_BG_PAGOS_CLASSES } from '~/constants/ui'
import { FILE_ICONS_MAP } from '~/constants/file'
import SectionHeader from '~/components/commons/SectionHeader.vue'
import { ConsolidadoService } from '~/services/cargaconsolidada/consolidadoService'

function getPermisoEstadoClass(estado: string): string {
    const k = estado as keyof typeof STATUS_BG_CLASSES
    if (STATUS_BG_CLASSES[k]) return STATUS_BG_CLASSES[k]
    if (estado === 'Completo') return STATUS_BG_CLASSES.Completado
    if (estado === 'Pendiente') return STATUS_BG_CLASSES.Pendiente
    if (estado === 'EN_TRAMITE' || estado === 'SD') return STATUS_BG_CLASSES.COTIZADO
    return STATUS_BG_CLASSES.WAIT
}
function renderEstadoPermisoPorTipo(list: Array<{ id_tipo_permiso?: number; nombre_permiso: string; estado: string }>, idTramite?: number) {
    if (!list?.length) return null
    return h('div', { class: 'flex flex-col gap-1 mt-1' }, list.map((p) => {
        const content = h(USelect as any, {
            modelValue: p.estado,
            disabled: true,
            items: [{ label: `${p.nombre_permiso}: ${p.estado}`, value: p.estado }],
            class: ['min-w-36 text-xs', getPermisoEstadoClass(p.estado)].filter(Boolean).join(' '),
        })
        if (idTramite != null && p.id_tipo_permiso != null) {
            return h('div', {
                class: 'cursor-pointer hover:opacity-80 transition-opacity',
                onClick: () => navigateTo(`/basedatos/permisos/documentos/${idTramite}?tab=${p.id_tipo_permiso}`),
            }, [content])
        }
        return content
    }))
}

const { withSpinner } = useSpinner()
const { showConfirmation, showSuccess, showError } = useModal()
const { currentRole, currentId, isCoordinacion } = useUserRole()
const route = useRoute()
const id = route.params.id
const tab = ref<string>(isCoordinacion.value || currentId.value == ID_JEFEVENTAS ? 'embarcados' : 'general')
const overlay = useOverlay()
const modalAcciones = overlay.create(ModalAcciones)
// F. Max. Documentacion (visible in the UI)
// default is placeholder '00/00/0000' until backend provides a real value
const fMaxDocumentacion = ref<string | null>(null)
const fMaxDocumentacionDisplay = computed(() => fMaxDocumentacion.value ?? '00/00/0000')

// Función para completar URLs incompletas
const completeUrl = (url: string): string => {
    if (!url) return ''
    // Si ya tiene http:// o https://, devolver como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
    }
    // Si es una ruta relativa (ej: contratos/filename.pdf), agregar la URL completa del backend
    const backendUrl = 'https://intranetback.probusiness.pe/files/'
    return backendUrl + url
}

const handleSaveFMaxDocumentacion = async () => {
    if (!fMaxDocumentacion.value) {
        showError('Fecha requerida', 'Por favor selecciona una fecha válida')
        return
    }
    try {
        await withSpinner(async () => {
            // Use the project's api plugin so the Authorization header (JWT) is attached
            const nuxtApp = useNuxtApp()
            const endpoint = `/api/carga-consolidada/contenedor/update-fecha-documentacion/${Number(id)}`
            const res = await nuxtApp.$api.call(endpoint, {
                method: 'POST',
                body: { fecha_documentacion_max: fMaxDocumentacion.value }
            })

            if (res && (res as any).success) {
                const data = (res as any).data
                if (data && data.fecha_documentacion_max) {
                    fMaxDocumentacion.value = data.fecha_documentacion_max
                }
                showSuccess('Fecha actualizada', (res as any).message || 'Fecha actualizada correctamente')
                // refresh headers / data and update fMaxDocumentacion if backend returned it in headers
                try {
                    await getHeaders(Number(id))
                    if (fecha_documentacion_max && fecha_documentacion_max.value) {
                        fMaxDocumentacion.value = fecha_documentacion_max.value
                    }
                } catch (e) {
                    // ignore header refresh errors
                }
            } else {
                showError('Error', (res as any).message || 'No se pudo actualizar la fecha')
            }
        }, 'Actualizando fecha...')
    } catch (error) {
        console.error('handleSaveFMaxDocumentacion', error)
        showError('Error', 'Error al actualizar la fecha de documentación')
    }
}
const { getClientes,
    clientes,
    updateEstadoCliente,
    totalRecordsGeneral,
    loadingGeneral,
    error,
    paginationGeneral,
    searchGeneral,
    itemsPerPageGeneral,
    totalPagesGeneral,
    currentPageGeneral,
    filtersGeneral,
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
    exportData: exportGeneralData } = useGeneral()
const { getEmbarcados,
    clientesEmbarcados,
    totalRecordsEmbarcados,
    loadingEmbarcados,
    paginationEmbarcados,
    searchEmbarcados,
    itemsPerPageEmbarcados,
    totalPagesEmbarcados,
    currentPageEmbarcados,
    filtersEmbarcados,
    handlePageEmbarcadosChange,
    handleItemsPerPageChangeEmbarcados,
    handleFilterChangeEmbarcados,
    handleSearchEmbarcados,
    // helpers and handlers
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
} = useEmbarcados({ refresh: getClientes, clientsRef: clientes })
const { updateProveedor } = useCotizacionProveedor()
const { sendRecordatorioFirmaContrato } = useCotizacion()
const { getClientesVariacion,
    updateVolumenSelected,
    clientesVariacion,
    totalRecordsVariacion,
    loadingVariacion,
    paginationVariacion,
    searchVariacion,
    itemsPerPageVariacion,
    totalPagesVariacion,
    currentPageVariacion,
    filtersVariacion,
    handlePageVariacionChange,
    handleItemsPerPageChangeVariacion,
    handleFilterChangeVariacion,
    handleSearchVariacion,
    exportData: exportVariacionData } = useVariacion()
const { getClientesPagos,
    clientesPagos,
    totalRecordsPagos,
    loadingPagos,
    paginationPagos,
    searchPagos,
    itemsPerPagePagos,
    totalPagesPagos,
    currentPagePagos,
    filtersPagos,
    handlePagePagosChange,
    handleItemsPerPageChangePagos,
    handleFilterChangePagos,
    handleSearchPagos,
    registrarPago,
    deletePago,
    exportData: exportPagosData } = usePagos()
const tabs = ref()
const handleTabChange = (value: string) => {
    if (tab.value === 'general') {
        getClientes(Number(id))
    } else if (tab.value === 'variacion') {
        getClientesVariacion(Number(id))
    } else if (tab.value === 'pagos') {
        getClientesPagos(Number(id))
    }
}

const exportData = async () => {
    if (tab.value === 'general') {
        await exportGeneralData()
    } else if (tab.value === 'variacion') {
        await exportVariacionData()
    } else if (tab.value === 'pagos') {
        await exportPagosData()
    }
}


//N.	Nombre	DNI/RUC	Whatsapp	T. Cliente	Estado	Conceptop	Importe	Pagado	Adelantos
const columnsPagos = ref<TableColumn<any>[]>([
    {
        accessorKey: 'index',
        header: 'N°',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const pick = (keys: string[]) => {
                for (const k of keys) {
                    const v = row.original?.[k]
                    if (v !== undefined && v !== null && String(v).trim() !== '') return v
                    const nested = row.original?.cliente
                    if (nested && nested[k] && String(nested[k]).trim() !== '') return nested[k]
                }
                return ''
            }

            const nombre = String(pick(['nombre', 'razon_social', 'name', 'cliente_nombre', 'clienteName']) || '')
            const documento = String(pick(['documento', 'dni', 'ruc', 'numero_documento']) || '')
            const telefono = String(pick(['telefono', 'whatsapp', 'celular', 'phone']) || '')
            const correo = String(pick(['correo', 'email', 'mail']) || '')

            return h('div', { class: 'py-2' }, [
                h('div', { class: 'font-medium' }, nombre || '—'),
                documento ? h('div', { class: 'text-sm text-gray-500' }, documento) : null,
                telefono ? h('div', { class: 'text-sm text-gray-500' }, telefono) : null,
                correo ? h('div', { class: 'text-sm text-gray-500' }, correo) : null
            ])
        }
    },
    {
        accessorKey: 'name',
        header: 'T. Cliente',
        cell: ({ row }: { row: any }) => {
            return row.getValue('name')
        }
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            const selectNode = h(USelect as any, {
                modelValue: row.original.estado_pago,
                disabled: true,
                items: [
                    { label: 'PENDIENTE', value: 'PENDIENTE' },
                    { label: 'PAGADO', value: 'PAGADO' },
                    { label: 'ADELANTO', value: 'ADELANTO' },
                    { label: 'SOBREPAGO', value: 'SOBREPAGO' },
                ],
                class: STATUS_BG_PAGOS_CLASSES[row.original.estado_pago as keyof typeof STATUS_BG_PAGOS_CLASSES],
            })
            return selectNode
        }
    },
    {
        accessorKey: 'concepto',
        header: 'Concepto',
        cell: ({ row }: { row: any }) => {
            return 'Logistica'
        }
    },
    {
        accessorKey: 'importe',
        header: 'Importe',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.original.monto)
        }
    },
    {
        accessorKey: 'pagado',
        header: 'Pagado',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.original.total_pagos)
        }
    },
    {
        accessorKey: 'adelantos',
        header: 'Adelantos',
        cell: ({ row }: { row: any }) => {
            const pagos = JSON.parse(row.original.pagos_details ?? '[]');
            return !row.original.id_contenedor_pago ? h(PagoGrid, {
                pagoDetails: pagos,
                currency: 'USD',
                numberOfPagos: (currentRole.value == ROLES.COORDINACION || currentRole.value == ROLES.JEFE_IMPORTACIONES) ? 4 : pagos.length,
                clienteNombre: row.original.nombre,
                onSave: (data) => {
                    const formData = new FormData();
                    for (const key in data) {
                        if (data[key] !== undefined && data[key] !== null) {
                            formData.append(key, data[key]);
                        }
                    }
                    formData.append('idPedido', row.original.id_cotizacion)
                    formData.append('idContenedor', row.original.id_contenedor)
                    formData.append('idCotizacion', row.original.id_cotizacion)
                    withSpinner(async () => {
                        const response = await registrarPago(formData)
                        if (response.success) {
                            showSuccess('Pago registrado', 'Pago registrado correctamente', { duration: 3000 })
                            getClientesPagos(Number(id))
                        } else {
                            showError('Error al registrar pago', response.error, { persistent: true })
                        }
                    }, 'registrarPago')

                },
                onDelete: (pagoId: number) => {
                    showConfirmation(
                        'Confirmar eliminación',
                        '¿Está seguro de que desea eliminar el pago? Esta acción no se puede deshacer.',
                        async () => {
                            try {
                                await withSpinner(async () => {
                                    const response = await deletePago(pagoId)
                                    if (response.success) {
                                        await getClientesPagos(Number(id))
                                        showSuccess('Eliminación Exitosa', 'El pago se ha eliminado correctamente.')
                                        await getHeaders(Number(id))
                                    }
                                }, 'Eliminando pago...')
                            } catch (error) {
                                console.error('Error al eliminar el pago:', error)
                                showError('Error de Eliminación', 'Error al eliminar el pago')
                            }
                        }
                    )
                },
                showDelete: (currentRole.value == ROLES.COORDINACION || currentRole.value == ROLES.JEFE_IMPORTACIONES),
            }) : null
        }
    }
])
//N° Fecha	Nombre	DNI/RUC	Correo	Whatsapp	T. Cliente	Volumen	Qty Item	Fob	Logistica	Impuesto	Tarifa	Estados	Status	Acciones
const columns: TableColumn<any>[] = [
    {
        accessorKey: 'index',
        header: 'N°',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },

    {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }: { row: any }) => {
            return formatDateTimeToDmy(row.getValue('fecha'))
        }
    },
    {
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const pick = (keys: string[]) => {
                for (const k of keys) {
                    const v = row.original?.[k]
                    if (v !== undefined && v !== null && String(v).trim() !== '') return v
                    const nested = row.original?.cliente
                    if (nested && nested[k] && String(nested[k]).trim() !== '') return nested[k]
                }
                return ''
            }

            const nombre = String(pick(['nombre', 'razon_social', 'name', 'cliente_nombre', 'clienteName']) || '')
            const documento = String(pick(['documento', 'dni', 'ruc', 'numero_documento']) || '')
            const telefono = String(pick(['telefono', 'whatsapp', 'celular', 'phone']) || '')
            const correo = String(pick(['correo', 'email', 'mail']) || '')
            const cod_contract = String(pick(['cod_contract']) || '')
            const cotizacion_contrato_firmado_url = completeUrl(String(pick(['cotizacion_contrato_firmado_url']) || ''))
            const cotizacion_contrato_url = completeUrl(String(pick(['cotizacion_contrato_url']) || ''))
            const cotizacion_contrato_autosigned_url = completeUrl(String(pick(['cotizacion_contrato_autosigned_url']) || ''))
            return h('div', { class: 'max-w-30 whitespace-normal break-words' }, [
                h('div', { class: 'font-medium' }, nombre ? (nombre.toUpperCase ? nombre.toUpperCase() : nombre) : '—'),
                documento ? h('div', { class: 'text-sm text-gray-500' }, documento) : null,
                telefono ? h('div', { class: 'text-sm text-gray-500' }, telefono) : null,
                correo ? h('div', { class: 'text-sm text-gray-500' }, correo) : h('div', { class: 'text-sm text-gray-500' }, 'Sin correo'),
                cod_contract ? h('div', { class: 'text-sm text-gray-500' }, [
                    //nueva condicion: si cotizacion_contrato_firmado_url existe entonces que aparezca contrato con texto primary, si no existe cotizacion_contrato_firmado_url pero si cotizacion_contrato_url entonces que aparezca contrato con texto secondary:
                    (cotizacion_contrato_firmado_url
                        ? h('a', { 
                            href: cotizacion_contrato_firmado_url,
                            target: '_blank',
                            class: 'text-success-400 font-medium hover:underline' 
                        }, `Contrato: ${cod_contract}`)
                        : (cotizacion_contrato_autosigned_url
                            ? h('a', { 
                                href: cotizacion_contrato_autosigned_url,
                                target: '_blank',
                                class: 'text-warning-400 font-medium hover:underline' 
                            }, `Contrato: ${cod_contract}`)
                            : (cotizacion_contrato_url
                                ? h('a', { 
                                    href: cotizacion_contrato_url,
                                    target: '_blank',
                                    class: 'text-secondary-700 dark:text-secondary-400 font-medium hover:underline' 
                                }, `Contrato: ${cod_contract}`)
                                : `Contrato: ${cod_contract}`
                            )
                        )
                    )
                ]) : null
            ])
        }
    },
    {
        accessorKey: 'name',
        header: 'T. Cliente',
        cell: ({ row }: { row: any }) => {
            return row.getValue('name')
        }
    },
    {
        accessorKey: 'volumen',
        header: 'Volumen',
        cell: ({ row }: { row: any }) => {
            return row.getValue('volumen')
        }
    },

    {
        accessorKey: 'qty_item',
        header: 'Qty Item',
        cell: ({ row }: { row: any }) => {
            return row.getValue('qty_item')
        }
    },
    {
        accessorKey: 'fob',
        header: 'Fob',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.getValue('fob'))
        }
    },
    {
        accessorKey: 'monto',
        header: 'Logistica',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.getValue('monto'))
        }
    },
    {
        accessorKey: 'impuestos',
        header: 'Impuesto',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.getValue('impuestos'))
        }
    },
    {
        accessorKey: 'tarifa',
        header: 'Tarifa',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.getValue('tarifa'))
        }
    },


    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            //button view with more info
            return h(UButton, {
                icon: 'i-heroicons-eye',
                variant: 'ghost',
                size: 'xs',
                onClick: () => {
                    navigateTo(`/cargaconsolidada/coordinacion/abiertos/clientes/documentacion/${row.original.id_cotizacion}`)
                }
            },
            )
        }
    }
]
const columnsCoordinacion: TableColumn<any>[] = [
    {
        accessorKey: 'index',
        header: 'N°',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },

    {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }: { row: any }) => {
            return formatDateTimeToDmy(row.getValue('fecha'))
        }
    },
    {
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const nombre = row.original?.nombre || ''
            const documento = row.original?.documento || ''
            const telefono = row.original?.telefono || ''
            const correo = row.original?.correo || ''
            const cod_contract = row.original?.cod_contract || ''
            const cotizacion_contrato_firmado_url = completeUrl(row.original?.cotizacion_contrato_firmado_url || '')
            const cotizacion_contrato_url = completeUrl(row.original?.cotizacion_contrato_url || '')
            const cotizacion_contrato_autosigned_url = completeUrl(row.original?.cotizacion_contrato_autosigned_url || '')
            return h('div', { class: 'max-w-30 whitespace-normal break-words' }, [
                h('div', { class: 'font-medium' }, nombre?.toUpperCase()),
                h('div', { class: 'text-sm text-gray-500' }, documento),
                h('div', { class: 'text-sm text-gray-500' }, telefono),
                h('div', { class: 'text-sm text-gray-500' }, correo || 'Sin correo'),
                cod_contract ? h('div', { class: 'text-sm text-gray-500' }, [
                    //nueva condicion: si cotizacion_contrato_firmado_url existe entonces que aparezca contrato con texto primary, si no existe cotizacion_contrato_firmado_url pero si cotizacion_contrato_url entonces que aparezca contrato con texto secondary:
                    (cotizacion_contrato_firmado_url
                        ? h('a', { 
                            href: cotizacion_contrato_firmado_url,
                            target: '_blank',
                            class: 'text-success-400 font-medium hover:underline' 
                        }, `Contrato: ${cod_contract}`)
                        : (cotizacion_contrato_autosigned_url
                            ? h('a', { 
                                href: cotizacion_contrato_autosigned_url,
                                target: '_blank',
                                class: 'text-warning-400 font-medium hover:underline' 
                            }, `Contrato: ${cod_contract}`)
                            : (cotizacion_contrato_url
                                ? h('a', { 
                                    href: cotizacion_contrato_url,
                                    target: '_blank',
                                    class: 'text-secondary-700 dark:text-secondary-400 font-medium hover:underline' 
                                }, `Contrato: ${cod_contract}`)
                                : `Contrato: ${cod_contract}`
                            )
                        )
                    )
                ]) : null
            ])
        }
    },
    {
        accessorKey: 'name',
        header: 'T. Cliente',
        cell: ({ row }: { row: any }) => {
            return row.getValue('name')
        }
    },
    {
        accessorKey: 'volumen',
        header: 'Volumen',
        cell: ({ row }: { row: any }) => {
            return row.getValue('volumen')
        }
    },

    {
        accessorKey: 'qty_item',
        header: 'Qty Item',
        cell: ({ row }: { row: any }) => {
            return row.getValue('qty_item')
        }
    },
    {
        accessorKey: 'fob',
        header: 'Fob',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.getValue('fob'))
        }
    },
    {
        accessorKey: 'monto',
        header: 'Logistica',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.getValue('monto'))
        }
    },
    {
        accessorKey: 'impuestos',
        header: 'Impuesto',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.getValue('impuestos'))
        }
    },
    {
        accessorKey: 'tarifa',
        header: 'Tarifa',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(row.getValue('tarifa'))
        }
    },
    {
        accessorKey: 'estados',
        header: 'Estados',
        cell: ({ row }: { row: any }) => {
            //show estado_cliente in USELECT WITH STATUS RESERVADO,NO RESERVADO DOCUMENTACION C FINAL FACTURADO
            const selectNode = h(USelect as any, {
                //color status based on estado_cliente
                class: [STATUS_BG_CLASSES[row.original.estado_cliente as keyof typeof STATUS_BG_CLASSES], 'w-full'],
                modelValue: row.original.estado_cliente,
                items: [
                    { label: 'Reservado', value: 'RESERVADO' },
                    { label: 'No Reservado', value: 'NO RESERVADO' },
                    { label: 'Documentación', value: 'DOCUMENTACION' },

                ],
                placeholder: 'Seleccionar estado',
                'onUpdate:modelValue': async (value: any) => {
                    if (value && value !== row.original.estado_cliente) {
                        const data = {
                            id_cotizacion: row.original.id_cotizacion,
                            estado_cliente: value
                        }
                        await handleUpdateEstadoCliente(data)
                    }
                }
            })
            return selectNode
        }
    },

    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            return h('div', { class: 'flex gap-2' }, [
                h(UButton, {
                    icon: 'i-heroicons-document-text',
                    variant: 'ghost',
                    color: 'primary',
                    size: 'xs',
                    title: 'Enviar recordatorio de firma',
                    onClick: () => {
                        handleSendRecordatorioFirma(row.original.id_cotizacion)
                    }
                }),
                h(UButton, {
                    icon: 'i-heroicons-eye',
                    variant: 'ghost',
                    size: 'xs',
                    onClick: () => {
                        navigateTo(`/cargaconsolidada/coordinacion/abiertos/clientes/documentacion/${row.original.id_cotizacion}`)
                    }
                })
            ])
        }
    }
]
//N°	Nombre	DNI/RUC	Correo	Whatsapp	T. Cliente	Status	Accio
const columnsDocumentacion: TableColumn<any>[] = [
    {
        accessorKey: 'index',
        header: 'N°',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: 'asesor',
        header: 'Asesor',
        cell: ({ row }: { row: any }) => {
            return row.getValue('asesor')
        }
    },
    {
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const nombre = row.original.nombre || ''
            const documento = row.original.documento || ''
            const correo = row.original.correo || ''
            const telefono = row.original.telefono || ''
            return h('div', { class: '' }, [
                h('div', { class: 'font-medium' }, nombre),
                h('div', { class: 'text-sm text-gray-500' }, documento),
                h('div', { class: 'text-sm text-gray-500' }, telefono),
                h('div', { class: 'text-sm text-gray-500' }, correo || '')
            ])
        }
    },
    {
        accessorKey: 'code supplier',
        header: 'Code Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.code_supplier,
                    class: 'w-full w-25',
                    disabled: true,
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'name',
        header: 'T. Cliente',
        cell: ({ row }: { row: any }) => {
            return row.getValue('name')
        }
    }, {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: any }) => {
            const selectNode = h(USelect as any, {
                label: row.original.status_cliente_doc,
                class: STATUS_BG_CLASSES[row.original.status_cliente_doc as keyof typeof STATUS_BG_CLASSES],
                variant: 'soft',
                modelValue: row.original.status_cliente_doc,
                items: [
                    { label: 'COMPLETADO', value: 'Completado' },
                    { label: 'PENDIENTE', value: 'Pendiente' },
                    { label: 'INCOMPLETO', value: 'Incompleto' }
                ],
                'onUpdate:modelValue': async (value: any) => {
                    if (value && value !== row.original.status_cliente_doc) {
                        await withSpinner(async () => {
                            const data = {
                                id_cotizacion: row.original.id_cotizacion,
                                status_cliente_doc: value

                            }
                            const response = await handleUpdateStatusClienteDoc(data)
                            if (response.success) {
                                await getClientes(Number(id))
                                showSuccess('Actualización Exitosa', 'El estado de la documentación del cliente se ha actualizado correctamente.')
                            }
                        }, 'Actualizando estado de la documentación del cliente...')
                    }
                }
            })
            const permisoBlock = (currentRole.value === ROLES.DOCUMENTACION || (currentRole.value === ROLES.JEFE_IMPORTACIONES && route.path.includes('documentacion')))
                ? renderEstadoPermisoPorTipo(row.original.estado_permiso_por_tipo ?? [], row.original.id_tramite)
                : null
            return h('div', { class: 'flex flex-col' }, [ selectNode, permisoBlock ].filter(Boolean))
        }
    },
    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            return h(UButton, {
                icon: 'i-heroicons-eye',
                variant: 'ghost',
                size: 'xs',
                onClick: () => {
                    navigateTo(`/cargaconsolidada/coordinacion/abiertos/clientes/documentacion/${row.original.id_cotizacion}`)
                }
            })
        }
    }
]
const getColumnsGeneral = () => {
    switch (currentRole.value) {
        case ROLES.DOCUMENTACION:
            return columnsDocumentacion
        case ROLES.JEFE_IMPORTACIONES:
            return columnsCoordinacion
        case ROLES.COORDINACION:
        case ROLES.JEFE_IMPORTACIONES:
            return columnsCoordinacion
        default:
            return columns
    }
}

const getColumnsEmbarcados = (): TableColumn<any>[] => {
    switch (currentRole.value) {
        case ROLES.COORDINACION:
        case ROLES.JEFE_IMPORTACIONES:
            return columnsEmbarcadosCoordinacion.value
        default:
            return columnsEmbarcados.value
    }
}
const getColorStatusDocumentacion = (status: string) => {
    //Completado,Pendiente,Incompleto
    switch (status) {
        case 'Completado':
            return 'primary'
        case 'Pendiente':
            return 'warning'
        case 'Incompleto':
            return 'error'
    }
    return 'neutral'
}

// Helper: elegir icono según la extensión en la URL/filename
const getFileIcon = (url?: string) => {
    try {
        if (!url) return 'i-heroicons-document'
        // eliminar query string
        const clean = url.split('?')[0]
        const parts = clean.split('/')
        const last = parts[parts.length - 1] || clean
        const segs = last.split('.')
        if (segs.length < 2) return 'i-heroicons-document'
        const ext = segs[segs.length - 1].toLowerCase()
        // FILE_ICONS_MAP es readonly, index con fallback
        // @ts-ignore
        return FILE_ICONS_MAP[ext] ?? 'i-heroicons-document'
    } catch (e) {
        return 'i-heroicons-document'
    }
}
// Map manual status labels to keys used in STATUS_BG_CLASSES (reuse existing color map from constants/ui)
// Desired mapping: Pendiente (gris), Recibido (azul), Observado (rojo), Revisado (verde)
const MANUAL_STATUS_TO_STATUS_BG_KEY: Record<string, string> = {
    Pendiente: 'WAIT', // gray
    Recibido: 'RECIBIENDO', // blue
    Observado: 'Incompleto', // red
    Revisado: 'Completado' // green
}
const columnsEmbarcados = ref<TableColumn<any>[]>([
    {
        accessorKey: 'index',
        header: 'N°',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const pick = (keys: string[]) => {
                for (const k of keys) {
                    const v = row.original?.[k]
                    if (v !== undefined && v !== null && String(v).trim() !== '') return v
                    const nested = row.original?.cliente
                    if (nested && nested[k] && String(nested[k]).trim() !== '') return nested[k]
                }
                return ''
            }

            const nombre = String(pick(['nombre', 'razon_social', 'name', 'cliente_nombre', 'clienteName']) || '')
            const documento = String(pick(['documento', 'dni', 'ruc', 'numero_documento']) || '')
            const telefono = String(pick(['telefono', 'whatsapp', 'celular', 'phone']) || '')
            const correo = String(pick(['correo', 'email', 'mail']) || '')

            return h('div', { class: '' }, [
                h('div', { class: 'font-medium' }, nombre),
                documento ? h('div', { class: 'text-sm text-gray-500' }, documento) : null,
                telefono ? h('div', { class: 'text-sm text-gray-500' }, telefono) : null,
                correo ? h('div', { class: 'text-sm text-gray-500' }, correo) : null
            ])
        }
    },
    {
        accessorKey: 'tipo_cliente',
        header: 'T. Cliente',
        cell: ({ row }: { row: any }) => {
            return row.getValue('tipo_cliente')
        }
    },
    {
        accessorKey: 'products',
        header: 'Productos',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores

            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.products,
                    class: 'w-full w-40',
                    disabled: true,
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'supplier',
        header: 'Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.supplier,
                    class: 'w-full w-25',
                    disabled: true,
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'code_supplier',
        header: 'Code Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.code_supplier,
                    class: 'w-full w-25',
                    disabled: true,
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'volumen_peru',
        header: 'Vol. Perú',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.vol_peru,
                    class: 'w-full w-12',
                    disabled: true,
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'volumen_china',
        header: 'Vol. China',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.vol_china,
                    class: 'w-full',
                    disabled: true,
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'factura_comercial',
        header: 'Factura Comercial',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores ?? []
            return h('div', { class: 'flex flex-col gap-2' }, proveedores.map((proveedor: any, idx: number) => {
                const url = proveedor.factura_comercial
                if (url) {
                    const icon = getFileIcon(url)
                    return h('div', {
                        class: 'flex flex-row gap-2'
                    }, [
                        h(UButton, {
                            icon,
                            color: 'primary',
                            variant: 'ghost',
                            'aria-label': 'Ver factura comercial',
                            onClick: () => {
                                // Abrir la URL del proveedor directamente
                                window.open(url, '_blank')
                            }
                        }),
                        h(UButton, {
                            icon: 'i-heroicons-trash',
                            color: 'error',
                            variant: 'ghost',
                            'aria-label': 'Eliminar factura comercial',
                            onClick: () => {
                                // Usar id del proveedor para eliminar
                                deleteFacturaComercial(proveedor.id)
                            }
                        })
                    ])
                } else {
                    return h(UButton, {
                        icon: 'i-heroicons-arrow-up-tray',
                        color: 'primary',
                        variant: 'outline',
                        label: 'Subir',
                        onClick: () => {
                            handleUploadFacturaComercial(proveedor.id)
                        }
                    })
                }
            }))
        }
    },
    {
        accessorKey: 'packing_list',
        header: 'Packing List',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores ?? []
            return h('div', { class: 'flex flex-col gap-2' }, proveedores.map((proveedor: any, idx: number) => {
                const url = proveedor.packing_list
                if (url) {
                    const icon = getFileIcon(url)
                    return h('div', {
                        class: 'flex flex-row gap-2'
                    }, [
                        h(UButton, {
                            icon,
                            color: 'primary',
                            variant: 'ghost',
                            'aria-label': 'Ver packing list',
                            onClick: () => {
                                // Abrir la URL del proveedor directamente
                                window.open(url, '_blank')
                            }
                        }),
                        h(UButton, {
                            icon: 'i-heroicons-trash',
                            color: 'error',
                            variant: 'ghost',
                            'aria-label': 'Eliminar packing list',
                            onClick: () => {
                                deletePackingList(proveedor.id)
                            }
                        })
                    ])
                } else {
                    return h(UButton, {
                        icon: 'i-heroicons-arrow-up-tray',
                        color: 'primary',
                        variant: 'outline',
                        label: 'Subir',
                        onClick: () => {
                            handleUploadPackingList(proveedor.id)
                        }
                    })
                }
            }))
        }
    },
    {
        accessorKey: 'excel_confirmacion',
        header: 'Excel Confirmación',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores ?? []
            return h('div', { class: 'flex flex-col gap-2' }, proveedores.map((proveedor: any, idx: number) => {
                const url = proveedor.excel_confirmacion
                if (url) {
                    const icon = getFileIcon(url)
                    return h('div', {
                        class: 'flex flex-row gap-2'
                    }, [
                        h(UButton, {
                            icon,
                            color: 'primary',
                            variant: 'ghost',
                            'aria-label': 'Ver excel de confirmación',
                            onClick: () => {
                                window.open(url, '_blank')
                            }
                        }),
                        h(UButton, {
                            icon: 'i-heroicons-trash',
                            color: 'error',
                            variant: 'ghost',
                            'aria-label': 'Eliminar excel de confirmación',
                            onClick: () => {
                                deleteExcelConfirmacion(proveedor.id)
                            }
                        })
                    ])

                } else {
                    return h(UButton, {
                        icon: 'i-heroicons-arrow-up-tray',
                        color: 'primary',
                        variant: 'outline',
                        label: 'Subir',
                        onClick: () => {
                            handleUploadExcelConfirmacion(proveedor.id)
                        }
                    })
                }
            }))
        }
    },
    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            //button view with more info
            return h(UButton, {
                icon: 'iconamoon:menu-burger-horizontal',
                variant: 'ghost',
                size: 'xs',
                'aria-label': 'Acciones del cliente',
                onClick: () => {
                    //generar un modal para solicitar el tipo de recordatorio de documento
                    console.log(row.original)
                    modalAcciones.open({
                        show: true,
                        clienteId: row.original.id,
                        clienteName: row.original.nombre,
                        onSelected: (data: any) => {
                            console.log(data)
                        },
                        validateMaxDate: true
                    })
                }
            },
            )
        }
    }
])
const columnsEmbarcadosCoordinacion = ref<TableColumn<any>[]>([
    {
        accessorKey: 'index',
        header: 'N°',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const pick = (keys: string[]) => {
                for (const k of keys) {
                    const v = row.original?.[k]
                    if (v !== undefined && v !== null && String(v).trim() !== '') return v
                    const nested = row.original?.cliente
                    if (nested && nested[k] && String(nested[k]).trim() !== '') return nested[k]
                }
                return ''
            }

            const nombre = String(pick(['nombre', 'razon_social', 'name', 'cliente_nombre', 'clienteName']) || '')
            const documento = String(pick(['documento', 'dni', 'ruc', 'numero_documento']) || '')
            const telefono = String(pick(['telefono', 'whatsapp', 'celular', 'phone']) || '')
            const correo = String(pick(['correo', 'email', 'mail']) || '')

            return h('div', { class: '' }, [
                h('div', { class: 'font-medium' }, nombre),
                documento ? h('div', { class: 'text-sm text-gray-500' }, documento) : null,
                telefono ? h('div', { class: 'text-sm text-gray-500' }, telefono) : null,
                correo ? h('div', { class: 'text-sm text-gray-500' }, correo) : null
            ])
        }
    },
    {
        accessorKey: 'tipo_cliente',
        header: 'T. Cliente',
        cell: ({ row }: { row: any }) => {
            return row.getValue('tipo_cliente')
        }
    },
    {
        accessorKey: 'products',
        header: 'Productos',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores

            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.products,
                    class: 'w-full w-40',
                    disabled: true,
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'code_supplier',
        header: 'Code Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.code_supplier,
                    class: 'w-full w-25',
                    disabled: true,
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'invoice_status',
        header: 'Invoice',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores || []
            const statuses = ['Pendiente', 'Recibido', 'Observado', 'Revisado']
            return h('div', { class: 'flex flex-col gap-2' }, proveedores.map((p: any) => {
                if (!p.invoice_status) p.invoice_status = 'Pendiente'
                // build items including per-option class
                const itemsWithClass = statuses.map((s: string) => {
                    const key = MANUAL_STATUS_TO_STATUS_BG_KEY[s] ?? s
                    const itemCls = (STATUS_BG_CLASSES as any)[key] ?? ''
                    return { label: s, value: s, class: itemCls }
                })
                const mapped = MANUAL_STATUS_TO_STATUS_BG_KEY[p.invoice_status] || 'Pendiente'
                const cls = STATUS_BG_CLASSES[mapped as keyof typeof STATUS_BG_CLASSES] ?? ''
                return h(USelect as any, {
                    modelValue: p.invoice_status,
                    items: itemsWithClass,
                    class: `w-full ${cls}`,
                    variant: 'ghost',
                    'onUpdate:modelValue': async (v: string) => { await saveProveedorField(p, 'invoice_status', v) }
                })
            }))
        }
    },
    {
        accessorKey: 'packing_status',
        header: 'Packing list',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores || []
            const statuses = ['Pendiente', 'Recibido', 'Observado', 'Revisado']
            return h('div', { class: 'flex flex-col gap-2' }, proveedores.map((p: any) => {
                if (!p.packing_status) p.packing_status = 'Pendiente'
                const itemsWithClass = statuses.map((s: string) => {
                    const key = MANUAL_STATUS_TO_STATUS_BG_KEY[s] ?? s
                    const itemCls = (STATUS_BG_CLASSES as any)[key] ?? ''
                    return { label: s, value: s, class: itemCls }
                })
                const mapped = MANUAL_STATUS_TO_STATUS_BG_KEY[p.packing_status] || 'Pendiente'
                const cls = STATUS_BG_CLASSES[mapped as keyof typeof STATUS_BG_CLASSES] ?? ''
                return h(USelect as any, {
                    modelValue: p.packing_status,
                    items: itemsWithClass,
                    class: `w-full ${cls}`,
                    variant: 'ghost',
                    'onUpdate:modelValue': async (v: string) => { await saveProveedorField(p, 'packing_status', v) }
                })
            }))
        }
    },
    {
        accessorKey: 'excel_conf_status',
        header: 'Excel Conf.',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores || []
            const statuses = ['Pendiente', 'Recibido', 'Observado', 'Revisado']
            return h('div', { class: 'flex flex-col gap-2' }, proveedores.map((p: any) => {
                if (!p.excel_conf_status) p.excel_conf_status = 'Pendiente'
                const itemsWithClass = statuses.map((s: string) => {
                    const key = MANUAL_STATUS_TO_STATUS_BG_KEY[s] ?? s
                    const itemCls = (STATUS_BG_CLASSES as any)[key] ?? ''
                    return { label: s, value: s, class: itemCls }
                })
                const mapped = MANUAL_STATUS_TO_STATUS_BG_KEY[p.excel_conf_status] || 'Pendiente'
                const cls = STATUS_BG_CLASSES[mapped as keyof typeof STATUS_BG_CLASSES] ?? ''
                return h(USelect as any, {
                    modelValue: p.excel_conf_status,
                    items: itemsWithClass,
                    class: `w-full ${cls}`,
                    variant: 'ghost',
                    'onUpdate:modelValue': async (v: string) => { await saveProveedorField(p, 'excel_conf_status', v) }
                })
            }))
        }
    },

    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            // Render both actions: menu (modal) and eye (navigate)
            return h('div', { class: 'flex items-center gap-1' }, [
                h(UButton, {
                    icon: 'iconamoon:menu-burger-horizontal',
                    variant: 'ghost',
                    size: 'xs',
                    onClick: () => {
                        // generar un modal para solicitar el tipo de recordatorio de documento
                        modalAcciones.open({
                            show: true,
                            clienteId: row.original.id,
                            clienteName: row.original.nombre,
                            onSelected: (data: any) => {
                                // callback cuando se selecciona una acción
                                console.log(data)
                            },
                            validateMaxDate: true
                        })
                    }
                }),
                h(UButton, {
                    icon: 'i-heroicons-eye',
                    variant: 'ghost',
                    size: 'xs',
                    onClick: () => {
                        navigateTo(`/cargaconsolidada/coordinacion/abiertos/clientes/documentacion/${row.original.id}`)
                    }
                })
            ])
        }
    }
])
const columnsVariacion = ref<TableColumn<any>[]>([
    {
        accessorKey: 'index',
        header: 'N°',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: 'asesor',
        header: 'Asesor',
        cell: ({ row }: { row: any }) => {
            return row.getValue('asesor')
        }
    },
    {
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const nombre = row.original?.nombre || ''
            const documento = row.original?.documento || ''
            const telefono = row.original?.telefono || ''
            const correo = row.original?.correo || ''
            return h('div', { class: '' }, [
                h('div', { class: 'font-medium' }, nombre),
                h('div', { class: 'text-sm text-gray-500' }, documento),
                h('div', { class: 'text-sm text-gray-500' }, telefono),
                h('div', { class: 'text-sm text-gray-500' }, correo || '')
            ])
        }
    },
    {
        accessorKey: 'name',
        header: 'T. Cliente',
        cell: ({ row }: { row: any }) => {
            return row.getValue('name')
        }
    },
    {
        accessorKey: 'tarifa',
        header: 'Tarifa',
        cell: ({ row }: { row: any }) => {
            return row.getValue('tarifa')
        }
    },
    {
        accessorKey: 'volumen',
        header: 'Vol. Cot',
        cell: ({ row }: { row: any }) => {
            //RETURN UBADGET WITH COLOR PRIMARY WHERE vol_selected is = accessorKey
            return h(UBadge, {
                color: row.original.vol_selected === 'volumen' ? 'primary' : 'transparent',
                variant: 'solid',
                class: 'cursor-pointer text-black dark:text-white p-4',
                label: row.getValue('volumen'),
                onClick: () => {
                    updateVolSelected({ id_cotizacion: row.original.id_cotizacion, volumen: 'volumen' })
                }
            })
        }
    },
    {
        accessorKey: 'volumen_china',
        header: 'Vol. China',
        cell: ({ row }: { row: any }) => {
            return h(UBadge, {
                color: row.original.vol_selected === 'volumen_china' ? 'primary' : 'transparent',
                variant: 'solid',
                class: 'cursor-pointer text-black dark:text-white p-4',
                label: row.getValue('volumen_china'),
                onClick: () => {
                    updateVolSelected({ id_cotizacion: row.original.id_cotizacion, volumen: 'volumen_china' })
                }
            })
        }
    },
    {
        accessorKey: 'volumen_doc',
        header: 'Vol. Doc',
        cell: ({ row }: { row: any }) => {
            return h(UBadge, {
                color: row.original.vol_selected === 'volumen_doc' ? 'primary' : 'transparent',
                variant: 'solid',
                label: row.getValue('volumen_doc'),
                class: 'cursor-pointer text-black dark:text-white p-4',
                onClick: () => {
                    updateVolSelected({ id_cotizacion: row.original.id_cotizacion, volumen: 'volumen_doc' })
                }
            })
        }
    },
    {
        accessorKey: 'valor_cot',
        header: 'Valor Cot',
        cell: ({ row }: { row: any }) => {
            return row.getValue('valor_cot')
        }
    },
    {
        accessorKey: 'valor_doc',
        header: 'Valor Doc',
        cell: ({ row }: { row: any }) => {
            return row.getValue('valor_doc')
        }
    },
    {
        accessorKey: 'variacion',
        header: 'Variación',
        cell: ({ row }: { row: any }) => {
            //if volumen volumen china and volumen doc are different o valor cot and valor doc are different show badge with text SI else NO
            if (row.getValue('volumen') !== row.getValue('volumen_china') || row.getValue('volumen') !== row.getValue('volumen_doc') || row.getValue('valor_cot') !== row.getValue('valor_doc')) {
                return h(UBadge, {
                    label: 'SI',
                    color: 'primary',
                    variant: 'soft'
                })
            }
            return h(UBadge, {
                label: 'NO',
                color: 'neutral',
                variant: 'soft'
            })
        }
    }
])

const handleSendRecordatorioFirma = async (idCotizacion: number) => {
    try {
        showConfirmation('¿Deseas enviar el recordatorio de firma de contrato?', 'Se enviará un mensaje de WhatsApp al cliente.', async () => {
            await withSpinner(async () => {
                const response = await sendRecordatorioFirmaContrato(idCotizacion)
                if (response?.success) {
                    showSuccess('Recordatorio enviado', 'El recordatorio de firma se ha enviado correctamente.')
                } else {
                    showError('Error', response?.error || 'No se pudo enviar el recordatorio')
                }
            }, 'Enviando recordatorio...')
        })
    } catch (error) {
        showError('Error al enviar recordatorio', error)
    }
}

const handleUpdateEstadoCliente = async (data: any) => {
    try {
        await withSpinner(async () => {
            const response = await updateEstadoCliente(data)
            if (response.success) {
                await getClientes(Number(id))
                showSuccess('Actualización Exitosa', 'El estado del cliente se ha actualizado correctamente.')
            }
        }, 'Actualizando estado del cliente...')
    } catch (err) {
        error.value = err as string
    }
}
const updateVolSelected = async (data: any) => {
    try {
        showConfirmation(
            'Confirmar actualización',
            '¿Está seguro de que desea actualizar el volumen seleccionado? Esta acción no se puede deshacer.',
            async () => {
                try {
                    await withSpinner(async () => {
                        const response = await updateVolumenSelected(data)
                        if (response.success) {
                            await getClientesVariacion(Number(id))
                            showSuccess('Actualización Exitosa', 'El volumen seleccionado se ha actualizado correctamente.')
                        }
                    }, 'Actualizando volumen seleccionado...')
                } catch (error) {
                    console.error('Error al actualizar el volumen seleccionado:', error)
                    showError('Error de Actualización', 'Error al actualizar el volumen seleccionado')
                }
            }
        )
    } catch (err) {
        error.value = err as string
    }
}
// Save a specific field for a proveedor (optimistic update, revert on failure)
const saveProveedorField = async (proveedor: any, field: string, value: string) => {
    if (!proveedor) return
    const previous = proveedor[field]
    if (previous === value) return
    try {
        // optimistic
        proveedor[field] = value
        await withSpinner(async () => {
            const formData = new FormData()
            formData.append('id', proveedor.id)
            formData.append(field, value)
            const response = await updateProveedor(formData)
            if (response && response.success) {
                showSuccess('Actualización Exitosa', 'El estado se ha guardado correctamente.')
                await getEmbarcados(Number(id))
            } else {
                throw new Error((response && (response as any).message) || 'No se pudo actualizar el proveedor')
            }
        }, 'Guardando estado...')
    } catch (err: any) {
        // revert
        proveedor[field] = previous
        console.error('Error guardando estado proveedor:', err)
        showError('Error', err?.message || 'No se pudo guardar el estado del proveedor')
    }
}
onMounted(() => {
    if (currentRole.value === ROLES.DOCUMENTACION ) {
        tabs.value = [
            {
                label: 'Documentacion',
                value: 'general'
            }
        ]
    }
    else if (currentRole.value === ROLES.COORDINACION || currentRole.value === ROLES.JEFE_IMPORTACIONES) {
        tabs.value = [
            {
                label: 'Seguimiento',
                value: 'embarcados'
            },
            {
                label: 'Documentacion',
                value: 'general'
            },
            {
                label: 'Variación',
                value: 'variacion'
            },

        ]
    } else if (currentRole.value === ROLES.COTIZADOR && currentId.value == ID_JEFEVENTAS) {
        tabs.value = [
            {
                label: 'Seguimiento',
                value: 'embarcados'
            },
            {
                label: 'Documentacion',
                value: 'general'
            },
            {
                label: 'Variación',
                value: 'variacion'
            }
        ]
    } else {
        tabs.value = [
            {
                label: 'Documentacion',
                value: 'general'
            },
            {
                label: 'Variación',
                value: 'variacion'
            }
        ]
    }
    handleTabChange(tab.value)
})
watch(() => tab.value, async (newVal) => {
    if (newVal && newVal !== '') {
        try {
            if (newVal === 'general') {
                navigateTo(`/cargaconsolidada/coordinacion/abiertos/clientes/${id}?tab=general`)
                // reset search to avoid sending stale query param to backend
                try { searchGeneral.value = '' } catch (e) { /* ignore */ }
                await getClientes(Number(id))
            } else if (newVal === 'embarcados') {
                navigateTo(`/cargaconsolidada/coordinacion/abiertos/clientes/${id}?tab=embarcados`)
                try { searchEmbarcados.value = '' } catch (e) { /* ignore */ }
                await getEmbarcados(Number(id))
            } else if (newVal === 'variacion') {
                navigateTo(`/cargaconsolidada/coordinacion/abiertos/clientes/${id}?tab=variacion`)
                try { searchVariacion.value = '' } catch (e) { /* ignore */ }
                await getClientesVariacion(Number(id))
            } else if (newVal === 'pagos') {
                navigateTo(`/cargaconsolidada/coordinacion/abiertos/clientes/${id}?tab=pagos`)
                try { searchPagos.value = '' } catch (e) { /* ignore */ }
                await getClientesPagos(Number(id))
            }
            await getHeaders(Number(id))
            //implements getHeaders
            if (fecha_documentacion_max && fecha_documentacion_max.value) {
                fMaxDocumentacion.value = fecha_documentacion_max.value
            }
            if (fecha_documentacion_max && fecha_documentacion_max.value) {
                fMaxDocumentacion.value = fecha_documentacion_max.value
            }
        } catch (error) {
            console.error('Error en carga inicial:', error)
        }
    }
}, { immediate: true })
</script>