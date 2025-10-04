<template>
    <div class="p-6">

        <DataTable title="Base de datos de clientes" :show-title="true" icon="i-heroicons-users" :data="clientes" :columns="columns"
            :loading="loading" :current-page="currentPage" :total-pages="totalPages" :total-records="totalItems"
            :items-per-page="itemsPerPage" :search-query-value="search" :primary-search-value="primarySearch"
            :show-primary-search="true" :showPrimarySearchLabel="false"
            :primary-search-placeholder="'Buscar por'" :show-filters="true"
            :filter-config="filterConfig" :filters-value="filters" :show-export="currentRole===ROLES.ADMINISTRACION"
            :show-headers="true" :headers="headers"
            empty-state-message="No se encontraron clientes que coincidan con los criterios de búsqueda."
            :show-new-button="currentRole===ROLES.ADMINISTRACION"
            new-button-label="Cargar Cliente"
            :on-new-button-click="goToArchivos"
            @update:search-query="handleSearch" @update:primary-search="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportClientes"
            @filter-change="handleFilterChange"
            >
            

            <template #error-state>
                <ErrorState :message="error || 'Error desconocido'" />
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Components
const UButton = resolveComponent('UButton')
import { ROLES } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
const { hasRole, isCoordinacion,currentRole } = useUserRole()
// Composables
const {
    clientes,
    loading,
    headers,
    error,
    search,
    primarySearch,
    filters,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    loadClientes,
    loadFilterOptions,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    handleItemsPerPageChange,
    exportClientes
} = useClientes()

const localCurrentPage = ref(1)

const onPageChange = (page: number) => {
  localCurrentPage.value = page
  loadClientes({ currentPage: page })
}

const onItemsPerPageChange = (limit: number) => {
  loadClientes({ currentPage: 1, itemsPerPage: limit })
}


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
      { label: 'Premium', value: 'Premium' },
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
        header: 'N°',
        cell: ({ row }) => {
            const index = clientes.value.indexOf(row.original)
            return h('div', { class: 'text-gray-700 py-3 dark:text-gray-300' }, index + 1)
        }
    },
    {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => h('div', { class: 'text-gray-700 py-3 dark:text-gray-400' }, row.getValue('fecha'))
    },
    {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }) => h('div', { class: 'text-gray-700 py-3 dark:text-gray-100' }, row.getValue('nombre'))
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }) => h('div', { class: 'text-gray-700 py-3 dark:text-gray-300' }, row.getValue('documento') || '-')
    },
    {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ row }) => h('div', { class: 'text-gray-700 py-3 dark:text-gray-300' }, row.getValue('correo'))
    },
    {
        accessorKey: 'telefono',
        header: 'WhstApp',
        cell: ({ row }) => h('div', { class: 'text-gray-700 py-3 dark:text-gray-300' }, row.getValue('telefono'))
    },
    {
        accessorKey: 'primer_servicio',
        header: 'Servicio',
        cell: ({ row }) => {
            const primerServicio = row.getValue('primer_servicio') as any
            return h('div', { class: 'font-medium text-gray-700 py-3 dark:text-gray-300' }, primerServicio?.servicio || '-')
        }
    },
    {
        accessorKey: 'categoria',
        header: 'Categoría',
        cell: ({ row }) => {
            const primerServicio = row.getValue('primer_servicio') as any
            return h('span', {
                class: `px-2 py-1 rounded-full dark:bg-gray-800 dark:text-gray-300 text-xs font-medium ${getCategoriaColor(primerServicio?.categoria)}`
            }, primerServicio?.categoria || '-')
        }
    },
    {
        accessorKey: 'acciones',
        header: 'Acción',
        cell: ({ row }) => h('div', { class: 'flex items-center justify-center py-3' }, [
            h(UButton as any, {
                size: 'xs',
                icon: 'i-heroicons-eye',
                color: 'primary',
                variant: 'ghost',
                onClick: () => navigateTo(`/basedatos/clientes/${row.original.id}`)
            })
        ])
    }
]

// Methods
const getCategoriaColor = (categoria: string) => {
    const colors = {
        'Cliente': 'bg-blue-100 text-blue-800',
        'Recurrente': 'bg-green-100 text-green-800',
        'Premium': 'bg-purple-100 text-purple-800',
        'Inactivo': 'bg-gray-100 text-gray-800'
    }
    return colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const handleSecondarySearch = (value: string) => {
    loadClientes({ currentPage: 1 })
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
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,100..900;1,100..900&display=swap');

* {
  font-family: 'Epilogue', sans-serif;
}
</style>