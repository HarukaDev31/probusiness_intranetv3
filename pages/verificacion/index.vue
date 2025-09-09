<template>
  <div class="p-2">

    <!-- Tab Content -->
    <div v-if="activeTab === 'consolidado'">
      <!-- Consolidado Tab -->
      <DataTable :show-title="true" title="Verificación" subtitle="Gestión de verificación de pagos" icon="i-heroicons-clipboard-document-check" :data="consolidadoData" :columns="consolidadoColumns" :loading="loadingConsolidado"
        :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
  :items-per-page="itemsPerPage" :primary-search-value="search" :show-secondary-search="false" :show-filters="true"
  :filter-config="filterConfigConsolidado" :filters-value="filtersConsolidado" :show-export="false"
        empty-state-message="No se encontraron registros de consolidado." @update:primary-search="handleSearch"
        @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportData"
        @filter-change="handleFilterChange"
        :show-body-top="true">
        <!-- Botón de filtros personalizado -->
        <template #body-top>
          <div class="w-50 my-3 flex items-center">
            <div class="inline-flex rounded-md bg-gray-100 dark:bg-gray-900 p-1 gap-2">
              <button
                type="button"
                @click="activeTab = 'consolidado'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition',
                  isConsolidado ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
                ]"
              >
                Consolidado
              </button>
              <button
                type="button"
                @click="activeTab = 'cursos'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition border-2 border-gray-300 text-gray-300',
                  isCursos ? 'bg-white dark:bg-gray-800 border border-gray-200 shadow-sm' : 'text-gray-600'
                ]"
              >
                Cursos
              </button>
            </div>
          </div>
          <div class="my-3 flex justify-end">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              Importe total: 
              <span class="text-black dark:text-primary-400 bg-white p-2 rounded-md border border-gray-200">
                {{ formatCurrency(totalImporteConsolidado) }}
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
      <DataTable title="Cursos" icon="i-heroicons-clipboard-document-check" :data="cursosData" :columns="cursosColumns" :loading="loadingCursos"
        :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
  :items-per-page="itemsPerPage" :primary-search-value="search" :show-secondary-search="false" :show-filters="true"
  :filter-config="filterConfigCursos" :filters-value="filtersCursos" :show-export="false"
  empty-state-message="No se encontraron registros de cursos." @update:primary-search="handleSearch"
        @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportData"
        @filter-change="handleFilterChange" :show-body-top="true">

        <template #body-top>
          <div class="w-50 mb-6 flex items-center">
            <div class="inline-flex rounded-md bg-gray-100 dark:bg-gray-900 p-1 gap-2">
              <button
                type="button"
                @click="activeTab = 'consolidado'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition border-2 border-gray-300 text-gray-300',
                  isConsolidado ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
                ]"
              >
                Consolidado
              </button>
              <button
                type="button"
                @click="activeTab = 'cursos'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition',
                  isCursos ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
                ]"
              >
                Cursos
              </button>
            </div>
          </div>
          <div class="mb-4 flex justify-end">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              Importe total: 
              <span class="text-black dark:text-primary-400 bg-white p-2 rounded-md border border-gray-200">
                {{ formatCurrency(totalImporteCursos) }}
              </span>
            </div>
          </div>
        </template>
        <!-- Estado de error -->
        <template #error-state>
          <ErrorState :message="errorCursos || 'Error desconocido'" />
        </template>
      </DataTable>
    </div>
  </div>

  <DynamicModal :visible="modalVisible" :modal="modalMessage" @close="modalVisible = false" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useConsolidado } from '~/composables/usePagosConsolidado'
import { usePagos } from '~/composables/usePagos'
import { ESTADOS_PAGO, CARGAS_DISPONIBLES } from '~/constants/consolidado'
import { ESTADOS_PAGO as ESTADOS_PAGO_CURSOS } from '~/constants/cursos'
import { getEstadoColor, formatCurrency, formatPhoneNumber, formatDocument } from '~/utils/consolidado'
import { getEstadoColor as getEstadoColorCursos, formatCurrency as formatCurrencyCursos, formatPhoneNumber as formatPhoneNumberCursos } from '~/utils/cursos'
import { UButton } from '#components'
import DynamicModal from '~/components/DynamicModal.vue'
import type { ModalData } from '~/composables/commons/useModal'
import PagoGrid from '~/components/PagoGrid.vue'

// Tabs
const tabs = [
  { value: 'consolidado', label: 'Consolidado' },
  { value: 'cursos', label: 'Cursos' }
]

const activeTab = ref('consolidado')

const isConsolidado = computed(() => activeTab.value === 'consolidado')
const isCursos = computed(() => activeTab.value === 'cursos')

const modalVisible = ref(false)
const modalMessage = ref<ModalData | null>(null)

// Agregar función para mostrar el modal
const showModal = (message: ModalData | string) => {
  if (typeof message === 'string') {
    modalMessage.value = {
      id: Date.now().toString(),
      type: 'info',
      title: 'Observaciones',
      message
    }
  } else {
    modalMessage.value = message
  }
  modalVisible.value = true
}

