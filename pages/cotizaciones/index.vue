<template>
  <div class="p-6">

    <DataTable title="Cotizaciones" :show-title="true" icon="i-heroicons-users" :data="cotizaciones" :columns="columns"
      :loading="loading" :current-page="currentPage" :total-pages="totalPages" :total-records="totalRecords"
      :items-per-page="itemsPerPage" :search-query-value="search" :primary-search-value="search"
      :show-primary-search="true" :showPrimarySearchLabel="false" :primary-search-placeholder="'Buscar por'"
      :show-filters="true" :filter-config="filterConfig" :filters-value="filters" :show-export="true" :show-headers="true" :headers="headers"
      empty-state-message="No se encontraron cotizaciones que coincidan con los criterios de búsqueda."
      :show-new-button="true" new-button-label="Crear Cotización" :on-new-button-click="handleNewButtonClick"
      @update:search-query="handleSearch" @update:primary-search="handleSearch" @page-change="handlePageChange"
      @items-per-page-change="handleItemsPerPageChange" @filter-change="handleFilterChange">


      <template #error-state>
        <ErrorState :message="error || 'Error desconocido'" />
      </template>
    </DataTable>
  </div>
</template>
<script setup lang="ts">
import { useCalculadoraImportacion } from '~/composables/useCalculadoraImportacion'
const { cotizaciones, loading, error, pagination, headers, search, itemsPerPage, totalPages, totalRecords, currentPage, filters, filterOptions, handleSearch, handlePageChange, handleItemsPerPageChange, handleFilterChange, getCotizaciones, estadoCotizaciones, deleteCotizacionCalculadora, duplicateCotizacionCalculadora, changeEstadoCotizacionCalculadora } = useCalculadoraImportacion()
import type { TableColumn } from '@nuxt/ui'
import { UButton, USelect } from '#components'
import MoveCotizacionModal from '~/components/cargaconsolidada/MoveCotizacionModal.vue'
import { useModal } from '~/composables/commons/useModal';
import { useSpinner } from '~/composables/commons/useSpinner';
import type { FilterConfig } from '~/types/data-table'
const { showSuccess, showConfirmation, showError } = useModal()
const overlay = useOverlay()
const moveCotizacionModal = overlay.create(MoveCotizacionModal)
const { withSpinner } = useSpinner()
const handleNewButtonClick = () => {
  navigateTo('/cotizaciones/crear')
}
const columns: TableColumn<any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }: { row: any }) => formatDateTimeToDmy(row.original.created_at)
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }: { row: any }) => row.original.nombre_cliente
  },
  {
    accessorKey: 'dni',
    header: 'DNI',
    cell: ({ row }: { row: any }) => row.original.dni_cliente
  },
  {
    accessorKey: 'whatsapp',
    header: 'WhatsApp',
    cell: ({ row }: { row: any }) => row.original.whatsapp_cliente
  },
  {
    accessorKey: 'volumen',
    header: 'Volumen',
    cell: ({ row }: { row: any }) => row.original.totales.total_cbm
  },
  {
    accessorKey: 'qty_item',
    header: 'Qty Item',
    cell: ({ row }: { row: any }) => row.original.totales.total_productos
  },
  {
    accessorKey: 'fob',
    header: 'Fob',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.total_fob)
  },
  {
    accessorKey: 'logistica',
    header: 'Logistica',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.logistica)
  },
  {
    accessorKey: 'impuesto',
    header: 'Impuesto',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.total_impuestos)
  },
  {
    accessorKey: 'tarifa',
    header: 'Tarifa',
    cell: ({ row }: { row: any }) => formatCurrency(row.original.tarifa)
  },
  {
    accessorKey: 'campania',
    header: 'Campaña',
    cell: ({ row }: { row: any }) => `${row.original.contenedor?.carga ? `Contenedor #${row.original.contenedor?.carga}` : ''}`
  },
  {
    accessorKey: 'cotizacion',
    header: 'Cotizacion',
    cell: ({ row }: { row: any }) => {
      //div with button to download the cotizacion
      return (h('div', [
        row.original.url_cotizacion ? h(UButton, {
          color: 'success',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-arrow-down-tray',
          label: '',
          onClick: (event: MouseEvent) => {
            window.open(row.original.url_cotizacion, '_blank')
          }
        }) : null,
        row.original.url_cotizacion_pdf ? h(UButton, {
          color: 'error',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-arrow-down-tray',
          label: '',
          onClick: (event: MouseEvent) => {
            window.open(row.original.url_cotizacion_pdf, '_blank')
          }
        }) : null,
      ]))
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      //RETURN USelect with options from estadoCotizaciones
      return h(USelect as any, {
        items: estadoCotizaciones.value.filter((item: any) => item.showOptions),
        modelValue: row.original.estado,
        'onUpdate:modelValue': (value: string) => {
          handleEstadoChange(row.original.id, value)
        }
      })
    }
  },

  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      //options delete, edit.duplicate,send
      return h('div', [
        h(UButton, {
          color: 'error',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-trash',
          label: '',
          onClick: (event: MouseEvent) => {
            handleDelete(row.original.id)
          }
        }),
        h(UButton, {
          color: 'warning',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-pencil',
          label: '',
          onClick: (event: MouseEvent) => {
            handleEdit(row.original.id)
          }
        }),
        h(UButton, {
          color: 'secondary',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-arrow-path',
          label: '',
          onClick: (event: MouseEvent) => {
            handleDuplicate(row.original.id)
          }
        }),
        h(UButton, {
          color: 'success',
          size: 'sm',
          variant: 'ghost',
          icon: 'i-heroicons-envelope',
          label: '',
          onClick: (event: MouseEvent) => {
            handleSend(row.original.id)
          }
        })
      ])
    }
  }
]
const handleEstadoChange = (id: string, value: string) => {
  showConfirmation('Cambiar Estado de Cotización', '¿Estás seguro de que deseas cambiar el estado de esta cotización?',
    async () => {
      await withSpinner(async () => {
        try {
          const result = await changeEstadoCotizacionCalculadora(Number(id), value)
          if (result.success) {
            showSuccess('Estado de cotización cambiado correctamente', 'El estado de la cotización ha sido cambiado correctamente')
            await getCotizaciones()
          } else {
            showError('Error al cambiar el estado de la cotización', 'Error al cambiar el estado de la cotización')
          }
        } catch (error) {
          showError('Error al cambiar el estado de la cotización', 'Error al cambiar el estado de la cotización')
        }
      })
    },
    () => {
      
    }
  )
}
const handleDelete = (id: string) => {
  showConfirmation('Eliminar Cotización', '¿Estás seguro de que deseas eliminar esta cotización?',
    async () => {
      try {
        await withSpinner(async () => {
          const result = await deleteCotizacionCalculadora(Number(id))
          if (result.success) {
            showSuccess('Cotización eliminada correctamente', 'La cotización ha sido eliminada correctamente')
            await getCotizaciones()
          } else {
            showError('Error al eliminar la cotización', 'Error al eliminar la cotización')
          }
        })
      } catch (error) {
        showError('Error al eliminar la cotización', 'Error al eliminar la cotización')
      }
    },
    () => {
      
    }
  )
}
const handleEdit = (id: string) => {
  
}
const handleDuplicate = (id: string) => {
  showConfirmation('Duplicar Cotización', '¿Estás seguro de que deseas duplicar esta cotización?',
    async () => {
      await withSpinner(async () => {
        const result = await duplicateCotizacionCalculadora(Number(id))
        if (result.success) {
          showSuccess('Cotización duplicada correctamente', 'La cotización ha sido duplicada correctamente')
          await getCotizaciones()
        } else {
          showError('Error al duplicar la cotización', 'Error al duplicar la cotización')
        }
      })
    },
    () => {
      
    }
  )
}
const handleSend = (id: string) => {
  moveCotizacionModal.open({
    cotizacionId: Number(id),
    show: true,
    isFromCalculadora: true,
    onMoved: () => {
      getCotizaciones()
    }
  })
}
onMounted(() => {
  getCotizaciones()
})

// Configuración de filtros para DataTable
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
    key: 'campania',
    label: 'Campaña',
    type: 'select',
    placeholder: 'Seleccionar campaña',
    options: [
      { label: 'Todas', value: 'todas' },
      ...(filterOptions.value.contenedores || []).map((item: any) => ({
        label: `Contenedor #${item.label}`,
        value: item.value.toString()
      }))
    ]
  },
  {
    key: 'estado_calculadora',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    options: [
      { label: 'Todos', value: 'todos' },
      ...(filterOptions.value.estadoCalculadora || []).map((item: any) => ({
        label: item.label,
        value: item.value.toString()
      }))
    ]
  }
])

</script>