<template>
    <div class="py-6 ">
        <DataTable v-if="tab === 'prospectos'" title="" icon="" :data="cotizaciones" :columns="getProespectosColumns()"
            :show-pagination="false" :loading="loadingCotizaciones" :current-page="currentPageCotizaciones"
            :total-pages="totalPagesCotizaciones" :total-records="totalRecordsCotizaciones"
            :items-per-page="itemsPerPageCotizaciones" :search-query-value="searchCotizaciones"
            :show-secondary-search="false" :show-filters="true" :filter-config="getFilterPerRole()" :show-export="(currentId == ID_JEFEVENTAS) ? true : false"
            empty-state-message="No se encontraron registros de prospectos."
            @update:primary-search="handleSearchProspectos" @page-change="handlePageChangeProspectos"
            @items-per-page-change="handleItemsPerPageChangeProspectos" @filter-change="handleFilterChangeProspectos" @export="exportData"
            :hide-back-button="false"
            :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`"
            :show-body-top="true">
            <template #body-top>
                <div class="flex flex-col gap-2 w-full">
                    <SectionHeader :title="`Contenedor #${carga}`" :headers="headersCotizaciones"
                        :loading="loadingHeaders" />
                    <UTabs v-model="tab" color="neutral" :items="tabs" variant="pill" class="mb-4 w-80 h-15"
                        v-if="tabs.length > 1" />
                </div>
            </template>
            <template #actions>

                <UButton v-if="currentRole === ROLES.COTIZADOR" icon="i-heroicons-plus" class="py-3"
                    label="Crear Prospecto" @click="handleAddProspecto" />
            </template>
        </DataTable>
        <DataTable v-if="tab === 'embarque'" title="" icon="" :data="cotizacionProveedor" :show-pagination="false"
            :columns="getEmbarqueColumns()" :loading="loading" :current-page="currentPage" :total-pages="totalPages"
            :total-records="totalRecords" :items-per-page="itemsPerPage" :search-query-value="search"
            :show-secondary-search="false" :show-filters="true" :filter-config="getFilterPerRole()" :show-export="(currentId == ID_JEFEVENTAS) ? true : false"
            empty-state-message="No se encontraron registros de cursos." @update:primary-search="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportData"
            @filter-change="handleFilterChange" :show-body-top="true"
            :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`"
            :hide-back-button="false">
            <template #body-top>
                <div class="flex flex-col gap-2 w-full">
                    <SectionHeader :title="`Contenedor #${carga}`" :headers="headersCotizaciones"
                        :loading="loadingHeaders" />
                    <UTabs v-model="tab" color="neutral" :items="tabs" variant="pill" class="mb-4 w-80 h-15"
                        v-if="tabs.length > 1" />
                </div>
            </template>
            <template #actions>
                <div class="flex items-center gap-2 relative w-full lg:w-auto">

                    <div ref="filtersButtonRef" class="w-full lg:w-auto">
                        <UButton label="Upload" icon="i-heroicons-arrow-up-tray" v-if="ROLES.CONTENEDOR_ALMACEN"
                            class="h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 w-full lg:w-auto"
                            @click="showUploadPanel = !showUploadPanel" />
                    </div>
                    <div ref="filtersPanelRef" v-if="showUploadPanel && ROLES.CONTENEDOR_ALMACEN"
                        class="absolute top-full right-0 mt-2 w-full lg:w-80 max-w-[90vw] lg:max-w-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 max-h-[80vh] overflow-y-auto"
                        @click.stop>
                        <div class="flex flex-row gap-2 w-full">
                            <UButton label="Packing List" variant="ghost" class="w-full" v-if="!packingList"
                                icon="i-heroicons-arrow-up-tray" color="secondary" @click="uploadPackingList" />
                            <div v-else class="flex flex-row gap-2 w-full">
                                <!--buttton download and button delete  -->
                                <label @click="downloadPackingList" class="w-full">Packing List</label>
                                <UButton label="" variant="ghost" icon="i-heroicons-trash" color="error"
                                    @click="deletePackingList" />
                            </div>


                        </div>

                    </div>
                </div>
                <UButton v-if="currentRole === ROLES.COTIZADOR" icon="i-heroicons-plus" label="Crear Prospecto"
                    @click="handleAddProspecto" class="py-3" />
            </template>
        </DataTable>
        <DataTable v-if="tab === 'pagos'" title="" icon="" :data="cotizacionPagos" :columns="getPagosColumns()"
            :show-pagination="false" :loading="loading" :current-page="currentPage" :total-pages="totalPages"
            :total-records="totalRecords" :items-per-page="itemsPerPage" :search-query-value="search"
            :show-secondary-search="false" :show-filters="false" :filter-config="filterConfig" :show-export="false"
            empty-state-message="No se encontraron registros de pagos." @update:primary-search="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange"
            @filter-change="handleFilterChange" :show-body-top="true" :hide-back-button="false"
            :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`">
            <template #body-top>
                <div class="flex flex-col gap-2 w-full">
                    <SectionHeader :title="`Contenedor #${carga}`" :headers="headersCotizaciones"
                        :loading="loadingHeaders" />
                    <UTabs v-model="tab" color="neutral" :items="tabs" size="sm" variant="pill" class="mb-4 w-80 h-15"
                        v-if="tabs.length > 1" />
                </div>
            </template>
            <template #actions>
                <UButton v-if="currentRole === ROLES.COTIZADOR" icon="i-heroicons-plus" label="Crear Prospecto"
                    @click="handleAddProspecto" class="py-3" />
            </template>
        </DataTable>
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
import { useCotizacion } from '~/composables/cargaconsolidada/useCotizacion'
import { formatDate, formatCurrency } from '~/utils/formatters'
import { useSpinner } from '~/composables/commons/useSpinner'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import { USelect, UInput, UButton, UIcon, UBadge } from '#components'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useModal } from '~/composables/commons/useModal'
import CreateProspectoModal from '~/components/cargaconsolidada/CreateProspectoModal.vue'
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
import MoveCotizacionModal from '~/components/cargaconsolidada/MoveCotizacionModal.vue'
import CreatePagoModal from '~/components/commons/CreatePagoModal.vue'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import AdelantoPreviewModal from '~/components/commons/AdelantoPreviewModal.vue'
import SectionHeader from '~/components/commons/SectionHeader.vue'
import { useCotizacionPagos } from '~/composables/cargaconsolidada/useCotizacionPagos'
import { usePagos } from '~/composables/cargaconsolidada/clientes/usePagos'
import PagoGrid from '~/components/PagoGrid.vue'
import { ConsolidadoService } from '~/services/cargaconsolidada/consolidadoService'

