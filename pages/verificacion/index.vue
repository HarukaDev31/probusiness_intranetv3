<template>
  <div class="p-6">
    <!-- Header -->
    <PageHeader title="Verificación" subtitle="Gestión de verificación de pagos"
      icon="i-heroicons-clipboard-document-check" :hide-back-button="true" />

    <!-- Tab Content -->
    <div v-if="activeTab === 'consolidado'">
      <!-- Consolidado Tab -->
      <DataTable title="" icon="" :data="consolidadoData" :columns="consolidadoColumns" :loading="loadingConsolidado"
        :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
        :items-per-page="itemsPerPage" :search-query-value="search" :show-secondary-search="false" :show-filters="true"
        :filter-config="filterConfig" :filters-value="filtersConsolidado" :show-export="true"
        empty-state-message="No se encontraron registros de consolidado." @update:search-query="handleSearch"
        @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportData"
        @filter-change="handleFilterChange">
        <!-- Botón de filtros personalizado -->
        <template #body-top>
          <UTabs size="md" variant="pill" :content="false" :items="tabs" v-model="activeTab" class="w-50 mb-6" />
          <div class="mb-4 flex justify-end">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              Importe total: <span
                class="text-black dark:text-primary-400 bg-white p-2 rounded-md border border-gray-200">
              </span>
            </div>
          </div>
        </template>

        <!-- Estado de error -->
        <template #error-state>
          <ErrorState :message="errorConsolidado || 'Error desconocido'" />
        </template>
      </DataTable>
    </div>

    <div v-else-if="activeTab === 'cursos'">
      <!-- Cursos Tab -->
      <DataTable title="" icon="" :data="cursosData" :columns="cursosColumns" :loading="loadingCursos"
        :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
        :items-per-page="itemsPerPage" :search-query-value="search" :show-secondary-search="false" :show-filters="true"
        :filter-config="filterConfig" :filters-value="filtersCursos" :show-export="true"
        empty-state-message="No se encontraron registros de cursos." @update:search-query="handleSearch"
        @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportData"
        @filter-change="handleFilterChange">

        <template #body-top>
          <UTabs size="md" variant="pill" :content="false" :items="tabs" v-model="activeTab" class="w-50   mb-6" />
        </template>
        <!-- Estado de error -->
        <template #error-state>
          <ErrorState :message="errorCursos || 'Error desconocido'" />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useConsolidado } from '~/composables/usePagosConsolidado'
import { usePagos } from '~/composables/usePagos'
import { ESTADOS_PAGO, CARGAS_DISPONIBLES } from '~/constants/consolidado'
import { ESTADOS_PAGO as ESTADOS_PAGO_CURSOS, CAMPANAS } from '~/constants/cursos'
import { getEstadoColor, formatCurrency, formatPhoneNumber, formatDocument } from '~/utils/consolidado'
import { getEstadoColor as getEstadoColorCursos, formatCurrency as formatCurrencyCursos, formatPhoneNumber as formatPhoneNumberCursos } from '~/utils/cursos'
import { UButton } from '#components'

// Tabs
const tabs = [
  { value: 'consolidado', label: 'Consolidado' },
  { value: 'cursos', label: 'Cursos' }
]

const activeTab = ref('consolidado')

// Composable de consolidado
const {
  consolidadoData,
  loading: loadingConsolidado,
  error: errorConsolidado,
  pagination: paginationConsolidado,
  filters: filtersConsolidado,
  totalAmount: totalAmountConsolidado,
  totalPaid: totalPaidConsolidado,
  filteredData: filteredDataConsolidado,
  fetchConsolidadoData,
  updateEstadoPago: updateEstadoPagoConsolidado,
  getPagoDetalle,
  exportData: exportConsolidadoData,
  updateFilters: updateFiltersConsolidado,
  clearFilters: clearFiltersConsolidado
} = useConsolidado()

// Composable de cursos
const {
  cursosData,
  loading: loadingCursos,
  error: errorCursos,
  pagination: paginationCursos,
  filters: filtersCursos,
  totalAmount: totalAmountCursos,
  totalPaid: totalPaidCursos,
  filteredData: filteredDataCursos,
  fetchCursosData,
  updateEstadoPago: updateEstadoPagoCursos,
  getCursoDetalle,
  exportData: exportCursosData,
  updateFilters: updateFiltersCursos,
  clearFilters: clearFiltersCursos
} = useCursos()

