<template>
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
            @clear-filters="handleClearFilters"
            >
            <template #actions>
                <UButton 
                    icon="i-heroicons-arrow-down-tray" 
                    label="Exportar Excel" 
                    @click="handleExportExcel"
                    :loading="exporting"
                    color="success"
                    variant="outline"
                />
            </template>

            <template #error-state>
                <ErrorState :message="error || 'Error desconocido'" />
            </template>
        </DataTable>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Components
const UButton = resolveComponent('UButton')
import { ROLES } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
const { hasRole, isCoordinacion,currentRole } = useUserRole()
const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()
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
    exportClientes,
    handleClearFilters
} = useClientes()

const localCurrentPage = ref(1)
const exporting = ref(false)

const handleExportExcel = async () => {
    exporting.value = true
    try {
        await withSpinner(async () => {
            const result = await exportClientes()
            if (result.success) {
                showSuccess('Exportación exitosa', 'El archivo Excel se ha descargado correctamente')
            } else {
                showError('Error al exportar', result.error || 'No se pudo exportar el archivo')
            }
        }, 'Exportando clientes...')
    } catch (err: any) {
        showError('Error al exportar', err.message || 'Error al exportar clientes')
    } finally {
        exporting.value = false
    }
}

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
      accessorKey: 'contacto',
      header: 'Contacto',
      cell: ({ row }) => {
        const nombre = row.original?.nombre  || ''
        const documento = row.original?.documento  || ''
        const telefono = row.original?.telefono  || ''
        const correo = row.original?.correo  || ''
        const provincia = row.original?.provincia  || ''
        return h('div', { class: 'text-gray-700 py-0 md:py-3 dark:text-gray-100' }, [
          h('div', { class: 'font-medium' }, nombre),
          h('div', { class: 'text-sm text-gray-500' }, documento),
          h('div', { class: 'text-sm text-gray-500' }, telefono),
          h('div', { class: 'text-sm text-gray-500' }, correo)
        ])
      }
    },
    {
        accessorKey: 'provincia',
        header: 'Provincia',
        cell: ({ row }) => h('div', { class: 'text-gray-700 py-3 dark:text-gray-400' }, row.getValue('provincia') || '-')
    },
    {
      accessorKey: 'origen',
      header: 'Origen',
      cell: ({ row }) => h('div', { class: 'text-gray-700 py-3 dark:text-gray-400' }, row.getValue('origen') || '-')
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
                onClick: () => {
                    // Establecer flag para indicar navegación interna
                    sessionStorage.setItem('clientes_internal_nav', 'true')
                    navigateTo(`/basedatos/clientes/${row.original.id}`)
                }
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
    
}

const handleDeleteCliente = (id: number) => {
    // Implementar eliminación de cliente
    
}

// Detectar si venimos de navegación interna o es una recarga real
onMounted(async () => {
  // Verificar si hay un flag que indica que navegamos internamente
  const cameFromInternal = sessionStorage.getItem('clientes_internal_nav')
 
  
  if (!cameFromInternal) {
    // No venimos de navegación interna, es una carga directa o recarga
    // Limpiar el storage y resetear filtros
    
    sessionStorage.removeItem('clientes_state')
    
    // Resetear los valores del composable
    search.value = ''
    primarySearch.value = ''
    filters.value = {
      categoria: 'todos',
      fecha_inicio: '',
      fecha_fin: '',
      servicio: 'todos'
    }
  } else {
    
    // Limpiar el flag para la próxima vez
    sessionStorage.removeItem('clientes_internal_nav')
  }
  
  // Cargar datos (con o sin filtros según el caso)
  await loadClientes()
})
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,100..900;1,100..900&display=swap');

* {
  font-family: 'Epilogue', sans-serif;
}
</style>