    <!--3 tabs:general,variacion,pagos and 3 tables-->
    <template>
        <div class="p-6">

            <DataTable v-if="tab === 'general'" title="" icon="" :data="clientes" :columns="getColumnsGeneral()"
                :loading="loadingGeneral" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral"
                :total-records="totalRecordsGeneral" :items-per-page="itemsPerPageGeneral"
                :search-query-value="searchGeneral" :show-secondary-search="false" :show-filters="false"
                :filter-config="filterConfig" :show-export="true" :show-body-top="true"
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchGeneral" @page-change="handlePageGeneralChange"
                @items-per-page-change="handleItemsPerPageChangeGeneral" @filter-change="handleFilterChangeGeneral"
                :hide-back-button="false"
                :previous-page-url="(currentRole !== ROLES.COORDINACION || currentId !== ID_JEFEVENTAS) ? `/cargaconsolidada/abiertos/pasos/${id}` : `/cargaconsolidada/abiertos`">
                <template #body-top>
                    <UTabs v-model="tab" :items="tabs" size="sm" variant="pill" class="mb-4 w-60" color="secondary" />

                </template>
            </DataTable>
            <DataTable v-if="tab === 'variacion'" title="" icon="" :data="clientesVariacion" :columns="columnsVariacion"
                :loading="loadingVariacion" :current-page="currentPageVariacion" :total-pages="totalPagesVariacion"
                :total-records="totalRecordsVariacion" :items-per-page="itemsPerPageVariacion"
                :search-query-value="searchVariacion" :show-secondary-search="false" :show-filters="false"
                :filter-config="filterConfigVariacion" :show-export="true" :show-body-top="true"
                :hide-back-button="false" empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchVariacion" @page-change="handlePageVariacionChange"
                @items-per-page-change="handleItemsPerPageChangeVariacion" @filter-change="handleFilterChangeVariacion">
                <template #body-top>
                    <UTabs v-model="tab" :items="tabs" size="sm" variant="pill" class="mb-4 w-60" color="secondary" />
                </template>
            </DataTable>
            <DataTable v-if="tab === 'pagos'" title="" icon="" :data="clientesPagos" :columns="columnsPagos"
                :loading="loadingPagos" :current-page="currentPagePagos" :total-pages="totalPagesPagos"
                :total-records="totalRecordsPagos" :items-per-page="itemsPerPagePagos"
                :search-query-value="searchVariacion" :show-secondary-search="false" :show-filters="false"
                :filter-config="filterConfigVariacion" :show-export="true" :hide-back-button="false"
                :show-body-top="true" empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchVariacion" @page-change="handlePageVariacionChange"
                @items-per-page-change="handleItemsPerPageChangeVariacion" @filter-change="handleFilterChangeVariacion">
                <template #body-top>
                    <UTabs v-model="tab" :items="tabs" size="sm" variant="pill" class="mb-4 w-60" color="secondary" />

                </template>
            </DataTable>
        </div>
    </template>
<script setup lang="ts">
import { useGeneral } from '~/composables/cargaconsolidada/clientes/useGeneral'
import { useVariacion } from '~/composables/cargaconsolidada/clientes/useVariacion'
import { usePagos } from '~/composables/cargaconsolidada/clientes/usePagos'
import { UButton, UBadge, USelect } from '#components'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
import type { TableColumn } from '@nuxt/ui'
import PagoGrid from '~/components/PagoGrid.vue'
const { withSpinner } = useSpinner()
const { showConfirmation, showSuccess, showError } = useModal()
const { currentRole, currentId } = useUserRole()

