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
      :previous-page-url="`/cargaconsolidada/abiertos/pasos/${id}`"
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
      :previous-page-url="`/cargaconsolidada/abiertos/pasos/${id}`"
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
      :previous-page-url="`/cargaconsolidada/abiertos/pasos/${id}`"
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

// Tabs
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

// Columnas para Clientes (según imagen)
const clientesColumns = ref<TableColumn<any>[]>([
  { accessorKey: 'nro', 
    header: 'N.', 
    cell: ({ row }) => row.index + 1 },
  { accessorKey: 'nombre', 
    header: 'Nombre', 
    cell: ({ row }) => row.original.nombre?.toUpperCase?.() || row.original.nombre },
  { accessorKey: 'documento', 
    header: 'DNI' },
  { accessorKey: 'telefono', 
    header: 'Whatsapp' },
  { accessorKey: 'name', 
    header: 'T. Cliente', 
    cell: ({ row }) => row.original.name || row.original.tipo_cliente || '—' },
  { accessorKey: 'tipo_entrega', 
    header: 'T. Entrega', 
    cell: ({ row }) => row.original.tipo_entrega || '—'
  },
  { accessorKey: 'registrado', 
    header: 'Registrado', 
    cell: ({ row }) => h(UBadge, { 
      label: row.original.registrado ? 'Si' : 'No', 
      color: row.original.registrado ? 'success' : 'neutral',
      variant: 'outline'
    }) 
  },
  { accessorKey: 'entregado', 
    header: 'Entregado', 
    cell: ({ row }) => h(UBadge, { 
      label: row.original.entregado ? 'Si' : 'No', 
      color: row.original.entregado ? 'success' : 'neutral',
      variant: 'outline'
    }) 
  },
  { accessorKey: 'estado_pago', 
    header: 'Estado', 
    cell: ({ row }) => h(UBadge, { 
      label: row.original.estado_pago || 'Pendiente', 
      color: (row.original.estado_pago || 'Pendiente') === 'Pagado' ? 'success' : 'secondary',
      variant: 'soft'
    }) 
  },
  { id: 'actions', 
    header: 'Accion', 
    cell: ({ row }) => h('div', { class: 'flex gap-2' }, 
    [h(UButton, 
      { size: 'xs', 
        icon: 'i-heroicons-paper-airplane', 
        variant: 'ghost', 
        color: 'info', 
        title: 'Enviar Mensaje', 
        onClick: () => handleEnviarMensaje(row.original) 
      })
    ]) }
])

// Columnas para Entregas (según especificación del usuario)
// Campos: N, Nombre, Whatsapp, Cbm, Bultos, Entrega, Ciudad, Ruc o Dni, Razon social o Nombre, Fecha, Hora, Estado, Accion
// Notas:
// - Cbm y Bultos: provienen del packing list (placeholder hasta integrar backend real)
// - Entrega (tipo_entrega) ya existe
// - Ciudad: usamos row.original.ciudad (placeholder) o '—'
// - Fecha / Hora: se derivan de fecha_programada (split) si viene en formato 'YYYY-MM-DD HH:mm' u otro similar
// - Estado: usamos estado_entrega / entregado para mostrar badge
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
      // Intentamos parsear fecha (soporta 'YYYY-MM-DD HH:mm' o ISO)
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
  h(UButton, { size: 'xs', icon: 'i-heroicons-eye', variant: 'ghost', color: 'neutral', title: 'Ver detalle', onClick: async () => { await navigateTo(`/cargaconsolidada/abiertos/entrega/clientes/${row.original.id_cotizacion}`) } }),
      h(UButton, { size: 'xs', icon: 'i-heroicons-pencil-square', variant: 'ghost', color: 'primary', title: 'Editar / Programar', onClick: () => handleProgramarEntrega(row.original) }),
      h(UButton, { size: 'xs', icon: 'i-heroicons-trash', variant: 'ghost', color: 'error', title: 'Eliminar registro', onClick: () => handleEliminarRegistro(row.original) })
    ]) }
])

const handleProgramarEntrega = async (row: any) => {
  // TODO: abrir modal para programar fecha/hora
}
const handleMarcarEntregado = async (row: any) => {
  // TODO: consumir service para marcar ENTREGADO
}
const handleEliminarRegistro = async (row: any) => {
  // TODO: Confirmación y eliminación lógica (soft delete) si aplica
  console.log('Eliminar registro entrega', row.id_cotizacion)
}
const handleEnviarMensaje = (row: any) => {
  // TODO: Implementar integración con WhatsApp / generación de link
  console.log('Enviar mensaje a', row.telefono)
}

onMounted(async () => {
  handleTabChange(tabs[0].value)
})
watch(activeTab, async (newVal) => {
  if (newVal && newVal !== '') {
    try {
            if (newVal === 'clientes') {
              await getClientes(id)
            } else if (newVal === 'entregas') {
              await getEntregas(id)
            } else if (newVal === 'delivery') {
              // Acción para la pestaña Delivery si es necesario
            }
            await getHeaders(Number(id))
    } catch (error) {
      console.error('Error al cambiar de pestaña:', error)
    }
  }
}, { immediate: true })
</script>
