<template>
    <div class="">
        <DataTable v-if="tab === 'prospectos'" title="" icon="" :data="cotizaciones" :columns="getProespectosColumns()"
            :show-pagination="true" :loading="loadingCotizaciones" :current-page="currentPageCotizaciones"
            :total-pages="totalPagesCotizaciones" :total-records="totalRecordsCotizaciones"
            :items-per-page="itemsPerPageCotizaciones" :search-query-value="searchCotizaciones"
            :show-secondary-search="false" :show-filters="true" :filter-config="getFilterPerRole()"
            :show-export="(currentId == ID_JEFEVENTAS) ? true : false"
            empty-state-message="No se encontraron registros de prospectos."
            @update:primary-search="handleSearchProspectos" @page-change="handlePageChangeProspectos"
            @items-per-page-change="handleItemsPerPageChangeProspectos" @filter-change="handleFilterChangeProspectos"
            @export="exportData" :hide-back-button="false"
            :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole == ROLES.ADMINISTRACION || currentRole == ROLES.CONTABILIDAD) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`"
            :show-body-top="true">
            <template #body-top>
                <div class="flex flex-col gap-2 w-full">
                    <SectionHeader :title="`Contenedor #${carga}`" :headers="headersCotizaciones"
                        :loading="loadingCotizaciones || loadingHeaders" />
                    <UTabs v-model="tab" color="neutral" :items="tabs" size="sm" variant="pill" class="mb-1 w-80 h-15"
                        v-if="tabs.length > 1" />
                </div>
            </template>
            <template #actions>

                <UButton v-if="currentRole === ROLES.COTIZADOR" icon="i-heroicons-plus" class="py-3 md:flex hidden"
                    label="Crear Prospecto" @click="handleAddProspecto" />
            </template>
        </DataTable>
            <DataTable v-if="tab === 'embarque'" title="" icon="" :data="cotizacionProveedor" :show-pagination="false"
            :columns="getEmbarqueColumns()" :loading="loading || loadingHeaders" :current-page="currentPage" :total-pages="totalPages"
            :total-records="totalRecords" :items-per-page="itemsPerPage" :search-query-value="search"
            :show-secondary-search="false" :show-filters="true" :filter-config="getFilterPerRole()" :show-export="false"
            empty-state-message="No se encontraron registros de cursos." @update:primary-search="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportData"
            @filter-change="handleFilterChange" :show-body-top="true"
            :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole == ROLES.CONTABILIDAD) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`"
            :hide-back-button="false">
            <template #body-top>
                <div class="flex flex-col gap-2 w-full">
                    <SectionHeader :title="`Contenedor #${carga}`" :headers="headersCotizaciones"
                        :loading="loading || loadingHeaders" />
                    <UTabs v-model="tab" color="neutral" :items="tabs" size="sm" variant="pill" class="mb-1 w-80 h-15"
                        v-if="tabs.length > 1" />
                </div>
            </template>
            <template #actions>
                <div class="flex items-center gap-2 relative w-full lg:w-auto">

                    <div ref="filtersButtonRef" class="w-full lg:w-auto">
                        <UButton label="Upload" icon="i-heroicons-arrow-up-tray" v-if="currentRole === ROLES.CONTENEDOR_ALMACEN"
                            class="h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 w-full lg:w-auto hidden md:flex"
                            @click="showUploadPanel = !showUploadPanel" />
                    </div>
                    <div ref="filtersPanelRef" v-if="showUploadPanel && currentRole === ROLES.CONTENEDOR_ALMACEN"
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
                    @click="handleAddProspecto" class="py-3 md:flex hidden" />
                <UButton v-if="currentRole === ROLES.COORDINACION || currentRole == ROLES.CONTABILIDAD" icon="i-heroicons-arrow-down-tray" color="success"
                    label="Descargar Embarque" @click="handleDownloadEmbarque" class="py-3 hidden md:flex" />
            </template>
        </DataTable>
        <DataTable v-if="tab === 'pagos'" title="" icon="" :data="cotizacionPagos" :columns="getPagosColumns()"
            :show-pagination="false" :loading="loadingPagos || loadingHeaders" :current-page="currentPagePagos"
            :total-pages="totalPagesPagos" :total-records="totalRecordsPagos" :items-per-page="itemsPerPagePagos"
            :search-query-value="searchPagos" :show-secondary-search="false" :show-filters="currentRole === ROLES.CONTABILIDAD"
            :filter-config="getFilterConfigPagos()" :show-export="false"
            empty-state-message="No se encontraron registros de pagos." @update:primary-search="handleSearchPagos"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange"
            @filter-change="handleFilterChangePagos" :show-body-top="true" :hide-back-button="false"
            :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole == ROLES.CONTABILIDAD) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`">
            <template #body-top>
                <div class="flex flex-col gap-2 w-full">
                    <SectionHeader :title="`Contenedor #${carga}`" :headers="headersPagos"
                        :loading="loadingPagos || loadingHeaders" />
                    <UTabs v-model="tab" color="neutral" :items="tabs" size="sm" variant="pill" class="mb-1 w-80 h-15"
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
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
import { useCotizacion } from '~/composables/cargaconsolidada/useCotizacion'
import { formatDate, formatCurrency } from '~/utils/formatters'
import { formatDateForInput } from '~/utils/data-table'
import { useSpinner } from '~/composables/commons/useSpinner'
import { ROLES, ID_JEFEVENTAS, COTIZADORES_WITH_PRIVILEGES } from '~/constants/roles'
import { USelect, UInput, UButton, UIcon, UBadge, UTooltip } from '#components'
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
import SelectTipoCargaModal from '~/components/cargaconsolidada/SelectTipoCargaModal.vue'
import PagoGrid from '~/components/PagoGrid.vue'
import { ConsolidadoService } from '~/services/cargaconsolidada/consolidadoService'
import ModalAcciones from '~/components/cargaconsolidada/clientes/ModalAcciones.vue'

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

