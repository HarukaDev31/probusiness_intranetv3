<template>
  <div class="md:p-6">
    <DataTable 
      title="Viáticos Completados" 
      :show-title="true" 
      icon="i-heroicons-check-circle" 
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
      empty-state-message="No se encontraron viáticos completados que coincidan con los criterios de búsqueda."
      @update:search-query="handleSearch" 
      @update:primary-search="handleSearch"
      @page-change="handlePageChange" 
      @items-per-page-change="handleItemsPerPageChange" 
      @filter-change="handleFilterChange"
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
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/types/data-table'
import { UButton, UBadge } from '#components'
import { formatDateTimeToDmy, formatCurrency } from '~/utils/formatters'
import { ROLES } from '~/constants/roles'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import type { FileItem } from '~/types/commons/file'

const { viaticos, loading, error, pagination, loadCompletados, getStatusColor, getStatusLabel } = useViaticos()
const { hasRole } = useUserRole()
const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)

const search = ref('')
const filters = ref<Record<string, any>>({})

// Verificar que sea administración
const isAdmin = computed(() => hasRole(ROLES.ADMINISTRACION))

if (!isAdmin.value) {
  navigateTo('/viaticos')
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
        color: getStatusColor(status),
        variant: 'subtle',
        label: getStatusLabel(status)
      })
    }
  },
  {
    accessorKey: 'receipt_file',
    header: 'Comprobante',
    cell: ({ row }: { row: any }) => {
      if (row.original.url_comprobante) {
        return h(UButton, {
          icon: 'i-heroicons-eye',
          size: 'xs',
          color: 'primary',
          variant: 'ghost',
          onClick: () => {
            const fileItem: FileItem = {
              id: 0,
              file_name: 'Comprobante',
              file_url: row.original.url_comprobante,
              type: 'image',
              size: 0,
              lastModified: 0,
              file_ext: 'jpg'
            }
            modalPreview.open({
              file: fileItem,
              isOpen: true
            })
          }
        })
      }
      return 'Sin comprobante'
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      return h(UButton, {
        icon: 'i-heroicons-eye',
        size: 'xs',
        color: 'primary',
        variant: 'ghost',
        onClick: () => navigateTo(`/viaticos/${row.original.id}`)
      })
    }
  }
]

const handleSearch = (val: string) => {
  search.value = val
}

const handlePageChange = (page: number) => {
  loadCompletados({
    page,
    per_page: pagination.value.per_page,
    search: search.value,
    ...filters.value
  })
}

const handleItemsPerPageChange = (itemsPerPage: number) => {
  loadCompletados({
    page: 1,
    per_page: itemsPerPage,
    search: search.value,
    ...filters.value
  })
}

const handleFilterChange = (newFilters: Record<string, any>) => {
  filters.value = newFilters
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
  }
])

// Watchers
watch([search, filters], () => {
  loadCompletados({
    page: 1,
    per_page: pagination.value.per_page,
    search: search.value,
    ...filters.value
  })
}, { deep: true })

onMounted(() => {
  loadCompletados({
    page: 1,
    per_page: 10
  })
})
</script>
