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
    <DataTable title="" v-if="activeTab === 'general'" :data="general" :columns="generalColumns" :icon="''"
      :loading="loadingGeneral" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral"
      :total-records="totalRecordsGeneral" :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral"
      :show-primary-search="false" :show-pagination="false" :show-secondary-search="false" :show-filters="false"
      :filter-config="filterConfigGeneral" :show-export="false"
      empty-state-message="No se encontraron registros de general." @update:primary-search="handleSearchGeneral"
      @page-change="handlePageChangeGeneral" @items-per-page-change="handleItemsPerPageChangeGeneral"
      @filter-change="handleFilterChangeGeneral" :show-body-top="true">
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Cotizacion Final #${carga}`" :headers="headers" :loading="loadingHeaders" />
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-4 w-80 h-15" />
        </div>
      </template>
    </DataTable>
    <DataTable v-if="activeTab === 'pagos'" :data="pagos" :columns="pagosColumns" :loading="loadingPagos" title=""
      :icon="''" :current-page="currentPagePagos" :total-pages="totalPagesPagos" :total-records="totalRecordsPagos"
      :items-per-page="itemsPerPagePagos" :search-query-value="searchPagos" :show-secondary-search="false"
      :show-filters="false" :filter-config="filterConfigPagos" :show-export="false"
      empty-state-message="No se encontraron registros de pagos." @update:primary-search="handleSearchPagos"
      @page-change="handlePageChangePagos" @items-per-page-change="handleItemsPerPageChangePagos"
      :show-pagination="false" @filter-change="handleFilterChangePagos" :show-body-top="true">
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Cotizacion Final #${carga}`" :headers="headers" :loading="loadingHeaders" />
          <UTabs v-model="activeTab" :items="tabs" color="neutral" variant="pill" class="mb-4 w-80 h-15" />
        </div>

      </template>
    </DataTable>

    <!-- CreatePagoModal -->
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
import SectionHeader from '~/components/commons/SectionHeader.vue'
import { STATUS_BG_CLASSES } from '~/constants/ui'
const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const { general, loadingGeneral, updateEstadoCotizacionFinal, getGeneral, currentPageGeneral, totalPagesGeneral, totalRecordsGeneral, itemsPerPageGeneral, searchGeneral, filterConfigGeneral, uploadFacturaComercial, uploadPlantillaFinal, downloadPlantillaGeneral, handleDownloadCotizacionFinalPDF, handleDeleteCotizacionFinal, headers, carga, loadingHeaders, getHeaders } = useGeneral()
const { pagos, loadingPagos, getPagos, currentPagePagos, totalPagesPagos, totalRecordsPagos, itemsPerPagePagos, searchPagos, filterConfigPagos, handleSearchPagos, handlePageChangePagos, handleItemsPerPageChangePagos, handleFilterChangePagos } = usePagos()
import { usePagos as usePagosClientes } from '~/composables/cargaconsolidada/clientes/usePagos'
const { registrarPagoFinal, deletePago } = usePagosClientes()
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
   const response = await downloadPlantillaGeneral(Number(id))
   if (response.success) {
    showSuccess('Éxito', 'Plantilla general descargada correctamente')

   } else {
    showError('Error', 'Error al descargar la plantilla general')
   }
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
          //reload table genearl
          await getGeneral(Number(id))
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
    header: 'Correo',
    cell: ({ row }: { row: any }) => {
      return row.original.correo || 'Sin correo'
    }
  },

  {
    accessorKey: 'telefono',
    header: 'Whatsapp',
    cell: ({ row }: { row: any }) => {
      return row.original.telefono || 'Sin Whatsapp'
    }
  },

  {
    accessorKey: 'tipo_cliente',
    header: 'T. Cliente'
  },

  {
    accessorKey: 'volumen_final',
    header: 'Volumen',
    cell: ({ row }: { row: any }) => {
      return row.original.volumen_final || 'N/A'
    }
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
      return formatCurrency(row.original.tarifa_final)
    }
  },
  {
    accessorKey: 'estado_cotizacion_final',
    header: 'Estados',
    cell: ({ row }: { row: any }) => {
      const initialValue = row.original.estado_cotizacion_final
      // If estado is PAGADO and pagado_verificado is true, use explicit green class
      const isPagadoVerificado = initialValue === 'PAGADO' && row.original.pagado_verificado === true
      // If estado is PENDIENTE use gray class
      const isPendiente = initialValue === 'PENDIENTE'

      const className = isPagadoVerificado
        ? 'bg-green-500 text-white dark:bg-green-500 dark:text-white'
        : isPendiente
        ? 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'
        : STATUS_BG_CLASSES[initialValue as keyof typeof STATUS_BG_CLASSES]

      return h(USelect as any, {
        items: filterConfigGeneral.value.find((filter: any) => filter.key === 'estado_cotizacion_final')?.options || [],
        class: [className],
        modelValue: initialValue,
        'onUpdate:modelValue': async (value: any) => {
          if (value && value !== initialValue) {
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
              // Send reminder button
              h(UButton, {
                icon: 'material-symbols:send-outline',
                color: 'primary',
                variant: 'ghost',
                onClick: () => {
                  showConfirmation(
                    'Confirmar envío',
                    '¿Está seguro de enviar un recordatorio de pago a este cliente?',
                    async () => {
                      try {
                        await withSpinner(async () => {
                          const nuxtApp = useNuxtApp()
                          const endpoint = `/api/carga-consolidada/contenedor/cotizacion-final/general/${row.original.id_cotizacion}/send-reminder-pago`
                          const res = await nuxtApp.$api.call(endpoint, { method: 'POST', body: {} })
                          if (res && (res as any).success) {
                            showSuccess('Recordatorio enviado', (res as any).message || 'Recordatorio de pago enviado correctamente')
                            await getGeneral(Number(id))
                            await getHeaders(Number(id))
                          } else {
                            showError('Error', (res as any).message || 'No se pudo enviar el recordatorio')
                          }
                        }, 'Enviando recordatorio...')
                      } catch (err) {
                        console.error('Error send reminder:', err)
                        showError('Error', 'Error al enviar recordatorio')
                      }
                    }
                  )
                }
              }),
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
              deleteCotizacionFinal(row.original.id_cotizacion)
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
      return       !row.original.id_contenedor_pago?
       h(PagoGrid,
        {
          numberOfPagos: 4,
          pagoDetails: JSON.parse(row.original.pagos || '[]'),
          clienteNombre: row.original.nombre,
          currency: 'USD',
          showDelete: true,
          onSave: (data) => {
            const formData = new FormData();
            for (const key in data) {
              if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
              }
            }
            formData.append('idPedido', row.original.id_cotizacion)
            formData.append('idContenedor', row.original.id_contenedor)
            formData.append('idCotizacion', row.original.id_cotizacion)
            withSpinner(async () => {
              const response = await registrarPagoFinal(formData)
              if (response.success) {
                showSuccess('Pago registrado', 'Pago registrado correctamente', { duration: 3000 })
                  await getPagos(Number(id))
                  await getHeaders(Number(id))
              } else {
                showError('Error al registrar pago', response.error, { persistent: true })
              }
            }, 'registrarPagoFinal')

          },
          onDelete: (pagoId: number) => {
            showConfirmation(
              'Confirmar eliminación',
              '¿Está seguro de que desea eliminar el pago? Esta acción no se puede deshacer.',
              async () => {
                try {
                  await withSpinner(async () => {
                    const response = await deletePago(pagoId)
                    if (response.success) {
                          await getPagos(Number(id))
                          showSuccess('Eliminación Exitosa', 'El pago se ha eliminado correctamente.')
                          await getHeaders(Number(id))
                    }
                  }, 'Eliminando pago...')
                } catch (error) {
                  console.error('Error al eliminar el pago:', error)
                  showError('Error de Eliminación', 'Error al eliminar el pago')
                }
              }
            )
          }
        }
      ):null
    }
  }
])
const overlay = useOverlay()
const simpleUploadFileModal = overlay.create(SimpleUploadFileModal)
const deleteCotizacionFinal = async (idCotizacion: number) => {
  showConfirmation(
    'Confirmar eliminación',
    '¿Está seguro de que desea eliminar la cotización final? Esta acción no se puede deshacer.',
    async () => {
      try {
        await withSpinner(async () => {
          const response = await handleDeleteCotizacionFinal(idCotizacion)
          if (response.success) {
            await getGeneral(Number(id))
            showSuccess('Eliminación Exitosa', 'La cotización final se ha eliminado correctamente.')
          }
        }, 'Eliminando cotización final...')
      } catch (error) {
        console.error('Error al eliminar el pago:', error)
        showError('Error de Eliminación', 'Error al eliminar la cotización final')
      }
    }
  )
}
// Navigation
const handleUpdateEstadoCotizacionFinal = async (idCotizacion: number, estado: string) => {
  withSpinner(async () => {
    const result = await updateEstadoCotizacionFinal(idCotizacion, estado)
    if (result && (result as any).success) {

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


watch(activeTab, async (newVal, oldVal) => {

  if (newVal === 'general') {
    navigateTo(`/cargaconsolidada/completados/cotizacion-final/${id}?tab=general`)
    await getGeneral(Number(id))
  }
  if (newVal === 'pagos') {
    navigateTo(`/cargaconsolidada/completados/cotizacion-final/${id}?tab=pagos`)
    await getPagos(Number(id))
  }
  await getHeaders(Number(id))

})


onMounted(async () => {
  const tabQuery = route.query.tab
  if (tabQuery) {
    activeTab.value = tabQuery as string
  } else {
    activeTab.value = tabs[0].value
  }
  if (activeTab.value === 'general') {
    await getGeneral(Number(id))
  }
  if (activeTab.value === 'pagos') {
    
    await getPagos(Number(id))
  }
  await getHeaders(Number(id))
})

// Watch tab changes and clear searches before fetching to avoid stale query params
import { watch } from 'vue'
watch(()=> activeTab.value, async (newVal) => {
  if (newVal && newVal !== '') {
    try {
      if (newVal === 'general') {
        try { searchGeneral.value = '' } catch (e) { /* ignore */ }
        await getGeneral(Number(id))
      } else if (newVal === 'pagos') {
        try { searchPagos.value = '' } catch (e) { /* ignore */ }
        if (typeof getPagos === 'function') await getPagos(Number(id))
      }
      if (typeof getHeaders === 'function') await getHeaders(Number(id))
    } catch (error) {
      console.error('Error en cambio de pestaña:', error)
    }
  }
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
