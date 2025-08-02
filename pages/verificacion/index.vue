<template>
  <div class="p-6">
    <!-- Header -->
    <PageHeader 
      title="Verificación" 
      subtitle="Gestión de verificación de pagos" 
      icon="i-heroicons-clipboard-document-check"
    />

    <!-- Tabs -->
    <div class="mb-6">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab Content -->
    <div v-if="activeTab === 'consolidado'">
      <!-- Consolidado Tab -->
      <div class="mb-4 flex justify-between items-center">
        <div class="text-lg font-semibold text-gray-900 dark:text-white">
          Importe total: <span class="text-blue-600 dark:text-blue-400">${{ totalAmount.toFixed(2) }}</span>
        </div>
      </div>

      <DataTable 
        title="" 
        icon="" 
        :data="consolidadoData" 
        :columns="consolidadoColumns"
        :loading="loading" 
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-records="totalRecords"
        :items-per-page="itemsPerPage"
        :search-query-value="search"
        :show-secondary-search="false"
        :show-filters="true"
        :filter-config="filterConfig" 
        :filters-value="filters"
        :show-export="true"
        empty-state-message="No se encontraron registros de consolidado."
        @update:search-query="handleSearch"
        @page-change="handlePageChange"
        @items-per-page-change="handleItemsPerPageChange"
        @export="exportData" 
        @filter-change="handleFilterChange"
      >
        <!-- Botón de filtros personalizado -->
        <template #actions>
          <UButton
            label="Filtros"
            icon="i-heroicons-funnel"
            color="neutral"
            variant="outline"
            @click="showFiltersPanel = !showFiltersPanel"
          />
        </template>

        <!-- Estado de error -->
        <template #error-state>
          <ErrorState :message="error || 'Error desconocido'" />
        </template>
      </DataTable>
    </div>

    <div v-else-if="activeTab === 'cursos'">
      <!-- Cursos Tab -->
      <DataTable 
        title="" 
        icon="" 
        :data="cursosData" 
        :columns="cursosColumns"
        :loading="loading" 
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-records="totalRecords"
        :items-per-page="itemsPerPage"
        :search-query-value="search"
        :show-secondary-search="false"
        :show-filters="true"
        :filter-config="filterConfig" 
        :filters-value="filters"
        :show-export="true"
        empty-state-message="No se encontraron registros de cursos."
        @update:search-query="handleSearch"
        @page-change="handlePageChange"
        @items-per-page-change="handleItemsPerPageChange"
        @export="exportData" 
        @filter-change="handleFilterChange"
      >
        <!-- Botón de filtros personalizado -->
        <template #actions>
          <UButton
            label="Filtros"
            icon="i-heroicons-funnel"
            color="neutral"
            variant="outline"
            @click="showFiltersPanel = !showFiltersPanel"
          />
        </template>

        <!-- Estado de error -->
        <template #error-state>
          <ErrorState :message="error || 'Error desconocido'" />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'

// Tabs
const tabs = [
  { id: 'consolidado', name: 'Consolidado' },
  { id: 'cursos', name: 'Cursos' }
]

const activeTab = ref('consolidado')

// State
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalRecords = ref(0)
const itemsPerPage = ref(15)
const showFiltersPanel = ref(false)

// Filters
const filters = ref({
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'todos',
  campana: 'todos'
})

