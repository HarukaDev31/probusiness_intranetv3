<template>
  <div class="p-6">
    <DataTable
      v-if="activeTab==='clientes'"
      title=""
      :data="clientes"
      :columns="clientesColumns"
      :loading="loading"
      icon=""
      :show-pagination="false"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-records="totalRecords"
      :items-per-page="itemsPerPage"
      :search-query-value="search"
      :show-secondary-search="false"
      :show-filters="true"
      :filter-config="filterConfig"
      :show-export="false"
      empty-state-message="No se encontraron registros de entrega."
      @update:primary-search="handleSearch"
      @page-change="handlePageChange"
      @items-per-page-change="handleItemsPerPageChange"
      @filter-change="handleFilterChange"
      :hide-back-button="false"
      :show-primary-search="true"
      :show-body-top="true"
      :previous-page-url="`/cargaconsolidada/completados/pasos/${id}`"
    >
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Entregas #${carga}`" :headers="headers" :loading="loadingHeaders" />
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-4 w-80 h-15" />
        </div>
      </template>
    </DataTable>
    <DataTable
      v-if="activeTab==='entregas'"
      title=""
      :data="entregas"
      :columns="entregasColumns"
      :loading="loading"
      icon=""
      :show-pagination="false"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-records="totalRecords"
      :items-per-page="itemsPerPage"
      :search-query-value="search"
      :show-secondary-search="false"
      :show-filters="false"
      :filter-config="filterConfig"
      :show-export="false"
      empty-state-message="No se encontraron registros de entrega."
      @update:primary-search="handleSearch"
      @page-change="handlePageChange"
      @items-per-page-change="handleItemsPerPageChange"
      @filter-change="handleFilterChange"
      :hide-back-button="false"
      :show-primary-search="false"
      :show-body-top="true"
      :previous-page-url="`/cargaconsolidada/completados/pasos/${id}`"
    >
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Entregas #${carga}`" :headers="headers" :loading="loadingHeaders" />
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-4 w-80 h-15" />
        </div>
      </template>
    </DataTable>
    <DataTable
      v-if="activeTab==='delivery'"
      title=""
      :data="[]"
      :columns="[]"
      :loading="false"
      icon=""
      :show-pagination="false"
      :hide-back-button="false"
      :show-primary-search="false"
      :show-body-top="true"
      :previous-page-url="`/cargaconsolidada/completados/pasos/${id}`"
    >
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Delivery #${carga}`" :headers="headers" :loading="loadingHeaders" />
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-4 w-80 h-15" />
          <div class="text-sm text-gray-500">Contenido pendiente.</div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import SectionHeader from '../../../../components/commons/SectionHeader.vue'
import { useEntrega } from '../../../../composables/cargaconsolidada/entrega/useEntrega'
import { useUserRole } from '../../../../composables/auth/useUserRole'
import { UBadge, UButton, UTabs } from '#components'

const route = useRoute()
const id = Number(route.params.id)
const { currentRole, currentId } = useUserRole()

const { 
  entregas,
  clientes,
  loading,
  error,
  pagination,
  search,
  itemsPerPage,
  totalPages,
  totalRecords,
  currentPage,
  filters,
  filterConfig,
  getEntregas,
  getClientes,
  clientesFilterConfig,
  marcarRegistrado,
  marcarEntregadoCliente,
  handleSearch,
  handlePageChange,
  handleItemsPerPageChange,
  handleFilterChange,
  headers,
  carga,
  loadingHeaders,
  getHeaders
} = useEntrega()