// State para paginación
const search = ref('')
const currentPage = computed(() => activeTab.value === 'consolidado' ? paginationConsolidado.value.current_page : paginationCursos.value.current_page)
const totalPages = computed(() => activeTab.value === 'consolidado' ? paginationConsolidado.value.last_page : paginationCursos.value.last_page)
const totalRecords = computed(() => activeTab.value === 'consolidado' ? paginationConsolidado.value.total : paginationCursos.value.total)
const itemsPerPage = computed(() => activeTab.value === 'consolidado' ? paginationConsolidado.value.per_page : paginationCursos.value.per_page)


// Configuración de filtros para consolidado
const filterConfig = computed(() => [
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    options: ESTADOS_PAGO
  },
  {
    key: 'carga',
    label: 'Carga',
    type: 'select',
    placeholder: 'Seleccionar carga',
    options: CARGAS_DISPONIBLES
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
const getEstadoBg = (estado: string) => {
  switch (estado) {
    case 'PENDIENTE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'CONFIRMADO':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'OBSERVADO':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}
// Columnas para Consolidado usando el nuevo servicio
const consolidadoColumns: TableColumn<any>[] = [
  {
    accessorKey: 'index',
    header: 'N.',
    cell: ({ row }: { row: any }) => row.getValue('index')
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
    cell: ({ row }: { row: any }) => formatDocument(row.getValue('documento'))
  },
  {
    accessorKey: 'telefono',
    header: 'WhatsApp',
    cell: ({ row }: { row: any }) => formatPhoneNumber(row.getValue('telefono'))
  },
  {
    accessorKey: 'tipo',
    header: 'Servicio',
    cell: ({ row }: { row: any }) => row.getValue('tipo')
  },
  {
    accessorKey: 'carga',
    header: 'Carga',
    cell: ({ row }: { row: any }) => `#${row.getValue('carga')} `
  },
  {
    accessorKey: 'estado_pago',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      const estado = row.getValue('estado_pago')
      const color = getEstadoColor(estado)
      console.log('Estado:', estado, 'Color:', color)
      return h('div', { class: 'flex items-center space-x-2' }, [
        h('span', {
          class: `px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(estado)}`
        }, estado),
        h('UIcon', {
          name: 'i-heroicons-chevron-down',
          class: 'w-4 h-4 text-gray-400 cursor-pointer'
        })
      ])
    }
  },
  {
    accessorKey: 'monto_a_pagar',
    header: 'Importe',
    cell: ({ row }: { row: any }) => {
      const monto = row.getValue('monto_a_pagar')
      return h('div', { class: 'flex items-center space-x-1' }, [
        h('span', {}, formatCurrency(monto)),
        h('UIcon', {
          name: 'i-heroicons-chevron-down',
          class: 'w-4 h-4 text-gray-400'
        })
      ])
    }
  },
  {
    accessorKey: 'total_pagado',
    header: 'Pagado',
    cell: ({ row }: { row: any }) => {
      const total = row.getValue('total_pagado')
      return h('div', { class: 'flex items-center space-x-1' }, [
        h('span', {}, formatCurrency(total)),
        h('UIcon', {
          name: 'i-heroicons-chevron-up',
          class: 'w-4 h-4 text-gray-400'
        })
      ])
    }
  },
  {
    accessorKey: 'pagos_detalle',
    header: 'Adelantos',
    cell: ({ row }: { row: any }) => {
      const pagos = row.getValue('pagos_detalle')
      return h('div', { class: 'flex flex-wrap gap-1' },
        pagos.map((pago: any) =>
          h('span', {
            class: `px-2 py-1 rounded-full text-xs font-medium border ${getEstadoBg(pago.status)}`
          }, formatCurrency(pago.monto))
        )
      )
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UButton as any, {
          size: 'xs',
          icon: 'i-heroicons-eye',
          color: 'primary',
          variant: 'ghost',
          onClick: () => navigateTo(`/verificacion/consolidado/${row.original.id}`)
        }),

      ])
    }
  }
]

