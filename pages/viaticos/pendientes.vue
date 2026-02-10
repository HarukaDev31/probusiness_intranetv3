<template>
  <div class="md:p-6">
    <DataTable 
      title="Pendientes" 
      :show-title="true" 
      icon="i-heroicons-clock" 
      :data="viaticos" 
      :columns="columns"
      :loading="loading" 
      :current-page="pagination.current_page" 
      :total-pages="pagination.last_page" 
      :total-records="pagination.total"
      :items-per-page="pagination.per_page" 
      :search-query-value="search" 
      :primary-search-value="search"
      :show-primary-search="true" 
      :showPrimarySearchLabel="false" 
      :primary-search-placeholder="'Buscar por asunto o descripción'"
      :show-filters="true" 
      :filter-config="filterConfig" 
      :filters-value="filters" 
      :show-export="false"
      :show-skeleton="true"
      :skeleton-rows="6"
      :skeleton-cols="9"
      :show-new-button="isAdmin"
      new-button-label="Crear viático o reintegro"
      :on-new-button-click="handleNewButtonClick"
      empty-state-message="No se encontraron viáticos pendientes que coincidan con los criterios de búsqueda."
      @update:search-query="handleSearch" 
      @update:primary-search="handleSearch"
      @page-change="handlePageChange" 
      @items-per-page-change="handleItemsPerPageChange" 
      @filter-change="handleFilterChange"
      @update:filters="handleUpdateFilters"
    >
      <template #error-state>
        <ErrorState :message="error || 'Error desconocido'" />
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, h } from 'vue'
import { useViaticos } from '~/composables/useViaticos'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/types/data-table'
import { UButton, UBadge } from '#components'
import { formatDateTimeToDmy, formatCurrency } from '~/utils/formatters'
import { ROLES } from '~/constants/roles'
import EvidenciasModal from '~/components/viaticos/EvidenciasModal.vue'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import CreateViaticoModal from '~/components/viaticos/CreateViaticoModal.vue'
import type { FileItem } from '~/types/commons/file'
import type { ViaticoPago, CreateViaticoRequest } from '~/types/viatico'

const { viaticos, loading, error, pagination, loadPendientes, createViatico, getStatusColor, getStatusLabel } = useViaticos()
const { hasRole } = useUserRole()
const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()
const overlay = useOverlay()
const evidenciasModal = overlay.create(EvidenciasModal)
const modalPreview = overlay.create(ModalPreview)
const createViaticoModal = overlay.create(CreateViaticoModal)

const search = ref('')
const filters = ref<Record<string, any>>({})

// Verificar que sea administración
const isAdmin = computed(() => hasRole(ROLES.ADMINISTRACION))

if (!isAdmin.value) {
  navigateTo('/viaticos')
}