const activeTab = ref('clientes')
const tabs = [
  { value: 'clientes', label: 'Clientes' },
  { value: 'entregas', label: 'Entregas' },
  { value: 'delivery', label: 'Delivery' }
]
const handleTabChange = (value: string) => {
  if (value === 'clientes') {
    getClientes(id)
  } else if (value === 'entregas') {
    getEntregas(id)
  } else if (value === 'delivery') {
    // Acción para la pestaña Delivery si es necesario
  }
}
const clientesColumns = ref<TableColumn<any>[]>([
  { accessorKey: 'nro', 
    header: 'N.', 
    cell: ({ row }) => row.index + 1 
  },
  { accessorKey: 'nombre', 
    header: 'Nombre', 
    cell: ({ row }) => row.original.nombre?.toUpperCase?.() || row.original.nombre 
  },
  { accessorKey: 'documento', 
    header: 'DNI' 
  },
  { accessorKey: 'telefono', 
    header: 'Whatsapp' 
  },
  { accessorKey: 'name', 
    header: 'T. Cliente', 
    cell: ({ row }) => row.original.name || row.original.tipo_cliente || '—' 
  },
  { accessorKey: 'tipo_entrega', 
    header: 'T. Entrega', 
    cell: ({ row }) => h(UBadge, { label: row.original.tipo_entrega || '—', color: row.original.tipo_entrega === 'Lima' ? 'primary' : (row.original.tipo_entrega ? 'warning' : 'neutral') }) 
  },
  { accessorKey: 'registrado', 
    header: 'Registrado', 
    cell: ({ row }) => h(UBadge, { label: row.original.registrado ? 'Si' : 'No', color: row.original.registrado ? 'success' : 'neutral' }) 
  },
  { accessorKey: 'entregado', 
    header: 'Entregado', 
    cell: ({ row }) => h(UBadge, { label: row.original.entregado ? 'Si' : 'No', color: row.original.entregado ? 'success' : 'neutral' }) 
  },
  { accessorKey: 'estado_pago', 
    header: 'Estado', 
    cell: ({ row }) => h(UBadge, { label: row.original.estado_pago || 'Pendiente', color: (row.original.estado_pago || 'Pendiente') === 'Pagado' ? 'success' : 'warning' }) 
  },
  { id: 'actions', 
    header: 'Accion', 
    cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
      h(UButton, { size: 'xs', 
                   icon: 'i-heroicons-paper-airplane', 
                   variant: 'ghost', 
                   color: 'info', 
                   title: 'Enviar Mensaje', 
                   onClick: () => handleEnviarMensaje(row.original) 
                 })
    ]) }
])
// Columnas actualizadas para Entregas (completados) – mismas que en 'abiertos'
const entregasColumns = ref<TableColumn<any>[]>([
  { accessorKey: 'nro', header: 'N', cell: ({ row }) => row.index + 1 },
  { accessorKey: 'nombre', header: 'Nombre', cell: ({ row }) => row.original.nombre || '—' },
  { accessorKey: 'telefono', header: 'Whatsapp', cell: ({ row }) => row.original.telefono || '—' },
  { accessorKey: 'cbm', header: 'Cbm', cell: ({ row }) => row.original.cbm ?? '—' },
  { accessorKey: 'bultos', header: 'Bultos', cell: ({ row }) => row.original.bultos ?? '—' },
  { accessorKey: 'tipo_entrega', header: 'Entrega', cell: ({ row }) => row.original.tipo_entrega || '—' },
  { accessorKey: 'ciudad', header: 'Ciudad', cell: ({ row }) => row.original.ciudad || row.original.distrito || '—' },
  { accessorKey: 'documento', header: 'Ruc o Dni', cell: ({ row }) => row.original.documento || '—' },
  { accessorKey: 'razon_social', header: 'Razon social o Nombre', cell: ({ row }) => row.original.razon_social || row.original.nombre || '—' },
  { accessorKey: 'fecha_programada', header: 'Fecha', cell: ({ row }) => {
      const fp = row.original.fecha_programada
      if (!fp) return '—'
      const date = fp.includes(' ') ? fp.split(' ')[0] : fp.split('T')[0]
      return date || '—'
    } },
  { id: 'hora_programada', header: 'Hora', cell: ({ row }) => {
      const fp = row.original.fecha_programada
      if (!fp) return '—'
      if (fp.includes(' ')) return fp.split(' ')[1] || '—'
      if (fp.includes('T')) return (fp.split('T')[1] || '').substring(0,5) || '—'
      return '—'
    } },
  { id: 'estado', header: 'Estado', cell: ({ row }) => {
      const estado = row.original.estado_entrega || (row.original.entregado ? 'ENTREGADO' : 'PENDIENTE')
      const color = estado === 'ENTREGADO' ? 'success' : estado === 'PROGRAMADA' ? 'warning' : 'neutral'
      return h(UBadge, { label: estado, color, variant: 'soft' })
    } },
  { id: 'accion', header: 'Accion', cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
      h(UButton, { size: 'xs', icon: 'i-heroicons-eye', variant: 'ghost', color: 'neutral', title: 'Ver detalle', onClick: async () => { await navigateTo(`/cargaconsolidada/completados/entrega/clientes/${row.original.id_cotizacion}`) } }),
      h(UButton, { size: 'xs', icon: 'i-heroicons-trash', variant: 'ghost', color: 'error', title: 'Eliminar registro', onClick: () => handleEliminarRegistro(row.original) })
    ]) }
])

const handleProgramarEntrega = async (row: any) => {}
const handleMarcarEntregado = async (row: any) => {}
const handleEnviarMensaje = (row: any) => { console.log('Enviar mensaje a', row.telefono) }
const handleEliminarRegistro = (row: any) => { console.log('Eliminar registro completado', row.id_cotizacion) }

onMounted(async () => {
  handleTabChange(tabs[0].value)
})

watch(activeTab, (newVal) => {
  if (newVal && newVal !== '') {
    try {
            if (newVal === 'clientes') {
              getClientes(id)
            } else if (newVal === 'entregas') {
              getEntregas(id)
            } else if (newVal === 'delivery') {
              // Acción para la pestaña Delivery si es necesario
            }
    } catch (error) {
      console.error('Error al cambiar de pestaña:', error)
    }
  }
}, { immediate: true })
</script>