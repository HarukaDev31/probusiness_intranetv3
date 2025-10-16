<template>
  <div class="p-2">

    <!-- Tab Content -->
    <div v-if="activeTab === 'consolidado'">
      <!-- Consolidado Tab -->
      <DataTable :show-title="true" title="Verificación" subtitle="Gestión de verificación de pagos"
        icon="i-heroicons-clipboard-document-check" :data="consolidadoData" :columns="consolidadoColumns"
        :loading="loadingConsolidado" :current-page="currentPage" :total-pages="totalPages"
        :total-records="totalRecords" :items-per-page="itemsPerPage" :primary-search-value="search"
        :show-secondary-search="false" :show-filters="true" :filter-config="filterConfigConsolidado"
        :filters-value="filtersConsolidado" :show-export="false"
        empty-state-message="No se encontraron registros de consolidado." @update:primary-search="handleSearch"
        @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportData"
        @filter-change="handleFilterChange" :show-body-top="true">
        <!-- Botón de filtros personalizado -->
        <template #body-top>
          <div class="w-50 my-3 flex items-center">
            <div class="inline-flex rounded-md bg-gray-100 dark:bg-gray-900 p-1 gap-2">
              <button type="button" @click="activeTab = 'consolidado'" :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition',
                isConsolidado ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
              ]">
                Consolidado
              </button>
              <button type="button" @click="activeTab = 'cursos'" :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition border-2 border-gray-300 text-gray-300',
                isCursos ? 'bg-white dark:bg-gray-800 border border-gray-200 shadow-sm' : 'text-gray-600'
              ]">
                Cursos
              </button>
              <button type="button" @click="activeTab = 'delivery'" :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition border-2 border-gray-300 text-gray-300',
                isDelivery ? 'bg-white dark:bg-gray-800 border border-gray-200 shadow-sm' : 'text-gray-600'
              ]">
                Delivery
              </button>
            </div>
          </div>
          <div class="my-3 mr-20 flex justify-end items-center">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              Importe total:
              <span
                class="text-primary-500 dark:text-primary-400 bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-700">
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
      <DataTable title="Cursos" icon="i-heroicons-clipboard-document-check" :data="cursosData" :columns="cursosColumns"
        :loading="loadingCursos" :current-page="currentPageCursos" :total-pages="totalPagesCursos"
        :total-records="totalRecordsCursos" :items-per-page="itemsPerPageCursos" :primary-search-value="searchCursos"
        :show-secondary-search="false" :show-filters="true" :filter-config="filterConfigCursos"
        :filters-value="filtersCursos" :show-export="false" empty-state-message="No se encontraron registros de cursos."
        @update:primary-search="handleSearch" @page-change="handlePageChange"
        @items-per-page-change="handleItemsPerPageChange" @export="exportCursosData" @filter-change="handleFilterChange"
        :show-body-top="true">

        <template #body-top>
          <div class="w-50 mb-6 flex items-center">
            <div class="inline-flex rounded-md bg-gray-100 dark:bg-gray-900 p-1 gap-2">
              <button type="button" @click="activeTab = 'consolidado'" :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition border-2 border-gray-300 text-gray-300',
                isConsolidado ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
              ]">
                Consolidado
              </button>
              <button type="button" @click="activeTab = 'cursos'" :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition',
                isCursos ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
              ]">
                Cursos
              </button>
              <button type="button" @click="activeTab = 'delivery'" :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition',
                isDelivery ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
              ]">
                Delivery
              </button>
            </div>
          </div>
          <div class="my-3 mr-20 flex justify-end items-center">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              Importe total:
              <span
                class="text-primary-500 dark:text-primary-400 bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-700">
                {{ formatCurrency(totalImporteCursos, 'PEN') }}
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

    <div v-else-if="activeTab === 'delivery'">
      <!-- Delivery Tab -->
      <DataTable title="Delivery" icon="i-heroicons-truck" :data="deliveryData" :columns="deliveryColumns"
        :loading="loadingDelivery" :current-page="currentPageDelivery" :total-pages="totalPagesDelivery"
        :total-records="totalRecordsDelivery" :items-per-page="itemsPerPageDelivery"
        :primary-search-value="searchDelivery" :show-secondary-search="false" :show-filters="true"
        :filter-config="filterConfigDelivery" :filters-value="filtersDelivery" :show-export="false"
        empty-state-message="No se encontraron registros de delivery." @update:primary-search="handleSearch"
        @page-change="handlePageChange" @items-per-page-change="handleItemsPerPageChange" @export="exportDeliveryData"
        @filter-change="handleFilterChange" :show-body-top="true">

        <template #body-top>
          <div class="w-50 mb-6 flex items-center">
            <div class="inline-flex rounded-md bg-gray-100 dark:bg-gray-900 p-1 gap-2">
              <button type="button" @click="activeTab = 'consolidado'" :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition border-2 border-gray-300 text-gray-300',
                isConsolidado ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
              ]">
                Consolidado
              </button>
              <button type="button" @click="activeTab = 'cursos'" :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition border-2 border-gray-300 text-gray-300',
                isCursos ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
              ]">
                Cursos
              </button>
              <button type="button" @click="activeTab = 'delivery'" :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition',
                isDelivery ? 'bg-white dark:bg-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600'
              ]">
                Delivery
              </button>
            </div>
          </div>
          <div class="my-3 mr-20 flex justify-end items-center">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              Importe total:
              <span
                class="text-primary-500 dark:text-primary-400 bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-700">
                {{ formatCurrency(totalImporteDelivery, 'PEN') }}
              </span>
            </div>
          </div>
        </template>
        <!-- Estado de error -->
        <template #error-state>
          <ErrorState :message="errorDelivery || 'Error desconocido'" />
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
import { useEntrega } from '~/composables/cargaconsolidada/entrega/useEntrega'
import { ESTADOS_PAGO, CARGAS_DISPONIBLES } from '~/constants/consolidado'
import { ESTADOS_PAGO as ESTADOS_PAGO_CURSOS } from '~/constants/cursos'
import { getEstadoColor, formatCurrency, formatPhoneNumber, formatDocument } from '~/utils/consolidado'
import { getEstadoColor as getEstadoColorCursos, formatCurrency as formatCurrencyCursos, formatPhoneNumber as formatPhoneNumberCursos } from '~/utils/cursos'
import { UButton, USelect } from '#components'
import DynamicModal from '~/components/DynamicModal.vue'
import type { ModalData } from '~/composables/commons/useModal'
import PagoGrid from '~/components/PagoGrid.vue'
import { STATUS_BG_CLASSES } from '~/constants/ui'
// Tabs
const tabs = [
  { value: 'consolidado', label: 'Consolidado' },
  { value: 'cursos', label: 'Cursos' },
  { value: 'delivery', label: 'Delivery' }
]

