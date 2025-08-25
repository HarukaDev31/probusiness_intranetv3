<template>
    <div class="p-6">
        <!-- <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div class="mb-4">
                <h1 class="text-2xl font-bold text-gray-900">Base de datos de clientes</h1>
            </div>
            <div class="flex justify-end">
                <UButton label="Ver Excel de clientes" icon="i-heroicons-eye" color="neutral"
                    variant="outline" @click="goToArchivos" />
            </div>
        </div>
        <DataTable title="Base de datos de clientes" icon="i-heroicons-users" :data="clientes" :columns="columns"
            :loading="loading" :current-page="currentPage" :total-pages="totalPages" :total-records="totalItems"
            :items-per-page="itemsPerPage" :search-query-value="search" :primary-search-value="primarySearch"
            :show-primary-search="true" :primary-search-label="'Buscar por'"
            :primary-search-placeholder="'Buscar por nombre, DNI/RUC, correo...'" :show-filters="true"
            :filter-config="filterConfig" :filters-value="filters" :show-export="true"
            :show-headers="true" :headers="headers"
            empty-state-message="No se encontraron clientes que coincidan con los criterios de búsqueda."
            @update:search-query="handleSearch" @update:primary-search="handleSearch"
            @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportClientes"
            @filter-change="handleFilterChange">
            

            <template #error-state>
                <ErrorState :message="error || 'Error desconocido'" />
            </template>
        </DataTable> -->

        <!-- Encabezado y acciones -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Base de datos clientes</h1>
        <p class="text-gray-500 text-sm mt-1">Total de clientes: {{ totalItems }}</p>
      </div>
      <div class="flex items-center gap-3">
        <UInput
          v-model="primarySearch"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar por"
          class="w-56"
          @input="handleSearch"
        />
        <UButton label="Filtros" icon="i-heroicons-adjustments-horizontal" variant="outline" @click="showFilters = true" />
        <UButton label="Exportar" icon="i-heroicons-arrow-down-tray" variant="outline" @click="exportClientes" />
        <UButton label="Cargar cliente" icon="i-heroicons-plus" color="primary" @click="goToArchivos" />
      </div>
    </div>

        <!-- Tabla de clientes -->
        <div class="bg-transparent rounded-lg shadow">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-transparent">
            <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">N°</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">DNI/RUC</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Correo</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">WhstApp</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Servicio</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Categoría</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Acción</th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="(cliente, idx) in clientes" :key="cliente.id" class="hover:bg-gray-50">
                <td class="px-4 py-2">{{ idx + 1 }}</td>
                <td class="px-4 py-2">{{ cliente.fecha }}</td>
                <td class="px-4 py-2">{{ cliente.nombre }}</td>
                <td class="px-4 py-2">{{ cliente.documento }}</td>
                <td class="px-4 py-2">{{ cliente.correo }}</td>
                <td class="px-4 py-2">{{ cliente.telefono }}</td>
                <td class="px-4 py-2">{{ cliente.primer_servicio?.servicio || '-' }}</td>
                <td class="px-4 py-2">
                <span :class="getCategoriaColor(cliente.primer_servicio?.categoria)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ cliente.primer_servicio?.categoria || '-' }}
                </span>
                </td>
                <td class="px-4 py-2">
                <UButton
                    icon="i-heroicons-eye"
                    size="xs"
                    color="primary"
                    variant="ghost"
                    @click="navigateTo(`/basedatos/clientes/${cliente.id}`)"
                    aria-label="Ver"
                />
                </td>
            </tr>
            </tbody>
        </table>
        <div v-if="clientes.length === 0" class="p-6 text-center text-gray-400">
            No se encontraron clientes que coincidan con los criterios de búsqueda.
        </div>
        </div>
            <!-- Paginación limpia como productos -->
            <div class="flex justify-end mt-8">
            <UPagination
                :page="currentPage"
                :page-count="totalPages"
                :total="totalItems"
                :items-per-page="itemsPerPage"
                @update:page="handlePageChange"
                @update:items-per-page="handleItemsPerPageChange"
                />
            </div>
    </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Components
const UButton = resolveComponent('UButton')

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
  loadClientes({ page })
}

const onItemsPerPageChange = (limit: number) => {
  loadClientes({ page: 1, limit })
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
        header: 'N°',
        cell: ({ row }) => {
            const index = clientes.value.indexOf(row.original)
            return h('div', { class: 'font-semibold text-gray-700 py-3' }, index + 1)
        }
    },
    {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => h('div', { class: 'text-gray-500 py-3' }, row.getValue('fecha'))
    },
    {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }) => h('div', { class: 'font-medium text-gray-900 py-3' }, row.getValue('nombre'))
    },
    {
        accessorKey: 'documento',
        header: 'DNI/RUC',
        cell: ({ row }) => h('div', { class: 'text-gray-700 py-3' }, row.getValue('documento') || '-')
    },
    {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ row }) => h('div', { class: 'text-gray-700 py-3' }, row.getValue('correo'))
    },
    {
        accessorKey: 'telefono',
        header: 'WhstApp',
        cell: ({ row }) => h('div', { class: 'text-gray-700 py-3' }, row.getValue('telefono'))
    },
    {
        accessorKey: 'primer_servicio',
        header: 'Servicio',
        cell: ({ row }) => {
            const primerServicio = row.getValue('primer_servicio') as any
            return h('div', { class: 'font-medium text-gray-700 py-3' }, primerServicio?.servicio || '-')
        }
    },
    {
        accessorKey: 'categoria',
        header: 'Categoría',
        cell: ({ row }) => {
            const primerServicio = row.getValue('primer_servicio') as any
            return h('span', {
                class: `px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(primerServicio?.categoria)}`
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
        'Premiun': 'bg-purple-100 text-purple-800',
        'Inactivo': 'bg-gray-100 text-gray-800'
    }
    return colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const handleSecondarySearch = (value: string) => {
    loadClientes({ page: 1 })
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
