<template>
    <div class="p-6">
        <!--div with content align right-->
        <div class="flex justify-end">
            <UButton label="Ver Excel de clientes" icon="i-heroicons-eye" color="neutral"
                variant="outline" @click="goToArchivos" />
        </div>

        <DataTable title="Base de datos de clientes" icon="i-heroicons-users" :data="clientes" :columns="columns"
            :loading="loading" :current-page="currentPage" :total-pages="totalPages" :total-records="totalItems"
            :items-per-page="itemsPerPage" :search-query-value="search" :secondary-search-value="secondarySearch"
            :show-secondary-search="true" :secondary-search-label="'Buscar por'"
            :secondary-search-placeholder="'Buscar por nombre, DNI/RUC, correo...'" :show-filters="true"
            :filter-config="filterConfig" :filters-value="filters" :show-export="true"
            empty-state-message="No se encontraron clientes que coincidan con los criterios de búsqueda."
            @update:search-query="handleSearch" @update:secondary-search="handleSecondarySearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportClientes"
            @filter-change="handleFilterChange">


            <!-- Estado de error -->
            <template #error-state>
                <ErrorState :message="error || 'Error desconocido'" />
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, h, resolveComponent, onMounted, computed } from 'vue'
import type { TableColumn } from '@nuxt/ui'

// Components
const UButton = resolveComponent('UButton')

// Composables
const {
    clientes,
    loading,
    error,
    pagination,
    search,
    secondarySearch,
    filters,
    filterOptions,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    loadClientes,
    loadFilterOptions,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    exportClientes
} = useClientes()

// Configuración de filtros para DataTable
const filterConfig = computed(() => [
  {
    key: 'categoria',
    label: 'Categoría',
    type: 'select',
    placeholder: 'Seleccionar categoría',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'Cliente', value: 'Cliente' },
      { label: 'Recurrente', value: 'Recurrente' },
      { label: 'Premiun', value: 'Premiun' },
      { label: 'Inactivo', value: 'Inactivo' }
    ]
  },
  {
    key: 'fecha_inicio',
    label: 'Fecha Inicio',
    type: 'date',
    placeholder: 'DD/MM/YYYY',
    options: []
  },
  {
    key: 'fecha_fin',
    label: 'Fecha Fin',
    type: 'date',
    placeholder: 'DD/MM/YYYY',
    options: []
  },
  {
    key: 'servicio',
    label: 'Servicio',
    type: 'select',
    placeholder: 'Seleccionar servicio',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'Curso', value: 'Curso' },
      { label: 'Consolidado', value: 'Consolidado' },
    ]
  },
])

// Configuración de columnas para la tabla
const columns: TableColumn<any>[] = [
    {
        accessorKey: 'id',
        header: 'N.',
        cell: ({ row }) => row.getValue('id')
    },
    {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }) => row.getValue('nombre')
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }) => row.getValue('documento') || '-'
    },
    {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ row }) => row.getValue('correo')
    },
    {
        accessorKey: 'telefono',
        header: 'Teléfono',
        cell: ({ row }) => row.getValue('telefono')
    },
    {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => row.getValue('fecha')
    },
    {
        accessorKey: 'primer_servicio',
        header: 'Servicio',
        cell: ({ row }) => {
            const primerServicio = row.getValue('primer_servicio') as any
            if (primerServicio) {
                return h('div', { class: 'space-y-1' }, [
                    h('div', { class: 'font-medium' }, primerServicio.servicio),
                    
                ])
            }
            return '-'
        }
    },
    {
        accessorKey: 'categoria',
        header: 'Categoría',
        cell: ({ row }) =>{
            const primerServicio = row.getValue('primer_servicio') as any
            if (primerServicio) {
                return h('div', { class: 'space-y-1' }, [
             
                    h('div', { class: 'text-xs' }, [
                        h('span', { class: `px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(primerServicio.categoria)}` }, primerServicio.categoria)
                    ])
                ])
            }
            return '-'
        }
    },
    {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-2' }, [
                h(UButton as any, {
                    size: 'xs',
                    icon: 'i-heroicons-eye',
                    color: 'primary',
                    variant: 'ghost',
                    onClick: () => navigateTo(`/basedatos/clientes/${row.original.id}`)
                }),
           
            ])
        }
    }
]

// Methods
const getCategoriaColor = (categoria: string) => {
    const colors = {
        'Cliente': 'bg-blue-100 text-blue-800',
        'Recurrente': 'bg-green-100 text-green-800',
        'Premiun': 'bg-purple-100 text-purple-800',
        'Inactivo': 'bg-gray-100 text-gray-800'
    }
    return colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const handleSecondarySearch = (value: string) => {
    secondarySearch.value = value
    loadClientes({ page: 1 })
}

const handleItemsPerPageChange = (limit: number) => {
    loadClientes({ page: 1, limit })
}

const goToArchivos = () => {
    navigateTo('/basedatos/clientes/archivos')
}

const handleEditCliente = (id: number) => {
    // Implementar edición de cliente
    console.log('Editar cliente:', id)
}

const handleDeleteCliente = (id: number) => {
    // Implementar eliminación de cliente
    console.log('Eliminar cliente:', id)
}

// Initialize data
onMounted(async () => {
  
    await loadClientes()
})
</script>
