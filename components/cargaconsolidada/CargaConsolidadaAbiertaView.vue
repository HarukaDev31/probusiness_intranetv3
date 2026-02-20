<template>
  <div class="">
    <WhatsappNumbersStatus
      :instances="[{ instanceName: 'COORDINATION', key: 'Coordinación' }, { instanceName: 'SELLS', key: 'Ventas' }]"
      :auto-refresh="true"
      :refresh-interval="30000"
      :compact="true"
    />

    <div v-if="isDesktop || role === ROLES.DOCUMENTACION || role === ROLES.JEFE_IMPORTACIONES">
      <DataTable
        title="Carga Consolidada Abierta"
        icon=""
        :show-title="true"
        :data="consolidadoData"
        :show-pagination="false"
        :show-export="false"
        :columns="getColumns()"
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
        empty-state-message="No se encontraron registros de contenedores."
        :hide-back-button="!backRoute"
        :previous-page-url="backRoute ?? undefined"
        @update:search-query="handleSearch"
        @update:primary-search="handleSearch"
        @page-change="handlePageChange"
        @items-per-page-change="handleItemsPerPageChange"
        @export="exportClientes"
        @filter-change="handleFilterChange"
      >
        <template #actions>
          <template v-if="role === ROLES.COORDINACION">
            <CreateConsolidadoModal @submit="handleCreateConsolidado" :id="currentConsolidado" />
          </template>
        </template>
      </DataTable>
    </div>

    <!-- Mobile list view: visible only on small screens -->
    <div
      v-if="role !== ROLES.DOCUMENTACION && role !== ROLES.JEFE_IMPORTACIONES"
      class="sm:hidden mt-4"
    >
      <div class="flex flex-col gap-3">
        <template v-for="(row, idx) in consolidadoData" :key="row.id || idx">
          <button
            type="button"
            @click="handleViewSteps(row.id)"
            class="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
          >
            <div class="flex-1">
              <div class="text-xs text-gray-500">{{ row.mes }}</div>
              <div class="font-semibold text-sm">Consolidado #{{ row.carga }}</div>
              <div class="text-xs text-gray-400 mt-1">{{ row.empresa }}</div>
              <div class="mt-1 text-xs text-gray-400 flex flex-col items-center gap-1">
                <span v-if="row.f_cierre">Cierre: {{ formatDateTimeToDmy(row.f_cierre) }}</span>
                <span v-if="row.fecha_arribo || row.f_puerto">Puerto: {{ formatDateTimeToDmy(row.fecha_arribo || row.f_puerto) }}</span>
                <span v-if="row.f_entrega">Entrega: {{ formatDateTimeToDmy(row.f_entrega) }}</span>
              </div>
            </div>
            <div class="ml-4 flex flex-col items-end">
              <div class="min-w-[110px]">
                <USelect
                  :model-value="row.estado_china"
                  variant="subtle"
                  disabled
                  :items="[
                    { label: 'PENDIENTE', value: 'PENDIENTE' },
                    { label: 'RECIBIENDO', value: 'RECIBIENDO' },
                    { label: 'COMPLETADO', value: 'COMPLETADO' }
                  ]"
                  :class="STATUS_BG_CLASSES[(row.estado_china) as keyof typeof STATUS_BG_CLASSES] + ' text-sm py-2 px-3 rounded-full'"
                />
              </div>
              <div class="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-300">
                <div class="flex items-center gap-2">
                  <img data-v-f8957c9e="" src="https://upload.wikimedia.org/wikipedia/commons/c/cf/Flag_of_Peru.svg" alt="icon" class="w-4 h-2.5">
                  <span class="whitespace-nowrap">{{ safeCbm(row, 'cbm_total_peru') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <img data-v-f8957c9e="" src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Flag_of_the_People%27s_Republic_of_China.svg" alt="icon" class="w-4 h-2.5">
                  <span class="whitespace-nowrap">{{ safeCbm(row, 'cbm_total_china') }}</span>
                </div>
              </div>
            </div>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h, resolveComponent, onMounted, onUnmounted, computed, toRef } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { FilterConfig } from '~/types/data-table'
import { useConsolidado } from '~/composables/cargaconsolidada/useConsolidado'
import { ROLES } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import CreateConsolidadoModal from '~/components/cargaconsolidada/CreateConsolidadoModal.vue'
import { USelect } from '#components'
import { STATUS_BG_CLASSES } from '~/constants/ui'

const props = withDefaults(
  defineProps<{
    /** Rol del usuario para mostrar columnas/filtros/acciones según corresponda */
    role: string
    /** Ruta a donde volver al hacer clic en el botón atrás del DataTable. Si no se pasa, se oculta el botón. */
    backRoute?: string | null
    /** Base path para enlaces Ver/pasos/cotizaciones (ej. /cargaconsolidada/abiertos o /cargaconsolidada/coordinacion/abiertos). Por defecto /cargaconsolidada/abiertos. */
    basePath?: string
  }>(),
  { backRoute: null, basePath: '/cargaconsolidada/abiertos' }
)

const { withSpinner } = useSpinner()
const { hasRole, currentId } = useUserRole()
const { showSuccess, showConfirmation, showError } = useModal()

const isCoordinacion = computed(() => props.role === ROLES.COORDINACION)
const isAlmacen = computed(() => props.role === ROLES.CONTENEDOR_ALMACEN)

const {
  consolidadoData,
  loading,
  search,
  itemsPerPage,
  totalPages,
  totalRecords,
  currentPage,
  filters,
  getConsolidadoData,
  handleSearch,
  handlePageChange,
  handleItemsPerPageChange,
  handleFilterChange,
  createConsolidado,
  deleteConsolidado,
  updateEstadoDocumentacion,
} = useConsolidado(toRef(props, 'role'))

const overlay = useOverlay()
const modal = overlay.create(CreateConsolidadoModal)
const currentConsolidado = ref<number | null>(null)

const isDesktop = ref(false)
const tableMeta = {
  class: {
    tr: (row: TableRow<{ value: number }>) => {
      return row.original.isVerified ? 'bg-green-500' : 'bg-white dark:bg-gray-800'
    },
  },
}
let resizeRafId: number | null = null
const updateIsDesktop = () => {
  if (resizeRafId) return
  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = null
    try {
      isDesktop.value = window.innerWidth >= 640
    } catch (e) {
      isDesktop.value = true
    }
  })
}
onMounted(() => {
  updateIsDesktop()
  window.addEventListener('resize', updateIsDesktop, { passive: true })
})
onUnmounted(() => {
  try {
    window.removeEventListener('resize', updateIsDesktop)
    if (resizeRafId) {
      cancelAnimationFrame(resizeRafId)
      resizeRafId = null
    }
  } catch (e) {}
})

