<template>
    <div class="p-6">
        <!-- Navegación superior -->
        <div class="flex items-center space-x-6 mb-6">
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Coordinación</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Ventas</span>
                </div>
            </div>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
                <UIcon name="i-heroicons-truck" class="text-2xl mr-3 text-gray-700 dark:text-gray-300" />
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Carga Consolidada</h1>
            </div>
        </div>

        <!-- Controls -->
        <UCard class="mb-6">
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <!-- Search and Actions -->
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2">
                            <label class="text-sm text-gray-600 dark:text-gray-400">Buscar por:</label>
                            <UInput :model-value="secondarySearch || ''"
                                placeholder="Buscar por carga, empresa, país..." class="w-48"
                                @update:model-value="(value) => secondarySearch = value" />
                        </div>

                        <!-- Export Button -->
                        <UButton label="Exportar" icon="i-heroicons-arrow-up-tray" variant="outline"
                            @click="handleExport" />

                        <!-- Filters Button -->
                        <UButton label="Filtros" icon="i-heroicons-funnel" variant="outline"
                            @click="showFiltersPanel = !showFiltersPanel" />
                        <UModal v-model="showCreateModal">
                            <UButton label="Crear" icon="i-heroicons-plus" color="orange"
                                @click="showCreateModal = true" />
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                                        Crear Nueva Carga Consolidada
                                    </h3>
                                    <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid"
                                        class="-my-1" @click="showCreateModal = false" />
                                </div>
                            </template>
                            <template #body>
                                <div class="space-y-4">
                                    <!-- Formulario de carga -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <!-- Columna Izquierda -->
                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Carga *
                                            </label>
                                            <USelect v-model="newCarga.carga" :items="consolidadosOptions"
                                                placeholder="Seleccione un consolidado" required />
                                        </div>

                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Mes *
                                            </label>
                                            <USelect v-model="newCarga.mes" :items="mesesOptions"
                                                placeholder="Seleccione un mes" required />
                                        </div>

                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                País *
                                            </label>
                                            <USelect v-model="newCarga.pais" :items="paisesOptions"
                                                placeholder="Seleccione un país" required />
                                        </div>

                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Empresa *
                                            </label>
                                            <UInput v-model="newCarga.empresa"
                                                placeholder="Ingresa el nombre de la empresa" required />
                                        </div>

                                        <!-- Columna Derecha -->
                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Fecha Cierre *
                                            </label>
                                            <UInput v-model="newCarga.fechaCierre" placeholder="00/00/0000" required />
                                        </div>

                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Fecha Arribo *
                                            </label>
                                            <UInput v-model="newCarga.fechaArribo" placeholder="00/00/0000" required />
                                        </div>

                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Fecha Entrega *
                                            </label>
                                            <UInput v-model="newCarga.fechaEntrega" placeholder="00/00/0000" required />
                                        </div>
                                    </div>
                                </div>
                            </template>

                            <template #footer>
                                <div class="flex justify-end gap-3">
                                    <UButton color="neutral" variant="outline" @click="showCreateModal = false"
                                        :disabled="createLoading">
                                        Cancelar
                                    </UButton>
                                    <UButton color="orange" @click="handleCreateCarga" :loading="createLoading"
                                        :disabled="createLoading">
                                        Crear Carga
                                    </UButton>
                                </div>
                            </template>
                        </UModal>
                    </div>
                </div>
            </template>

            <!-- Filters Panel -->
            <div v-if="showFiltersPanel" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                    <!-- Fecha Inicio -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fecha Inicio
                        </label>
                        <UInput v-model="filters.fechaInicio" type="date" placeholder="DD/MM/YYYY" class="w-full" />
                    </div>

                    <!-- Fecha Fin -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fecha Fin
                        </label>
                        <UInput v-model="filters.fechaFin" type="date" placeholder="DD/MM/YYYY" class="w-full" />
                    </div>

                    <!-- Estado -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estado
                        </label>
                        <USelect v-model="filters.estado" :items="estadosOptions" placeholder="Seleccionar estado"
                            class="w-full" />
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-end gap-3 pt-4">
                        <UButton color="neutral" variant="outline" @click="clearFilters">
                            Cancelar
                        </UButton>
                        <UButton color="orange" @click="applyFilters">
                            Aplicar
                        </UButton>
                    </div>
                </div>
            </div>

            <!-- Data Table -->
            <div class="overflow-x-auto">
                <UTable :data="filteredData" :columns="columns" :loading="loading" class="h-100 w-full">
                    <template #loading-state>
                        <div class="flex items-center justify-center py-8">
                            <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6 mr-2" />
                            <span>Cargando...</span>
                        </div>
                    </template>

                    <template #empty-state>
                        <div class="text-center py-8">
                            <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12 text-gray-400" />
                            <h3 class="mt-2 text-sm font-semibold text-gray-900">No hay registros</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                No se encontraron cargas que coincidan con los criterios de búsqueda.
                            </p>
                        </div>
                    </template>
                </UTable>
            </div>
        </UCard>

        <!-- Pagination -->
        <div class="mt-6 flex items-center justify-between">
            <div class="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a {{ Math.min(currentPage * itemsPerPage,
                totalRecords) }}
                de {{ totalRecords }} resultados
            </div>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-600 dark:text-gray-400">Mostrar:</label>
                    <USelect :model-value="itemsPerPage" :items="[5, 10, 25, 50, 100]" placeholder="10" class="w-20"
                        @update:model-value="(value: any) => onItemsPerPageChange(Number(value))" />
                    <span class="text-sm text-gray-600 dark:text-gray-400">registros</span>
                </div>
                <UPagination v-model="currentPage" :page-count="totalPages" :total="totalRecords"
                    @update:page="onPageChange" />
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, h, resolveComponent, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'

