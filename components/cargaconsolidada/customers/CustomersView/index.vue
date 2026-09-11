<template>
  <div>
    <DataTable
      title="Clientes"
      icon=""
      :data="customers"
      :columns="columns"
      :loading="loading"
      :show-pagination="true"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-records="totalRecords"
      :items-per-page="itemsPerPage"
      :pagination-options="[...CUSTOMERS_PAGINATION_OPTIONS]"
      :search-query-value="search"
      :show-secondary-search="false"
      :show-filters="true"
      :filter-config="filterConfig"
      :filters-value="filters"
      :show-export="false"
      :hide-back-button="true"
      :show-body-top="true"
      empty-state-message="No confirmed customers found."
      @update:primary-search="handleSearch"
      @page-change="handlePageChange"
      @items-per-page-change="handleItemsPerPageChange"
      @filter-change="handleFilterChange"
      @clear-filters="clearFilters"
    >
      <template #body-top>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full mb-2">
          <div
            v-for="card in kpiCards"
            :key="card.key"
            class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 border-t-2 border-t-orange-500"
            :class="card.clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60' : ''"
            @click="card.clickable ? filterByNc() : undefined"
          >
            <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <UIcon :name="card.icon" class="w-4 h-4 text-orange-500" />
              <span>{{ card.label }}</span>
            </div>
            <div class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {{ card.value }}
            </div>
            <p v-if="card.hint" class="mt-1 text-[11px] text-gray-400">
              {{ card.hint }}
            </p>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { UBadge, UButton, UIcon, UInput, USelect } from '#components'
import { useCustomers, CUSTOMERS_PAGINATION_OPTIONS } from '~/composables/cargaconsolidada/customers'
import { useCotizacionProveedor } from '~/composables/cargaconsolidada/useCotizacionProveedor'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { STATUS_BG_CLASSES } from '~/constants/ui'
import type { CustomerProveedor, CustomerRow } from '~/types/cargaconsolidada/customers'
import type { CustomersViewProps } from './types'

defineProps<CustomersViewProps>()

const {
  customers,
  loading,
  search,
  itemsPerPage,
  filters,
  headers,
  filterConfig,
  totalPages,
  totalRecords,
  currentPage,
  getCustomers,
  handleSearch,
  handlePageChange,
  handleItemsPerPageChange,
  handleFilterChange,
  clearFilters,
  filterByNc,
} = useCustomers()

const { updateProveedor, updateProveedorEstado } = useCotizacionProveedor()
const { withSpinner } = useSpinner()
const { showSuccess, showError } = useModal()

const statusOptions = computed(() => {
  const options = filterConfig.value.find((item) => item.key === 'estado_china')?.options ?? []
  return options.map((option) => ({
    ...option,
    class: option.value !== 'todos' ? STATUS_BG_CLASSES[option.value as keyof typeof STATUS_BG_CLASSES] : '',
  }))
})

const kpiCards = computed(() => {
  const cbm = headers.value.cbm_warehouse
  const customersHeader = headers.value.total_customers
  const suppliers = headers.value.total_suppliers_code
  const nc = headers.value.total_nc
  return [
    {
      key: 'cbm_warehouse',
      label: cbm?.label || 'CBM warehouse',
      value: cbm?.value ?? '0',
      icon: cbm?.icon || 'i-heroicons-cube',
      clickable: false,
    },
    {
      key: 'total_customers',
      label: customersHeader?.label || 'Total customers',
      value: customersHeader?.value ?? 0,
      icon: customersHeader?.icon || 'i-heroicons-users',
      clickable: false,
    },
    {
      key: 'total_suppliers_code',
      label: suppliers?.label || 'Total suppliers code',
      value: suppliers?.value ?? 0,
      icon: suppliers?.icon || 'i-heroicons-tag',
      clickable: false,
    },
    {
      key: 'total_nc',
      label: nc?.label || 'Total NC',
      value: nc?.value ?? 0,
      icon: nc?.icon || 'i-heroicons-exclamation-triangle',
      hint: 'Click to filter NC',
      clickable: true,
    },
  ]
})