const { getCotizacionProveedor, 
        updateProveedorEstado,
        updateProveedor,
        cotizacionProveedor,
        loading,
        currentPage,
        totalPages,
        totalRecords,
        itemsPerPage,
        search,
        filterConfig,
        handleSearch,
        handlePageChange,
        handleItemsPerPageChange,
        handleFilterChange,
        resetFiltersProveedor,
        exportData: exportEmbarqueData,
        refreshRotuladoStatus,
    } = useCotizacionProveedor()
const { cotizaciones,
        refreshCotizacionFile,
        deleteCotizacion,
        deleteCotizacionFile,
        updateEstadoCotizacionCotizador,
        loading: loadingCotizaciones,
        error: errorCotizaciones,
        pagination: paginationCotizaciones,
        search: searchCotizaciones,
        itemsPerPage: itemsPerPageCotizaciones,
        totalPages: totalPagesCotizaciones,
        totalRecords: totalRecordsCotizaciones,
        currentPage: currentPageCotizaciones,
        filters: filtersCotizaciones,
        getCotizaciones,
        headersCotizaciones,
        getHeaders,
        carga,
        loadingHeaders,
        resetFiltersCotizacion,
        packingList,
        exportData: exportProspectosData,
    } = useCotizacion()
const { cotizacionPagos,
        loading: loadingPagos,
        error: errorPagos,
        pagination: paginationPagos,
        search: searchPagos,
        itemsPerPage: itemsPerPagePagos,
        totalPages: totalPagesPagos,
        totalRecords: totalRecordsPagos,
        currentPage: currentPagePagos,
        filters: filtersPagos,
        getCotizacionPagos,
        headers: headersPagos
    } = useCotizacionPagos()

// Registrar/eliminar pagos para el grid de adelantos
const { registrarPago, deletePago } = usePagos()

const showUploadPanel = ref(false)


const { withSpinner } = useSpinner()
import { STATUS_BG_PAGOS_CLASSES } from '~/constants/ui'
const route = useRoute()
const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
const { showConfirmation, showSuccess, showError } = useModal()

const tab = ref('')
import { STATUS_BG_CLASSES, CUSTOMIZED_ICONS } from '~/constants/ui'
const { currentRole, currentId } = useUserRole()
const tabs = ref([])
import SimpleUploadFileModal from '~/components/commons/SimpleUploadFile.vue'
const loadTabs = () => {
    switch (currentRole.value) {
        case ROLES.COORDINACION:
            tabs.value = [
                {
                    label: 'Prospectos',
                    value: 'prospectos'
                },
                {
                    label: 'Por Embarcar',
                    value: 'embarque'
                },
                {
                    label: 'Pagos',
                    value: 'pagos'
                }

            ]
            break
        case ROLES.COTIZADOR:
            tabs.value = [
                {
                    label: 'Prospectos',
                    value: 'prospectos'
                },
                {
                    label: 'Por Embarcar',
                    value: 'embarque'
                }
            ]
            break
        default:
            tabs.value = [
                {
                    label: 'Por Embarcar',
                    value: 'embarque'
                }
            ]
            break
    }
}
const overlay = useOverlay()
const simpleUploadFileModal = overlay.create(SimpleUploadFileModal)

const exportData = async () => {
  if (tab.value === 'prospectos') {
    await exportProspectosData()
  } if (tab.value === 'embarque') {
    await exportEmbarqueData()
  }
}

const filterConfigProspectosCoordinacion = ref([
    {
        label: 'Fecha Inicio',
        key: 'fecha_inicio',
        type: 'date',
        placeholder: 'Selecciona una fecha',
        options: []
    },

    {
        label: 'Fecha Fin',
        key: 'fecha_fin',
        type: 'date',
        placeholder: 'Selecciona una fecha',
        options: []
    },

    {
        key: 'estado_coordinacion',
        label: 'Estado',
        type: 'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: 'todos', inrow: false },
            { label: 'ROTULADO', value: 'ROTULADO', inrow: true },
            { label: 'DATOS PROVEEDOR', value: 'DATOS PROVEEDOR', inrow: true },
            { label: 'INSPECCIONADO', value: 'INSPECCIONADO', inrow: true },
            { label: 'COBRANDO', value: 'COBRANDO', inrow: true },

        ]
    },
    {
        key: 'estado_china',
        label: 'Estado Proveedor',
        type: 'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: 'todos', inrow: false },
            { label: 'NC', value: 'NC', inrow: true },
            { label: 'C', value: 'C', inrow: true },
            { label: 'R', value: 'R', inrow: true },
            { label: 'INSPECTION', value: 'INSPECTION', inrow: true },
            { label: 'LOADED', value: 'LOADED', inrow: true },
            { label: 'NO LOADED', value: 'NO LOADED', inrow: true }
        ]
    }
])
const filterConfigProspectos = ref([
    {
        label: 'Fecha Inicio',
        key: 'fecha_inicio',
        type: 'date',
        placeholder: 'Selecciona una fecha',
        options: []
    },

    {
        label: 'Fecha Fin',
        key: 'fecha_fin',
        type: 'date',
        placeholder: 'Selecciona una fecha',
        options: []
    },
    {
        key: 'estado_cotizador',
        label: 'Estado',
        type: 'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: 'todos', inrow: false },
            { label: 'PENDIENTE', value: 'PENDIENTE', inrow: true },
            { label: 'COTIZADO', value: 'COTIZADO', inrow: true },
            { label: 'CONTACTADO', value: 'CONTACTADO', inrow: false },
            { label: 'CONFIRMADO', value: 'CONFIRMADO', inrow: true }
        ]
    },

])
const getFilterPerRole = () => {
    if (currentRole.value === ROLES.COORDINACION) {
        return filterConfigProspectosCoordinacion.value
    } else {
        return filterConfigProspectos.value
    }
}