const { getCotizacionProveedor,
    updateProveedorEstado,
    updateProveedor,
    updateArriveDate,
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
    downloadEmbarque,
    sendRotulado
} = useCotizacionProveedor()
const { cotizaciones,
    refreshCotizacionFile,
    deleteCotizacion,
    deleteCotizacionFile,
    sendRecordatorioFirmaContrato,
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
    headersPagos,
    getHeaders,
    carga,
    loadingHeaders,
    resetFiltersCotizacion,
    packingList,
    exportData: exportProspectosData,
} = useCotizacion()
const {
    cotizacionPagos,
    loadingPagos,
    error: errorPagos,
    paginationPagos,
    searchPagos,
    itemsPerPagePagos,
    totalPagesPagos,
    totalRecordsPagos,
    currentPagePagos,
    filtersPagos,
    getCotizacionPagos,
    handleSearchPagos,
    handleFilterChange: handleFilterChangePagos,
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
import StatusOptionsModal from '~/components/cargaconsolidada/StatusOptionsModal.vue'
const loadTabs = () => {
    switch (currentRole.value) {
        case ROLES.CONTABILIDAD:
            tabs.value = [
                {
                    label: 'Pagos',
                    value: 'pagos'
                },
                {
                    label: 'Prospectos',
                    value: 'prospectos'
                }
            ]
            break
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

// Función para construir el URL de firma usando el UUID
const getSignUrl = (uuid: string): string => {
    if (!uuid) return ''
    return 'https://clientes.probusiness.pe/firma-acuerdo-servicio/' + uuid
}

const overlay = useOverlay()
const modalAcciones = overlay.create(ModalAcciones)
const simpleUploadFileModal = overlay.create(SimpleUploadFileModal)
const statusOptionsModal = overlay.create(StatusOptionsModal)
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
            { label: 'RESERVADO', value: 'RESERVADO', inrow: true}

        ]
    },
    {
        key: 'estado_china',
        label: 'Estado Proveedor',
        type: 'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: 'todos', inrow: false },
            { label: 'WAIT', value: 'WAIT', inrow: true },
            { label: 'NC', value: 'NC', inrow: true },
            { label: 'NP', value: 'NP', inrow: true },
            { label: 'C', value: 'C', inrow: true },
            { label: 'R', value: 'R', inrow: true },
            { label: 'INSPECTION', value: 'INSPECTION', inrow: true },
            { label: 'LOADED', value: 'LOADED', inrow: true },
            { label: 'NO LOADED', value: 'NO LOADED', inrow: true }
        ]
    }
])
const filterConfigProspectosAlmacen = ref([
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
        key: 'estado_china',
        label: 'Estado Proveedor',
        type: 'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: 'todos', inrow: false },
            { label: 'WAIT', value: 'WAIT', inrow: true },
            { label: 'NC', value: 'NC', inrow: true },
            { label: 'NP', value: 'NP', inrow: true },
            { label: 'C', value: 'C', inrow: true },
            { label: 'NS', value: 'NS', inrow: true },
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
        label: 'Estado Cotizador',
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
    {
        key: 'estado_china',
        label: 'Estado Proveedor',
        type: 'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: 'todos', inrow: false },
            { label: 'WAIT', value: 'WAIT', inrow: true },
            { label: 'NC', value: 'NC', inrow: true },
            { label: 'NP', value: 'NP', inrow: true },
            { label: 'C', value: 'C', inrow: true },
            { label: 'R', value: 'R', inrow: true },
            { label: 'INSPECTION', value: 'INSPECTION', inrow: true },
            { label: 'LOADED', value: 'LOADED', inrow: true },
            { label: 'NO LOADED', value: 'NO LOADED', inrow: true }
        ]
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
            { label: 'RESERVADO', value: 'RESERVADO', inrow: true}

        ]
    }

])
// Filtros tab Pagos (solo Contabilidad): inspección y estado de pago
const filterConfigPagos = ref([
    {
        key: 'estado_inspeccion',
        label: 'Inspección',
        type: 'select',
        placeholder: 'Seleccionar inspección',
        options: [
            { label: 'Todos', value: 'todos', inrow: true },
            { label: 'Pendiente', value: 'Pendiente', inrow: true },
            { label: 'Inspeccionado', value: 'Inspeccionado', inrow: true },
            { label: 'Completado', value: 'Completado', inrow: true }
        ]
    },
    {
        key: 'estado_pago',
        label: 'Estado de pago',
        type: 'select',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: 'todos', inrow: true },
            { label: 'PENDIENTE', value: 'PENDIENTE', inrow: true },
            { label: 'PAGADO', value: 'PAGADO', inrow: true },
            { label: 'ADELANTO', value: 'ADELANTO', inrow: true },
            { label: 'SOBREPAGO', value: 'SOBREPAGO', inrow: true }
        ]
    }
])
const getFilterConfigPagos = () => {
    if (currentRole.value === ROLES.CONTABILIDAD) return filterConfigPagos.value
    return []
}
const getFilterPerRole = () => {
    if (currentRole.value === ROLES.COORDINACION || currentRole.value === ROLES.CONTABILIDAD) {
        return filterConfigProspectosCoordinacion.value
    } else if (currentRole.value === ROLES.CONTENEDOR_ALMACEN) {
        return filterConfigProspectosAlmacen.value
    } else if (currentRole.value === ROLES.COTIZADOR) {
        return filterConfigProspectos.value
    }
    else {
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
            await withSpinner(async () => {
                const result = await ConsolidadoService.uploadPackingList(formData)

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
            return fecha ? formatDateTimeToDmy(fecha) : ''
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
                    // nested cliente object fallback
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
            const cotizacion_contrato_firmado_url = String(pick(['cotizacion_contrato_firmado_url']) || '')
            const cotizacion_contrato_url = String(pick(['cotizacion_contrato_url']) || '')
            const cotizacion_contrato_autosigned_url = String(pick(['cotizacion_contrato_autosigned_url']) || '')
            const permisoBlock = (currentRole.value === ROLES.COORDINACION || currentRole.value === ROLES.CONTABILIDAD || (currentRole.value === ROLES.JEFE_IMPORTACIONES && route.path.includes('coordinacion')))
                ? renderEstadoPermisoPorTipo(row.original.estado_permiso_por_tipo ?? [], row.original.id_tramite)
                : null
            return h('div', { class: '' }, [
                h('div', { class: 'font-medium' }, nombre ? (nombre.toUpperCase ? nombre.toUpperCase() : nombre) : '—'),
                documento ? h('div', { class: 'text-sm text-gray-500' }, documento) : null,
                telefono ? h('div', { class: 'text-sm text-gray-500' }, telefono) : null,
                correo ? h('div', { class: 'text-sm text-gray-500' }, correo) : null,
                cod_contract ? h('div', { class: 'text-sm text-gray-500' }, [
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
                ]) : null,
                permisoBlock
            ].filter(Boolean))
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
            return h('div', { class: 'flex flex-row gap-2' }, [
                row.original.cotizacion_file_url ? h('div', {
                    innerHTML: CUSTOMIZED_ICONS.EXCEL,
                    class: 'cursor-pointer',
                    onClick: () => {
                        downloadFile(row.original.cotizacion_file_url)
                    }
                }) : null
            ])
        }
    },
    //action cols borrar cot
    {
        accessorKey: 'action',
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
                        handleSendRecordatorioFirma(row.original.id)
                    }
                }),
                (row.original.cotizacion_contrato_url || row.original.cotizacion_contrato_autosigned_url || row.original.cotizacion_contrato_firmado_url) ? h(UButton, {
                    icon: 'i-heroicons-document-duplicate',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'info',
                    title: 'Copiar enlace de firma',
                    onClick: () => {
                        copyToClipboard(getSignUrl(row.original.uuid), 'Enlace de firma copiado')
                    }
                }) : null,
                h(UButton, {
                    icon: 'i-heroicons-eye',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'primary',
                    title: 'Ver documentación cotizadores',
                    onClick: () => {
                        navigateTo(`/cargaconsolidada/completados/cotizaciones/documentacion/${row.original.id}?soloVista=1`)
                    }
                }),
                currentRole.value !== ROLES.CONTABILIDAD ? h(UButton, {
                    icon: 'i-heroicons-trash',
                    variant: 'ghost',
                    activeColor: 'error',
                    size: 'xs',
                    onClick: () => {
                        handleDelete(row.original.id)
                    }
                }) : null
            ])
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
            return fecha ? formatDateTimeToDmy(fecha) : ''
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
            const cotizacion_contrato_firmado_url = String(pick(['cotizacion_contrato_firmado_url']) || '')
            const cotizacion_contrato_url = String(pick(['cotizacion_contrato_url']) || '')
            const cotizacion_contrato_autosigned_url = String(pick(['cotizacion_contrato_autosigned_url']) || '')
            const permisoBlock = (currentRole.value === ROLES.COORDINACION || currentRole.value === ROLES.CONTABILIDAD || (currentRole.value === ROLES.JEFE_IMPORTACIONES && route.path.includes('coordinacion')))
                ? renderEstadoPermisoPorTipo(row.original.estado_permiso_por_tipo ?? [], row.original.id_tramite)
                : null
            return h('div', { class: 'py-2' }, [
                h('div', { class: 'font-medium' }, nombre ? (nombre.toUpperCase ? nombre.toUpperCase() : nombre) : '—'),
                documento ? h('div', { class: 'text-sm text-gray-500' }, documento) : null,
                telefono ? h('div', { class: 'text-sm text-gray-500' }, telefono) : null,
                correo ? h('div', { class: 'text-sm text-gray-500' }, correo) : h('div', { class: 'text-sm text-gray-500' }, 'Sin correo'),
                cod_contract ? h('div', { class: 'text-sm text-gray-500' }, [
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
                ]) : null,
                permisoBlock
            ].filter(Boolean))
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
            return h('div', { class: 'flex flex-row gap-2' }, [
                row.original.cotizacion_file_url ? h('div', {
                    innerHTML: CUSTOMIZED_ICONS.EXCEL,
                    class: 'cursor-pointer',
                    onClick: () => {
                        downloadFile(row.original.cotizacion_file_url)
                    }
                }) : null
            ])
        }
    },
    {
        accessorKey: 'estado_cotizador',
        header: 'Estado',

        cell: ({ row }: { row: any }) => {
            const estado = row.getValue('estado_cotizador')
            const color = getEstadoColor(estado)

            const selectNode = h(USelect as any, {
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
            const permisoBlock = currentRole.value === ROLES.COTIZADOR
                ? renderEstadoPermisoPorTipo(row.original.estado_permiso_por_tipo ?? [], row.original.id_tramite)
                : null
            return h('div', { class: 'flex flex-col' }, [ selectNode, permisoBlock ].filter(Boolean))
        }
    },
    {
        accessorKey: 'action',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            return h('div', {
                class: 'flex flex-row gap-2'
            }, [
                row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-arrow-path',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'secondary',
                    onClick: () => {
                        handleRefresh(row.original.id)
                    }
                }) : null,
                row.original.estado_cotizador !== 'CONFIRMADO' && currentId.value === ID_JEFEVENTAS && currentRole.value !== ROLES.CONTABILIDAD ? h(UButton, {
                icon: 'i-heroicons-trash',
                variant: 'ghost',
                activeColor: 'error',
                size: 'xs',
                onClick: () => {
                    handleDelete(row.original.id)
                }
            }) : null,
                (row.original.cotizacion_contrato_url || row.original.cotizacion_contrato_autosigned_url || row.original.cotizacion_contrato_firmado_url) ? h(UButton, {
                    icon: 'i-heroicons-document-duplicate',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'info',
                    title: 'Copiar enlace de firma',
                    onClick: () => {
                        copyToClipboard(getSignUrl(row.original.uuid), 'Enlace de firma copiado')
                    }
                }) : null,
                h(UButton, {
                    icon: 'i-heroicons-eye',
                    variant: 'ghost',
                    size: 'xs',
                    color: 'info',
                    title: 'Ver documentación cotizadores',
                    onClick: () => {
                        navigateTo(`/cargaconsolidada/completados/cotizaciones/documentacion/${row.original.id}`)
                    }
                }),
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
    }
])
// Columnas tab Pagos: N° Contacto T. Cliente Acciones Inspección Estado Concepto Importe Pagado Diferencia (+ Adelantos solo Coordinación)
const getPagosColumns = () => {
    const nuxtApp = useNuxtApp()
    const isContabilidad = currentRole.value === ROLES.CONTABILIDAD
    return [
        {
            accessorKey: 'index',
            header: 'N°',
            cell: ({ row }: { row: any }) => row.index + 1
        },
        {
            accessorKey: 'contacto',
            header: 'Contacto',
            cell: ({ row }: { row: any }) => {
                const nombre = row.original?.nombre || ''
                const documento = row.original?.documento || ''
                const telefono = row.original?.telefono || ''
                const correo = row.original?.correo || ''
                return h('div', { class: 'py-2' }, [
                    h('div', { class: 'font-medium' }, nombre?.toUpperCase()),
                    h('div', { class: 'text-sm text-gray-500' }, documento),
                    h('div', { class: 'text-sm text-gray-500' }, telefono),
                    h('div', { class: 'text-sm text-gray-500' }, correo || 'Sin correo')
                ])
            }
        },
        {
            accessorKey: 'tipo_cliente',
            header: 'T. Cliente',
            cell: ({ row }: { row: any }) => row.original.tipo_cliente
        },
        {
            accessorKey: 'acciones',
            header: 'Acciones',
            cell: ({ row }: { row: any }) => {
                return h('div', { class: 'flex items-center' }, [
                    h(UTooltip, { text: 'Enviar recordatorio de pago', placement: 'top' }, {
                        default: () => h(UButton, {
                            icon: 'material-symbols:send-outline',
                            color: 'primary',
                            variant: 'ghost',
                            onClick: () => {
                                showConfirmation(
                                    'Confirmar envío',
                                    '¿Está seguro de enviar un recordatorio de pago a este cliente?',
                                    async () => {
                                        try {
                                            await withSpinner(async () => {
                                                const endpoint = `/api/carga-consolidada/contenedor/cotizacion-final/general/${row.original.id_cotizacion}/send-reminder-pago`
                                                const res = await nuxtApp.$api.call(endpoint, { method: 'POST', body: {} })
                                                if (res && (res as any).success) {
                                                    showSuccess('Recordatorio enviado', (res as any).message || 'Recordatorio de pago enviado correctamente')
                                                    getCotizacionPagos(Number(id))
                                                    getHeaders(Number(id))
                                                } else {
                                                    showError('Error', (res as any).message || 'No se pudo enviar el recordatorio')
                                                }
                                            }, 'Enviando recordatorio...')
                                        } catch (err) {
                                            console.error('Error send reminder:', err)
                                            showError('Error', 'Error al enviar recordatorio')
                                        }
                                    }
                                )
                            }
                        })
                    })
                ])
            }
        },
        {
            accessorKey: 'estado_inspeccion',
            header: 'Inspección',
            cell: ({ row }: { row: any }) => {
                const estado = row.original.estado_inspeccion || 'Pendiente'
                // Colores: gris Pendiente, verde Inspeccionado, azul Completado
                const INSPECCION_CLASSES: Record<string, string> = {
                    Pendiente: 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white',
                    Inspeccionado: 'bg-green-500 text-white dark:bg-green-500 dark:text-white',
                    Completado: 'bg-blue-500 text-white dark:bg-blue-500 dark:text-white'
                }
                const cls = INSPECCION_CLASSES[estado] || INSPECCION_CLASSES.Pendiente
                return h(UButton as any, {
                    disabled: true,
                    class: cls,
                    label: estado
                })
            }
        },
        {
            accessorKey: 'estado_pago',
            header: 'Estado',
            cell: ({ row }: { row: any }) => h(USelect as any, {
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
        {
            accessorKey: 'diferencia',
            header: 'Diferencia',
            cell: ({ row }: { row: any }) => {
                const diff = row.original.diferencia ?? (Number(row.original.monto) - Number(row.original.total_pagos))
                return formatCurrency(diff)
            }
        },
         {
            accessorKey: 'adelantos',
            header: 'Adelantos',
            cell: ({ row }: { row: any }) => {
                const pagos = row.original.pagos || []
                const showGrid = row.original.id_contenedor_pago == id || row.original.id_contenedor_pago == null
                if (!showGrid) return null
                return h(PagoGrid, {
                    numberOfPagos: 4,
                    pagoDetails: pagos,
                    clienteNombre: row.original.nombre,
                    currency: 'USD',
                    showDelete: !isContabilidad,
                    onSave: (data) => {
                        const formData = new FormData()
                        for (const key in data) {
                            if (data[key] !== undefined && data[key] !== null) {
                                formData.append(key, data[key])
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
                })
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
                    // Transformar las opciones para incluir clases de color
                    const optionsWithClasses = filterConfig.value
                        .find((filter: any) => filter.key === 'estado_china')?.options
                        .map((option: any) => ({
                            ...option,
                            class: option.value !== 'todos' ? STATUS_BG_CLASSES[option.value as keyof typeof STATUS_BG_CLASSES] : ''
                        }))

                    return h(USelect as any, {
                        items: optionsWithClasses,
                        placeholder: 'Seleccionar estado',
                        value: proveedor.estados_proveedor,
                        class: STATUS_BG_CLASSES[proveedor.estados_proveedor as keyof typeof STATUS_BG_CLASSES],
                        disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
                        modelValue: proveedor.estados_proveedor,
                        'onUpdate:modelValue': (value: any) => {
                            console.log(value, row.original)
                            proveedor.estados_proveedor = value
                            handleUpdateProveedorEstado(proveedor.id, value, row.original.id)
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
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const nombre = row.original?.nombre || row.original?.cliente?.nombre || ''
            const telefono = row.original?.telefono || row.original?.cliente?.telefono || ''
            return h('div', { class: 'w-70 whitespace-normal' }, [
                h('div', { class: 'font-medium' }, nombre ? (typeof nombre === 'string' ? nombre.toUpperCase() : nombre) : ''),
                telefono ? h('div', { class: 'text-sm text-gray-500' }, telefono) : null
            ])
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
                    label: 'RESERVADO',
                    value: 'RESERVADO',
                },


            ]
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(USelect as any, {
                    items: estados,
                    placeholder: 'Seleccionar estado',
                    modelValue: proveedor.estados,
                    class: 'w-full w-30',
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD,
                    'onUpdate:modelValue': (value: any) => {
                        console.log(value, row.original)

                        proveedor.estados = value
                        handleUpdateProveedorEstado(proveedor.id, value, row.original.id)
                    }
                })
            }))
            return div

        }
    },
    {
        accessorKey: 'tipo_rotulado',
        header: 'Tipo Rotulado',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                let tipoRotulado = proveedor.tipo_rotulado || proveedor.tipo_rotulacion || ''
               
                let formattedValue = tipoRotulado
                    .toUpperCase()
                    .replace(/_/g, ' ')
                    .trim() || '-'
                console.log(formattedValue)
                if (formattedValue === 'ROTULADO') {
                    formattedValue = 'GENERAL';
                }
                return h(UBadge as any, {
                    label: formattedValue,
                    color: 'gray',
                    variant: 'soft'
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
        accessorKey: 'fecha_llegada',
        header: 'F. llegada',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            return h('div', { class: 'flex flex-col gap-2' }, proveedores.map((proveedor: any) => {
                const isChinaDate = !!proveedor.arrive_date_china
                const rawValue = proveedor.arrive_date_china || proveedor.arrive_date || ''
                const rawDatePart = rawValue && String(rawValue).includes('T') ? String(rawValue).split('T')[0] : (rawValue && String(rawValue).includes(' ') ? String(rawValue).split(' ')[0] : rawValue)
                const displayedValue = formatDateForInput(rawDatePart)
                const editable = !isChinaDate && (currentRole.value === ROLES.COTIZADOR || currentRole.value === ROLES.COORDINACION || currentRole.value === ROLES.CONTABILIDAD)

                return h('div', { class: 'flex flex-col gap-1' }, [
                    h(UInput as any, {
                        type: 'date',
                        modelValue: displayedValue,
                        class: 'min-w-36',
                        'onUpdate:modelValue': (value: string) => handleUpdateProveedorFechaLlegada(proveedor.id_proveedor, isChinaDate ? 'arrive_date_china' : 'arrive_date', value),
                        disabled: !editable
                    })
                ])
            }))
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
                    disabled: !COTIZADORES_WITH_PRIVILEGES.includes(currentId.value as number),
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
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD,
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
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD && !COTIZADORES_WITH_PRIVILEGES.includes(currentId.value as number),
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
                    class: 'w-full w-10',
                    disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
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
                    class: 'w-full w-12',
                    disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
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
                    disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
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

const handleUpdateProveedorFechaLlegada = async (idProveedor: number, _field: string, value: string) => {
    try {
        await withSpinner(async () => {
            const response = await updateArriveDate(idProveedor, value || '')
            if (response?.success) {
                showSuccess('Fecha actualizada', 'La fecha de llegada se ha actualizado correctamente.')
                await getCotizacionProveedor(Number(id))
            } else {
                showError('Error', response?.error || 'No se pudo actualizar la fecha')
            }
        }, 'Actualizando fecha...')
    } catch (error) {
        showError('Error al actualizar fecha', error)
    }
}
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
                    // Transformar las opciones para incluir clases de color
                    const optionsWithClasses = filterConfig.value
                        .find((filter: any) => filter.key === 'estado_china')?.options
                        .map((option: any) => ({
                            ...option,
                            class: option.value !== 'todos' ? STATUS_BG_CLASSES[option.value as keyof typeof STATUS_BG_CLASSES] : ''
                        }))

                    return h(USelect as any, {
                        items: optionsWithClasses,
                        placeholder: 'Seleccionar estado',
                        value: proveedor.estados_proveedor,
                        class: STATUS_BG_CLASSES[proveedor.estados_proveedor as keyof typeof STATUS_BG_CLASSES],
                        disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
                        modelValue: proveedor.estados_proveedor,
                        'onUpdate:modelValue': (value: any) => {
                            proveedor.estados_proveedor = value
                            handleUpdateProveedorEstado(proveedor.id, value, row.original.id)
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
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const nombre = row.original?.nombre || row.original?.cliente?.nombre || ''
            const telefono = row.original?.telefono || row.original?.cliente?.telefono || ''
            return h('div', { class: 'w-70 whitespace-normal' }, [
                h('div', { class: 'font-medium' }, nombre ? (typeof nombre === 'string' ? nombre.toUpperCase() : nombre) : ''),
                telefono ? h('div', { class: 'text-sm text-gray-500' }, telefono) : null
            ])
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
                    label: 'RESERVADO',
                    value: 'RESERVADO',
                },


            ]
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(USelect as any, {
                    items: estados,
                    placeholder: 'Seleccionar estado',
                    modelValue: proveedor.estados,
                    class: 'w-full w-30',
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD,
                    'onUpdate:modelValue': (value: any) => {
                        console.log(value, row.original)
                        proveedor.estados = value
                        handleUpdateProveedorEstado(proveedor.id, value, row.original.id)
                    }
                })
            }))
            return div

        }
    },
    {
        accessorKey: 'tipo_rotulado',
        header: 'Tipo Rotulado',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                const tipoRotulado = proveedor.tipo_rotulado || proveedor.tipo_rotulacion || ''
                let formattedValue = tipoRotulado
                    .toUpperCase()
                    .replace(/_/g, ' ')
                    .trim() || '-'
                if (formattedValue === 'ROTULADO') {
                    formattedValue = 'GENERAL';
                }
                return h(UBadge as any, {
                    label: formattedValue,
                    color: 'gray',
                    variant: 'soft'
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
        accessorKey: 'fecha_llegada',
        header: 'F. llegada',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            return h('div', { class: 'flex flex-col gap-2' }, proveedores.map((proveedor: any) => {
                const isChinaDate = !!proveedor.arrive_date_china
                const rawValue = proveedor.arrive_date_china || proveedor.arrive_date || ''
                const rawDatePart = rawValue && String(rawValue).includes('T') ? String(rawValue).split('T')[0] : (rawValue && String(rawValue).includes(' ') ? String(rawValue).split(' ')[0] : rawValue)
                const displayedValue = formatDateForInput(rawDatePart)
                const editable = !isChinaDate && (currentRole.value === ROLES.COTIZADOR || currentRole.value === ROLES.COORDINACION || currentRole.value === ROLES.CONTABILIDAD)

                return h('div', { class: 'flex flex-col gap-1' }, [
                    h(UInput as any, {
                        type: 'date',
                        modelValue: displayedValue,
                        class: 'min-w-36',
                        'onUpdate:modelValue': (value: string) => handleUpdateProveedorFechaLlegada(proveedor.id_proveedor, isChinaDate ? 'arrive_date_china' : 'arrive_date', value),
                        disabled: !editable
                    })
                ])
            }))
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
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD,
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
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD,
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
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD,
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
        header: () => {
            return h('div', {
                class: 'flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded'
            }, [
                h('img', {
                    src: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flag_of_the_People%27s_Republic_of_China.svg',
                    alt: 'China',
                    class: 'w-4 h-4'
                }),
                h('span', {
                    class: 'font-medium'
                }, 'Qty Box')
            ])
        },
        //apply vertical separator to all column 
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.qty_box_china,
                    class: 'w-full w-10',
                    disabled: true,
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
        header: () => {
            return h('div', {
                class: 'flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded'
            }, [
                h('img', {
                    src: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flag_of_the_People%27s_Republic_of_China.svg',
                    alt: 'China',
                    class: 'w-4 h-4'
                }),
                h('span', {
                    class: 'font-medium'
                }, 'CBM')
            ])
        },
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.cbm_total_china,
                    class: 'w-full w-12',
                    disabled: true,
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
        header: () => {
            return h('div', {
                class: 'flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-full'
            }, [
                h('img', {
                    src: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flag_of_the_People%27s_Republic_of_China.svg',
                    alt: 'China',
                    class: 'w-4 h-4'
                }),
                h('span', {
                    class: 'font-medium'
                }, 'Arrive Date')
            ])
        },
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.arrive_date_china,
                    class: 'w-full w-25',
                    disabled: true,
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

                    row.original.estado_cotizador === 'CONFIRMADO' ? h(UButton, {
                        icon: 'iconamoon:menu-burger-horizontal',
                        variant: 'ghost',
                        color: 'success',
                        size: 'md',
                        onClick: () => {
                            statusOptionsModal.open({
                                idCotizacion: row.original.id,
                                idContainer: row.original.id_contenedor,
                                onSuccess: () => {
                                    getCotizacionProveedor(Number(id))
                                }
                            });
                        }
                    }) : null,
                    h(UButton, {
                        icon: 'material-symbols:send-outline',
                        variant: 'ghost',
                        color: 'primary',
                        size: 'md',
                        onClick: () => {
                            modalAcciones.open({
                                show: true,
                                clienteId: row.original.id,
                                clienteName: row.original.nombre,
                                onSelected: (data: any) => {
                                    console.log(data)
                                },
                                validateMaxDate:false
                            })
                        }
                    })
                ])
            }))
        }
    },
    
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
                    // Transformar las opciones para incluir clases de color
                    const optionsWithClasses = filterConfig.value
                        .find((filter: any) => filter.key === 'estado_china')?.options
                        .map((option: any) => ({
                            ...option,
                            class: option.value !== 'todos' ? STATUS_BG_CLASSES[option.value as keyof typeof STATUS_BG_CLASSES] : ''
                        }))

                    return h(USelect as any, {
                        items: optionsWithClasses,
                        placeholder: 'Seleccionar estado',
                        value: proveedor.estados_proveedor,
                        class: STATUS_BG_CLASSES[proveedor.estados_proveedor as keyof typeof STATUS_BG_CLASSES],
                        disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
                        modelValue: proveedor.estados_proveedor,
                        'onUpdate:modelValue': (value: any) => {
                            console.log(value, row.original)
                            proveedor.estados_proveedor = value
                            handleUpdateProveedorEstado(proveedor.id, value, row.original.id)
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
        accessorKey: 'contacto',
        header: 'Contacto',
        cell: ({ row }: { row: any }) => {
            const nombre = row.original?.nombre || row.original?.cliente?.nombre || ''
            const telefono = row.original?.telefono || row.original?.cliente?.telefono || ''
            return h('div', { class: 'w-40 whitespace-normal' }, [
                h('div', { class: 'font-medium' }, nombre ? (typeof nombre === 'string' ? nombre.toUpperCase() : nombre) : ''),
                telefono ? h('div', { class: 'text-sm text-gray-500' }, telefono) : null
            ])
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
                    variant: 'none',
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
                    variant: 'none',
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
                    variant: 'none',
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
                    variant: 'none',
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
                    variant: 'none',
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD && !COTIZADORES_WITH_PRIVILEGES.includes(currentId.value as number),
                    'onUpdate:modelValue': (value: string) => {
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
                    variant: 'none',
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD,
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
                class: 'flex flex-col gap-2 w-35'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.supplier_phone,
                    class: 'w-full',
                    variant: 'none',
                    disabled: currentRole.value !== ROLES.COORDINACION && currentRole.value !== ROLES.CONTABILIDAD && !COTIZADORES_WITH_PRIVILEGES.includes(currentId.value as number),
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
                    class: 'w-full w-10',
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
    modal.open({
        idConsolidado: Number(id),
        idCotizacion: null,
        onSuccess: () => {
            getCotizaciones(Number(id))
        },

    })
}
const handleDownloadEmbarque = async () => {
    try {
        await withSpinner(async () => {
            const response = await downloadEmbarque(Number(id))
            //return blobs
            if (response) {
                //download file type excel
                const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `embarque_${id}.xlsx`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                showSuccess('Embarque descargado correctamente', 'El embarque se ha descargado correctamente.')
            }
            else {
                showError('Error al descargar embarque', 'No se pudo descargar el embarque')
            }
        }, 'Descargando embarque...')
    } catch (error) {
        showError('Error al descargar embarque', error)
    }
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
        console.log(estado)
        await withSpinner(async () => {
            try {

                const response = await updateEstadoCotizacionCotizador(idCotizacion, { estado })
                if (response?.success) {
                    showSuccess('Estado actualizado correctamente', 'El estado se ha actualizado correctamente.')
                    await getCotizaciones(Number(id))
                }
            } catch (error: any) {

                showError('Error al actualizar el estado de la cotización', error)
            }
        }, 'Actualizando estado de la cotización...')
    } catch (error) {
        showError('Error al actualizar el estado de la cotización', error)
    }
}
const handleUpdateProveedorEstado = async (idProveedor: number, estado: string, idCotizacion: number) => {
    try {
        await withSpinner(async () => {
            if (estado === 'ROTULADO') {
                const modal = overlay.create(SelectTipoCargaModal)
                modal.open({
                    show: true,
                    cotizacionId: idCotizacion,
                    onSelected: async (data: any) => {
                        await withSpinner(async () => {
                            try {
                                const response = await sendRotulado(data)
                                if (response?.success) {
                                    showSuccess('Rotulado enviado correctamente', 'El rotulado se ha enviado correctamente.')
                                    await getCotizacionProveedor(Number(id))
                                }
                                else {
                                    showError('Error al enviar el rotulado', response?.message)
                                }
                                return;
                            } catch (error) {
                                showError('Error al enviar el rotulado', error)
                                return;
                            }
                        }, 'Enviando rotulado...')
                    }
                })
                return;
            }
            await updateProveedorEstado({ id: idProveedor, estado })
            showSuccess('Estado actualizado correctamente', 'El estado se ha actualizado correctamente.')
            await getCotizacionProveedor(Number(id))
        }, 'Actualizando estado del proveedor...')
    } catch (error) {
        showError('Error al actualizar el estado del proveedor', error)
    }
}
const handleUpdateCotizacion = async (idCotizacion: number) => {
    const modal = overlay.create(CreateProspectoModal)
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
const getProespectosColumns = () => {
    switch (currentRole.value) {
        case ROLES.COORDINACION:
        case ROLES.CONTABILIDAD:
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
        case ROLES.CONTABILIDAD:
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

const copyToClipboard = async (text: string, successMessage: string = 'Copiado al portapapeles') => {
    try {
        await navigator.clipboard.writeText(text)
        showSuccess('Éxito', successMessage)
    } catch (error) {
        showError('Error al copiar', 'No se pudo copiar al portapapeles')
    }
}
// Manejadores para prospectos
const handleSearchProspectos = (value: string) => {
    searchCotizaciones.value = value
    paginationCotizaciones.value.current_page = 1
    // Eliminar idCotizacion de la query string cuando se usa el buscador
    const query = { ...route.query }
    delete query.idCotizacion
    navigateTo({ path: route.path, query }, { replace: true })
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
    // Eliminar idCotizacion de la query string cuando se usa un filtro
    const query = { ...route.query }
    delete query.idCotizacion
    navigateTo({ path: route.path, query }, { replace: true })
    await getCotizaciones(Number(id))
}



// Watch inmediato para la carga inicial
watch(() => tab.value, async (newVal) => {
    if (newVal && newVal !== '') {
        try {
            resetFilters()
            // Preservar idCotizacion de la query string si existe
            const idCotizacionQuery = route.query.idCotizacion ? `&idCotizacion=${route.query.idCotizacion}` : ''
            if (newVal === 'prospectos') {
                navigateTo(`/cargaconsolidada/completados/cotizaciones/${id}?tab=prospectos${idCotizacionQuery}`)
                // reset search to avoid sending stale query param to backend
                try { searchCotizaciones.value = '' } catch (e) { /* ignore */ }
                await getCotizaciones(Number(id))
            } else if (newVal === 'embarque') {
                navigateTo(`/cargaconsolidada/completados/cotizaciones/${id}?tab=embarque${idCotizacionQuery}`)
                try { search.value = '' } catch (e) { /* ignore */ }
                await getCotizacionProveedor(Number(id))
            } else if (newVal === 'pagos') {
                navigateTo(`/cargaconsolidada/completados/cotizaciones/${id}?tab=pagos${idCotizacionQuery}`)
                try { searchPagos.value = '' } catch (e) { /* ignore */ }
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
        if (COTIZADORES_WITH_PRIVILEGES.includes(currentId.value as number)) {
            data.supplier = row.supplier ?? []
            data.supplier_phone = row.supplier_phone ?? []
            formData.append('supplier', data.supplier)
            formData.append('supplier_phone', data.supplier_phone)
        }
    }
    if (currentRole.value === ROLES.COORDINACION || currentRole.value === ROLES.CONTABILIDAD) {
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
    } else if (currentRole.value === ROLES.CONTABILIDAD) {
        tab.value = 'pagos'
    } else {
        tab.value = (tabs.value && tabs.value.length > 0) ? tabs.value[0].value : ''
    }
})
</script>
