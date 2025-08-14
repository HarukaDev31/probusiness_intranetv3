<template>
    <div class="p-6">
        <PageHeader title="Cotizaciones" subtitle="Gestión de cotizaciones" icon="i-heroicons-book-open"
            :hide-back-button="true" />
        <UTabs v-model="tab" :items="tabs" size="sm" variant="pill" class="mb-4 w-50" />

        <DataTable v-if="tab === 'prospectos'" title="" icon="" :data="cotizaciones" :columns="prospectosColumns"
            :loading="loadingCotizaciones" :current-page="currentPageCotizaciones" :total-pages="totalPagesCotizaciones"
            :total-records="totalRecordsCotizaciones" :items-per-page="itemsPerPageCotizaciones"
            :search-query-value="searchCotizaciones" :show-secondary-search="false" :show-filters="true"
            :filter-config="filterConfigProspectos" :show-export="true"
            empty-state-message="No se encontraron registros de prospectos."
            @update:primary-search="handleSearchProspectos" @page-change="handlePageChangeProspectos"
            @items-per-page-change="handleItemsPerPageChangeProspectos" @filter-change="handleFilterChangeProspectos">
        </DataTable>
        <DataTable v-if="tab === 'embarque'" title="" icon="" :data="cotizacionProveedor" :columns="columns"
            :loading="loading" :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
            :items-per-page="itemsPerPage" :search-query-value="search" :show-secondary-search="false"
            :show-filters="true" :filter-config="filterConfig" :show-export="true"
            empty-state-message="No se encontraron registros de cursos." @update:primary-search="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange"
            @filter-change="handleFilterChange">
        </DataTable>
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/userCotizacionProveedor'
import { useCotizacion } from '~/composables/cargaconsolidada/useCotizacion'
import { formatDate, formatCurrency } from '~/utils/formatters'
import { useSpinner } from '~/composables/commons/useSpinner'


const { getCotizacionProveedor, cotizacionProveedor, loading, currentPage, totalPages, totalRecords, itemsPerPage, search, filterConfig, handleSearch, handlePageChange, handleItemsPerPageChange, handleFilterChange } = useCotizacionProveedor()
const { cotizaciones, loading: loadingCotizaciones, error: errorCotizaciones, pagination: paginationCotizaciones, search: searchCotizaciones, itemsPerPage: itemsPerPageCotizaciones, totalPages: totalPagesCotizaciones, totalRecords: totalRecordsCotizaciones, currentPage: currentPageCotizaciones, filters: filtersCotizaciones, getCotizaciones } = useCotizacion()
const { withSpinner } = useSpinner()
const route = useRoute()
const id = route.params.id
const tabs = [
    {
        label: 'Prospectos',
        value: 'prospectos'
    },
    {
        label: 'Por Embarcar',
        value: 'embarque'
    },

]
const tab = ref('')
import { USelect, UInput, UButton, UIcon } from '#components'

// Configuración de filtros para prospectos
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

// Columnas para el tab de prospectos
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
        cell: ({ row }: { row: any }) => row.getValue('estado_cliente') || 'Sin estado'
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
                        //refresh
                    }
                }),
                h(UButton, {
                    icon: 'i-heroicons-trash',
                    variant: 'ghost',
                    size: 'xs',
                    onClick: () => {
                        //delete    
                    }
                })
            ])
        }
        
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            const estado = row.getValue('estado')
            const color = getEstadoColor(estado)
            return h(USelect as any, {
                items: filterConfigProspectos.value.find((filter: any) => filter.key === 'estado')?.options.filter((option: any) => option.inrow),
                placeholder: 'Seleccionar estado',
                value: estado,
                class: 'w-full',
                modelValue: estado,
            })
        }
    }
])

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
        showError('Error al descargar archivo')
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

// Watch inmediato para cargar datos cuando cambie el tab
watch(tab, async (newVal, oldVal) => {
    // Solo ejecutar si hay un cambio real de tab (no en la inicialización)
    if (oldVal === '' || !newVal) {
        return
    }

    try {
        if (newVal === 'prospectos') {
            await getCotizaciones(Number(id))
        } else if (newVal === 'embarque') {
            await getCotizacionProveedor(Number(id))
        }
    } catch (error) {
        console.error('Error al cambiar tab:', error)
    }
}, { immediate: false })

// Watch inmediato para la carga inicial
watch(() => tab.value, async (newVal) => {
    if (newVal && newVal !== '') {
        try {
            if (newVal === 'prospectos') {
                await getCotizaciones(Number(id))
            } else if (newVal === 'embarque') {
                await getCotizacionProveedor(Number(id))
            }
        } catch (error) {
            console.error('Error en carga inicial:', error)
        }
    }
}, { immediate: true })

const columns = ref<TableColumn<any>[]>([
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
        accessorKey: 'index',
        header: 'N.',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: 'nombre',
        header: 'Buyer',
        cell: ({ row }: { row: any }) => {
            return row.original.nombre
        }
    },
    {
        accessorKey: 'products',
        header: 'Products',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            //foreach proveedor, show products in UINPUT DISABLED AND READONLY
            const div = h('div', {
                class: 'flex flex-col gap-2'
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.products
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
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.qty_box ?? 0
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
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.cbm_total ?? 0
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'weight',
        header: 'Weight',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.peso ?? 0
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
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.supplier
                })
            }))
            return div
        }
    },
    //COD SUPPLIER
    {
        accessorKey: 'code_supplier',
        header: 'C. Supplier',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.code_supplier
                })
            }))
            return div
        }
    },
    //supplier_phone
    {
        accessorKey: 'supplier_phone',
        header: 'P. Number',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.supplier_phone
                })
            }))
            return div
        }
    },
    //qty_box_china, cbm_total_china ,arrive_date_china,ACTIONS SHOW AND SAVE
    //arrive_date_china
    {
        accessorKey: 'arrive_date_china',
        header: 'Arrive Date',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.arrive_date_china ?? 0
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'cbm_total_china',
        header: 'CBM Ch.',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.cbm_total_china ?? 0
                })
            }))
            return div
        }
    },
    {
        accessorKey: 'qty_box_china',
        header: 'Qty Box Ch.',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.qty_box_china ?? 0
                })
            }))
            return div
        }
    },
    //arrive_date_china
    {
        accessorKey: 'arrive_date_china',
        header: 'Arrive Date',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const div = h('div', {
                class: 'flex flex-col gap-2',
                style: {
                    width: '100px'
                }
            }, proveedores.map((proveedor: any) => {
                return h(UInput as any, {
                    disabled: true,
                    readonly: true,
                    value: proveedor.arrive_date_china ?? 0
                })
            }))
            return div
        }
    },
    //actions
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
                            navigateTo(`/cargaconsolidada/abiertos/cotizaciones/proveedor/documentacion-china/${proveedor.id}`)
                        }
                    }),
                    h(UButton, {
                        icon: 'i-heroicons-document-arrow-down',
                        variant: 'ghost',
                        size: 'xs',
                        onClick: () => {
                        }
                    })
                ])
            }))
        }
    }
])

onMounted(() => {
    // Solo establecer el tab inicial, el watch se encargará de cargar los datos
    tab.value = tabs[0].value // Cambiar a 'prospectos' como tab inicial
})
</script>