const dateInputValue = (raw?: string) => {
  if (!raw) return ''
  const value = String(raw)
  if (value.includes('T')) return value.split('T')[0]
  if (value.includes(' ')) return value.split(' ')[0]
  return value
}

const docsPathForRow = (row: CustomerRow) => {
  return row.contenedor_cerrado
    ? '/cargaconsolidada/completados'
    : '/cargaconsolidada/abiertos'
}

const handleUpdateEstado = async (proveedor: CustomerProveedor, estado: string) => {
  try {
    await withSpinner(async () => {
      await updateProveedorEstado({ id: proveedor.id, estado })
      proveedor.estados_proveedor = estado
      showSuccess('Estado actualizado', 'El estado del proveedor se actualizó correctamente.')
      await getCustomers()
    }, 'Actualizando estado...')
  } catch (error) {
    showError('Error', 'No se pudo actualizar el estado del proveedor.')
  }
}

const handleSaveProveedor = async (proveedor: CustomerProveedor) => {
  const formData = new FormData()
  formData.append('id', String(proveedor.id_proveedor || proveedor.id))
  formData.append('qty_box_china', String(proveedor.qty_box_china ?? ''))
  formData.append('qty_pallet_china', String(proveedor.qty_pallet_china ?? 0))
  formData.append('cbm_total_china', String(proveedor.cbm_total_china ?? ''))
  formData.append('peso_china', String(proveedor.peso_china ?? 0))
  formData.append('arrive_date_china', String(proveedor.arrive_date_china ?? ''))
  try {
    await withSpinner(async () => {
      const response = await updateProveedor(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'No se pudo guardar')
      }
      showSuccess('Proveedor actualizado', 'Los datos del proveedor se guardaron correctamente.')
      await getCustomers()
    }, 'Guardando...')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar el proveedor.'
    showError('Error', message)
  }
}

const providerStack = (row: CustomerRow, render: (proveedor: CustomerProveedor) => any) => {
  return h('div', { class: 'flex flex-col gap-2' }, (row.proveedores || []).map(render))
}