const filterConfig = computed(() => [
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'Pagado', value: 'Pagado' },
      { label: 'Sobrepago', value: 'Sobrepago' },
      { label: 'Pendiente', value: 'Pendiente' }
    ]
  },
  {
    key: 'campana',
    label: 'Campaña',
    type: 'select',
    placeholder: 'Seleccionar campaña',
    options: [
      { label: 'Todas', value: 'todos' },
      { label: '#6', value: '#6' },
      { label: 'Junio 2025', value: 'Junio 2025' }
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

// Mock data para Consolidado
const consolidadoData = ref([
  {
    id: 1,
    numero: 1,
    fecha: '11-06-2025',
    nombre: 'SARITA VICTORIA CRUZADO SANTAMARIA',
    documento: '44361377',
    whatsapp: '51982097245',
    servicio: 'Consolidado',
    campana: '#6',
    estado: 'Pagado',
    importe: 755.48,
    pagado: 755.48,
    adelantos: [510.00, 245.48]
  },
  {
    id: 2,
    numero: 2,
    fecha: '11-06-2025',
    nombre: 'Jendy Roky Gonzales Matias',
    documento: '47456666',
    whatsapp: '51902843298',
    servicio: 'Consolidado',
    campana: '#6',
    estado: 'Pagado',
    importe: 1115.15,
    pagado: 1115.15,
    adelantos: [536.25, 578.90]
  },
  {
    id: 3,
    numero: 3,
    fecha: '11-06-2025',
    nombre: 'Sebastian Valencia Meza',
    documento: '74393334',
    whatsapp: '51942399815',
    servicio: 'Consolidado',
    campana: '#6',
    estado: 'Sobrepago',
    importe: 370.84,
    pagado: 375.00,
    adelantos: [375.00]
  },
  {
    id: 4,
    numero: 4,
    fecha: '11-06-2025',
    nombre: 'Pool Moreno Valencia',
    documento: '76190839',
    whatsapp: '51976852089',
    servicio: 'Consolidado',
    campana: '#6',
    estado: 'Pagado',
    importe: 850.80,
    pagado: 850.80,
    adelantos: [375.00, 475.80]
  },
  {
    id: 5,
    numero: 5,
    fecha: '11-06-2025',
    nombre: 'Jhonatan Espinoza Parraga',
    documento: '',
    whatsapp: '51997480474',
    servicio: 'Consolidado',
    campana: '#6',
    estado: 'Sobrepago',
    importe: 1195.18,
    pagado: 1195.18,
    adelantos: [487.50, 707.68]
  }
])

// Mock data para Cursos
const cursosData = ref([
  {
    id: 1,
    pedido: 1006,
    fecha: '02-06-2025',
    nombre: 'ALISSON CALLAÑAUPA QUISPE',
    whatsapp: '958349979',
    servicio: 'Curso',
    campana: 'Junio 2025',
    estado: 'Pagado',
    importe: 350,
    pagado: 350,
    adelantos: 350
  },
  {
    id: 2,
    pedido: 1008,
    fecha: '02-06-2025',
    nombre: 'Wendie Gavidia',
    whatsapp: '924464096',
    servicio: 'Curso',
    campana: 'Junio 2025',
    estado: 'Pagado',
    importe: 350,
    pagado: 350,
    adelantos: 350
  },
  {
    id: 3,
    pedido: 1009,
    fecha: '02-06-2025',
    nombre: 'Juan Carlos Pecho Romero',
    whatsapp: '993461037',
    servicio: 'Curso',
    campana: 'Junio 2025',
    estado: 'Pagado',
    importe: 350,
    pagado: 350,
    adelantos: 350
  }
])

// Columnas para Consolidado
const consolidadoColumns: TableColumn<any>[] = [
  {
    accessorKey: 'numero',
    header: 'N.',
    cell: ({ row }: { row: any }) => row.getValue('numero')
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => row.getValue('fecha')
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }: { row: any }) => row.getValue('nombre')
  },
  {
    accessorKey: 'documento',
    header: 'DNI/RUC',
    cell: ({ row }: { row: any }) => row.getValue('documento') || '-'
  },
  {
    accessorKey: 'whatsapp',
    header: 'WhatsApp',
    cell: ({ row }: { row: any }) => row.getValue('whatsapp')
  },
  {
    accessorKey: 'servicio',
    header: 'Servicio',
    cell: ({ row }: { row: any }) => row.getValue('servicio')
  },
  {
    accessorKey: 'campana',
    header: 'Campaña',
    cell: ({ row }: { row: any }) => row.getValue('campana')
  },
  {
    accessorKey: 'estado',
    header: 'Estados',
    cell: ({ row }: { row: any }) => {
      const estado = row.getValue('estado')
      const color = estado === 'Pagado' ? 'success' : 'error'
      return h('div', { class: 'flex items-center space-x-2' }, [
        h('UBadge', { 
          color,
          variant: 'subtle',
          class: 'text-xs'
        }, estado),
        h('UIcon', { 
          name: 'i-heroicons-chevron-down',
          class: 'w-4 h-4 text-gray-400 cursor-pointer'
        })
      ])
    }
  },
  {
    accessorKey: 'importe',
    header: 'Importe',
    cell: ({ row }: { row: any }) => `$${row.getValue('importe').toFixed(2)}`
  },
  {
    accessorKey: 'pagado',
    header: 'Pagado',
    cell: ({ row }: { row: any }) => `$${row.getValue('pagado').toFixed(2)}`
  },
  {
    accessorKey: 'adelantos',
    header: 'Adelanto',
    cell: ({ row }: { row: any }) => {
      const adelantos = row.getValue('adelantos')
      return h('div', { class: 'flex flex-wrap gap-1' }, 
        adelantos.map((adelanto: number) => 
          h('UBadge', { 
            color: 'success',
            variant: 'subtle',
            class: 'text-xs'
          }, `$${adelanto.toFixed(2)}`)
        )
      )
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      return h('div', { class: 'flex justify-center' }, [
        h('div', { 
          class: 'w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors',
          onClick: () => handleViewDetails(row.original.id)
        }, [
          h('UIcon', { 
            name: 'i-heroicons-eye',
            class: 'w-4 h-4 text-white'
          })
        ])
      ])
    }
  }
]

