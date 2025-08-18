    <!--3 tabs:general,variacion,pagos and 3 tables-->
    <template>
        <div class="p-6">
            <PageHeader title="Clientes" subtitle="Gestión de clientes" icon="i-heroicons-user"
                :hide-back-button="true" />
            <UTabs v-model="tab"  :items="tabs" size="sm" variant="pill"
                class="mb-4 w-50" />
            <DataTable v-if="tab === 'general'" title="" icon="" :data="clientes" :columns="columns"
                :loading="loadingGeneral" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral"
                :total-records="totalRecordsGeneral" :items-per-page="itemsPerPageGeneral"
                :search-query-value="searchGeneral" :show-secondary-search="false" :show-filters="true"
                :filter-config="filterConfig" :show-export="true"
                empty-state-message="No se encontraron registros de clientes." @update:primary-search="handleSearch"
                @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange"
                @filter-change="handleFilterChange">
            </DataTable>
            <DataTable v-if="tab === 'variacion'" title="" icon="" :data="clientesVariacion" :columns="columnsVariacion"
                :loading="loadingVariacion" :current-page="currentPageVariacion" :total-pages="totalPagesVariacion"
                :total-records="totalRecordsVariacion" :items-per-page="itemsPerPageVariacion"
                :search-query-value="searchVariacion" :show-secondary-search="false" :show-filters="true"
                :filter-config="filterConfigVariacion" :show-export="true"
                empty-state-message="No se encontraron registros de clientes."
                @update:primary-search="handleSearchVariacion" @page-change="handlePageChangeVariacion"
                @items-per-page-change="handleItemsPerPageChangeVariacion" @filter-change="handleFilterChangeVariacion">
            </DataTable>
        </div>
    </template>
<script setup lang="ts">
import { useGeneral } from '../composables/cargaconsolidada/clientes/useGeneral'
import { useVariacion } from '../composables/cargaconsolidada/clientes/useVariacion'
import { UButton, UBadge } from '#components'
const route = useRoute()
const id = route.params.id
const tab = ref('general')
const { getClientes, clientes, totalRecordsGeneral, loadingGeneral, error, paginationGeneral, searchGeneral, itemsPerPageGeneral, totalPagesGeneral, currentPageGeneral, filtersGeneral, filterConfig, handleSearch, handlePageChange, handleItemsPerPageChange, handleFilterChange } = useGeneral()
const { getClientesVariacion, clientesVariacion, totalRecordsVariacion, loadingVariacion, errorVariacion, paginationVariacion, searchVariacion, itemsPerPageVariacion, totalPagesVariacion, currentPageVariacion, filtersVariacion, filterConfigVariacion, handleSearchVariacion, handlePageChangeVariacion, handleItemsPerPageChangeVariacion, handleFilterChangeVariacion } = useVariacion()
const tabs = ref([
    {
        label: 'General',
        value: 'general'
    },
    {
        label: 'Variación',
        value: 'variacion'
    },
    /*{
        label: 'Pagos',
        value: 'pagos'
    }*/
])
const handleTabChange = (value: string) => {
    //set tab to value
    console.log(value)
    if (tab.value === 'general') {
        getClientes(Number(id))
    }else if (tab.value === 'variacion') {
        getClientesVariacion(Number(id))
    }
}
const columns = ref<TableColumn<any>[]>([
    {
        accessorKey: 'index',
        header: 'N°',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: 'carga',
        header: 'Carga',
        cell: ({ row }: { row: any }) => {
            return row.original.carga
        }
    },
    {
        accessorKey: 'f_cierre',
        header: 'F. Cierre',
        cell: ({ row }: { row: any }) => {
            return row.getValue('f_cierre')
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
        accessorKey: 'COD',
        header: 'Codigo',
        cell: ({ row }: { row: any }) => {
            return row.getValue('COD')
        }
    },
    {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }: { row: any }) => {
            return row.getValue('fecha')
        }
    },
    {
        accessorKey: 'updated_at',
        header: 'Fecha Modificación',
        cell: ({ row }: { row: any }) => {
            return row.getValue('updated_at')
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
        accessorKey: 'volumen_china',
        header: 'Volumen China',
        cell: ({ row }: { row: any }) => {
            return row.getValue('volumen_china')
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
            return row.getValue('estados')
        }
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: any }) => {
            return row.getValue('status')
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
            return row.getValue('volumen')
        }
    },
    {
        accessorKey: 'volumen_china',
        header: 'Vol. China',
        cell: ({ row }: { row: any }) => {
            return row.getValue('volumen_china')
        }
    },
    {
        accessorKey: 'volumen_doc',
        header: 'Vol. Doc',
        cell: ({ row }: { row: any }) => {
            return row.getValue('volumen_doc')
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
onMounted(() => {
    handleTabChange(tab.value)
})

</script>