// Components
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

// State
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalRecords = ref(0)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const secondarySearch = ref('')
const showFiltersPanel = ref(false)
const filters = ref({
    fechaInicio: '',
    fechaFin: '',
    estado: ''
})
const showCreateModal = ref(false)
const createLoading = ref(false)

// Datos de ejemplo para cargas
const cargas = ref([
    {
        id: 1,
        carga: 'CARGA CONSOLIDADA #14',
        mes: 'AGOSTO',
        pais: 'PERU',
        fechaCierre: '29/08/2025',
        fechaArribo: '17/10/2025',
        fechaEntrega: '30/10/2025',
        empresa: 'PRO MUNDO COMEX SAC.',
        estado: 'Pendiente'
    },
    {
        id: 2,
        carga: 'CARGA CONSOLIDADA #13',
        mes: 'AGOSTO',
        pais: 'PERU',
        fechaCierre: '14/08/2025',
        fechaArribo: '26/09/2025',
        fechaEntrega: '15/10/2025',
        empresa: 'PRO MUNDO COMEX SAC.',
        estado: 'Pendiente'
    }
])

// Nuevo carga
const newCarga = ref({
    carga: '',
    mes: '',
    pais: '',
    fechaCierre: '',
    fechaArribo: '',
    fechaEntrega: '',
    empresa: ''
})

// Opciones para los selects
const mesesOptions = [
    { label: 'ENERO', value: 'ENERO' },
    { label: 'FEBRERO', value: 'FEBRERO' },
    { label: 'MARZO', value: 'MARZO' },
    { label: 'ABRIL', value: 'ABRIL' },
    { label: 'MAYO', value: 'MAYO' },
    { label: 'JUNIO', value: 'JUNIO' },
    { label: 'JULIO', value: 'JULIO' },
    { label: 'AGOSTO', value: 'AGOSTO' },
    { label: 'SEPTIEMBRE', value: 'SEPTIEMBRE' },
    { label: 'OCTUBRE', value: 'OCTUBRE' },
    { label: 'NOVIEMBRE', value: 'NOVIEMBRE' },
    { label: 'DICIEMBRE', value: 'DICIEMBRE' }
]

const paisesOptions = [
    { label: 'PERU', value: 'PERU' },
    { label: 'CHILE', value: 'CHILE' },
    { label: 'COLOMBIA', value: 'COLOMBIA' },
    { label: 'ECUADOR', value: 'ECUADOR' },
    { label: 'BOLIVIA', value: 'BOLIVIA' }
]

const estadosOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En Proceso', value: 'En Proceso' },
    { label: 'Completado', value: 'Completado' },
    { label: 'Cancelado', value: 'Cancelado' }
]

const consolidadosOptions = [
    { label: 'CARGA CONSOLIDADA #15', value: 'CARGA CONSOLIDADA #15' },
    { label: 'CARGA CONSOLIDADA #16', value: 'CARGA CONSOLIDADA #16' },
    { label: 'CARGA CONSOLIDADA #17', value: 'CARGA CONSOLIDADA #17' },
    { label: 'CARGA CONSOLIDADA #18', value: 'CARGA CONSOLIDADA #18' }
]

// Computed properties
const filteredData = computed(() => {
    let filtered = cargas.value

    // Filtrar por búsqueda secundaria
    if (secondarySearch.value) {
        const searchTerm = secondarySearch.value.toLowerCase()
        filtered = filtered.filter(carga =>
            carga.carga.toLowerCase().includes(searchTerm) ||
            carga.empresa.toLowerCase().includes(searchTerm) ||
            carga.pais.toLowerCase().includes(searchTerm)
        )
    }

    // Filtrar por estado
    if (filters.value.estado && filters.value.estado !== 'todos') {
        filtered = filtered.filter(carga => carga.estado === filters.value.estado)
    }

    // Filtrar por fecha inicio
    if (filters.value.fechaInicio) {
        filtered = filtered.filter(carga => {
            const fechaCierre = new Date(carga.fechaCierre.split('/').reverse().join('-'))
            const fechaInicio = new Date(filters.value.fechaInicio)
            return fechaCierre >= fechaInicio
        })
    }

    // Filtrar por fecha fin
    if (filters.value.fechaFin) {
        filtered = filtered.filter(carga => {
            const fechaCierre = new Date(carga.fechaCierre.split('/').reverse().join('-'))
            const fechaFin = new Date(filters.value.fechaFin)
            return fechaCierre <= fechaFin
        })
    }

    return filtered
})