// Columnas para Cursos (mantener las existentes)
const cursosColumns: TableColumn<any>[] = [
  {
    accessorKey: 'id',
    header: 'Pedido',
    cell: ({ row }: { row: any }) => h('div', { class: 'flex items-center space-x-1' }, [
      h('span', {}, row.getValue('id')),
      h('UIcon', {
        name: 'i-heroicons-chevron-up-down',
        class: 'w-4 h-4 text-gray-400'
      })
    ])
  },
  {
    accessorKey: 'fecha_registro',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => row.getValue('fecha_registro')
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }: { row: any }) => row.getValue('nombre')
  },
  {
    accessorKey: 'telefono',
    header: 'Whatsapp',
    cell: ({ row }: { row: any }) => row.getValue('telefono')
  },
  {
    accessorKey: 'tipo',
    header: 'Servicio',
    cell: ({ row }: { row: any }) => row.getValue('tipo')
  },
  {
    accessorKey: 'campana',
    header: 'Campaña',
    cell: ({ row }: { row: any }) => row.getValue('campana')
  },
  {
    accessorKey: 'estado_pago',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      const estado = row.getValue('estado_pago')
      //get the color of the state
      const color = getEstadoColor(estado)
      return h('div', { class: 'flex items-center space-x-2' }, [
        h('span', {
          class: `px-2 py-1 rounded-full text-xs font-medium border ${color}`
        }, estado),
      ])
    }
  },
  {
    accessorKey: 'monto_a_pagar_formateado',
    header: 'Importe',
    cell: ({ row }: { row: any }) => `S/${row.getValue('monto_a_pagar_formateado')}`
  },
  {
    accessorKey: 'total_pagado_formateado',
    header: 'Pagado',
    cell: ({ row }: { row: any }) => `S/${row.getValue('total_pagado_formateado')}`
  },
  {
    accessorKey: 'pagos_detalle',
    header: 'Adelantos',
    cell: ({ row }: { row: any }) => {
      const adelantos = row.getValue('pagos_detalle')
      //for each adelanto, create a span with the status and the amount
      return h('div', { class: 'flex flex-wrap gap-1' },
        adelantos.map((adelanto: any) =>
          h('span', {
            class: `px-2 py-1 rounded-full text-xs font-medium border ${getEstadoBg(adelanto.status)}`
          }, formatCurrency(adelanto.monto))
        )
      )
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UButton as any, {
          size: 'xs',
          icon: 'i-heroicons-eye',
          color: 'primary',
          variant: 'ghost',
          onClick: () => navigateTo(`/verificacion/curso/${row.original.id}`)
        }),

      ])
    }
  }
]

// Computed para el total del consolidado (asegurar que sea un número)
const totalAmountConsolidadoComputed = computed(() => {
  const amount = totalAmountConsolidado.value
  console.log('totalAmountConsolidado.value:', amount, 'type:', typeof amount)
  return typeof amount === 'number' ? amount : 0
})

// Computed para el total de cursos
const totalAmountCursosComputed = computed(() => {
  const amount = totalAmountCursos.value
  return typeof amount === 'number' ? amount : 0
})

// Methods
const handleSearch = (query: string) => {
  search.value = query
  if (activeTab.value === 'consolidado') {
    updateFiltersConsolidado({ search: query })
    fetchConsolidadoData(filtersConsolidado.value, 1, itemsPerPage.value)
  } else {
    updateFiltersCursos({ search: query })
    fetchCursosData(filtersCursos.value, 1, itemsPerPage.value)
  }
}

const handlePageChange = (page: number) => {
  if (activeTab.value === 'consolidado') {
    fetchConsolidadoData(filtersConsolidado.value, page, itemsPerPage.value)
  } else {
    fetchCursosData(filtersCursos.value, page, itemsPerPage.value)
  }
}

const handleItemsPerPageChange = (items: number) => {
  if (activeTab.value === 'consolidado') {
    fetchConsolidadoData(filtersConsolidado.value, 1, items)
  } else {
    fetchCursosData(filtersCursos.value, 1, items)
  }
}

const handleFilterChange = (filterType: string, value: string) => {
  if (activeTab.value === 'consolidado') {
    updateFiltersConsolidado({ [filterType]: value })
    fetchConsolidadoData(filtersConsolidado.value, 1, itemsPerPage.value)
  } else {
    updateFiltersCursos({ [filterType]: value })
    fetchCursosData(filtersCursos.value, 1, itemsPerPage.value)
  }
}

const exportData = async () => {
  if (activeTab.value === 'consolidado') {
    await exportConsolidadoData()
  } else {
    await exportCursosData()
  }
}

const handleViewDetails = async (id: number) => {
  try {
    const detalle = await getPagoDetalle(id)
    console.log('Detalle del pago:', detalle)
    // Aquí puedes abrir un modal o navegar a una página de detalles
  } catch (err) {
    console.error('Error al obtener detalles:', err)
  }
}

const handleViewDocument = (id: number) => {
  console.log('Ver documento del registro:', id)
}

// Watchers
watch(activeTab, (newTab) => {
  if (newTab === 'consolidado') {
    fetchConsolidadoData(filtersConsolidado.value, 1, itemsPerPage.value)
  } else if (newTab === 'cursos') {
    fetchCursosData(filtersCursos.value, 1, itemsPerPage.value)
  }
})

// Initialize
onMounted(() => {
  // Cargar datos iniciales de consolidado
  fetchConsolidadoData(filtersConsolidado.value, 1, itemsPerPage.value)
})
</script>