const uploadPackingList = () => {
    showUploadPanel.value = false
    simpleUploadFileModal.open({
        title: 'Subir Packing List',
        onClose: () => simpleUploadFileModal.close(),
        onSave: async (data: { file: File }) => {
            const formData = new FormData()
            formData.append('file', data.file)
            formData.append('idContenedor', id)
            const result = await ConsolidadoService.uploadPackingList(formData)
            await withSpinner(async () => {
                if (result.success) {
                    showSuccess('Packing List subido correctamente', 'success')
                } else {
                    showError('Error', result.error || 'Error al subir el packing list')
                }
            })
            await getHeaders(Number(id))

        }
    })
}

const downloadPackingList = () => {
    window.open(packingList.value, '_blank')
}

const deletePackingList = () => {
    showUploadPanel.value = false
    showConfirmation('Confirmar eliminación', '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.', async () => {
        await withSpinner(async () => {
            const result = await ConsolidadoService.deletePackingList(Number(id))
            if (result.success) {
                showSuccess('Packing List eliminado correctamente', 'success')
            }
        }, 'Eliminando packing list...')
        await getHeaders(Number(id))
    })
}

const prospectosCoordinacionColumns = ref<TableColumn<any>[]>([
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
            const fecha = row.getValue('fecha')
            return fecha ? formatDate(fecha, { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
        }
    },
    {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }: { row: any }) => {
            const nombre = row.getValue('nombre')
            return h('div',{
                class: 'max-w-30 whitespace-normal',
            }, nombre
            )
        }
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }: { row: any }) => {
            const documento = row.getValue('documento')
            return h('div',{
                class: 'max-w-18 whitespace-normal',
            }, documento
            )
        }
    },
    {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ row }: { row: any }) => {
            const correo = row.getValue('correo')
            return h('div',{
                class: 'max-w-55 whitespace-normal',
            }, correo || 'Sin correo'
            )
        }
    },
    {
        accessorKey: 'telefono',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => {
            const telefono = row.getValue('telefono')
            return h('div',{
                class: 'max-w-20 whitespace-normal',
            }, telefono
            )
        }
    },
    {
        accessorKey: 'estado_cliente',
        header: 'T. Cliente',
        cell: ({ row }: { row: any }) => row.original.tipo_cliente || 'Sin estado'
    },
    {
        accessorKey: 'volumen',
        header: 'Volumen',
        cell: ({ row }: { row: any }) => row.getValue('volumen')
    },
    {
        accessorKey: 'qty_item',
        header: 'Qty Item',
        cell: ({ row }: { row: any }) => row.getValue('qty_item') || '0'
    },
    {
        accessorKey: 'fob',
        header: 'Fob',
        cell: ({ row }: { row: any }) => {
            const fob = parseFloat(row.original.fob)
            return formatCurrency(fob, 'USD')
        }
    },
    {
        accessorKey: 'logistica',
        header: 'Logistica',
        cell: ({ row }: { row: any }) => {
            const logistica = parseFloat(row.original.monto)
            return formatCurrency(logistica, 'USD')
        }
    },
    {
        accessorKey: 'impuestos',
        header: 'Impuesto',
        cell: ({ row }: { row: any }) => {
            const impuestos = parseFloat(row.getValue('impuestos'))
            return formatCurrency(impuestos, 'USD')
        }
    },
    {
        accessorKey: 'tarifa',
        header: 'Tarifa',
        cell: ({ row }: { row: any }) => {
            const tarifa = parseFloat(row.getValue('tarifa'))
            return formatCurrency(tarifa, 'USD')
        }
    },
    {
        accessorKey: 'cotizacion',
        header: 'Cotizacion',
        cell: ({ row }: { row: any }) => {
            // div with 3 button with icons file ,refresh an delete
            return h('div', {
                class: 'flex flex-row gap-2'
            }, [
                !row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-arrow-up-tray',
                    variant: 'ghost',
                    size: 'xs',
                    //add tooltip
                    tooltip: 'Subir Cotizacion',
                    onClick: () => {
                        handleUpdateCotizacion(row.original.id)
                    }
                }) : null,
                row.original.cotizacion_file_url ? h('div', {
                    innerHTML: CUSTOMIZED_ICONS.EXCEL,
                    class: 'cursor-pointer',
                    onClick: () => {
                        downloadFile(row.original.cotizacion_file_url)
                    }
                }) : null,
                row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-arrow-path',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'secondary',
                    onClick: () => {
                        handleRefresh(row.original.id)
                    }
                }) : null,
                row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-trash',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'secondary',
                    onClick: () => {
                        handleDeleteFile(row.original.id)
                    }
                }) : null,
                h(UButton, {
                    icon: 'i-heroicons-arrow-right',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'info',
                    onClick: () => {
                        handleMoveCotizacion(row.original.id)
                    }
                })
            ])
        }

    },
    //action cols borrar cot
    {
        accessorKey: 'action',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            return h(UButton, {
                icon: 'i-heroicons-trash',
                variant: 'ghost',
                activeColor: 'error',
                size: 'xs',
                onClick: () => {
                    handleDelete(row.original.id)
                }
            })
        }
    }
])

