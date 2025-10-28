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
      //RETURN USELECT WITH OPTION SELECTED FROM FILTERCONFIGGENERAL WITH KEY 'estado_cotizacion_final'
      return h(USelect as any, {
        items: filterConfigGeneral.value.find((filter: any) => filter.key === 'estado_cotizacion_final')?.options || [],
        class: [STATUS_BG_CLASSES[row.original.estado_cotizacion_final as keyof typeof STATUS_BG_CLASSES]],
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
                  await checkAndSetPagadoForClient(row.original.id_cotizacion)
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
                          await checkAndSetPagadoForClient(row.original.id_cotizacion)
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
      // If the state moved to COBRANDO, send the payment reminder automatically
      if (estado === 'COBRANDO') {
        try {
          await withSpinner(async () => {
            const nuxtApp = useNuxtApp()
            // reuse the same endpoint format used for manual send
            const endpoint = `/api/carga-consolidada/contenedor/cotizacion-final/general/${idCotizacion}/send-reminder-pago`
            const res = await nuxtApp.$api.call(endpoint, { method: 'POST', body: {} })
            if (res && (res as any).success) {
              showSuccess('Recordatorio enviado', (res as any).message || 'Recordatorio de pago enviado correctamente')
            } else {
              showError('Error al enviar recordatorio', (res as any).message || 'No se pudo enviar el recordatorio')
            }
          }, 'Enviando recordatorio...')
        } catch (err) {
          console.error('Error sending reminder after estado COBRANDO:', err)
          showError('Error', 'Ocurrió un error al enviar el recordatorio de pago')
        }
      }

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

// Check if all payments for a given cotizacion are confirmed; if so, set estado to PAGADO_V
const checkAndSetPagadoForClient = async (idCotizacion: number) => {
  try {
    const client = pagos.value.find((p: any) => Number(p.id_cotizacion) === Number(idCotizacion))
    if (!client) return

    let payments: any[] = []
    try {
      payments = Array.isArray(client.pagos) ? client.pagos : JSON.parse(client.pagos || '[]')
    } catch (e) {
      payments = []
    }

    if (payments.length === 0) return

    const allConfirmed = payments.every((py: any) => {
      const s = ((py.status ?? py.estado ?? py.estado_pago ?? py.payment_status) || '').toString().toUpperCase()
      return s === 'CONFIRMADO' || s === 'CONFIRMED' || s === 'CONFIRMADOS'
    })

    if (allConfirmed && client.estado_cotizacion_final !== 'PAGADO_V') {
      const res = await updateEstadoCotizacionFinal(idCotizacion, 'PAGADO_V')
      if (res && (res as any).success) {
        showSuccess('Estado actualizado', 'Estado cambiado a PAGADO_V por confirmación de todos los pagos')
        await getGeneral(Number(id))
        await getHeaders(Number(id))
      }
    }
  } catch (err) {
    console.error('checkAndSetPagadoForClient error', err)
  }
}

// Handle save pago
const handleSavePago = (pagoData: any) => {
  
  // Aquí puedes implementar la lógica para guardar el pago
  // Por ejemplo, llamar a un servicio o actualizar el estado
}

// Ensure pagos are loaded and run the PAGADO_V checks for all clients in the general table
const ensurePagosAndRunChecks = async () => {
  try {
    // Load pagos if not present so checks can inspect payment details
    if (!pagos.value || !Array.isArray(pagos.value) || pagos.value.length === 0) {
      await getPagos(Number(id))
    }

    if (!general.value || !Array.isArray(general.value)) return

    for (const client of general.value) {
      const idCot = client?.id_cotizacion ?? client?.idPedido ?? client?.id
      if (idCot) {
        // fire-and-forget per client to avoid blocking UI (check handles its own errors)
        checkAndSetPagadoForClient(Number(idCot))
      }
    }
  } catch (err) {
    console.error('ensurePagosAndRunChecks error', err)
  }
}

// Watch the general table and trigger pagos/checks so states like PAGADO_V are evaluated
watch(general, async (newVal) => {
  if (!newVal || !Array.isArray(newVal)) return
  // run in background
  ensurePagosAndRunChecks()
}, { immediate: true })
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
  await getHeaders(Number(id))

})

// Whenever pagos list updates, verify if any client should be moved to PAGADO_V
watch(pagos, async (newVal) => {
  if (!newVal || !Array.isArray(newVal)) return
  for (const client of newVal) {
    const idCot = client?.id_cotizacion ?? client?.idPedido ?? client?.id
    if (idCot) {
      // fire-and-forget per client to avoid blocking UI; check handles errors
      checkAndSetPagadoForClient(Number(idCot))
    }
  }
}, { immediate: true })

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
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
