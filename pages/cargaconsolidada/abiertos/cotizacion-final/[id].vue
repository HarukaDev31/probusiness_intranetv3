<template>
  <div class="p-6">
    <!-- Header Section -->
    <PageHeader title="Cotizaciones finales" subtitle="Gestión de cotizaciones" icon="i-heroicons-book-open"
      :hide-back-button="false" @back="navigateTo(`/cargaconsolidada/abiertos/pasos/${id}`)" />

    <UTabs v-model="activeTab" :items="tabs" size="sm" variant="pill" class="mb-4 w-50" />
    <DataTable title="General" v-if="activeTab === 'general'" :data="general" :columns="generalColumns"
      :loading="loadingGeneral" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral"
      :total-records="totalRecordsGeneral" :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral"
      :show-secondary-search="false" :show-filters="true" :filter-config="filterConfigGeneral" :show-export="true"
      empty-state-message="No se encontraron registros de general." @update:primary-search="handleSearchGeneral"
      @page-change="handlePageChangeGeneral" @items-per-page-change="handleItemsPerPageChangeGeneral"
      @filter-change="handleFilterChangeGeneral" />
    <DataTable v-if="activeTab === 'pagos'" :data="pagos" :columns="pagosColumns" :loading="loadingPagos" title="Pagos"
      :current-page="currentPagePagos" :total-pages="totalPagesPagos" :total-records="totalRecordsPagos"
      :items-per-page="itemsPerPagePagos" :search-query-value="searchPagos" :show-secondary-search="false"
      :show-filters="true" :filter-config="filterConfigPagos" :show-export="true"
      empty-state-message="No se encontraron registros de pagos." @update:primary-search="handleSearchPagos"
      @page-change="handlePageChangePagos" @items-per-page-change="handleItemsPerPageChangePagos"
      @filter-change="handleFilterChangePagos" />

    <!-- CreatePagoModal -->
    <CreatePagoModal v-model="showCreatePagoModal" :cliente-nombre="selectedCliente" @save="handleSavePago" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGeneral } from '../composables/cargaconsolidada/cotizacion-final/useGeneral'
import { usePagos } from '../composables/cargaconsolidada/cotizacion-final/usePagos'
import { USelect, UBadge } from '#components'
import CreatePagoModal from '../components/commons/CreatePagoModal.vue'

const { general, loadingGeneral, getGeneral, currentPageGeneral, totalPagesGeneral, totalRecordsGeneral, itemsPerPageGeneral, searchGeneral, filterConfigGeneral, handleSearchGeneral, handlePageChangeGeneral, handleItemsPerPageChangeGeneral, handleFilterChangeGeneral } = useGeneral()
const { pagos, loadingPagos, getPagos, currentPagePagos, totalPagesPagos, totalRecordsPagos, itemsPerPagePagos, searchPagos, filterConfigPagos, handleSearchPagos, handlePageChangePagos, handleItemsPerPageChangePagos, handleFilterChangePagos } = usePagos()

const route = useRoute()
const id = Number(route.params.id)

// Modal state for creating pagos
const showCreatePagoModal = ref(false)
const selectedCliente = ref('')

// Tab state
const activeTab = ref('general') as Ref<string>

// Tab configuration
const tabs = [
  { value: 'general', label: 'General' },
  { value: 'pagos', label: 'Pagos' }
]

