<template>
  <div class="md:p-6">
    <DataTable 
      title="Mis viáticos y reintegros" 
      :show-title="true" 
      icon="i-heroicons-banknotes" 
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
      :skeleton-cols="8"
      empty-state-message="No se encontraron viáticos que coincidan con los criterios de búsqueda."
      :show-new-button="isDesktop" 
      new-button-label="Crear viático o reintegro" 
      :on-new-button-click="handleNewButtonClick"
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
import { useIsDesktop } from '~/composables/useResponsive'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/types/data-table'
import { UButton, UBadge } from '#components'
import { formatDateTimeToDmy, formatCurrency } from '~/utils/formatters'
import { STATUS_BG_CLASSES } from '~/constants/ui'
import CreateViaticoModal from '~/components/viaticos/CreateViaticoModal.vue'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import type { CreateViaticoRequest } from '~/types/viatico'
import type { FileItem } from '~/types/commons/file'

const { viaticos, loading, error, pagination, loadViaticos, createViatico, updateViatico, getStatusColor, getStatusLabel, formatAmount, deleteViatico } = useViaticos()
const { hasRole } = useUserRole()
const { isDesktop } = useIsDesktop()
const { showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()

const search = ref('')
const filters = ref<Record<string, any>>({})

// Overlay para el modal de creación
const overlay = useOverlay()
const createViaticoModal = overlay.create(CreateViaticoModal)
const modalPreview = overlay.create(ModalPreview)

const handleNewButtonClick = () => {
  createViaticoModal.open({
    onClose: () => createViaticoModal.close(),
    onSave: async (data: CreateViaticoRequest) => {
      try {
        await withSpinner(async () => {
          await createViatico(data)
          showSuccess('Viático creado', 'El viático ha sido creado exitosamente')
          createViaticoModal.close()
          await loadViaticos({
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
    cell: ({ row }: { row: any }) => formatDateTimeToDmy(row.original.return_date)||'N/A'
  },
  {
    accessorKey: 'requesting_area',
    header: 'Área Solicitante',
    cell: ({ row }: { row: any }) => row.original.requesting_area
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
    header: 'Evidencia',
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
              file_name: row.original.url_comprobante,
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
      return 'Sin evidencia'
    }
  },
  {
    accessorKey: 'payment_receipt_file',
    header: 'Retribución',
    cell: ({ row }: { row: any }) => {
      if (row.original.url_payment_receipt) {
        return h(UButton, {
          icon: 'i-heroicons-eye',
          size: 'xs',
          color: 'primary',
          variant: 'ghost',
          onClick: () => {
            const fileItem: FileItem = {
              id: 0,
              file_name: row.original.url_payment_receipt,
              file_url: row.original.url_payment_receipt,
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
      return '-'
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      return h('div', { class: 'flex gap-2' }, [
        // Ver detalles
        h(UButton, {
          icon: 'i-heroicons-eye',
          size: 'xs',
          color: 'primary',
          variant: 'ghost',
          onClick: (event: MouseEvent) => { navigateTo(`/viaticos/${row.original.id}`) }
        }),
        // Editar (abrir modal en modo edición)
        h(UButton, {
          icon: 'i-heroicons-pencil',
          size: 'xs',
          color: 'primary',
          variant: 'ghost',
          onClick: () => {
            createViaticoModal.open({
              initialData: {
                subject: row.original.subject,
                reimbursement_date: row.original.reimbursement_date,
                requesting_area: row.original.requesting_area,
                expense_description: row.original.expense_description,
                total_amount: row.original.total_amount
              },
              mode: 'edit',
              onClose: () => createViaticoModal.close(),
              onSave: async (data: CreateViaticoRequest) => {
                try {
                  await withSpinner(async () => {
                    await updateViatico(row.original.id, data)
                    showSuccess('Viático actualizado', 'El viático ha sido actualizado exitosamente')
                    createViaticoModal.close()
                    await loadViaticos({
                      page: pagination.value.current_page,
                      per_page: pagination.value.per_page,
                      search: search.value,
                      ...filters.value
                    })
                  })
                } catch (err: any) {
                  showError('Error al actualizar viático', err.message || 'Error desconocido')
                }
              }
            })
          }
        }),
        // Borrar
        h(UButton, {
          icon: 'i-heroicons-trash',
          size: 'xs',
          color: 'error',
          variant: 'ghost',
          onClick: async () => {
            const confirmed = confirm('¿Está seguro que desea eliminar este viático?')
            if (!confirmed) return
            try {
              await withSpinner(async () => {
                await deleteViatico(row.original.id)
                showSuccess('Viático eliminado', 'El viático ha sido eliminado exitosamente')
                await loadViaticos({
                  page: pagination.value.current_page,
                  per_page: pagination.value.per_page,
                  search: search.value,
                  ...filters.value
                })
              })
            } catch (err: any) {
              showError('Error al eliminar viático', err.message || 'Error desconocido')
            }
          }
        })
      ])
    }
  }
]

const handleSearch = (val: string) => {
  search.value = val
}

const handlePageChange = (page: number) => {
  loadViaticos({
    page,
    per_page: pagination.value.per_page,
    search: search.value,
    ...filters.value
  })
}

const handleItemsPerPageChange = (itemsPerPage: number) => {
  loadViaticos({
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
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    options: [
      { label: 'Todos', value: 'todos' },
      { label: 'Pendiente', value: 'PENDING' },
      { label: 'Confirmado', value: 'CONFIRMED' },
      { label: 'Rechazado', value: 'REJECTED' }
    ]
  }
])

// Watchers
watch([search, filters], () => {
  loadViaticos({
    page: 1,
    per_page: pagination.value.per_page,
    search: search.value,
    ...filters.value
  })
}, { deep: true })

onMounted(() => {
  loadViaticos({
    page: 1,
    per_page: 10
  })
})
</script>
