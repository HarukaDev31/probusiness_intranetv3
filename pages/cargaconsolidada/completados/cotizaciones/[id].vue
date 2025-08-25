<template>
    <div class="p-6">
        <PageHeader title="Cotizaciones" subtitle="Gestión de cotizaciones" icon="i-heroicons-book-open"
            :hide-back-button="true" />
        <UTabs v-model="tab" :items="tabs" size="sm" variant="pill" class="mb-4 w-60" v-if="tabs.length > 1" />

        <DataTable v-if="tab === 'prospectos'" title="" icon="" :data="cotizaciones" :columns="getProespectosColumns()"
            :headers="headersCotizaciones" :show-headers="true" :loading="loadingCotizaciones"
            :current-page="currentPageCotizaciones" :total-pages="totalPagesCotizaciones"
            :total-records="totalRecordsCotizaciones" :items-per-page="itemsPerPageCotizaciones"
            :search-query-value="searchCotizaciones" :show-secondary-search="false" :show-filters="true"
            :filter-config="filterConfigProspectos" :show-export="true"
            empty-state-message="No se encontraron registros de prospectos."
            @update:primary-search="handleSearchProspectos" @page-change="handlePageChangeProspectos"
            @items-per-page-change="handleItemsPerPageChangeProspectos" @filter-change="handleFilterChangeProspectos">

            <template #actions>
                <UButton v-if="currentRole === ROLES.COTIZADOR" icon="i-heroicons-plus" variant="outline"
                    label="Crear Prospecto" @click="handleAddProspecto" />
            </template>
        </DataTable>
        <DataTable v-if="tab === 'embarque'" title="" icon="" :data="cotizacionProveedor"
            :columns="getEmbarqueColumns()" :loading="loading" :current-page="currentPage" :total-pages="totalPages"
            :total-records="totalRecords" :items-per-page="itemsPerPage" :search-query-value="search"
            :show-secondary-search="false" :show-filters="true" :filter-config="filterConfig" :show-export="true"
            empty-state-message="No se encontraron registros de cursos." @update:primary-search="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange"
            @filter-change="handleFilterChange">
        </DataTable>
        <DataTable v-if="tab === 'pagos'" title="" icon="" :data="cotizacionPagos" :columns="getPagosColumns()"
            :loading="loading" :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
            :items-per-page="itemsPerPage" :search-query-value="search" :show-secondary-search="false"
            :show-filters="true" :filter-config="filterConfig" :show-export="true"
            empty-state-message="No se encontraron registros de pagos." @update:primary-search="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange"
            @filter-change="handleFilterChange">
        </DataTable>
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
import { useCotizacion } from '~/composables/cargaconsolidada/useCotizacion'
import { formatDate, formatCurrency } from '~/utils/formatters'
import { useSpinner } from '~/composables/commons/useSpinner'
import { ROLES } from '~/constants/roles'
import { USelect, UInput, UButton, UIcon, UBadge } from '#components'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useModal } from '~/composables/commons/useModal'
import CreateProspectoModal from '~/components/cargaconsolidada/CreateProspectoModal.vue'
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
import MoveCotizacionModal from '~/components/cargaconsolidada/MoveCotizacionModal.vue'
import CreatePagoModal from '~/components/commons/CreatePagoModal.vue'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import AdelantoPreviewModal from '~/components/commons/AdelantoPreviewModal.vue'
import { useCotizacionPagos } from '~/composables/cargaconsolidada/useCotizacionPagos'
const { getCotizacionProveedor, updateProveedorEstado, updateProveedor, cotizacionProveedor, loading, currentPage, totalPages, totalRecords, itemsPerPage, search, filterConfig, handleSearch, handlePageChange, handleItemsPerPageChange, handleFilterChange } = useCotizacionProveedor()
const { cotizaciones, refreshCotizacionFile, deleteCotizacion, deleteCotizacionFile, updateEstadoCotizacionCotizador, loading: loadingCotizaciones, error: errorCotizaciones, pagination: paginationCotizaciones, search: searchCotizaciones, itemsPerPage: itemsPerPageCotizaciones, totalPages: totalPagesCotizaciones, totalRecords: totalRecordsCotizaciones, currentPage: currentPageCotizaciones, filters: filtersCotizaciones, getCotizaciones, headersCotizaciones } = useCotizacion()
const { cotizacionPagos, loading: loadingPagos, error: errorPagos, pagination: paginationPagos, search: searchPagos, itemsPerPage: itemsPerPagePagos, totalPages: totalPagesPagos, totalRecords: totalRecordsPagos, currentPage: currentPagePagos, filters: filtersPagos, getCotizacionPagos, headersPagos } = useCotizacionPagos()
const { withSpinner } = useSpinner()
const route = useRoute()
const id = route.params.id
const { showConfirmation, showSuccess, showError } = useModal()