const generalColumns = ref<TableColumn<any>[]>([
  {
    accessorKey: 'nro',
    header: 'N°',
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre'
  },

  {
    accessorKey: 'documento',
    header: 'DNI/RUC'
  },

  {
    accessorKey: 'correo',
    header: 'Correo'
  },

  {
    accessorKey: 'telefono',
    header: 'Whatsapp'
  },

  {
    accessorKey: 'tipo_cliente',
    header: 'T. Cliente'
  },

  {
    accessorKey: 'volumen_final',
    header: 'Volumen'
  },

  {
    accessorKey: 'fob_final',
    header: 'Fob'
  },

  {
    accessorKey: 'logistica_final',
    header: 'Logística'
  },

  {
    accessorKey: 'impuestos_final',
    header: 'Impuesto'
  },

  {
    accessorKey: 'tarifa_final',
    header: 'Tarifa'
  },
  {
    accessorKey: 'estado_cotizacion_final',
    header: 'Estados',
    cell: ({ row }: { row: any }) => {
      //RETURN USELECT WITH OPTION SELECTED FROM FILTERCONFIGGENERAL WITH KEY 'estado_cotizacion_final'
      return h(USelect as any, {
        items: filterConfigGeneral.value.find((filter: any) => filter.key === 'estado_cotizacion_final')?.options || [],
        modelValue: row.original.estado_cotizacion_final,
        onChange: (value: string) => {
          row.original.estado_cotizacion_final = value
        }
      })
    }
  },
  {
    accessorKey: 'c_final',
    header: 'C Final'
  }
])
//pagos columns N.	Nombre	DNI/RUC	Whatsapp	T. Cliente	Importe	Pagado	Adelantos
const pagosColumns = ref<TableColumn<any>[]>([
  {
    accessorKey: 'nro',
    header: 'N°',
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'nombre',
    header: 'Nombre'
  },

  {
    accessorKey: 'documento',
    header: 'DNI/RUC'
  },


  {
    accessorKey: 'telefono',
    header: 'Whatsapp'
  },


  {
    accessorKey: 'tipo_cliente',
    header: 'T. Cliente'
  },


  {
    accessorKey: 'total_logistica_impuestos',
    header: 'Importe',
    cell: ({ row }: { row: any }) => {
      return formatCurrency(row.original.total_logistica_impuestos)
    }
  },
  {
    accessorKey: 'pagado',
    header: 'Pagado',
    cell: ({ row }: { row: any }) => {
      return formatCurrency(row.original.total_pagos)
    }
  },
  {
    accessorKey: 'adelantos',
    header: 'Adelantos',
    cell: ({ row }: { row: any }) => {
      // Parse pagos JSON and validate count
      const pagos = row.original.pagos ? JSON.parse(row.original.pagos) : []
      const validPagos = Array.isArray(pagos) ? pagos : []

      // Always show 4 elements: existing pagos + plus buttons for missing ones
      const elements = []

      // Add existing pagos
      for (let i = 0; i < Math.min(validPagos.length, 4); i++) {
        const pago = validPagos[i]
        elements.push(
          h(UBadge as any, {
            label: formatCurrency(pago.monto),
            color: 'primary',
            variant: 'outline',
            class: 'cursor-pointer',
            onClick: () => {
              // Show pago details or edit modal
              console.log('Pago clicked:', pago)
            }
          })
        )
      }

      // Add plus buttons for missing pagos to complete 4
      for (let i = validPagos.length; i < 4; i++) {
        elements.push(
          h('div', {
            class: 'w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
            onClick: () => {
              // Open CreatePagoModal
              showCreatePagoModal.value = true
              selectedCliente.value = row.original.cliente_nombre || 'Cliente'
            }
          }, [
            h('i-heroicons-plus', { class: 'w-4 h-4 text-gray-500' })
          ])
        )
      }

      return h('div', { class: 'flex items-center space-x-2' }, elements)
    }
  }
])
// Navigation
const goBack = () => {
  navigateTo(`/cargaconsolidada/abiertos/pasos/${id}`)
}

// Handle save pago
const handleSavePago = (pagoData: any) => {
  console.log('Pago guardado:', pagoData)
  // Aquí puedes implementar la lógica para guardar el pago
  // Por ejemplo, llamar a un servicio o actualizar el estado
}
watch(activeTab, async (newVal, oldVal) => {
  if (oldVal === '' || !newVal) {
    return
  }
  if (newVal === 'general') {
    await getGeneral(Number(id))
  }
  if (newVal === 'pagos') {
    await getPagos(Number(id))
  }
})

onMounted(async () => {
  await getGeneral(Number(id))
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