// Configuración de columnas para la tabla
const columns: TableColumn<any>[] = [
    {
        accessorKey: 'carga',
        header: 'Carga',
        cell: ({ row }) => row.getValue('carga')
    },
    {
        accessorKey: 'mes',
        header: 'Mes',
        cell: ({ row }) => row.getValue('mes')
    },
    {
        accessorKey: 'pais',
        header: 'País',
        cell: ({ row }) => row.getValue('pais')
    },
    {
        accessorKey: 'fechaCierre',
        header: 'F. Cierre',
        cell: ({ row }) => row.getValue('fechaCierre')
    },
    {
        accessorKey: 'fechaArribo',
        header: 'F. Arribo',
        cell: ({ row }) => row.getValue('fechaArribo')
    },
    {
        accessorKey: 'fechaEntrega',
        header: 'F. Entrega',
        cell: ({ row }) => row.getValue('fechaEntrega')
    },
    {
        accessorKey: 'empresa',
        header: 'Empresa',
        cell: ({ row }) => row.getValue('empresa')
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => {
            const estado = row.getValue('estado') as string
            const color = getEstadoColor(estado)
            return h(UBadge, {
                color,
                variant: 'subtle',
                label: estado
            })
        }
    },
    {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
            return h('div', { class: 'flex space-x-2' }, [
                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-eye',
                    color: 'primary',
                    variant: 'ghost',
                    onClick: () => handleViewSteps(row.original.id)
                }),
                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-pencil',
                    color: 'warning',
                    variant: 'ghost',
                    onClick: () => handleEditCarga(row.original.id)
                }),
                h(UButton, {
                    size: 'xs',
                    icon: 'i-heroicons-trash',
                    color: 'error',
                    variant: 'ghost',
                    onClick: () => handleDeleteCarga(row.original.id)
                })
            ])
        }
    }
]

// Methods
const clearFilters = () => {
    filters.value = {
        fechaInicio: '',
        fechaFin: '',
        estado: ''
    }
    showFiltersPanel.value = false
}

const applyFilters = () => {
    // Los filtros se aplican automáticamente a través del computed filteredData
    showFiltersPanel.value = false
}

const handleFilterChangeLocal = (filterType: string, value: string) => {
    // Implementar lógica de filtrado
    console.log('Filtro cambiado:', filterType, value)
}

const handleExport = async () => {
    try {
        // Implementar exportación
        console.log('Exportando cargas...')
    } catch (error) {
        console.error('Error al exportar:', error)
    }
}

const onPageChange = (page: number) => {
    currentPage.value = page
    // Implementar cambio de página
}

const onItemsPerPageChange = (items: number) => {
    itemsPerPage.value = items
    currentPage.value = 1
    // Implementar cambio de items por página
}

const handleViewCarga = (id: number) => {
    navigateTo(`/cargaconsolidada/abiertos/${id}`)
}
const handleViewSteps = (id: number) => {
    navigateTo(`/cargaconsolidada/abiertos/pasos/${id}`)
}
const handleEditCarga = (id: number) => {
    navigateTo(`/cargaconsolidada/abiertos/${id}/editar`)
}

const handleDeleteCarga = (id: number) => {
    // Implementar confirmación de eliminación
    console.log('Eliminar carga:', id)
}

const getEstadoColor = (estado: string) => {
    const colorMap = {
        'Pendiente': 'warning',
        'En Proceso': 'info',
        'Completado': 'success',
        'Cancelado': 'error'
    }
    return colorMap[estado as keyof typeof colorMap] || 'neutral'
}

const handleCreateCarga = async () => {
    if (!newCarga.value.carga || !newCarga.value.mes || !newCarga.value.pais ||
        !newCarga.value.fechaCierre || !newCarga.value.fechaArribo ||
        !newCarga.value.fechaEntrega || !newCarga.value.empresa) {
        return
    }

    createLoading.value = true

    try {
        // Simular creación
        await new Promise(resolve => setTimeout(resolve, 1000))

        const nuevaCarga = {
            id: Date.now(),
            ...newCarga.value,
            estado: 'Pendiente' // Estado por defecto
        }

        cargas.value.unshift(nuevaCarga)
        totalRecords.value++

        // Reset form
        newCarga.value = {
            carga: '',
            mes: '',
            pais: '',
            fechaCierre: '',
            fechaArribo: '',
            fechaEntrega: '',
            empresa: ''
        }

        showCreateModal.value = false

        // Show success notification
        const { showCreateSuccess } = useNotifications()
        showCreateSuccess('Carga Consolidada')
    } catch (error) {
        console.error('Error al crear carga:', error)
    } finally {
        createLoading.value = false
    }
}

// Initialize data
onMounted(async () => {
    loading.value = true
    try {
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 500))
        totalRecords.value = cargas.value.length
        totalPages.value = Math.ceil(totalRecords.value / itemsPerPage.value)
    } catch (error) {
        console.error('Error al cargar datos:', error)
    } finally {
        loading.value = false
    }
})
</script>
