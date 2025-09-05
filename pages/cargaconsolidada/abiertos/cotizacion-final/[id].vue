<template>
  <div class="p-6">
    <!-- Header Section -->
    <PageHeader title="" subtitle="Gestión de cotizaciones" icon="" :hide-back-button="false"
      @back="navigateTo(`/cargaconsolidada/abiertos/pasos/${id}`)" />

    <div class="flex justify-end gap-3 mb-4">
      <UButton label="Subir Factura" icon="i-heroicons-arrow-up-tray" color="primary" variant="outline"
        @click="handleUploadFactura" />
      <UButton label="Plantilla General" icon="i-heroicons-arrow-down-tray" color="primary" variant="outline"
        @click="handleDownloadPlantillaGeneral" />
      <UButton label="Plantilla Final" icon="i-heroicons-arrow-up-tray" color="primary" variant="outline"
        @click="handleUploadPlantillaFinal" />
    </div>
    <DataTable title="" v-if="activeTab === 'general'" :data="general" :columns="generalColumns" :icon="''"
      :loading="loadingGeneral" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral"
      :total-records="totalRecordsGeneral" :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral"
      :show-secondary-search="false" :show-filters="true" :filter-config="filterConfigGeneral" :show-export="true"
      empty-state-message="No se encontraron registros de general." @update:primary-search="handleSearchGeneral"
      @page-change="handlePageChangeGeneral" @items-per-page-change="handleItemsPerPageChangeGeneral"
       :show-body-top="true">
      <template #body-top>
        <UTabs v-model="activeTab" :items="tabs" size="sm" variant="pill" class="mb-4 w-50" />

      </template>
    </DataTable>
    <DataTable v-if="activeTab === 'pagos'" :data="pagos" :columns="pagosColumns" :loading="loadingPagos" title=""
      :icon="''" :current-page="currentPagePagos" :total-pages="totalPagesPagos" :total-records="totalRecordsPagos"
      :items-per-page="itemsPerPagePagos" :search-query-value="searchPagos" :show-secondary-search="false"
      :show-filters="true" :filter-config="filterConfigPagos" :show-export="true"
      empty-state-message="No se encontraron registros de pagos." @update:primary-search="handleSearchPagos"
      @page-change="handlePageChangePagos" @items-per-page-change="handleItemsPerPageChangePagos"
      @filter-change="handleFilterChangePagos" :show-body-top="true">
      <template #body-top>
        <UTabs v-model="activeTab" :items="tabs" size="sm" variant="pill" class="mb-4 w-50" />

      </template>
    </DataTable>

    <!-- CreatePagoModal -->
    <CreatePagoModal v-model="showCreatePagoModal" :cliente-nombre="selectedCliente" @save="handleSavePago" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGeneral } from '~/composables/cargaconsolidada/cotizacion-final/useGeneral'
import { usePagos } from '~/composables/cargaconsolidada/cotizacion-final/usePagos'
import { USelect, UBadge } from '#components'
import CreatePagoModal from '~/components/commons/CreatePagoModal.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import SimpleUploadFileModal from '~/components/cargaconsolidada/cotizacion-final/SimpleUploadFile.vue'
import PagoGrid from '~/components/PagoGrid.vue'
import type { TableColumn } from '@nuxt/ui'
const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const { general, loadingGeneral, updateEstadoCotizacionFinal, getGeneral,handleSearchGeneral, handlePageChangeGeneral, handleItemsPerPageChangeGeneral, currentPageGeneral, totalPagesGeneral, totalRecordsGeneral, itemsPerPageGeneral, searchGeneral, filterConfigGeneral, uploadFacturaComercial, uploadPlantillaFinal, downloadPlantillaGeneral } = useGeneral()
const { pagos, loadingPagos, getPagos, currentPagePagos, totalPagesPagos, totalRecordsPagos, itemsPerPagePagos, searchPagos, filterConfigPagos, handleSearchPagos, handlePageChangePagos, handleItemsPerPageChangePagos, handleFilterChangePagos } = usePagos()

const route = useRoute()
const id = Number(route.params.id)

// Modal state for creating pagos
const showCreatePagoModal = ref(false)
const selectedCliente = ref('')

// Tab state
const activeTab = ref('') as Ref<string>

// Tab configuration
const tabs = [
  { value: 'general', label: 'General' },
  { value: 'pagos', label: 'Pagos' }
]
const handleUploadFactura = () => {
  simpleUploadFileModal.open({
    title: 'Subir Factura',
    onClose: () => simpleUploadFileModal.close(),
    onSave: async (data: { file: File }) => {
      await withSpinner(async () => {
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('idContenedor', id.toString())
        const result = await uploadFacturaComercial(formData)
        if (result.success) {
          showSuccess('Éxito', 'Factura subida correctamente')
        } else {
          showError('Error', 'Error al subir la factura')
        }
      }, 'Subiendo factura...')
    }
  })
}
const handleDownloadPlantillaGeneral = () => {
  withSpinner(async () => {
    await downloadPlantillaGeneral(Number(id))
  }, 'Descargando plantilla general...')
}
const handleUploadPlantillaFinal = () => {
  simpleUploadFileModal.open({
    title: 'Subir Plantilla Final',
    onClose: () => simpleUploadFileModal.close(),
    onSave: async (data: { file: File }) => {

      await withSpinner(async () => {
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('idContenedor', id.toString())
        const result = await uploadPlantillaFinal(formData)
        if (result.success) {
          showSuccess('Éxito', 'Plantilla final subida correctamente')
        } else {
          showError('Error', 'Error al subir la plantilla final')
        }
      }, 'Subiendo plantilla final...')
    }
  })
}
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
        'onUpdate:modelValue': async (value: any) => {
          if (value && value !== row.original.estado_cliente) {
            await handleUpdateEstadoCotizacionFinal(row.original.id_cotizacion, value)
          }
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
      return h(PagoGrid,
        {
          numberOfPagos: 4,
          pagoDetails: JSON.parse(row.original.pagos   || '[]'),
          clienteNombre: row.original.nombre,
          currency: 'USD'
        }
      )
    }
  }
])
const overlay = useOverlay()
const simpleUploadFileModal = overlay.create(SimpleUploadFileModal)
// Navigation
const handleUpdateEstadoCotizacionFinal = async (idCotizacion: number, estado: string) => {
  withSpinner(async () => {
    const result = await updateEstadoCotizacionFinal(idCotizacion, estado)
    if (result.success) {
      await getGeneral(Number(id))
      showSuccess('Éxito', 'Estado actualizado correctamente')
    } else {
      showError('Error', 'Error al actualizar el estado')
    }
  })
}
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
    console.log('general')
    navigateTo(`/cargaconsolidada/abiertos/cotizacion-final/${id}?tab=general`)
    await getGeneral(Number(id))
  }
  if (newVal === 'pagos') {
    navigateTo(`/cargaconsolidada/abiertos/cotizacion-final/${id}?tab=pagos`)
    await getPagos(Number(id))
  }
})

onMounted(async () => {
  const tabQuery = route.query.tab
  if (tabQuery) {
    activeTab.value = tabQuery as string
  } else {
    activeTab.value = tabs[0].value
  }
  
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