const prospectosColumns = ref<TableColumn<any>[]>([
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
            const fecha = row.getValue('fecha')
            return fecha ? formatDate(fecha, { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
        }
    },
    {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }: { row: any }) => row.getValue('nombre')
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }: { row: any }) => row.getValue('documento')
    },
    {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ row }: { row: any }) => row.getValue('correo') || 'Sin correo'
    },
    {
        accessorKey: 'telefono',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => row.getValue('telefono')
    },
    {
        accessorKey: 'estado_cliente',
        header: 'T. Cliente',
        cell: ({ row }: { row: any }) => row.original.tipo_cliente || 'Sin estado'
    },
    {
        accessorKey: 'volumen',
        header: 'Volumen',
        cell: ({ row }: { row: any }) => row.getValue('volumen')
    },
    {
        accessorKey: 'qty_item',
        header: 'Qty Item',
        cell: ({ row }: { row: any }) => row.getValue('qty_item') || '0'
    },
    {
        accessorKey: 'fob',
        header: 'Fob',
        cell: ({ row }: { row: any }) => {
            const fob = parseFloat(row.original.fob)
            return formatCurrency(fob, 'USD')
        }
    },
    {
        accessorKey: 'logistica',
        header: 'Logistica',
        cell: ({ row }: { row: any }) => {
            // Campo calculado o por defecto
            const monto = parseFloat(row.original.monto)
            return formatCurrency(monto, 'USD')
        }
    },
    {
        accessorKey: 'impuestos',
        header: 'Impuesto',
        cell: ({ row }: { row: any }) => {
            // Campo calculado o por defecto
            const impuestos = parseFloat(row.original.impuestos)
            return formatCurrency(impuestos, 'USD')
        }
    },
    {
        accessorKey: 'tarifa',
        header: 'Tarifa',
        cell: ({ row }: { row: any }) => {
            return formatCurrency(parseFloat(row.original.tarifa), 'USD')
        }
    },
    {
        accessorKey: 'cotizacion',
        header: 'Cotizacion',
        cell: ({ row }: { row: any }) => {
            // div with 3 button with icons file ,refresh an delete
            return h('div', {
                class: 'flex flex-row gap-2'
            }, [
                !row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-arrow-up-tray',
                    variant: 'ghost',
                    size: 'xs',
                    //add tooltip
                    tooltip: 'Subir Cotizacion',
                    onClick: () => {
                        handleUpdateCotizacion(row.original.id)
                    }
                }) : null,
                row.original.cotizacion_file_url ? h('div', {
                    innerHTML: CUSTOMIZED_ICONS.EXCEL,
                    class: 'cursor-pointer',
                    onClick: () => {
                        downloadFile(row.original.cotizacion_file_url)
                    }
                }) : null,
                row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-arrow-path',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'secondary',
                    onClick: () => {
                        handleRefresh(row.original.id)
                    }
                }) : null,
                row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-trash',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'secondary',
                    onClick: () => {
                        handleDeleteFile(row.original.id)
                    }
                }) : null,
                h(UButton, {
                    icon: 'i-heroicons-arrow-right',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'info',
                    onClick: () => {
                        handleMoveCotizacion(row.original.id)
                    }
                })
            ])
        }

    },
    {
        accessorKey: 'estado_cotizador',
        header: 'Estado',

        cell: ({ row }: { row: any }) => {
            const estado = row.getValue('estado_cotizador') || row.original.estado
            const color = getEstadoColor(estado)

            return h(USelect as any, {
                items: filterConfigProspectos.value
                    .find((filter: any) => filter.key === 'estado_cotizador')?.options
                    .filter((option: any) => option.inrow) || [],
                placeholder: 'Seleccionar estado',
                modelValue: estado,
                color: color,
                class: ['min-w-36', STATUS_BG_CLASSES[estado as keyof typeof STATUS_BG_CLASSES]].join(' '),
                'onUpdate:modelValue': (value: any) => {
                    if (value && value !== estado) {
                        handleUpdateEstadoCotizacion(row.original.id, value)
                    }
                }
            })
        }
    }
])
//N.	Nombre	DNI/RUC	Whatsapp	T. Cliente	Estado	Conceptop	Importe	Pagado	Adelantos
const getPagosColumns = () => {
    return [
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
            cell: ({ row }: { row: any }) => row.original.nombre
        },
        {
            accessorKey: 'documento',
            header: 'DNI/RUC',
            cell: ({ row }: { row: any }) => row.original.documento
        },
        {
            accessorKey: 'whatsapp',
            header: 'Whatsapp',
            cell: ({ row }: { row: any }) => row.original.telefono
        },
        {
            accessorKey: 'tipo_cliente',
            header: 'T. Cliente',
            cell: ({ row }: { row: any }) => {
                return row.original.tipo_cliente
            }
        },
        {
            accessorKey: 'estado_pago',
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
            cell: ({ row }: { row: any }) => row.original.tipo_pago
        },
        {
            accessorKey: 'importe',
            header: 'Importe',
            cell: ({ row }: { row: any }) => formatCurrency(row.original.monto)
        },
        {
            accessorKey: 'pagado',
            header: 'Pagado',
            cell: ({ row }: { row: any }) => formatCurrency(row.original.total_pagos)
        },
        /**adleantos "pagos": [
                {
                    "id": 291,
                    "monto": "1237.6000",
                    "fecha_pago": "2025-07-30",
                    "estado": "PENDIENTE",
                    "is_confirmed": 0,
                    "banco": "BCP",
                    "voucher_url": "https:\/\/intranet.probusiness.pe\/assets\/cargaconsolidada\/pagos\/1753917804_WhatsApp%20Image%202025-07-30%20at%206.22.03%20PM.jpeg"
                }
            ] */
        {
            accessorKey: 'adelantos',
            header: 'Adelantos',
            cell: ({ row }: { row: any }) => {
                const pagos = row.original.pagos || []
                return h(PagoGrid, {
                    numberOfPagos: 4,
                    pagoDetails: pagos,
                    clienteNombre: row.original.nombre,
                    currency: 'USD',
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
                                getCotizacionPagos(Number(id))
                                getHeaders(Number(id))
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
                                            await getCotizacionPagos(Number(id))
                                            showSuccess('Eliminación Exitosa', 'El pago se ha eliminado correctamente.')
                                            getHeaders(Number(id))
                                        }
                                    }, 'Eliminando pago...')
                                } catch (error) {
                                    console.error('Error al eliminar el pago:', error)
                                    showError('Error de Eliminación', 'Error al eliminar el pago')
                                }
                            }
                        )
                    }
                }) as any
            }
        }
    ]
}
const embarqueCotizadorColumns = ref<TableColumn<any>[]>([
    //Asesor	Status	N.	Buyer	Whatsapp	Estado	Productos	Qty Box	CBM t.	Weight	Supplier	C. Supplier	P. Number	Qty Box.	CBM Ch.	Arrive Date	Acciones
    {
        accessorKey: 'asesor',
        header: 'Asesor',
        cell: ({ row }: { row: any }) => {
            const asesor = row.original.No_Nombres_Apellidos
            return h('div', {
                class: 'max-w-25 whitespace-normal',
            }, asesor)
        }
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores

            const div = h('div',
                {
                    class: 'flex flex-col gap-2'
                },
                proveedores.map((proveedor: any) => {
                    return h(USelect as any, {
                        items: filterConfig.value.find((filter: any) => filter.key === 'estado_china')?.options,
                        placeholder: 'Seleccionar estado',
                        value: proveedor.estados_proveedor,
                        class: STATUS_BG_CLASSES[proveedor.estados_proveedor as keyof typeof STATUS_BG_CLASSES],
                        disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
                        modelValue: proveedor.estados_proveedor,
                        'onUpdate:modelValue': (value: any) => {
                            proveedor.estados_proveedor = value
                            handleUpdateProveedorEstado(proveedor.id, value)
                        }
                    })
                }))
            return div

        }
    },
    {
        accessorKey: 'n',
        header: 'N.',
        cell: ({ row }: { row: any }) => {
            //return index + 1
            return row.index + 1
        }
    },
    {
        accessorKey: 'buyer',
        header: 'Buyer',
        cell: ({ row }: { row: any }) => {
            const nombre = row.original.nombre
            const div = h('div', {
                //que tenga un max width y si es muy largo que lo haga doble linea
                class: 'max-w-45 whitespace-normal',
            }, nombre)
            return div
        }
    },
    {
        accessorKey: 'whatsapp',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => {
            const telefono = row.original.telefono
            return h('div', {
                class: 'max-w-20 whitespace-normal',
            }, telefono)
        }
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const estados = [
                {
                    label: 'Seleccionar',
                    value: 'PENDIENTE',
                    disabled: true
                },
                {
                    label: 'ROTULADO',
                    value: 'ROTULADO',
                },
                {
                    label: 'DATOS PROVEEDOR',
                    value: 'DATOS PROVEEDOR',
                    disabled: true
                },
                {
                    label: 'INSPECCIONADO',
                    value: 'INSPECCIONADO',
                    disabled: true
                },
                {
                    label: 'COBRANDO',
                    value: 'COBRANDO',
                },
                {
                    label: 'RESERVADO',
                    value: 'RESERVADO',
                },


            ]
            console.log(proveedores)
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(USelect as any, {
                    items: estados,
                    placeholder: 'Seleccionar estado',
                    modelValue: proveedor.estados,
                    class: 'w-full w-30',
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.estados = value
                        handleUpdateProveedorEstado(proveedor.id, value)
                    }
                })
            }))
            return div

        }
    },
    {
        accessorKey: 'productos',
        header: 'Productos',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.products,
                    class: 'w-full w-40',
                    disabled: currentRole.value !== ROLES.COTIZADOR,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.products = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'qty_box',
        header: 'Qty Box',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.qty_box,
                    class: 'w-full w-10',
                    disabled: true,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.qty_box = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'cbm_total',
        header: 'CBM t.',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.cbm_total,
                    class: 'w-full w-12',
                    disabled: true,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.cbm_total = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'peso',
        header: 'Weight',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.peso,
                    class: 'w-full w-15',
                    disabled: true,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.peso = value
                    }
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
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.supplier = value
                    }
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
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.code_supplier = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'supplier_phone',
        header: 'Supplier Phone',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.supplier_phone,
                    class: 'w-full w-30',
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.supplier_phone = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'qty_box_supplier',
        header: 'Qty Box Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.qty_box_china,
                    class: 'w-full',
                    disabled: currentRole.value === ROLES.CONTENEDOR_ALMACEN,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.qty_box_china = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'cbm_total_supplier',
        header: 'CBM Total Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.cbm_total_china,
                    class: 'w-full',
                    disabled: currentRole.value === ROLES.CONTENEDOR_ALMACEN,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.cbm_total_china = value
                    }
                })
            }))
            return div
        }
    },

    {
        accessorKey: 'arrive_date',
        header: 'Arrive Date',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.arrive_date_china,
                    class: 'w-full w-25',
                    disabled: currentRole.value === ROLES.CONTENEDOR_ALMACEN,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.arrive_date_china = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores

            return h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h('div', {
                    class: 'flex flex-row gap-2'
                }, [
                    h(UButton, {
                        icon: 'i-heroicons-eye',
                        variant: 'ghost',
                        color: 'info',
                        size: 'md',
                        onClick: () => {
                            navigateTo(`/cargaconsolidada/completados/cotizaciones/proveedor/documentacion/${proveedor.id}`)
                        }
                    }),
                    h(UButton, {
                        icon: 'material-symbols:save-sharp',
                        variant: 'ghost',
                        color: 'primary',
                        size: 'md',
                        onClick: () => {
                            updateProveedorData(proveedor)
                        }
                    })
                ])
            }))
        }
    }
])
const embarqueCoordinacionColumns = ref<TableColumn<any>[]>([
    //Asesor	Status	N.	Buyer	Whatsapp	Estado	Productos	Qty Box	CBM t.	Weight	Supplier	C. Supplier	P. Number	Qty Box.	CBM Ch.	Arrive Date	Acciones
    {
        accessorKey: 'asesor',
        header: 'Asesor',
        cell: ({ row }: { row: any }) => {
            const asesor = row.original.No_Nombres_Apellidos
            return h('div', {
                class: 'max-w-25 whitespace-normal',
            }, asesor)
        }
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores

            const div = h('div',
                {
                    class: 'flex flex-col gap-2'
                },
                proveedores.map((proveedor: any) => {
                    return h(USelect as any, {
                        items: filterConfig.value.find((filter: any) => filter.key === 'estado_china')?.options,
                        placeholder: 'Seleccionar estado',
                        value: proveedor.estados_proveedor,
                        class: STATUS_BG_CLASSES[proveedor.estados_proveedor as keyof typeof STATUS_BG_CLASSES],
                        disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
                        modelValue: proveedor.estados_proveedor,
                        'onUpdate:modelValue': (value: any) => {
                            proveedor.estados_proveedor = value
                            handleUpdateProveedorEstado(proveedor.id, value)
                        }
                    })
                }))
            return div

        }
    },
    {
        accessorKey: 'n',
        header: 'N.',
        cell: ({ row }: { row: any }) => {
            //return index + 1
            return row.index + 1
        }
    },
    {
        accessorKey: 'buyer',
        header: 'Buyer',
        cell: ({ row }: { row: any }) => {
            const nombre = row.original.nombre
            const div = h('div', {
                //que tenga un max width y si es muy largo que lo haga doble linea
                class: 'max-w-45 whitespace-normal',
            }, nombre)
            return div
        }
    },
    {
        accessorKey: 'whatsapp',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => {
            const telefono = row.original.telefono
            return h('div', {
                class: 'max-w-20 whitespace-normal',
            }, telefono)
        }
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const estados = [
                {
                    label: 'Seleccionar',
                    value: 'PENDIENTE',
                    disabled: true
                },
                {
                    label: 'ROTULADO',
                    value: 'ROTULADO',
                },
                {
                    label: 'DATOS PROVEEDOR',
                    value: 'DATOS PROVEEDOR',
                    disabled: true
                },
                {
                    label: 'INSPECCIONADO',
                    value: 'INSPECCIONADO',
                    disabled: true
                },
                {
                    label: 'COBRANDO',
                    value: 'COBRANDO',
                },
                {
                    label: 'RESERVADO',
                    value: 'RESERVADO',
                },


            ]
            console.log(proveedores)
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(USelect as any, {
                    items: estados,
                    placeholder: 'Seleccionar estado',
                    modelValue: proveedor.estados,
                    class: 'w-full w-30',
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.estados = value
                        handleUpdateProveedorEstado(proveedor.id, value)
                    }
                })
            }))
            return div

        }
    },
    {
        accessorKey: 'productos',
        header: 'Productos',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.products,
                    class: 'w-full w-40',
                    disabled: currentRole.value !== ROLES.COTIZADOR,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.products = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'qty_box',
        header: 'Qty Box',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.qty_box,
                    class: 'w-full w-10',
                    disabled: true,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.qty_box = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'cbm_total',
        header: 'CBM t.',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.cbm_total,
                    class: 'w-full w-12',
                    disabled: true,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.cbm_total = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'peso',
        header: 'Weight',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.peso,
                    class: 'w-full w-15',
                    disabled: true,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.peso = value
                    }
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
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.supplier = value
                    }
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
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.code_supplier = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'supplier_phone',
        header: 'Supplier Phone',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.supplier_phone,
                    class: 'w-full w-30',
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.supplier_phone = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'qty_box_supplier',
        header: 'Qty Box Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.qty_box_china,
                    class: 'w-full',
                    disabled: currentRole.value === ROLES.CONTENEDOR_ALMACEN,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.qty_box_china = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'cbm_total_supplier',
        header: 'CBM Total Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.cbm_total_china,
                    class: 'w-full',
                    disabled: currentRole.value === ROLES.CONTENEDOR_ALMACEN,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.cbm_total_china = value
                    }
                })
            }))
            return div
        }
    },

    {
        accessorKey: 'arrive_date',
        header: 'Arrive Date',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.arrive_date_china,
                    class: 'w-full w-25',
                    disabled: currentRole.value === ROLES.CONTENEDOR_ALMACEN,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.arrive_date_china = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores

            return h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h('div', {
                    class: 'flex flex-row gap-2'
                }, [
                    h(UButton, {
                        icon: 'i-heroicons-eye',
                        variant: 'ghost',
                        color: 'info',
                        size: 'md',
                        onClick: () => {
                            navigateTo(`/cargaconsolidada/completados/cotizaciones/proveedor/documentacion/${proveedor.id}`)
                        }
                    }),
                    h(UButton, {
                        icon: 'material-symbols:save-sharp',
                        variant: 'ghost',
                        color: 'primary',
                        size: 'md',
                        onClick: () => {
                            updateProveedorData(proveedor)
                        }
                    }),
                    h(UButton, {
                        icon: 'i-heroicons-arrow-path-rounded-square',
                        variant: 'ghost',
                        color: proveedor.send_rotulado_status ? 'primary' : 'secondary',
                        size: 'md',
                        onClick: () => {
                            if(proveedor.send_rotulado_status=="SENDED"){
                                handleRefreshRotuladoStatus(proveedor)
                            }
                        }
                    })
                ])
            }))
        }
    }
])
const embarqueCotizadorColumnsAlmacen = ref<TableColumn<any>[]>([
    //	Status	N.	Buyer	Productos	Qty Box	CBM t.	Weight	Supplier	C. Supplier	P. Number	Qty Box.	CBM Ch.	Arrive Date	Acciones
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores

            const div = h('div',
                {
                    class: 'flex flex-col gap-2'
                },
                proveedores.map((proveedor: any) => {
                    return h(USelect as any, {
                        items: filterConfig.value.find((filter: any) => filter.key === 'estado_china')?.options,
                        placeholder: 'Seleccionar estado',
                        value: proveedor.estados_proveedor,
                        class: STATUS_BG_CLASSES[proveedor.estados_proveedor as keyof typeof STATUS_BG_CLASSES],
                        disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
                        modelValue: proveedor.estados_proveedor,
                        'onUpdate:modelValue': (value: any) => {
                            proveedor.estados_proveedor = value
                            handleUpdateProveedorEstado(proveedor.id, value)
                        }
                    })
                }))
            return div

        }
    },
    {
        accessorKey: 'n',
        header: 'N.',
        cell: ({ row }: { row: any }) => {
            //return index + 1
            return row.index + 1
        }
    },
    {
        accessorKey: 'buyer',
        header: 'Buyer',
        cell: ({ row }: { row: any }) => {
            const nombre = row.original.nombre
            return h('div', {
                class: 'max-w-45 whitespace-normal',
            }, nombre)
        }
    },
    {
        accessorKey: 'productos',
        header: 'Productos',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.products,
                    class: 'w-full w-40',
                    disabled: currentRole.value !== ROLES.COTIZADOR,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.products = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'qty_box',
        header: 'Qty Box',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.qty_box,
                    class: 'w-full',
                    disabled: true,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.qty_box = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'cbm_total',
        header: 'CBM t.',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.cbm_total,
                    class: 'w-full',
                    disabled: true,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.cbm_total = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'peso',
        header: 'Weight',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.peso,
                    class: 'w-full',
                    disabled: true,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.peso = value
                    }
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
                    class: 'w-full',
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.supplier = value
                    }
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
                class: 'flex flex-col gap-2 w-25'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.code_supplier,
                    class: 'w-full',
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.code_supplier = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'supplier_phone',
        header: 'Supplier Phone',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.supplier_phone,
                    class: 'w-full',
                    disabled: currentRole.value !== ROLES.COORDINACION,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.supplier_phone = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'qty_box_supplier',
        header: 'Qty Box Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.qty_box_china,
                    class: 'w-full',
                    disabled: false,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.qty_box_china = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'cbm_total_supplier',
        header: 'CBM Total Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.cbm_total_china,
                    class: 'w-full',
                    disabled: false,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.cbm_total_china = value
                    }
                })
            }))
            return div
        }
    },

    {
        accessorKey: 'arrive_date',
        header: 'Arrive Date',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.arrive_date_china,
                    class: 'w-full',
                    type: 'date',
                    disabled: false,
                    'onUpdate:modelValue': (value: any) => {
                        proveedor.arrive_date_china = value
                    }
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores

            return h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h('div', {
                    class: 'flex flex-row gap-2'
                }, [
                    h(UButton, {
                        icon: 'i-heroicons-eye',
                        variant: 'ghost',
                        color: 'info',
                        size: 'md',
                        onClick: () => {
                            navigateTo(`/cargaconsolidada/completados/cotizaciones/proveedor/documentacion/${proveedor.id}`)
                        }
                    }),
                    h(UButton, {
                        //save icon
                        icon: 'material-symbols:save-sharp',
                        variant: 'ghost',
                        color: 'primary',
                        size: 'md',
                        onClick: () => {
                            updateProveedorData(proveedor)
                        }
                    })
                ])
            }))
        }
    }
])
const handleRefreshRotuladoStatus = async (proveedor: any) => {
    try {
        showConfirmation('¿Estás seguro de querer actualizar el estado del proveedor?', 'Esta acción no se puede deshacer.', async () => {
        await withSpinner(async () => {
                await refreshRotuladoStatus(proveedor.id_proveedor)
            }, 'Actualizando estado del proveedor...')
        })
    } catch (error) {
        showError('Error al actualizar el estado del proveedor', error)
    }
}
const handleAddProspecto = async () => {
    const modal = overlay.create(CreateProspectoModal)
    console.log(id)
    modal.open({
        idConsolidado: Number(id),
        idCotizacion: null,
        onSuccess: () => {
            getCotizaciones(Number(id))
        },

    })
}
const handleMoveCotizacion = async (idCotizacion: number) => {
    const modal = overlay.create(MoveCotizacionModal)
    modal.open({
        show: true,
        cotizacionId: idCotizacion,
        idConsolidado: id,
        onMoved: () => {
            getCotizaciones(Number(id))
            getHeaders(Number(id))
        }
    })
}
const handleRefresh = async (idCotizacion: number) => {
    try {
        showConfirmation('¿Estás seguro de querer actualizar la cotización?', 'Esta acción no se puede deshacer.', async () => {
            await withSpinner(async () => {
                await refreshCotizacionFile(idCotizacion)
                showSuccess('Cotización actualizada correctamente', 'La cotización se ha actualizado correctamente.')
                await getCotizaciones(Number(id))
            }, 'Actualizando cotización...')
        })
    } catch (error) {
        showError('Error al actualizar la cotización', error)
    }
}
const handleUpdateEstadoCotizacion = async (idCotizacion: number, estado: string) => {
    try {
        await withSpinner(async () => {
            try {
                const response = await updateEstadoCotizacionCotizador(idCotizacion, { estado })
                if (response?.success) {
                    showSuccess('Estado actualizado correctamente', 'El estado se ha actualizado correctamente.')
                    await getCotizaciones(Number(id))
                }
            } catch (error: any) {
                console.log(error.data)
                showError('Error al actualizar el estado de la cotización', error)
            }
        }, 'Actualizando estado de la cotización...')
    } catch (error) {
        showError('Error al actualizar el estado de la cotización', error)
    }
}
const handleUpdateProveedorEstado = async (idProveedor: number, estado: string) => {
    try {
        await withSpinner(async () => {
            await updateProveedorEstado({ id: idProveedor, estado })
            showSuccess('Estado actualizado correctamente', 'El estado se ha actualizado correctamente.')
            await getCotizaciones(Number(id))
        }, 'Actualizando estado del proveedor...')
    } catch (error) {
        showError('Error al actualizar el estado del proveedor', error)
    }
}
const handleUpdateCotizacion = async (idCotizacion: number) => {
    const modal = overlay.create(CreateProspectoModal)
    console.log(idCotizacion)
    modal.open({
        idCotizacion: idCotizacion,
        idConsolidado: null,
        onSuccess: () => {
            getCotizaciones(Number(id))
        },
    })
}
const handleDeleteFile = async (idCotizacion: number) => {
    try {
        showConfirmation('¿Estás seguro de querer eliminar el archivo de esta cotización?', 'Esta acción no se puede deshacer.', async () => {
            await withSpinner(async () => {
                const response = await deleteCotizacionFile(idCotizacion)
                if (response?.success) {
                    showSuccess('Archivo eliminado correctamente', 'El archivo se ha eliminado correctamente.')
                    await getCotizaciones(Number(id))
                }
            }, 'Eliminando archivo...')
        })
    } catch (error) {
        showError('Error al eliminar el archivo de la cotización', error)
    }
}