// Composable de consolidado
const {
  consolidadoData,
  loading: loadingConsolidado,
  error: errorConsolidado,
  pagination: paginationConsolidado,
  filters: filtersConsolidado,
  cargasDisponibles,
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
  campanasDisponibles,
  totalAmount: totalAmountCursos,
  totalPaid: totalPaidCursos,
  filteredData: filteredDataCursos,
  fetchCursosData,
  updateEstadoPago: updateEstadoPagoCursos,
  getCursoDetalle,
  exportData: exportCursosData,
  updateFilters: updateFiltersCursos,
  clearFilters: clearFiltersCursos
} = usePagos()

// State para paginación
const search = ref('')
const currentPage = computed(() => activeTab.value === 'consolidado' ? paginationConsolidado.value.current_page : paginationCursos.value.current_page)
const totalPages = computed(() => activeTab.value === 'consolidado' ? paginationConsolidado.value.last_page : paginationCursos.value.last_page)
const totalRecords = computed(() => activeTab.value === 'consolidado' ? paginationConsolidado.value.total : paginationCursos.value.total)
const itemsPerPage = computed(() => {
  const per = activeTab.value === 'consolidado' ? paginationConsolidado.value.per_page : paginationCursos.value.per_page
  const n = Number(per)
  return Number.isFinite(n) && n > 0 ? n : 10
})


// Configuración de filtros para consolidado
// Opciones de cargas derivadas de los datos (únicas y ordenadas de menor a mayor)
const cargasOptions = computed(() => {
  const values = (consolidadoData.value || []).map((it: any) => it.carga).filter((v: any) => v !== undefined && v !== null && String(v).trim() !== '')
  const unique = Array.from(new Set(values.map((v: any) => String(v))))
  unique.sort((a: string, b: string) => {
    const na = Number(a)
    const nb = Number(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b, undefined, { numeric: true })
  })
  return [{ value: 'todos', label: 'Todas las cargas' }, ...unique.map((v: string) => ({ value: String(v), label: `#${v}` }))]
})


const filterConfigConsolidado = computed(() => [
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
  options: (cargasDisponibles && cargasDisponibles.value && cargasDisponibles.value.length) ? cargasDisponibles.value : cargasOptions.value
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

const filterConfigCursos = computed(() => [
  {
    key: 'estado_pago',
    label: 'Estado de pago',
    type: 'select',
    placeholder: 'Seleccionar estado de pago',
    options: ESTADOS_PAGO_CURSOS
  },
  {
    key: 'campanas',
    label: 'Campaña',
    type: 'select',
    placeholder: 'Seleccionar campaña',
    options: campanasDisponibles.value
  },
  {
    key: 'Filtro_Fe_Inicio',
    label: 'Fecha Inicio',
    type: 'date',
    placeholder: 'DD/MM/YYYY',
    options: []
  },
  {
    key: 'Filtro_Fe_Fin',
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

      return h('div', [
        h('select', {
          class: `py-1 text-xs font-medium border ${getEstadoColor(estado)}`,
          value: estado,
          disabled: true
        },
        // generar opciones desde ESTADOS_PAGO (value,label)
        (ESTADOS_PAGO || []).map((opt: any) =>
          h('option', { value: opt.value }, opt.label)
        )
        ),
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
      const pagos = row.getValue('pagos_detalle')??[]
      return h(PagoGrid,
        {
          numberOfPagos: pagos.length,
          pagoDetails: pagos,
          showDelete: false,
          clienteNombre: row.original.nombre,
          currency: 'USD',
          
        }
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
        //agregar boton en caso tenga "note_administracion" y que se habra un modal mostrando el mensaje
        row.original.note_administracion && h(UButton as any, {
          size: 'xs',
          icon: 'i-heroicons-document-text',
          color: 'primary',
          variant: 'ghost',
          onClick: () => {
            // Mostrar modal con el mensaje de "note_administracion"
            showModal(row.original.note_administracion)
          }
        })

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
      return h('div', [
        h('select', {
          class: `py-1 text-xs font-medium border ${getEstadoColor(estado)}`,
          value: estado,
          disabled: true
        }, [
          (ESTADOS_PAGO || []).map((opt: any) =>
            h('option', { value: opt.value }, opt.label)
          )
        ])
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
      const adelantos = row.getValue('pagos_detalle') ?? []
      return h(PagoGrid,
        {
          numberOfPagos: adelantos.length,
          pagoDetails: adelantos,
          showDelete: false,
          clienteNombre: row.original.nombre,
          currency: 'USD',
          
        }
      ) 
      if (!Array.isArray(adelantos) || adelantos.length === 0) {
        return h('div', { class: 'text-sm text-gray-500' }, '-')
      }
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
        //agregar boton en caso tenga "note_administracion" y que se habra un modal mostrando el mensaje
        row.original.note_administracion && h(UButton as any, {
          size: 'xs',
          icon: 'i-heroicons-document-text',
          color: 'primary',
          variant: 'ghost',
          onClick: () => {
            // Mostrar modal con el mensaje de "note_administracion"
            showModal(row.original.note_administracion)
          }
        })

      ])
    }
  }
]

const totalImporteConsolidado = computed(() =>
  consolidadoData.value.reduce((sum, item) => sum + (Number(item.monto_a_pagar_formateado) || 0), 0)
)
const totalImporteCursos = computed(() =>
  cursosData.value.reduce((sum, item) => sum + (Number(item.monto_a_pagar_formateado) || 0), 0)
)

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