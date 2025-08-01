<template>
    <div class="p-6">
        <UButton label="Subir archivo de clientes" icon="i-heroicons-arrow-up-tray" color="neutral"
        variant="outline" @click="goToArchivos" />


        <DataTable title="Base de datos de clientes" icon="i-heroicons-users" :data="clientes" :columns="columns"
            :loading="loading" :pagination="pagination" :search="search" :secondary-search="secondarySearch"
            :filter-config="filterConfig" :filters-value="filters" @search="handleSearch"
            @page-change="handlePageChange" @export="exportClientes" @filter-change="handleFilterChange">
        </DataTable>

        <!-- Modal de subir archivo -->
      
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
    loadClientes,
    loadFilterOptions,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    exportClientes,
    uploadClientesFile
} = useClientes()

// State para el modal de subida
const showUploadModal = ref(false)
const selectedFile = ref<File | null>(null)
const fileError = ref('')
const uploadLoading = ref(false)

// Configuración de filtros para DataTable
const filterConfig = computed(() => [
    {
        key: 'categoria',
        label: 'Categoría',
        type: 'select',
        placeholder: 'Seleccionar categoría',
        options: [
            { label: 'Todos', value: '' },
            ...(filterOptions.value.categorias || []).map(cat => ({
                label: cat,
                value: cat
            }))
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
    }
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
        cell: ({ row }) => row.getValue('documento')
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
        header: 'Primer Servicio',
        cell: ({ row }) => {
            const primerServicio = row.getValue('primer_servicio') as any
            if (primerServicio) {
                return h('div', { class: 'space-y-1' }, [
                    h('div', { class: 'font-medium' }, primerServicio.servicio),
                    h('div', { class: 'text-sm text-gray-500' }, primerServicio.fecha),
                    h('div', { class: 'text-xs' }, [
                        h('span', {
                            class: `px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(primerServicio.categoria)}`
                        }, primerServicio.categoria)
                    ])
                ])
            }
            return '-'
        }
    },
    {
        accessorKey: 'total_servicios',
        header: 'Total Servicios',
        cell: ({ row }) => {
            const total = row.getValue('total_servicios')
            return h('span', {
                class: 'px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium'
            }, total)
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
                h(UButton as any, {
                    size: 'xs',
                    icon: 'i-heroicons-pencil-square',
                    color: 'secondary',
                    variant: 'ghost',
                    onClick: () => handleEditCliente(row.original.id)
                }),
                h(UButton as any, {
                    size: 'xs',
                    icon: 'i-heroicons-trash',
                    color: 'error',
                    variant: 'ghost',
                    onClick: () => handleDeleteCliente(row.original.id)
                })
            ])
        }
    }
]

// Methods
const getCategoriaColor = (categoria: string) => {
    const colors = {
        'Comercial': 'bg-green-100 text-green-800',
        'Industrial': 'bg-blue-100 text-blue-800',
        'Personal': 'bg-purple-100 text-purple-800'
    }
    return colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
        fileError.value = ''
        const isValid = validateFile(file)

        if (isValid) {
            selectedFile.value = file
        } else {
            selectedFile.value = null
        }
    }
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
    await loadFilterOptions()
    await loadClientes()
})
</script>