const UButton = resolveComponent('UButton')

const filterConfig = computed<FilterConfig[]>(() => {
  const baseConfig: FilterConfig[] = [
    { label: 'Fecha Inicio', key: 'fecha_inicio', type: 'date', placeholder: 'Selecciona una fecha', options: [] },
    { label: 'Fecha Fin', key: 'fecha_fin', type: 'date', placeholder: 'Selecciona una fecha', options: [] },
  ]
  if (isAlmacen.value) {
    baseConfig.push({
      label: 'Estado',
      key: 'estado_china',
      type: 'select',
      options: [
        { label: 'Todos', value: 'todos' },
        { label: 'WAITING', value: 'WAITING' },
        { label: 'RECEIVING', value: 'RECEIVING' },
        { label: 'FINISH', value: 'FINISH' },
      ],
      placeholder: 'Selecciona un estado',
    })
  } else {
    baseConfig.push({
      label: 'Estado',
      key: 'estado_china',
      type: 'select',
      options: [
        { label: 'Todos', value: 'todos' },
        { label: 'PENDIENTE', value: 'PENDIENTE' },
        { label: 'RECIBIENDO', value: 'RECIBIENDO' },
        { label: 'COMPLETADO', value: 'COMPLETADO' },
      ],
      placeholder: 'Selecciona un estado',
    })
  }
  return baseConfig
})

