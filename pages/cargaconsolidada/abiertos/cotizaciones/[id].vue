<template>
    <div class="p-6">
        <PageHeader title="Cotizaciones" subtitle="Gestión de cotizaciones" icon="i-heroicons-book-open"
            :hide-back-button="true" />
        <DataTable title="" icon="" :data="cotizacionProveedor" :columns="columns" :loading="loading"
            :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
            :items-per-page="itemsPerPage" :search-query-value="search" :show-secondary-search="false"
            :show-filters="true" :filter-config="filterConfig" :filters-value="filterConfig" :show-export="true"
            empty-state-message="No se encontraron registros de cursos." @update:search-query="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange"
            @filter-change="handleFilterChange">
        </DataTable>
    </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
const { getCotizacionProveedor, cotizacionProveedor, loading, currentPage, totalPages, totalRecords, itemsPerPage, search, filterConfig, handleSearch, handlePageChange, handleItemsPerPageChange, handleFilterChange } = useCotizacionProveedor()
const route = useRoute()
const id = route.params.id
import { USelect, UInput, UButton, UIcon } from '#components'
const columns = ref<TableColumn<any>[]>([
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: any }) => {
            const proveedores = row.original.proveedores
            const options = [{
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
            }];
            //create div and foreach proveedor, show select with options NC,C,R,INSPECTION,LOADED,NO LOADED AND SELECTED IS ROW.ORIGINAL.estado_china
            const div = h('div',
                {
                    class: 'flex flex-col gap-2'
                },
                proveedores.map((proveedor: any) => {
                    return h(USelect as any, {
                        items: options,
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
            console.log(row)
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
            },proveedores.map((proveedor: any) => {
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
                            console.log(row)
                        }
                    })
                ])
            }))
        }
    }
])
onMounted(() => {
    getCotizacionProveedor(Number(id))
})
</script>