// Columnas para Cursos
const cursosColumns: TableColumn<any>[] = [
  {
    accessorKey: 'pedido',
    header: 'Pedido',
    cell: ({ row }: { row: any }) => h('div', { class: 'flex items-center space-x-1' }, [
      h('span', {}, row.getValue('pedido')),
      h('UIcon', { 
        name: 'i-heroicons-chevron-up-down',
        class: 'w-4 h-4 text-gray-400'
      })
    ])
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => row.getValue('fecha')
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }: { row: any }) => row.getValue('nombre')
  },
  {
    accessorKey: 'whatsapp',
    header: 'Whatsapp',
    cell: ({ row }: { row: any }) => row.getValue('whatsapp')
  },
  {
    accessorKey: 'servicio',
    header: 'Servicio',
    cell: ({ row }: { row: any }) => row.getValue('servicio')
  },
  {
    accessorKey: 'campana',
    header: 'Campaña',
    cell: ({ row }: { row: any }) => row.getValue('campana')
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      const estado = row.getValue('estado')
      return h('div', { class: 'flex items-center space-x-2' }, [
        h('UBadge', { 
          color: 'success',
          variant: 'subtle',
          class: 'text-xs'
        }, estado),
        h('UIcon', { 
          name: 'i-heroicons-chevron-down',
          class: 'w-4 h-4 text-gray-400 cursor-pointer'
        })
      ])
    }
  },
  {
    accessorKey: 'importe',
    header: 'Importe',
    cell: ({ row }: { row: any }) => `S/${row.getValue('importe')}`
  },
  {
    accessorKey: 'pagado',
    header: 'Pagado',
    cell: ({ row }: { row: any }) => `S/${row.getValue('pagado')}`
  },
  {
    accessorKey: 'adelantos',
    header: 'Adelantos',
    cell: ({ row }: { row: any }) => {
      const adelantos = row.getValue('adelantos')
      return h('UBadge', { 
        color: 'success',
        variant: 'subtle',
        class: 'text-xs'
      }, `S/${adelantos}`)
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const actions = []
      
      // Botón de ver detalles
      actions.push(
        h('div', { 
          class: 'w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors mr-2',
          onClick: () => handleViewDetails(row.original.id)
        }, [
          h('UIcon', { 
            name: 'i-heroicons-eye',
            class: 'w-4 h-4 text-white'
          })
        ])
      )
      
      // Botón de documento (solo para algunos registros)
      if (row.original.pedido === 1009) {
        actions.push(
          h('div', { 
            class: 'w-8 h-8 bg-green-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors',
            onClick: () => handleViewDocument(row.original.id)
          }, [
            h('UIcon', { 
              name: 'i-heroicons-document',
              class: 'w-4 h-4 text-white'
            })
          ])
        )
      }
      
      return h('div', { class: 'flex items-center' }, actions)
    }
  }
]

// Computed
const totalAmount = computed(() => {
  if (activeTab.value === 'consolidado') {
    return consolidadoData.value.reduce((sum, item) => sum + item.importe, 0)
  } else {
    return cursosData.value.reduce((sum, item) => sum + item.importe, 0)
  }
})

// Methods
const handleSearch = (query: string) => {
  search.value = query
  // Implementar búsqueda
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Implementar cambio de página
}

const handleItemsPerPageChange = (items: number) => {
  itemsPerPage.value = items
  // Implementar cambio de items por página
}

const handleFilterChange = (filterType: string, value: string) => {
  filters.value = { ...filters.value, [filterType]: value }
  // Implementar filtros
}

const exportData = () => {
  // Implementar exportación
  console.log('Exportando datos...')
}

const handleViewDetails = (id: number) => {
  console.log('Ver detalles del registro:', id)
}

const handleViewDocument = (id: number) => {
  console.log('Ver documento del registro:', id)
}

// Initialize
onMounted(() => {
  // Cargar datos iniciales
  totalRecords.value = activeTab.value === 'consolidado' ? consolidadoData.value.length : cursosData.value.length
})
</script>