const columns: TableColumn<CustomerRow>[] = [
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => providerStack(row.original, (proveedor) => h(USelect as any, {
      items: statusOptions.value,
      placeholder: 'Seleccionar estado',
      modelValue: proveedor.estados_proveedor,
      class: STATUS_BG_CLASSES[proveedor.estados_proveedor as keyof typeof STATUS_BG_CLASSES],
      'onUpdate:modelValue': (value: string) => handleUpdateEstado(proveedor, value),
    })),
  },
  {
    accessorKey: 'n',
    header: 'N.',
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: 'carga',
    header: 'Carga',
    cell: ({ row }) => h('div', { class: 'flex flex-col gap-1 min-w-20' }, [
      h('span', { class: 'font-medium' }, row.original.carga_label || `#${row.original.carga || ''}`),
      row.original.contenedor_cerrado
        ? h(UBadge, { color: 'neutral', variant: 'soft', size: 'xs', label: 'Closed' })
        : null,
    ]),
  },
  {
    accessorKey: 'pais',
    header: 'País',
    cell: ({ row }) => row.original.pais || 'N/A',
  },
  {
    accessorKey: 'nombre',
    header: 'Cliente',
    cell: ({ row }) => h('div', { class: 'w-40 whitespace-normal' }, [
      h('div', { class: 'font-medium' }, String(row.original.nombre || '').toUpperCase()),
      row.original.telefono
        ? h('div', { class: 'text-sm text-gray-500' }, row.original.telefono)
        : null,
    ]),
  },
  {
    accessorKey: 'productos',
    header: 'Productos',
    cell: ({ row }) => providerStack(row.original, (proveedor) => h('div', {
      class: 'products-scroll w-44 max-w-44',
      style: { overflowX: 'auto', overflowY: 'hidden' },
    }, [
      h('span', { class: 'inline-block min-w-max whitespace-nowrap px-2 py-1 text-sm' }, String(proveedor.products || '')),
    ])),
  },
  {
    accessorKey: 'qty_box',
    header: 'Qty Box',
    cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
      modelValue: proveedor.qty_box,
      class: 'w-16',
      disabled: true,
    })),
  },
  {
    accessorKey: 'cbm_total',
    header: 'CBM',
    cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
      modelValue: proveedor.cbm_total,
      class: 'w-20',
      disabled: true,
    })),
  },
  {
    accessorKey: 'peso',
    header: 'Peso',
    cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
      modelValue: proveedor.peso,
      class: 'w-20',
      disabled: true,
    })),
  },
  {
    accessorKey: 'supplier',
    header: 'Proveedor',
    cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
      modelValue: proveedor.supplier,
      class: 'w-28',
      disabled: true,
    })),
  },
  {
    accessorKey: 'code_supplier',
    header: 'Code Supplier',
    cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
      modelValue: proveedor.code_supplier,
      class: 'w-28',
      disabled: true,
    })),
  },
  {
    accessorKey: 'supplier_phone',
    header: 'Tel. proveedor',
    cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
      modelValue: proveedor.supplier_phone,
      class: 'w-32',
      disabled: true,
    })),
  },
  {
    id: 'china_qty_group',
    header: () => h('div', { class: 'flex items-center justify-center gap-2 px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-200' }, [
      h(UIcon, { name: 'flagpack:cn', class: 'w-5 h-4' }),
      h('span', 'Supplier'),
    ]),
    columns: [
      {
        accessorKey: 'qty_box_supplier',
        header: 'QTY Box',
        cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
          modelValue: proveedor.qty_box_china,
          class: 'w-16',
          'onUpdate:modelValue': (value: string) => {
            proveedor.qty_box_china = value
          },
        })),
      },
      {
        accessorKey: 'qty_pallet_supplier',
        header: 'QTY Pallet',
        cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
          modelValue: proveedor.qty_pallet_china ?? 0,
          class: 'w-16',
          'onUpdate:modelValue': (value: string) => {
            proveedor.qty_pallet_china = value
          },
        })),
      },
      {
        accessorKey: 'qty_total_supplier',
        header: 'QTY Total',
        cell: ({ row }) => providerStack(row.original, (proveedor) => {
          const qtyTotal = Number(proveedor.qty_box_china ?? 0) + Number(proveedor.qty_pallet_china ?? 0)
          return h(UInput as any, {
            modelValue: qtyTotal,
            class: 'w-16',
            disabled: true,
          })
        }),
      },
      {
        accessorKey: 'cbm_total_supplier',
        header: 'CBM Total',
        cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
          modelValue: proveedor.cbm_total_china,
          class: 'w-24',
          'onUpdate:modelValue': (value: string) => {
            proveedor.cbm_total_china = value
          },
        })),
      },
      {
        accessorKey: 'peso_china_supplier',
        header: 'Total Weight',
        cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
          modelValue: proveedor.peso_china ?? 0,
          class: 'w-24',
          'onUpdate:modelValue': (value: string) => {
            proveedor.peso_china = value
          },
        })),
      },
      {
        accessorKey: 'arrive_date',
        header: 'Arrive Date',
        cell: ({ row }) => providerStack(row.original, (proveedor) => h(UInput as any, {
          modelValue: dateInputValue(proveedor.arrive_date_china),
          class: 'w-36',
          type: 'date',
          'onUpdate:modelValue': (value: string) => {
            proveedor.arrive_date_china = value
          },
        })),
      },
    ],
  },
  {
    accessorKey: 'actions',
    header: 'Acciones',
    cell: ({ row }) => providerStack(row.original, (proveedor) => h('div', { class: 'flex flex-row gap-1' }, [
      h(UButton, {
        icon: 'i-heroicons-eye',
        variant: 'ghost',
        color: 'info',
        size: 'md',
        onClick: () => {
          navigateTo(`${docsPathForRow(row.original)}/cotizaciones/proveedor/documentacion/${proveedor.id}`)
        },
      }),
      h(UButton, {
        icon: 'material-symbols:save-sharp',
        variant: 'ghost',
        color: 'primary',
        size: 'md',
        onClick: () => handleSaveProveedor(proveedor),
      }),
    ])),
  },
]

onMounted(async () => {
  await getCustomers()
})
</script>
