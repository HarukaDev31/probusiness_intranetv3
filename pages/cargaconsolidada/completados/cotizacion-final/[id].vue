<template>
  <div class="p-6">
    <!-- Header Section -->
    <PageHeader title="" subtitle="Gestión de cotizaciones" icon="" :hide-back-button="false"
      @back="navigateTo(`/cargaconsolidada/completados/pasos/${id}`)" />
    <!-- add 3 buttons 
 Subir Factura
 Plantilla General
 Plantilla Final
-->
    <div class="flex justify-end gap-3 mb-4">
      <UButton label="Subir Factura" icon="i-heroicons-arrow-up-tray" color="primary" variant="outline"
        @click="handleUploadFactura" />
      <UButton label="Plantilla General" icon="i-heroicons-arrow-down-tray" color="primary" variant="outline"
        @click="handleDownloadPlantillaGeneral" />
      <UButton label="Plantilla Final" icon="i-heroicons-arrow-up-tray" color="primary" variant="outline"
        @click="handleUploadPlantillaFinal" />
    </div>
    <DataTable title=""  :show-pagination="false"   v-if="activeTab === 'general'" :data="general" :columns="generalColumns" :icon="''"
      :loading="loadingGeneral" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral"
      :total-records="totalRecordsGeneral" :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral"
      :show-primary-search="false"
      :show-secondary-search="false" :show-filters="false" :filter-config="filterConfigGeneral" :show-export="false"
        empty-state-message="No se encontraron registros de general." @update:primary-search="handleSearchGeneral"
      @page-change="handlePageChangeGeneral" @items-per-page-change="handleItemsPerPageChangeGeneral"
      @filter-change="handleFilterChangeGeneral" :show-body-top="true">
      <template #body-top>
        <UTabs v-model="activeTab" :items="tabs"  color="neutral" variant="pill" class="mb-4 w-80 h-15" />

      </template>
    </DataTable>
    <DataTable v-if="activeTab === 'pagos'"  :show-pagination="false"   :data="pagos" :columns="pagosColumns" :loading="loadingPagos" title=""
      :icon="''" :current-page="currentPagePagos" :total-pages="totalPagesPagos" :total-records="totalRecordsPagos"
      :items-per-page="itemsPerPagePagos" :search-query-value="searchPagos" :show-secondary-search="false"
      :show-filters="false" :filter-config="filterConfigPagos" :show-export="false"
      empty-state-message="No se encontraron registros de pagos." @update:primary-search="handleSearchPagos"
      @page-change="handlePageChangePagos" @items-per-page-change="handleItemsPerPageChangePagos"
      @filter-change="handleFilterChangePagos" :show-body-top="true">
      <template #body-top>
        <UTabs v-model="activeTab" :items="tabs"  color="neutral" variant="pill" class="mb-4 w-80 h-15" />

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
import { USelect, UBadge, UButton } from '#components'
import CreatePagoModal from '~/components/commons/CreatePagoModal.vue'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import SimpleUploadFileModal from '~/components/cargaconsolidada/cotizacion-final/SimpleUploadFile.vue'
import PagoGrid from '~/components/PagoGrid.vue'
import type { TableColumn } from '@nuxt/ui'
import { STATUS_BG_CLASSES } from '~/constants/ui'
const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const { general, loadingGeneral, updateEstadoCotizacionFinal, getGeneral, currentPageGeneral, totalPagesGeneral, totalRecordsGeneral, itemsPerPageGeneral, searchGeneral, filterConfigGeneral, uploadFacturaComercial, uploadPlantillaFinal, downloadPlantillaGeneral, handleDownloadCotizacionFinalPDF, handleDeleteCotizacionFinal } = useGeneral()
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
        if (result) {
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
    header: 'Fob',
    cell: ({ row }: { row: any }) => {
      return `$${row.original.fob_final}`
    }
  },

  {
    accessorKey: 'logistica_final',
    header: 'Logística',
    cell: ({ row }: { row: any }) => {
      return formatCurrency(row.original.logistica_final)
    }
  },

  {
    accessorKey: 'impuestos_final',
    header: 'Impuesto',
    cell: ({ row }: { row: any }) => {
      return formatCurrency(row.original.impuestos_final)
    }
  },

  {
    accessorKey: 'tarifa_final',
    header: 'Tarifa',
    cell: ({ row }: { row: any }) => {
      return `$${row.original.tarifa_final}`
    }
  },
  {
    accessorKey: 'estado_cotizacion_final',
    header: 'Estados',
    cell: ({ row }: { row: any }) => {
      //RETURN USELECT WITH OPTION SELECTED FROM FILTERCONFIGGENERAL WITH KEY 'estado_cotizacion_final'
      return h(USelect as any, {
        items: filterConfigGeneral.value.find((filter: any) => filter.key === 'estado_cotizacion_final')?.options || [],
        class :[STATUS_BG_CLASSES[row.original.estado_cotizacion_final as keyof typeof STATUS_BG_CLASSES]],
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
    header: 'C Final',
    cell: ({ row }: { row: any }) => {
      //if cotizacion_final_url exists show excel button to download else upload button
      if (row.original.cotizacion_final_url) {
        //div with button excel ,pdf and delete button
        return h('div', {
          class: 'flex flex-row gap-2'
        }, [
          h(UButton, {
            icon: 'vscode-icons:file-type-excel',
            color: 'primary',
            variant: 'ghost',
            onClick: () => {
              window.open(row.original.cotizacion_final_url, '_blank')
            }
          }),
          h(UButton, {
            icon: 'vscode-icons:file-type-pdf2',
            color: 'primary',
            variant: 'ghost',
            onClick: () => {
              handleDownloadCotizacionFinalPDF(row.original.id_cotizacion)  
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'ghost',
            onClick: () => {
              handleDeleteCotizacionFinal(row.original.id_cotizacion)
            }
          })
        ])
   
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          variant: 'outline',
          onClick: () => {
            handleUploadPlantillaFinal()
          }
        })
      } 
    }
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
  navigateTo(`/cargaconsolidada/completados/pasos/${id}`)
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
    navigateTo(`/cargaconsolidada/completados/cotizacion-final/${id}?tab=general`)
    await getGeneral(Number(id))
  }
  if (newVal === 'pagos') {
    navigateTo(`/cargaconsolidada/completados/cotizacion-final/${id}?tab=pagos`)
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
  await getGeneral(Number(id))
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