const handleCreateConsolidado = async (data: any) => {
  try {
    const payload = {
      id: data.id,
      carga: data.carga,
      mes: data.mes,
      id_pais: data.pais,
      empresa: data.empresa,
      f_cierre: `${data.fechaCierre.year}-${data.fechaCierre.month}-${data.fechaCierre.day}`,
      f_puerto: `${data.fechaArribo.year}-${data.fechaArribo.month}-${data.fechaArribo.day}`,
      f_entrega: `${data.fechaEntrega.year}-${data.fechaEntrega.month}-${data.fechaEntrega.day}`,
    }
    await withSpinner(async () => {
      await createConsolidado(payload)
    })
    showSuccess('Carga consolidada creada correctamente', 'La carga consolidada se ha creado correctamente y ya está disponible en el sistema.')
    await getConsolidadoData()
  } catch (error) {
    showError('Error al crear carga consolidada', error as string)
  }
}

const safeCbm = (r: any, key: string) => {
  try {
    const val = (r && (r as any)[key]) ?? (r && (r as any).original && (r as any).original[key])
    return val != null ? formatNumber(val, 2) : 'N/A'
  } catch (e) {
    return 'N/A'
  }
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'carga', header: 'Carga', cell: ({ row }) => `CARGA CONSOLIDADA #${row.getValue('carga')}` },
  { accessorKey: 'mes', header: 'Mes', cell: ({ row }) => row.getValue('mes') },
  { accessorKey: 'anio', header: 'Año', cell: ({ row }) => row.getValue('anio') },
  { accessorKey: 'pais', header: 'País', cell: ({ row }) => row.original.pais?.No_Pais || 'N/A' },
  { accessorKey: 'f_cierre', header: 'F. Cierre', cell: ({ row }) => formatDateTimeToDmy(row.getValue('f_cierre')) },
  {
    accessorKey: 'fecha_arribo',
    header: 'F. Arribo',
    cell: ({ row }) => {
      const fa = row.getValue('fecha_arribo') || row.original?.fecha_arribo || row.original?.f_puerto
      return fa ? formatDateTimeToDmy(fa) : 'N/A'
    },
  },
  { accessorKey: 'f_entrega', header: 'F. Entrega', cell: ({ row }) => formatDateTimeToDmy(row.getValue('f_entrega')) },
  { accessorKey: 'empresa', header: 'Empresa', cell: ({ row }) => row.getValue('empresa') },
  {
    accessorKey: 'estado_china',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado_china') as string
      const color = getColorByEstado(estado)
      const selectNode = h(USelect as any, {
        modelValue: estado,
        variant: 'subtle',
        color: color,
        disabled: true,
        class: STATUS_BG_CLASSES[estado as keyof typeof STATUS_BG_CLASSES],
        items: [
          { label: 'PENDIENTE', value: 'PENDIENTE' },
          { label: 'RECIBIENDO', value: 'RECIBIENDO' },
          { label: 'COMPLETADO', value: 'COMPLETADO' },
        ],
      })
      return selectNode
    },
  },
  { accessorKey: 'cbm_total_peru', header: 'CBM Perú', cell: ({ row }) => formatNumber(row.getValue('cbm_total_peru'), 2) },
  { accessorKey: 'cbm_total_china', header: 'CBM China', cell: ({ row }) => formatNumber(row.getValue('cbm_total_china'), 2) },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      return h('div', { class: 'flex space-x-2' }, isCoordinacion.value
        ? [
            h(UButton, {
              size: 'xs',
              icon: 'i-heroicons-eye',
              color: 'info',
              variant: 'ghost',
              onClick: () => handleViewSteps(row.original.id),
            }),
            h(UButton, {
              size: 'xs',
              icon: 'i-heroicons-pencil',
              color: 'warning',
              variant: 'ghost',
              onClick: () => {
                currentConsolidado.value = row.original.id
                modal.open({
                  id: row.original.id,
                  onSubmit: (data: any) => {
                    handleCreateConsolidado(data)
                  },
                })
              },
            }),
            h(UButton, {
              size: 'xs',
              icon: 'i-heroicons-trash',
              color: 'error',
              variant: 'ghost',
              onClick: () => handleDeleteCarga(row.original.id),
            }),
          ]
        : [
            h(UButton, {
              size: 'xs',
              icon: 'i-heroicons-eye',
              color: 'info',
              variant: 'ghost',
              onClick: () => handleViewSteps(row.original.id),
            }),
          ])
    },
  },
]

