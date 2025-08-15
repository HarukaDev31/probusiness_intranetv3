<template>
    <div class="p-6">
        <PageHeader title="Cursos" subtitle="Gestión de cursos" icon="i-heroicons-book-open" :hide-back-button="true" />
        <DataTable title="" icon="" :data="cursosData" :columns="columns" :loading="loading" :current-page="currentPage"
            :total-pages="totalPages" :total-records="totalRecords" :items-per-page="itemsPerPage"
            :search-query-value="search" :show-secondary-search="false" :show-filters="true"
            :filter-config="filterConfig" :filters-value="filters" :show-export="true"
            empty-state-message="No se encontraron registros de cursos." @update:search-query="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportData"
            @filter-change="handleFilterChange">
        </DataTable>
    </div>
</template>
<script setup lang="ts">
import { useCursos } from '~/composables/useCursos'
import type { TableColumn } from '@nuxt/ui'
const { cursosData, loading, currentPage, totalPages,getFiltros, fetchCursosData, totalRecords, itemsPerPage, search, filterConfig, filters, handleSearch, handlePageChange, handleItemsPerPageChange, handleFilterChange, exportData } = useCursos()
import { UButton, USelect } from '#components'
const estadoClasses: Record<string, string> = {
    pendiente: 'bg-gray-100 text-gray-800',
    adelanto: 'bg-yellow-100 text-yellow-800',
    pagado: 'bg-green-100 text-green-800',
    sobrepago: 'bg-red-100 text-red-800'
}
const columns = ref<TableColumn<any>[]>([
    {
        accessorKey: 'index',
        header: 'N.',
        cell: ({ row }: { row: any }) => {
            return row.index + 1
        }
    },

    {
        accessorKey: 'Fe_Registro',
        header: 'Fecha',
        cell: ({ row }: { row: any }) => row.getValue('Fe_Registro')
    },
    {
        accessorKey: 'cliente',
        header: 'Cliente',
        cell: ({ row }: { row: any }) => {
            return h('div', [
                h('p', row.original.No_Entidad),
                h('p', row.original.Nu_Documento_Identidad),
                h('p', row.original.Nu_Celular_Entidad),
                h('p', row.original.Txt_Email_Entidad)
            ])
        }
    },
    {
        accessorKey: 'tipo_curso',
        header: 'Curso',
        cell: ({ row }: { row: any }) => {
            const value = row.original.tipo_curso
            const items = [
                { label: 'Virtual', value:0, icon: 'i-heroicons-video-camera' },
                { label: 'En vivo', value:1, icon: 'i-heroicons-computer-desktop' }
            ]
            const icon = items.find(item => item.value === value)?.icon
            return h(USelect as any, {
                modelValue: value,
                'onUpdate:modelValue': (value: any) => {
                    row.original.tipo_curso = value
                },
                placeholder: 'Seleccionar tipo',    
                variant: 'outline',
                size: 'sm',
                items,
                option: (option: any) => h('div', { class: 'flex items-center gap-2' }, [
                    h('span', { class: option.icon }),
                    h('span', option.label)
                ]),
                icon,
                class: 'w-full'
            })
        }
    },
    {
        accessorKey: 'campana',
        header: 'Campaña',
        cell: ({ row }: { row: any }) => {
            //create a select with the campanas in filterConfig with key campana and select with row.original.ID_Campana
            return h(USelect as any, {
                modelValue: row.original.ID_Campana,
                'onUpdate:modelValue': (value: any) => {
                    row.original.ID_Campana = value
                },
                placeholder: 'Seleccionar campaña',
                items: filterConfig.value.find((filter: any ) => filter.key === 'campanas')?.options || []
            })  
        }
    },
    {
        accessorKey: 'usuario',
        header: 'Usuario',
        cell: ({ row }: { row: any }) => {
            const items = [
                { label: 'Pendiente', value:0, icon: 'ic:outline-access-time' },
                { label: 'Creado', value:1, icon: 'ic:outline-person' },
                { label: 'Constancia', value:2, icon: 'solar:diploma-outline' }
            ]
            const icon = items.find(item => item.value === row.original.Nu_Estado_Usuario_Externo)?.icon
            return h(USelect as any, {
                modelValue: row.original.Nu_Estado_Usuario_Externo,
                'onUpdate:modelValue': (value: any) => {
                    row.original.Nu_Estado_Usuario_Externo = value
                },
                placeholder: 'Seleccionar usuario',
                items,
                option: (option: any) => h('div', { class: 'flex items-center gap-2' }, [
                    h('span', { class: option.icon }),
                    h('span', option.label)
                ]),
                icon,
            })
        }
    },
    {
        accessorKey: 'importe',
        header: 'Importe',
        cell: ({ row }: { row: any }) => formatCurrency(row.original.Ss_Total,'PEN'),
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => {
            const value = row.original.estado_pago
            const items = [
                { label: 'Pendiente', value: 'pendiente', icon: 'ic:outline-access-time' },
                { label: 'Adelanto', value: 'adelanto', icon: 'ic:round-double-arrow' },
                { label: 'Pagado', value: 'pagado', icon: 'ic:baseline-check-circle-outline' },
                { label: 'Sobrepago', value: 'sobrepago', icon: 'ri:error-warning-line' }
            ]
            const icon = items.find(item => item.value === value)?.icon
            return h(USelect as any, {
                modelValue: value,
                'onUpdate:modelValue': (val: any) => {
                    row.original.estado_pago = val
                },
                placeholder: 'Seleccionar estado',
                items,
                option: (option: any) => h('div', { 
                    class: estadoClasses[option.value] + ' rounded px-2 py-1 flex items-center gap-2'
                }, [
                    h('span', { class: option.icon }),
                    h('span', option.label)
                ]),
                icon,
                class: estadoClasses[value] + ' rounded px-2 py-1',
                
            })
        },
    },
    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            //ver,borrar,guardar
            return h('div', { class: 'flex items-center gap-2' }, [
                h(UButton, {
                    icon: 'i-heroicons-eye',
                    variant: 'solid',
                    onClick: () => {
                        console.log('ver')
                    }
                }),
                h(UButton, {
                    icon: 'i-heroicons-trash',
                    variant: 'outline',
                    onClick: () => {
                        console.log('borrar')
                    }
                }),
                h(UButton, {
                    icon: 'ic:outline-save',
                    variant: 'outline',
                    onClick: () => {
                        console.log('guardar')
                    }
                })
            ])
        }
    }
])
const fillFilters = async () => {
    const response = await getFiltros()
    console.log(response)
    filterConfig.value=response.data
    
}
onMounted(() => {
    fetchCursosData(filters.value, 1, itemsPerPage.value)
    fillFilters()
})
</script>