const activeTab = ref('consolidado')

const isConsolidado = computed(() => activeTab.value === 'consolidado')
const isCursos = computed(() => activeTab.value === 'cursos')
const isDelivery = computed(() => activeTab.value === 'delivery')

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
  clearFilters: clearFiltersConsolidado,
  totalPages,
  totalRecords,
  currentPage,
  itemsPerPage,
  search
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
  clearFilters: clearFiltersCursos,
  totalPagesCursos,
  totalRecordsCursos,
  currentPageCursos,
  itemsPerPageCursos,
  searchCursos
} = usePagos()

// Composable de entrega para delivery
const {
  delivery: deliveryData,
  loading: loadingDelivery,
  error: errorDelivery,
  pagination: paginationDelivery,
  search: searchDelivery,
  itemsPerPage: itemsPerPageDelivery,
  totalPages: totalPagesDelivery,
  totalRecords: totalRecordsDelivery,
  currentPage: currentPageDelivery,
  filters: filtersDelivery,
  getDelivery,
  updateImporteDelivery,
  registrarPagoDelivery,
  deletePagoDelivery,
  getAllDeliveryData,
  fetchDeliveryData,
  updateFiltersDelivery,
  clearFiltersDelivery,
  cargasDisponiblesDelivery
} = useEntrega()



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