const route = useRoute()
const id = route.params.id
const tab = ref('general')
const { getClientes, clientes, updateEstadoCliente, totalRecordsGeneral, loadingGeneral, error, paginationGeneral, searchGeneral, itemsPerPageGeneral, totalPagesGeneral, currentPageGeneral, filtersGeneral, filterConfig, handlePageGeneralChange, handleItemsPerPageChangeGeneral, handleFilterChangeGeneral, handleSearchGeneral } = useGeneral()
const { getClientesVariacion, updateVolumenSelected, clientesVariacion, totalRecordsVariacion, loadingVariacion, paginationVariacion, searchVariacion, itemsPerPageVariacion, totalPagesVariacion, currentPageVariacion, filtersVariacion } = useVariacion()
const { getClientesPagos, clientesPagos, totalRecordsPagos, loadingPagos, paginationPagos, searchPagos, itemsPerPagePagos, totalPagesPagos, currentPagePagos, filtersPagos, filterConfigPagos, handlePagePagosChange, handleItemsPerPageChangePagos, handleFilterChangePagos, handleSearchPagos, registrarPago, deletePago } = usePagos()
const tabs = ref()
const handleTabChange = (value: string) => {
    //set tab to value
    if (tab.value === 'general') {
        getClientes(Number(id))
    } else if (tab.value === 'variacion') {
        getClientesVariacion(Number(id))
    } else if (tab.value === 'pagos') {
        getClientesPagos(Number(id))
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
            return row.getValue('estado')
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
            return h(PagoGrid, {
                pagoDetails: JSON.parse(row.original.pagos_details ?? '[]'),
                currency: 'USD',
                numberOfPagos: 4,
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
            return row.getValue('fob')
        }
    },
    {
        accessorKey: 'monto',
        header: 'Logistica',
        cell: ({ row }: { row: any }) => {
            return row.getValue('monto')
        }
    },
    {
        accessorKey: 'impuestos',
        header: 'Impuesto',
        cell: ({ row }: { row: any }) => {
            return row.getValue('impuestos')
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
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            //button view with more info
            return h(UButton, {
                icon: 'i-heroicons-eye',
                variant: 'ghost',
                size: 'xs',
                onClick: () => {
                    navigateTo(`/cargaconsolidada/abiertos/clientes/documentacion/${row.original.id_cotizacion}`)
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
            return row.getValue('fob')
        }
    },
    {
        accessorKey: 'monto',
        header: 'Logistica',
        cell: ({ row }: { row: any }) => {
            return row.getValue('monto')
        }
    },
    {
        accessorKey: 'impuestos',
        header: 'Impuesto',
        cell: ({ row }: { row: any }) => {
            return row.getValue('impuestos')
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
        accessorKey: 'estados',
        header: 'Estados',
        cell: ({ row }: { row: any }) => {
            //show estado_cliente in USELECT WITH STATUS RESERVADO,NO RESERVADO DOCUMENTACION C FINAL FACTURADO
            return h(USelect as any, {
                modelValue: row.original.estado_cliente,
                items: [
                    { label: 'Reservado', value: 'RESERVADO' },
                    { label: 'No Reservado', value: 'NO RESERVADO' },
                    { label: 'Documentación', value: 'DOCUMENTACION' },
                    { label: 'C Final', value: 'C FINAL' },
                    { label: 'Facturado', value: 'FACTURADO' }
                ],
                placeholder: 'Seleccionar estado',
                class: 'w-full',
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
                    navigateTo(`/cargaconsolidada/abiertos/clientes/documentacion/${row.original.id_cotizacion}`)
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
            return h(UBadge, {
                label: row.original.status_cliente_doc,
                color: getColorStatusDocumentacion(row.original.status_cliente_doc),
                variant: 'soft'
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
                    navigateTo(`/cargaconsolidada/abiertos/clientes/documentacion/${row.original.id_cotizacion}`)
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
                color: row.original.vol_selected === 'volumen' ? 'primary' : 'neutral',
                variant: 'soft',
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
                color: row.original.vol_selected === 'volumen_china' ? 'primary' : 'neutral',
                variant: 'soft',
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
                color: row.original.vol_selected === 'volumen_doc' ? 'primary' : 'neutral',
                variant: 'soft',
                label: row.getValue('volumen_doc'),
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
watch(tab, (newVal, oldVal) => {
    if (newVal === null) {
        handleTabChange('general')
    } else {
        handleTabChange(newVal)
    }
})
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

</script>