const handleDelete = async (idCotizacion: number) => {
    try {
        showConfirmation('¿Estás seguro de querer eliminar esta cotización?', 'Esta acción no se puede deshacer.', async () => {
            await withSpinner(async () => {
                const response = await deleteCotizacion(idCotizacion)
                console.log(response)
                if (response?.success) {
                    showSuccess('Cotización eliminada correctamente', 'La cotización se ha eliminado correctamente.')
                    await getCotizaciones(Number(id))
                }
            }, 'Eliminando cotización...')
        })
    } catch (error) {
        showError('Error al eliminar cotización', error)
    }
}
const getProespectosColumns = () => {
    switch (currentRole.value) {
        case ROLES.COORDINACION:
            return prospectosCoordinacionColumns.value
        default:
            return prospectosColumns.value
    }
}
const getEmbarqueColumns = () => {
    switch (currentRole.value) {
        case ROLES.CONTENEDOR_ALMACEN:
            return embarqueCotizadorColumnsAlmacen.value
        case ROLES.COORDINACION:
            return embarqueCoordinacionColumns.value
        default:
            return embarqueCotizadorColumns.value
    }
}
// Función para obtener el color del estado
const getEstadoColor = (estado: string) => {
    switch (estado) {
        case 'PENDIENTE':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'COTIZADO':
            return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'CONFIRMADO':
            return 'bg-green-100 text-green-800 border-green-200'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}
const getEstadoPago = (estado: string) => {
    //PENDIENTE, PAGADO,ADELANTO,SOBREPAGADO
    switch (estado) {
        case 'PENDIENTE':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'PAGADO':
            return 'bg-green-100 text-green-800 border-green-200'
        case 'ADELANTO':
            return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'SOBREPAGADO':
            return 'bg-red-100 text-red-800 border-red-200'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}
const downloadFile = async (fileUrl: string) => {

    console.log(fileUrl)
    try {
        await withSpinner(async () => {
            const a = document.createElement('a')
            a.href = fileUrl
            a.download = 'archivo'
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }, 'Descargando archivo...')
    } catch (error) {
        showError('Error al descargar archivo', error as string)
    }
}
// Manejadores para prospectos
const handleSearchProspectos = (value: string) => {
    searchCotizaciones.value = value
    paginationCotizaciones.value.current_page = 1
    getCotizaciones(Number(id))
}

const handlePageChangeProspectos = (value: number) => {
    paginationCotizaciones.value.current_page = value
    getCotizaciones(Number(id))
}

const handleItemsPerPageChangeProspectos = (value: number) => {
    itemsPerPageCotizaciones.value = value
    paginationCotizaciones.value.current_page = 1
    getCotizaciones(Number(id))
}

const handleFilterChangeProspectos = async (filterType: string, value: string) => {
    filtersCotizaciones.value = {
        ...filtersCotizaciones.value,
        [filterType]: value
    }
    paginationCotizaciones.value.current_page = 1
    await getCotizaciones(Number(id))
}



// Watch inmediato para la carga inicial
watch(() => tab.value, async (newVal) => {
    if (newVal && newVal !== '') {
        try {
            resetFilters()
            if (newVal === 'prospectos') {
                navigateTo(`/cargaconsolidada/completados/cotizaciones/${id}?tab=prospectos`)
                await getCotizaciones(Number(id))
            } else if (newVal === 'embarque') {
                navigateTo(`/cargaconsolidada/completados/cotizaciones/${id}?tab=embarque`)
                await getCotizacionProveedor(Number(id))
            } else if (newVal === 'pagos') {
                navigateTo(`/cargaconsolidada/completados/cotizaciones/${id}?tab=pagos`)
                await getCotizacionPagos(Number(id))
            }
            await getHeaders(Number(id))
        } catch (error) {
            console.error('Error en carga inicial:', error)
        }
    }
}, { immediate: true })


const updateProveedorData = async (row: any) => {
    const data: any = {
        id: row.id_proveedor,

    }
    const formData = new FormData()

    if (currentRole.value === ROLES.COTIZADOR) {
        data.products = row.products ?? []
        formData.append('products', data.products)
    }
    if (currentRole.value === ROLES.COORDINACION) {
        data.supplier = row.supplier ?? []
        data.code_supplier = row.code_supplier ?? []
        data.supplier_phone = row.supplier_phone ?? []
        formData.append('supplier', data.supplier)
        formData.append('code_supplier', data.code_supplier)
        formData.append('supplier_phone', data.supplier_phone)
    }
    if (currentRole.value === ROLES.CONTENEDOR_ALMACEN) {
        data.qty_box_china = row.qty_box_china ?? []
        data.cbm_total_china = row.cbm_total_china ?? []
        data.arrive_date = row.arrive_date_china ?? []
        formData.append('qty_box_china', data.qty_box_china)
        formData.append('cbm_total_china', data.cbm_total_china)
        formData.append('arrive_date_china', data.arrive_date)
    }
    formData.append('id', data.id)

    try {
        await withSpinner(async () => {
            const response = await updateProveedor(formData)
            if (response?.success) {
                showSuccess('Proveedor actualizado correctamente', 'El proveedor se ha actualizado correctamente.')
                await getCotizacionProveedor(Number(id))
            }
        }, 'Actualizando proveedor...')

    } catch (error) {
        showError('Error al actualizar el proveedor', error)
    }

}
const resetFilters = () => {
    resetFiltersCotizacion()
    resetFiltersProveedor()
}
onMounted(() => {
    loadTabs();

    const tabQuery = route.query.tab

    if (tabQuery) {
        tab.value = tabQuery as string
    } else {
        // Ensure we access the inner array on the ref and guard empty state
        tab.value = (tabs.value && tabs.value.length > 0) ? tabs.value[0].value : '' // Cambiar a 'prospectos' como tab inicial
    }
})
</script>