const documentacionColumns: TableColumn<any>[] = [
  { accessorKey: 'carga', header: 'Carga', cell: ({ row }) => `CARGA CONSOLIDADA #${row.getValue('carga')}` },
  { accessorKey: 'mes', header: 'Mes', cell: ({ row }) => row.getValue('mes') },
  { accessorKey: 'pais', header: 'País', cell: ({ row }) => row.original.pais?.No_Pais || 'N/A' },
  { accessorKey: 'f_cierre', header: 'F. Cierre', cell: ({ row }) => formatDateTimeToDmy(row.getValue('f_cierre')) },
  { accessorKey: 'empresa', header: 'Empresa', cell: ({ row }) => row.getValue('empresa') },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.original.estado_documentacion as string
      const color = getColorByEstado(estado)
      const selectNode = h(USelect as any, {
        modelValue: row.original.estado_documentacion,
        variant: 'subtle',
        color: color,
        class: STATUS_BG_CLASSES[estado as keyof typeof STATUS_BG_CLASSES],
        items: [
          { label: 'PENDIENTE', value: 'PENDIENTE' },
          { label: 'DOCUMENTACION', value: 'DOCUMENTACION' },
          { label: 'COMPLETADO', value: 'COMPLETADO' },
        ],
        'onUpdate:modelValue': async (value: any) => {
          row.original.estado_documentacion = value
          await withSpinner(async () => {
            try {
              const data = { id: row.original.id, estado_documentacion: value }
              const response = await updateEstadoDocumentacion(data)
              if (response.success) {
                showSuccess('Estado de documentación actualizado correctamente', 'El estado de documentación se ha actualizado correctamente.')
                await getConsolidadoData()
              } else {
                showError('Error al actualizar el estado de documentación', response.error)
              }
            } catch (error) {
              showError('Error al actualizar el estado de documentación', error as string)
            }
          })
        },
      })
      return selectNode
    },
  },
  { accessorKey: 'cbm_total_peru', header: 'CBM Perú', cell: ({ row }) => formatNumber(row.getValue('cbm_total_peru'), 2) },
  { accessorKey: 'cbm_total_china', header: 'CBM China', cell: ({ row }) => formatNumber(row.getValue('cbm_total_china'), 2) },
  {
    accessorKey: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      return h('div', { class: 'flex space-x-2' }, [
        h(UButton, {
          size: 'xs',
          icon: 'i-heroicons-eye',
          color: 'info',
          variant: 'ghost',
          onClick: () => handleViewSteps(row.original.id),
        }),
      ])
    },
  },
]

const getColumns = () => {
  switch (props.role) {
    case ROLES.DOCUMENTACION:
      return documentacionColumns
    case ROLES.JEFE_IMPORTACIONES:
      return documentacionColumns
    default:
      return columns
  }
}

const getColorByEstado = (estado: string) => {
  if (!estado) return 'neutral'
  if (estado === 'PENDIENTE') return 'warning'
  if (estado === 'RECIBIENDO') return 'info'
  if (estado === 'COMPLETADO') return 'success'
  return 'neutral'
}

const IDGINO = 28791
const handleViewSteps = (id: number) => {
  const base = props.basePath ?? '/cargaconsolidada/abiertos'
  if (hasRole('ContenedorAlmacen')) {
    navigateTo(`${base}/cotizaciones/${id}?tab=embarque`)
  } else if (currentId.value !== IDGINO && props.role === ROLES.COTIZADOR) {
    navigateTo(`${base}/cotizaciones/${id}?tab=prospectos`)
  } else {
    navigateTo(`${base}/pasos/${id}`)
  }
}

const handleDeleteCarga = async (id: number) => {
  try {
    showConfirmation('¿Estás seguro de querer eliminar esta carga consolidada?', 'Esta acción no se puede deshacer.', async () => {
      await withSpinner(async () => {
        const response = await deleteConsolidado(id)
        if (response.success) {
          showSuccess('Carga consolidada eliminada correctamente', 'La carga consolidada se ha eliminado correctamente.')
        }
        await getConsolidadoData()
      }, 'Eliminando carga consolidada~.')
    })
  } catch (error) {
    showError('Error al eliminar carga consolidada', error as string)
  }
}

const exportClientes = async () => {
  try {
    // placeholder
  } catch (error) {
    console.error('Error al exportar:', error)
  }
}

onMounted(async () => {
  try {
    await getConsolidadoData()
  } catch (error) {
    console.error('Error al cargar datos:', error)
  }
})
</script>