const handleNewButtonClick = () => {
  if (!isAdmin.value) return
  createViaticoModal.open({
    onClose: () => createViaticoModal.close(),
    onSave: async (data: CreateViaticoRequest) => {
      try {
        await withSpinner(async () => {
          await createViatico(data)
          showSuccess('Viático creado', 'El viático ha sido creado exitosamente')
          createViaticoModal.close()
          await loadPendientes({
            page: pagination.value.current_page,
            per_page: pagination.value.per_page,
            search: search.value,
            ...filters.value
          })
        })
      } catch (err: any) {
        showError('Error al crear viático', err.message || 'Error desconocido')
      }
    }
  })
}

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }: { row: any }) => row.index + 1
  },
  {
    accessorKey: 'subject',
    header: 'Asunto',
    cell: ({ row }: { row: any }) => row.original.subject
  },
  {
    accessorKey: 'reimbursement_date',
    header: 'Fecha Reintegro',
    cell: ({ row }: { row: any }) => formatDateTimeToDmy(row.original.reimbursement_date)
  },
  {
    accessorKey: 'return_date',
    header: 'Fecha de devolución',
    cell: ({ row }: { row: any }) => formatDateTimeToDmy(row.original.return_date)
  },
  {
    accessorKey: 'requesting_area',
    header: 'Área Solicitante',
    cell: ({ row }: { row: any }) => row.original.requesting_area
  },
  {
    accessorKey: 'nombre_usuario',
    header: 'Solicitante',
    cell: ({ row }: { row: any }) => row.original.nombre_usuario || 'N/A'
  },
  {
    accessorKey: 'total_amount',
    header: 'Monto',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.total_amount, 'PEN')
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      const status = row.original.status
      return h(UBadge, {
        color: getStatusColor(status) as 'primary' | 'success' | 'error' | 'warning' | 'neutral' | 'info' | 'secondary' | 'transparent',
        variant: 'subtle',
        label: getStatusLabel(status)
      })
    }
  },
  {
    accessorKey: 'receipt_file',
    header: 'Comprobante',
    cell: ({ row }: { row: any }) => {
      const pagos: ViaticoPago[] = row.original.pagos || []
      const urlComprobante = row.original.url_comprobante

      if (pagos.length > 0) {
        return h('div', { class: 'flex items-center gap-2' }, [
          h(UBadge, {
            color: 'primary' as const,
            variant: 'soft',
            size: 'xs',
            label: `${pagos.length} ${pagos.length === 1 ? 'comprobante' : 'comprobantes'}`
          }),
          h(UButton, {
            icon: 'i-heroicons-eye',
            size: 'xs',
            color: 'primary',
            variant: 'ghost',
            label: 'Ver',
            onClick: () => {
              evidenciasModal.open({
                pagos,
                subject: row.original.subject
              })
            }
          })
        ])
      }
      if (urlComprobante) {
        return h(UButton, {
          icon: 'i-heroicons-eye',
          size: 'xs',
          color: 'primary',
          variant: 'ghost',
          onClick: () => {
            const fileItem: FileItem = {
              id: 0,
              file_name: String(urlComprobante).split('/').pop() || 'Comprobante',
              file_url: urlComprobante,
              type: 'image',
              size: 0,
              lastModified: 0,
              file_ext: 'jpg'
            }
            modalPreview.open({ file: fileItem, isOpen: true })
          }
        })
      }
      return h('span', { class: 'text-gray-500 dark:text-gray-400 text-sm' }, 'Sin comprobante')
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      return h(UButton, {
        icon: 'i-heroicons-pencil',
        size: 'xs',
        color: 'primary',
        variant: 'ghost',
        onClick: () => { void navigateTo(`/viaticos/${row.original.id}`) }
      })
    }
  }
]

const handleSearch = (val: string) => {
  search.value = val
}

const handlePageChange = (page: number) => {
  loadPendientes({
    page,
    per_page: pagination.value.per_page,
    search: search.value,
    ...filters.value
  })
}

const handleItemsPerPageChange = (itemsPerPage: number) => {
  loadPendientes({
    page: 1,
    per_page: itemsPerPage,
    search: search.value,
    ...filters.value
  })
}

// DataTable may emit either:
// - ('filter-change', key, value) for single filter changes, OR
// - ('update:filters', filtersObject) when clearing/updating all filters.
const handleFilterChange = (arg1: any, arg2?: any) => {
  // case: filter-change with key + value
  if (typeof arg1 === 'string' && arg2 !== undefined) {
    filters.value = { ...(filters.value || {}), [arg1]: arg2 }
    return
  }

  // case: parent emitted a full filters object accidentally
  if (arg1 && typeof arg1 === 'object') {
    filters.value = arg1
    return
  }
}

const handleUpdateFilters = (newFilters: Record<string, any>) => {
  filters.value = newFilters || {}
}

// Configuración de filtros
const filterConfig = computed<FilterConfig[]>(() => [
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
    key: 'area_solicitante',
    label: 'Área Solicitante',
    type: 'select',
    placeholder: 'Seleccionar área solicitante',
    options: [
      { label: 'Ventas', value: 'Ventas' },
      { label: 'Marketing', value: 'Marketing' },
      { label: 'Administración', value: 'Administración' },
      { label: 'Finanzas', value: 'Finanzas' },
      { label: 'Otros', value: 'Otros' }
    ]
  }
])

// Watchers
watch([search, filters], () => {
  loadPendientes({
    page: 1,
    per_page: pagination.value.per_page,
    search: search.value,
    ...filters.value
  })
}, { deep: true })

onMounted(() => {
  loadPendientes({
    page: 1,
    per_page: 10
  })
})
</script>