// Opciones de cargas desde el backend (cargas_disponibles)
const cargasOptionsDelivery = computed(() => {
  // Si hay cargas_disponibles en el composable, usarlas
  if (cargasDisponiblesDelivery.value && Array.isArray(cargasDisponiblesDelivery.value) && cargasDisponiblesDelivery.value.length > 0) {
    return [{ value: 'todos', label: 'Todas las cargas' }, ...cargasDisponiblesDelivery.value]
  }

  // Fallback: derivar de los datos si no hay cargas_disponibles
  const values = (deliveryData.value || []).map((it: any) => it.carga).filter((v: any) => v !== undefined && v !== null && String(v).trim() !== '')
  const unique = Array.from(new Set(values.map((v: any) => String(v))))
  unique.sort((a: string, b: string) => {
    const na = Number(a)
    const nb = Number(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b, undefined, { numeric: true })
  })
  return [{ value: 'todos', label: 'Todas las cargas' }, ...unique.map((v: string) => ({ value: String(v), label: `#${v}` }))]
})

const filterConfigDelivery = computed(() => [
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    options: [
      { value: 'todos', label: 'Todos los estados' },
      { value: 'PENDIENTE', label: 'Pendiente' },
      { value: 'PAGADO', label: 'Pagado' }
    ]
  },
  {
    key: 'entrega',
    label: 'Tipo de Entrega',
    type: 'select',
    placeholder: 'Seleccionar tipo',
    options: [
      { value: 'todos', label: 'Todos los tipos' },
      { value: 'LIMA', label: 'Lima' },
      { value: 'PROVINCIA', label: 'Provincia' }
    ]
  },
  {
    key: 'carga',
    label: 'Carga',
    type: 'select',
    placeholder: 'Seleccionar carga',
    options: cargasOptionsDelivery.value
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
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => formatDateTimeToDmy(row.getValue('fecha'))
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }: { row: any }) => row.getValue('nombre')
  },
  {
    accessorKey: 'documento',
    header: 'DNI',
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
        h(USelect as any, {
          class: `py-1 text-xs font-medium border ${getEstadoColor(estado)}`,
          modelValue: estado,
          items: ESTADOS_PAGO,
          disabled: true
        },)
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
      const pagos = row.getValue('pagos_detalle') ?? []
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
          currency: 'PEN',

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

// Columnas para Delivery (usando las mismas que Consolidado)
const deliveryColumns: TableColumn<any>[] = [
  {
    accessorKey: 'index',
    header: 'N.',
    cell: ({ row }: { row: any }) => row.getValue('index')
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => formatDateTimeToDmy(row.getValue('fecha'))
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }: { row: any }) => row.getValue('nombre')
  },
  {
    accessorKey: 'documento',
    header: 'DNI',
    cell: ({ row }: { row: any }) => formatDocument(row.getValue('documento'))
  },
  {
    accessorKey: 'telefono',
    header: 'WhatsApp',
    cell: ({ row }: { row: any }) => formatPhoneNumber(row.getValue('telefono'))
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
      const estado_pago = row.getValue('estado_pago')

      return h(USelect as any, {
        modelValue: estado_pago,
        items: ESTADOS_PAGO,
        class: [STATUS_BG_CLASSES[estado_pago as keyof typeof STATUS_BG_CLASSES]],
        disabled: true
      })
    }
  },
  {
    accessorKey: 'total_pago_delivery',
    header: 'Importe',
    cell: ({ row }: { row: any }) => {
      const monto = row.getValue('total_pago_delivery')
      return h('div', { class: 'flex items-center space-x-1' }, [
        h('span', {}, formatCurrency(monto, 'PEN')),
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
      const total = row.original.pagado
      return h('div', { class: 'flex items-center space-x-1' }, [
        h('span', {}, formatCurrency(total, 'PEN')),
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
      const pagos = row.original.pagos_details ?? []
      return h(PagoGrid,
        {
          numberOfPagos: pagos.length,
          pagoDetails: pagos,
          showDelete: false,
          clienteNombre: row.original.nombre,
          currency: 'PEN',
          onSave: (data: any) => handleRegistrarPagoDelivery(row.original, data),
          onDelete: (pagoId: number) => handleDeletePagoDelivery(row.original, pagoId)
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
          onClick: () => navigateTo(`/verificacion/delivery/${row.original.id}`)
        }),
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
const totalImporteDelivery = computed(() =>
  deliveryData.value.reduce((sum, item) => sum + (Number(item.pagado) || 0), 0)
)

// Computed para el total del consolidado (asegurar que sea un número)
const totalAmountConsolidadoComputed = computed(() => {
  const amount = totalAmountConsolidado.value
  
  return typeof amount === 'number' ? amount : 0
})

// Computed para el total de cursos
const totalAmountCursosComputed = computed(() => {
  const amount = totalAmountCursos.value
  return typeof amount === 'number' ? amount : 0
})

// Helper functions to get parameters from route
const getIdCotizacionFromRoute = () => {
  const route = useRoute()
  return route.query.idCotizacion ? Number(route.query.idCotizacion) : undefined
}

const getIdPedidoFromRoute = () => {
  const route = useRoute()
  return route.query.idPedido ? Number(route.query.idPedido) : undefined
}

// Methods
const handleSearch = async (query: string) => {
  search.value = query
  const idCotizacion = getIdCotizacionFromRoute()
  const idPedido = getIdPedidoFromRoute()

  if (activeTab.value === 'consolidado') {
    updateFiltersConsolidado({ search: query })
    fetchConsolidadoData(filtersConsolidado.value, 1, itemsPerPage.value, idCotizacion)
  } else if (activeTab.value === 'cursos') {
    updateFiltersCursos({ search: query })
    fetchCursosData(filtersCursos.value, 1, itemsPerPage.value, idPedido)
  } else if (activeTab.value === 'delivery') {
    searchDelivery.value = query
    await fetchDeliveryData(filtersDelivery.value, 1, itemsPerPageDelivery.value)
  }
}

const handlePageChange = async (page: number) => {
  const idCotizacion = getIdCotizacionFromRoute()
  const idPedido = getIdPedidoFromRoute()

  if (activeTab.value === 'consolidado') {
    fetchConsolidadoData(filtersConsolidado.value, page, itemsPerPage.value, idCotizacion)
  } else if (activeTab.value === 'cursos') {
    fetchCursosData(filtersCursos.value, page, itemsPerPage.value, idPedido)
  } else if (activeTab.value === 'delivery') {
    paginationDelivery.value.current_page = page
    await fetchDeliveryData(filtersDelivery.value, page, itemsPerPageDelivery.value)
  }
}

const handleItemsPerPageChange = async (items: number) => {
  const idCotizacion = getIdCotizacionFromRoute()
  const idPedido = getIdPedidoFromRoute()

  if (activeTab.value === 'consolidado') {
    fetchConsolidadoData(filtersConsolidado.value, 1, items, idCotizacion)
  } else if (activeTab.value === 'cursos') {
    fetchCursosData(filtersCursos.value, 1, items, idPedido)
  } else if (activeTab.value === 'delivery') {
    paginationDelivery.value.per_page = items
    await fetchDeliveryData(filtersDelivery.value, 1, items)
  }
}

const handleFilterChange = async (filterType: string, value: string) => {
  const idCotizacion = getIdCotizacionFromRoute()
  const idPedido = getIdPedidoFromRoute()

  if (activeTab.value === 'consolidado') {
    updateFiltersConsolidado({ [filterType]: value })
    fetchConsolidadoData(filtersConsolidado.value, 1, itemsPerPage.value, idCotizacion)
  } else if (activeTab.value === 'cursos') {
    updateFiltersCursos({ [filterType]: value })
    fetchCursosData(filtersCursos.value, 1, itemsPerPage.value, idPedido)
  } else if (activeTab.value === 'delivery') {
    updateFiltersDelivery({ [filterType]: value })
    await fetchDeliveryData(filtersDelivery.value, 1, itemsPerPageDelivery.value)
  }
}

const exportData = async () => {
  if (activeTab.value === 'consolidado') {
    await exportConsolidadoData()
  } else if (activeTab.value === 'cursos') {
    await exportCursosData()
  } else if (activeTab.value === 'delivery') {
    // Aquí se implementaría la lógica de exportación para delivery
    
  }
}

const handleViewDetails = async (id: number) => {
  try {
    const detalle = await getPagoDetalle(id)
    
    // Aquí puedes abrir un modal o navegar a una página de detalles
  } catch (err) {
    console.error('Error al obtener detalles:', err)
  }
}

const handleViewDocument = (id: number) => {
  
}

// Función para exportar datos de delivery
const exportDeliveryData = async () => {
  
  // Aquí se implementaría la lógica de exportación específica para delivery
}



// Handlers para delivery
const handleRegistrarPagoDelivery = async (row: any, data: any) => {
  try {
    const response = await registrarPagoDelivery(row, data)
    if (response?.success) {
      // Recargar todos los datos de delivery después de registrar pago
      await fetchDeliveryData(filtersDelivery.value, currentPageDelivery.value, itemsPerPageDelivery.value)
    }
  } catch (error) {
    console.error('Error al registrar pago:', error)
  }
}

const handleDeletePagoDelivery = async (row: any, pagoId: number) => {
  try {
    const response = await deletePagoDelivery(row, pagoId)
    if (response?.success) {
      // Recargar todos los datos de delivery después de eliminar pago
      await fetchDeliveryData(filtersDelivery.value, currentPageDelivery.value, itemsPerPageDelivery.value)
    }
  } catch (error) {
    console.error('Error al eliminar pago:', error)
  }
}

const handleUpdateImporteDelivery = async (row: any) => {
  try {
    const data = {
      id_cotizacion: row.id_cotizacion,
      importe: row.importe
    }
    const response = await updateImporteDelivery(data)
    if (response?.success) {
      // Recargar todos los datos de delivery después de actualizar importe
      await fetchDeliveryData(filtersDelivery.value, currentPageDelivery.value, itemsPerPageDelivery.value)
    }
  } catch (error) {
    console.error('Error al actualizar importe:', error)
  }
}

// Watchers


// Initialize
onMounted(async () => {
  const route = useRoute()
  const tabQuery = route.query.tab
  const idCotizacion = route.query.idCotizacion ? Number(route.query.idCotizacion) : undefined
  const idPedido = route.query.idPedido ? Number(route.query.idPedido) : undefined

  if (tabQuery) {
    activeTab.value = tabQuery as string
  } else {
    activeTab.value = (tabs && tabs.length > 0) ? tabs[0].value : 'consolidado' // Cambiar a 'consolidado' como tab inicial
  }
  
  
  

  // Cargar datos iniciales según el tab activo
  if (activeTab.value === 'consolidado') {
    fetchConsolidadoData(filtersConsolidado.value, 1, itemsPerPage.value, idCotizacion)
  } else if (activeTab.value === 'cursos') {
    fetchCursosData(filtersCursos.value, 1, itemsPerPage.value, idPedido)
  } else if (activeTab.value === 'delivery') {
    // Cargar todos los datos de delivery
    await fetchDeliveryData(filtersDelivery.value, 1, itemsPerPageDelivery.value)
  }
})
watch(activeTab, async (newTab, oldTab) => {
  
  
  const route = useRoute()
  const idCotizacion = route.query.idCotizacion ? Number(route.query.idCotizacion) : undefined
  const idPedido = route.query.idPedido ? Number(route.query.idPedido) : undefined

  if (newTab === 'consolidado') {
    navigateTo(`/verificacion?tab=consolidado`)
    fetchConsolidadoData(filtersConsolidado.value, 1, itemsPerPage.value, idCotizacion)
  } else if (newTab === 'cursos') {
    navigateTo(`/verificacion?tab=cursos`)
    fetchCursosData(filtersCursos.value, 1, itemsPerPage.value, idPedido)
  } else if (newTab === 'delivery') {
    navigateTo(`/verificacion?tab=delivery`)
    // Cargar todos los datos de delivery
    await fetchDeliveryData(filtersDelivery.value, 1, itemsPerPageDelivery.value)
  }
})
</script>