const tab = ref('')

const { currentRole } = useUserRole()
const tabs = ref([


])
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



const filterConfigProspectos = ref([
    {
        key: 'estado',
        label: 'Estado',
        placeholder: 'Seleccionar estado',
        options: [
            { label: 'Todos', value: 'todos', inrow: false },
            { label: 'PENDIENTE', value: 'PENDIENTE', inrow: true },
            { label: 'COTIZADO', value: 'COTIZADO', inrow: true },
            { label: 'CONTACTADO', value: 'CONTACTADO', inrow: false },
            { label: 'CONFIRMADO', value: 'CONFIRMADO', inrow: true }
        ]
    }
])

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
        accessorKey: 'monto',
        header: 'Fob',
        cell: ({ row }: { row: any }) => {
            const monto = parseFloat(row.getValue('monto'))
            return formatCurrency(monto, 'USD')
        }
    },
    {
        accessorKey: 'logistica',
        header: 'Logistica',
        cell: ({ row }: { row: any }) => {
            // Campo calculado o por defecto
            return row.original.monto
        }
    },
    {
        accessorKey: 'impuestos',
        header: 'Impuesto',
        cell: ({ row }: { row: any }) => {
            // Campo calculado o por defecto
            return row.original.impuestos
        }
    },
    {
        accessorKey: 'tarifa',
        header: 'Tarifa',
        cell: ({ row }: { row: any }) => {
            return row.original.tarifa
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
                row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-document-text',
                    variant: 'ghost',
                    size: 'xs',
                    //add tooltip
                    tooltip: 'Ver Documentacion',
                    onClick: () => {
                        downloadFile(row.original.cotizacion_file_url)
                    }
                }) : null,
                h(UButton, {
                    icon: 'i-heroicons-arrow-path',
                    variant: 'ghost',
                    size: 'xs',
                    onClick: () => {
                        handleRefresh(row.original.id)
                    }
                }),
                h(UButton, {
                    icon: 'i-heroicons-trash',
                    variant: 'ghost',
                    size: 'xs',
                    onClick: () => {
                        handleDeleteFile(row.original.id)
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
        accessorKey: 'monto',
        header: 'Fob',
        cell: ({ row }: { row: any }) => {
            const monto = parseFloat(row.getValue('monto'))
            return formatCurrency(monto, 'USD')
        }
    },
    {
        accessorKey: 'logistica',
        header: 'Logistica',
        cell: ({ row }: { row: any }) => {
            // Campo calculado o por defecto
            return row.original.monto
        }
    },
    {
        accessorKey: 'impuestos',
        header: 'Impuesto',
        cell: ({ row }: { row: any }) => {
            // Campo calculado o por defecto
            return row.original.impuestos
        }
    },
    {
        accessorKey: 'tarifa',
        header: 'Tarifa',
        cell: ({ row }: { row: any }) => {
            return row.original.tarifa
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
                row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-document-text',
                    variant: 'ghost',
                    size: 'xs',
                    //add tooltip
                    tooltip: 'Ver Documentacion',
                    onClick: () => {
                        downloadFile(row.original.cotizacion_file_url)
                    }
                }) : null,
                row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-arrow-path',
                    variant: 'ghost',
                    size: 'xs',
                    onClick: () => {
                        handleRefresh(row.original.id)
                    }
                }) : null,
                row.original.cotizacion_file_url ? h(UButton, {
                    icon: 'i-heroicons-trash',
                    variant: 'ghost',
                    size: 'xs',
                    onClick: () => {
                        handleDeleteFile(row.original.id)
                    }
                }) : null,
                h(UButton, {
                    icon: 'i-heroicons-arrow-right',
                    variant: 'ghost',
                    size: 'xs',
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
            const estado = row.getValue('estado_cotizador')
            const color = getEstadoColor(estado)
            return h(USelect as any, {
                items: filterConfigProspectos.value.find((filter: any) => filter.key === 'estado')?.options.filter((option: any) => option.inrow),
                placeholder: 'Seleccionar estado',
                modelValue: estado,
                class: 'w-full',
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
                const estado = row.original.estado_pago
                const color = getEstadoPago(estado)
                return h('span', {
                    class: `px-2 py-1 rounded-md text-xs font-medium ${color}`
                }, estado)
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

                return h('div', {
                    class: 'flex flex-row gap-2 items-center flex-wrap'
                }, [
                    ...pagos.map((pago: any) =>
                        h('div', {
                            class: 'flex items-center bg-gray-100 rounded-lg p-2 cursor-pointer hover:bg-gray-200',
                            onClick: () => {
                                const modal = overlay.create(AdelantoPreviewModal)
                                modal.open({
                                    modelValue: true,
                                    pago,
                                    onOnDelete: async () => {
                                        try {

                                            showSuccess('Voucher eliminado correctamente', 'El voucher se ha eliminado correctamente')
                                            await getCotizaciones(Number(id))
                                            modal.close()
                                        } catch (error) {
                                            showError('Error al eliminar el voucher', error)
                                        }
                                    }
                                })
                            }
                        }, [
                            h(UBadge, {
                                color: pago.is_confirmed ? 'success' : 'neutral',
                                variant: 'subtle',
                                size: 'xs',
                                label: formatCurrency(pago.monto, 'USD')
                            })

                        ])
                    ),
                    h(UButton, {
                        icon: 'i-heroicons-plus',
                        variant: 'ghost',
                        size: 'xs',
                        onClick: () => {
                            const modal = overlay.create(CreatePagoModal)
                            modal.open({
                                onSuccess: () => {
                                    getCotizaciones(Number(id))
                                }
                            })
                        }
                    })
                ])
            }
        }
    ]
}
const embarqueCotizadorColumns = ref<TableColumn<any>[]>([
    //Asesor	Status	N.	Buyer	Whatsapp	Estado	Productos	Qty Box	CBM t.	Weight	Supplier	C. Supplier	P. Number	Qty Box.	CBM Ch.	Arrive Date	Acciones
    {
        accessorKey: 'asesor',
        header: 'Asesor',
        cell: ({ row }: { row: any }) => row.original.No_Nombres_Apellidos
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
                        class: 'w-full',
                        disabled: currentRole.value !== ROLES.CONTENEDOR_ALMACEN,
                        modelValue: proveedor.estados_proveedor,
                        'onUpdate:modelValue': (value: any) => {
                            proveedor.estados_proveedor = value
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
            return row.original.nombre
        }
    },
    {
        accessorKey: 'whatsapp',
        header: 'Whatsapp',
        cell: ({ row }: { row: any }) => row.original.telefono
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
                    class: 'w-full',
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
                    class: 'w-full',
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
                class: 'flex flex-col gap-2'
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
        header: 'CBM Total Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.cbm_total_china,
                    class: 'w-full',
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
        header: 'Arrive Date',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    modelValue: proveedor.arrive_date_china,
                    class: 'w-full',
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
                        size: 'xs',
                        onClick: () => {
                            navigateTo(`/cargaconsolidada/completados/cotizaciones/proveedor/documentacion/${proveedor.id}`)
                        }
                    }),
                    h(UButton, {
                        icon: 'i-heroicons-document-arrow-down',
                        variant: 'ghost',
                        size: 'xs',
                        onClick: () => {
                            updateProveedorData(proveedor)
                        }
                    })
                ])
            }))
        }
    }
])
const overlay = useOverlay()
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
        cotizacionId: idCotizacion,
        idConsolidado: id,
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
    formData.append('id', data.id)

    try {
        await withSpinner(async () => {
            await updateProveedor(formData)
            showSuccess('Proveedor actualizado correctamente', 'El proveedor se ha actualizado correctamente.')
            await getCotizaciones(Number(id))
        }, 'Actualizando proveedor...')
        await getCotizaciones(Number(id))
    } catch (error) {
        showError('Error al actualizar el proveedor', error)
    }

}
onMounted(() => {
    loadTabs();
   
    const tabQuery = route.query.tab
    
    if (tabQuery) {
        tab.value = tabQuery as string
    } else {
        tab.value = tabs[0].value // Cambiar a 'prospectos' como tab inicial
    }
})
</script>
