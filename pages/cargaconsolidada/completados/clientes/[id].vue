    <!--3 tabs:general,variacion,pagos and 3 tables-->
    <template>
        <div class="p-6">


            <DataTable v-if="tab === 'general'" title="" icon="" :data="clientes" :columns="getColumnsGeneral()"
                :loading="loadingGeneral" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral"
                :total-records="totalRecordsGeneral" :items-per-page="itemsPerPageGeneral"
                :search-query-value="searchGeneral" :show-secondary-search="false" :show-filters="false"
                :filters-value="filtersGeneral" :show-export="(currentId == ID_JEFEVENTAS) ? true : false" :show-body-top="true"
                :show-pagination="false" @export="exportData"
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchGeneral" @page-change="handlePageGeneralChange"
                @items-per-page-change="handleItemsPerPageChangeGeneral" @filter-change="handleFilterChangeGeneral"
                :hide-back-button="false"
                :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole == ROLES.DOCUMENTACION) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`">
                <template #body-top>
                    <div class="flex items-center justify-between w-full gap-4">
                        <div class="flex flex-col gap-2">
                            <SectionHeader :title="`Clientes #${carga}`" :headers="headers" :loading="loadingHeaders" />
                            <div class="flex justify-between">
                                <UTabs v-model="tab" :items="tabs" size="md" variant="pill" class="mb-4 w-100 h-15" color="neutral" />
                                <div class="flex flex-row items-center gap-2 bg-white dark:bg-gray-800 shadow-sm rounded p-3">
                                    <div class="flex flex-col mr-2 space-y-1">
                                        <div class="text-xs font-semibold text-orange-600">F. Max. Documentacion</div>
                                        <div class="flex items-center gap-2">
                                            <input type="date" v-model="fMaxDocumentacion" class="text-sm text-gray-700 dark:text-gray-400 bg-transparent outline-none" />
                                            <UButton size="xs" variant="outline" color="primary" icon="material-symbols:save-outline" @click="handleSaveFMaxDocumentacion"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </DataTable>
            <DataTable v-if="tab === 'embarcados'" title="" icon="" :data="clientesEmbarcados" :columns="columnsEmbarcados"
                :loading="loadingEmbarcados" :current-page="currentPageEmbarcados" :total-pages="totalPagesEmbarcados"
                :total-records="totalRecordsEmbarcados" :items-per-page="itemsPerPageEmbarcados"
                :search-query-value="searchEmbarcados" :show-secondary-search="false" :show-filters="false"
                :filters-value="filtersEmbarcados" :show-export="false" :show-body-top="true"
                :hide-back-button="false"
                :show-pagination="false" @export="exportData"
                :previous-page-url="(currentRole == ROLES.COORDINACION) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`"
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchEmbarcados" @page-change="handlePageEmbarcadosChange"
                @items-per-page-change="handleItemsPerPageChangeEmbarcados" @filter-change="handleFilterChangeEmbarcados">
                <template #body-top>
                    <div class="flex items-center justify-between w-full gap-4">
                        <div class="flex flex-col gap-2">
                            <SectionHeader :title="`Clientes #${carga}`" :headers="headers" :loading="loadingHeaders" />
                            <div class="flex justify-between">
                                <UTabs v-model="tab" :items="tabs" size="md" variant="pill" class="mb-4 w-100 h-15" color="neutral" />
                                <div class="flex flex-row items-center gap-2 bg-white dark:bg-gray-800 shadow-sm rounded p-3">
                                    <div class="flex flex-col mr-2 space-y-1">
                                        <div class="text-xs font-semibold text-orange-600">F. Max. Documentacion</div>
                                        <div class="flex items-center gap-2">
                                            <input type="date" v-model="fMaxDocumentacion" class="text-sm text-gray-700 dark:text-gray-400 bg-transparent outline-none" />
                                            <UButton size="xs" variant="outline" color="primary" icon="material-symbols:save-outline" @click="handleSaveFMaxDocumentacion"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

            </DataTable>
            <DataTable v-if="tab === 'variacion'" title="" icon="" :data="clientesVariacion" :columns="columnsVariacion"
                :loading="loadingVariacion" :current-page="currentPageVariacion" :total-pages="totalPagesVariacion"
                :total-records="totalRecordsVariacion" :items-per-page="itemsPerPageVariacion"
                :search-query-value="searchVariacion" :show-secondary-search="false" :show-filters="false"
                :filters-value="filtersVariacion" :show-export="false" :show-body-top="true"
                :hide-back-button="false"
                :show-pagination="false" @export="exportData"
                :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole == ROLES.DOCUMENTACION) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`"
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchVariacion" @page-change="handlePageVariacionChange"
                @items-per-page-change="handleItemsPerPageChangeVariacion" @filter-change="handleFilterChangeVariacion">
                <template #body-top>
                    <div class="flex items-center justify-between w-full gap-4">
                        <div class="flex flex-col gap-2">
                            <SectionHeader :title="`Clientes #${carga}`" :headers="headers" :loading="loadingHeaders" />
                            <div class="flex justify-between">
                                <UTabs v-model="tab" :items="tabs" size="md" variant="pill" class="mb-4 w-100 h-15" color="neutral" />
                                <div class="flex flex-row items-center gap-2 bg-white dark:bg-gray-800 shadow-sm rounded p-3">
                                    <div class="flex flex-col mr-2 space-y-1">
                                        <div class="text-xs font-semibold text-orange-600">F. Max. Documentacion</div>
                                        <div class="flex items-center gap-2">
                                            <input type="date" v-model="fMaxDocumentacion" class="text-sm text-gray-700 dark:text-gray-400 bg-transparent outline-none" />
                                            <UButton size="xs" variant="outline" color="primary" icon="material-symbols:save-outline" @click="handleSaveFMaxDocumentacion"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </DataTable>
            <DataTable v-if="tab === 'pagos'" title="" icon="" :data="clientesPagos" :columns="columnsPagos"
                :loading="loadingPagos" :current-page="currentPagePagos" :total-pages="totalPagesPagos"
                :total-records="totalRecordsPagos" :items-per-page="itemsPerPagePagos"
                :search-query-value="searchPagos" :show-secondary-search="false" :show-filters="false"
                :filters-value="filtersPagos" :show-export="false" :hide-back-button="false"
                :show-body-top="true"
                :show-pagination="false" @export="exportData"
                :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`"
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchVariacion" @page-change="handlePageVariacionChange"
                @items-per-page-change="handleItemsPerPageChangeVariacion" @filter-change="handleFilterChangeVariacion">
                <template #body-top>
                    <div class="flex items-center justify-between w-full gap-4">
                        <div class="flex flex-col gap-2">
                            <SectionHeader :title="`Clientes #${carga}`" :headers="headers" :loading="loadingHeaders" />
                            <div class="flex justify-between">
                                <UTabs v-model="tab" :items="tabs" size="md" variant="pill" class="mb-4 w-100 h-15" color="neutral" />
                                <div class="flex flex-row items-center gap-2 bg-white dark:bg-gray-800 shadow-sm rounded p-3">
                                    <div class="flex flex-col mr-2 space-y-1">
                                        <div class="text-xs font-semibold text-orange-600">F. Max. Documentacion</div>
                                        <div class="flex items-center gap-2">
                                            <input type="date" v-model="fMaxDocumentacion" class="text-sm text-gray-700 dark:text-gray-400 bg-transparent outline-none" />
                                            <UButton size="xs" variant="outline" color="primary" icon="material-symbols:save-outline" @click="handleSaveFMaxDocumentacion"/>
                                        </div>
                                    </div>
                                </div>
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
const { withSpinner } = useSpinner()
const { showConfirmation, showSuccess, showError } = useModal()
const { currentRole, currentId, isCoordinacion } = useUserRole()
const route = useRoute()
const id = route.params.id
const tab = ref('general')
const overlay = useOverlay()
const modalAcciones = overlay.create(ModalAcciones)
// F. Max. Documentacion (visible in the UI)
// default is placeholder '00/00/0000' until backend provides a real value
const fMaxDocumentacion = ref<string | null>(null)
const fMaxDocumentacionDisplay = computed(() => fMaxDocumentacion.value ?? '00/00/0000')

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
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }: { row: any }) => {
            return row.getValue('nombre')
        }
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }: { row: any }) => {
            return row.getValue('documento')
        }
    },
    {
        accessorKey: 'telefono',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => {
            return row.getValue('telefono')
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
            return h(USelect as any, {
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
            return !row.original.id_contenedor_pago?h(PagoGrid, {
                pagoDetails: pagos,
                currency: 'USD',
                numberOfPagos: currentRole.value == ROLES.COORDINACION ? 4 :pagos.length,
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
                showDelete: currentRole.value == ROLES.COORDINACION,
            }):null
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
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }: { row: any }) => {
            const nombre = row.getValue('nombre').toUpperCase()
            return h('div', {
                class: 'max-w-30 whitespace-normal break-words',
            }, nombre)
        }
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }: { row: any }) => {
            return row.getValue('documento')
        }
    },

    {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ row }: { row: any }) => {
            const correo = row.getValue('correo')
            return h('div', {
                class: 'max-w-40 whitespace-normal break-words',
            }, correo || 'Sin correo'
            )
        }
    },
    {
        accessorKey: 'telefono',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => {
            const telefono = row.getValue('telefono')
            return h('div', {
                class: 'max-w-20 whitespace-normal',
            }, telefono
            )
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
                    navigateTo(`/cargaconsolidada/completados/clientes/documentacion/${row.original.id_cotizacion}`)
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
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }: { row: any }) => {
            const nombre = row.getValue('nombre').toUpperCase()
            return h('div', {
                class: 'max-w-30 whitespace-normal break-words',
            }, nombre)
        }
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }: { row: any }) => {
            return row.getValue('documento')
        }
    },

    {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ row }: { row: any }) => {
            const correo = row.getValue('correo')
            return h('div',{
                //que tenga un max width y si es muy largo que lo haga doble linea pero no hay espaciados para usar whitespace
                class: 'max-w-40 whitespace-normal break-words',
            }, correo || 'Sin correo'
            )
        }
    },
    {
        accessorKey: 'telefono',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => {
            return row.getValue('telefono')
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
            return h(USelect as any, {
                //color status based on estado_cliente
                class: [STATUS_BG_CLASSES[row.original.estado_cliente as keyof typeof STATUS_BG_CLASSES], 'w-full'],
                modelValue: row.original.estado_cliente,
                items: [
                    { label: 'Reservado', value: 'RESERVADO' },
                    { label: 'No Reservado', value: 'NO RESERVADO' },
                    { label: 'Documentación', value: 'DOCUMENTACION' },
                    { label: 'C Final', value: 'C FINAL' },
                    { label: 'Facturado', value: 'FACTURADO' }
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
                    navigateTo(`/cargaconsolidada/completados/clientes/documentacion/${row.original.id_cotizacion}`)
                }
            },
            )
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
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }: { row: any }) => {
            return row.getValue('nombre')
        }
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }: { row: any }) => {
            return row.getValue('documento')
        }
    },
    {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ row }: { row: any }) => {
            return row.getValue('correo')
        }
    },
    {
        accessorKey: 'telefono',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => {
            return row.getValue('telefono')
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
            return h(USelect as any, {
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
                    navigateTo(`/cargaconsolidada/completados/clientes/documentacion/${row.original.id_cotizacion}`)
                }
            })
        }
    }
]
const getColumnsGeneral = () => {
    switch (currentRole.value) {
        case ROLES.DOCUMENTACION:
            return columnsDocumentacion
        case ROLES.COORDINACION:
            return columnsCoordinacion
        default:
            return columns
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
const columnsEmbarcados = ref<TableColumn<any>[]>([
    {
        accessorKey: 'index',
        header: 'N°',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }: { row: any }) => {
            return row.getValue('nombre')
        }
    },
    {
        accessorKey: 'whatsapp',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => {
            return row.getValue('whatsapp')
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
                        onClick: () => {
                        // Abrir la URL del proveedor directamente
                        window.open(url, '_blank')
                        }
                    }),
                    h(UButton, {
                        icon: 'i-heroicons-trash',
                        color: 'error',
                        variant: 'ghost',
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
                        onClick: () => {
                        // Abrir la URL del proveedor directamente
                        window.open(url, '_blank')
                        }
                    }),
                    h(UButton, {
                        icon: 'i-heroicons-trash',
                        color: 'error',
                        variant: 'ghost',
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
                            onClick: () => {
                            window.open(url, '_blank')
                            }
                        }),
                        h(UButton, {
                            icon: 'i-heroicons-trash',
                            color: 'error',
                            variant: 'ghost',
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
                onClick: () => {
                    //generar un modal para solicitar el tipo de recordatorio de documento
                    console.log(row.original)
                    modalAcciones.open({
                        show: true,
                        clienteId: row.original.id,
                        onSelected: (data: any) => {
                            console.log(data)
                        }
                    })
                }
            },
            )
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
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }: { row: any }) => {
            return row.getValue('nombre')
        }
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }: { row: any }) => {
            return row.getValue('documento')
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
onMounted(() => {
    if (currentRole.value === ROLES.DOCUMENTACION) {
        tabs.value = [
            {
                label: 'General',
                value: 'general'
            }
        ]
    }
    else if (currentRole.value === ROLES.COORDINACION || (currentRole.value === ROLES.COTIZADOR && currentId.value == ID_JEFEVENTAS)) {
        tabs.value = [
            {
                label: 'General',
                value: 'general'
            },
            {
                label: 'Embarcados',
                value: 'embarcados'
            },
            {
                label: 'Variación',
                value: 'variacion'
            },
            {
                label: 'Pagos',
                value: 'pagos'
            }
        ]
    } else {
        tabs.value = [
            {
                label: 'General',
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
                navigateTo(`/cargaconsolidada/completados/clientes/${id}?tab=general`)
                await getClientes(Number(id))
            } else if (newVal === 'embarcados') {
                navigateTo(`/cargaconsolidada/completados/clientes/${id}?tab=embarcados`)
                await getEmbarcados(Number(id))
            } else if (newVal === 'variacion') {
                navigateTo(`/cargaconsolidada/completados/clientes/${id}?tab=variacion`)
                await getClientesVariacion(Number(id))
            } else if (newVal === 'pagos') {
                navigateTo(`/cargaconsolidada/completados/clientes/${id}?tab=pagos`)
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