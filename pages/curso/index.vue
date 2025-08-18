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
import { useCursos } from '../composables/useCursos'
import type { TableColumn } from '@nuxt/ui'
const { cursosData, loading, currentPage, totalPages,getFiltros, fetchCursosData, totalRecords, itemsPerPage, search, filterConfig, filters, handleSearch, handlePageChange, handleItemsPerPageChange, handleFilterChange, exportData } = useCursos()
import { UButton, USelect } from '#components'
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
            return h(USelect as any, {
                modelValue: row.original.tipo_curso,
                'onUpdate:modelValue': (value: any) => {
                    row.original.tipo_curso = value
                },
                placeholder: 'Seleccionar tipo',    
                variant: 'outline',
                size: 'sm',
                items: [
                    { label: 'Virtual', value:0, icon: 'i-heroicons-video-camera' },
                    { label: 'En vivo', value:1, icon: 'i-heroicons-computer-desktop' }
                ],
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
        cell: ({ row }: { row: any }) => row.getValue('usuario')
    },
    {
        accessorKey: 'importe',
        header: 'Importe',
        cell: ({ row }: { row: any }) => row.getValue('importe')
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }: { row: any }) => row.getValue('estado')
    },
    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }: { row: any }) => {
            //ver,borrar,guardar,editar
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
                    icon: 'i-heroicons-save',
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
