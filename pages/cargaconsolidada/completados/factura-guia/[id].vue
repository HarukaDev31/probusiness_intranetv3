<template>
  <div class="p-6">
    <!-- Header Section -->


  <DataTable title="" :show-pagination="false" :data="general" :columns="generalColumnsByRole" :loading="loadingGeneral || loadingHeaders"
      icon="" :current-page="currentPageGeneral" :total-pages="totalPagesGeneral" :total-records="totalRecordsGeneral"
      :items-per-page="itemsPerPageGeneral" :search-query-value="searchGeneral" :show-secondary-search="false"
      :show-filters="false" :filter-config="filterConfigGeneral" :show-export="false"
      empty-state-message="No se encontraron registros de general." @update:primary-search="handleSearchGeneral"
      @page-change="handlePageChangeGeneral" @items-per-page-change="handleItemsPerPageChangeGeneral"
      @filter-change="handleFilterChangeGeneral" :hide-back-button="false" :show-primary-search="false"
      :show-body-top="true"
      :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole == ROLES.ADMINISTRACION) ? `/cargaconsolidada/abiertos/pasos/${id}` : `/cargaconsolidada/abiertos`">
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Factura y Guía #${carga}`" :headers="headers" :loading="loadingGeneral || loadingHeaders" />
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGeneral } from '~/composables/cargaconsolidada/factura-guia/useGeneral'
import { USelect, UBadge, UButton, UTooltip } from '#components'
import SimpleUploadFileModal from '~/components/cargaconsolidada/cotizacion-final/SimpleUploadFile.vue'
import SendDocumentModal from '~/components/cargaconsolidada/factura-guia/SendDocumentModal.vue'
import { ROLES, ID_JEFEVENTAS } from '~/constants/roles'
import type { TableColumn } from '@nuxt/ui'
import { useUserRole } from '~/composables/auth/useUserRole'
const { general, loadingGeneral, getGeneral, currentPageGeneral, totalPagesGeneral, totalRecordsGeneral, itemsPerPageGeneral, searchGeneral, filterConfigGeneral, handleSearchGeneral, handlePageChangeGeneral, handleItemsPerPageChangeGeneral, handleFilterChangeGeneral, uploadFacturaComercial, uploadGuiaRemision, headers, carga, loadingHeaders, getHeaders, deleteFacturaComercial, deleteGuiaRemision } = useGeneral()
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useWhatsapp } from '~/composables/cargaconsolidada/factura-guia/useWhatsapp'
import SectionHeader from '~/components/commons/SectionHeader.vue'
const { withSpinner } = useSpinner()
const { showSuccess, showError, showConfirmation } = useModal()
const { sendFactura, sendGuia } = useWhatsapp()
const route = useRoute()
const id = Number(route.params.id)
const overlay = useOverlay()
const simpleUploadFileModal = overlay.create(SimpleUploadFileModal)
const sendDocumentModal = overlay.create(SendDocumentModal)
// Modal state for creating pagos
const { currentRole, currentId } = useUserRole()
const selectedCliente = ref('')

// Tab state
const activeTab = ref('general') as Ref<string>

// Tab configuration
const tabs = [
  { value: 'general', label: 'General' },
  { value: 'pagos', label: 'Pagos' }
]

const generalColumnsByRole = computed<TableColumn<any>[]>(() => {
  switch (currentRole.value) {
    case ROLES.ADMINISTRACION:
      return generalColumnsAdministrador.value || []
    default:
      return generalColumns.value || []
  }
})
const generalColumnsAdministrador = ref<TableColumn<any>[]>([
  {
    accessorKey: 'nro',
    header: 'N°',
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'contacto',
    header: 'Contacto',
    cell: ({ row }: { row: any }) => {
      const nombre = row.original?.nombre || ''
      const documento = row.original?.documento || ''
      const correo = row.original?.correo || ''
      const telefono = row.original?.telefono || ''
      return h('div', { class: 'py-2 w-full whitespace-normal' }, [
        h('div', { class: 'font-medium' }, nombre),
        h('div', { class: 'text-sm text-gray-500' }, documento),
        h('div', { class: 'text-sm text-gray-500' }, telefono),
        h('div', { class: 'text-sm text-gray-500' }, correo)
      ])
    }
  },

  {
    accessorKey: 'tipo_cliente',
    header: 'T. Cliente',
    cell: ({ row }: { row: any }) => {
      return row.original.name
    }
  },
  //Ajuste	C.Final	Factura C.	Guia R.
  {
    accessorKey: 'ajuste',
    header: 'Ajuste',
    cell: ({ row }: { row: any }) => {
      return h(UBadge, {
        color: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'error' : 'success',
        label: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'SI' : 'NO'
      })
    }
  },
  {
    accessorKey: 'c_final',
    header: 'C. Final',
    cell: ({ row }: { row: any }) => {
      // cotizacion_final_url SHOW DOWNLOAD ICON 
      if (row.original.cotizacion_final_url) {
        return h(UButton, {
          icon: 'vscode-icons:file-type-excel',
          color: 'primary',
          variant: 'ghost',
          size: 'xl',
          onClick: () => {
            window.open(row.original.cotizacion_final_url, '_blank')
          }
        })
      } else {
        return
      }
    }
  },
  {
    accessorKey: 'factura_c_',
    header: 'Factura C. ',
    cell: ({ row }: { row: any }) => {
      // if factura_comercial exist show download icon else show button to open modal to upload and button delete
      if (row.original.factura_comercial) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',
            onClick: () => {
              window.open(row.original.factura_comercial, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            'aria-label': 'Eliminar factura comercial',
            onClick: () => {
              handleDeleteFacturaComercial(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          label: 'Subir',

          variant: 'outline',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Factura Comercial',
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file: File }) => {
                await handleUploadFacturaComercial(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guia R. ',
    cell: ({ row }: { row: any }) => {
      // if guia_r exist show download icon else show button to open modal to upload
      if (row.original.guia_remision_url) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',
            'aria-label': 'Descargar guía de remisión',
            onClick: () => {
              window.open(row.original.guia_remision_url, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            'aria-label': 'Eliminar guía de remisión',
            onClick: () => {
              handleDeleteGuiaRemision(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          variant: 'outline',
          label: 'Subir',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Guia Remisión',
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file: File }) => {
                await handleUploadGuiaRemision(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  },
  {
    accessorKey: 'whatsapp',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const hasFactura = !!row.original.factura_comercial
      const hasGuia = !!row.original.guia_remision_url
      const clienteNombre = row.original?.nombre || 'Cliente'
      
    
      
      return h(UTooltip, {
        text: 'Enviar documento por WhatsApp',
        placement: 'top'
      }, {
        default: () => h(UButton, {
          icon: 'iconamoon:menu-burger-horizontal',
          color: 'success',
          variant: 'ghost',
          'aria-label': 'Enviar documento por WhatsApp',
          onClick: () => {
            sendDocumentModal.open({
              idCotizacion: row.original.id_cotizacion,
              clienteNombre: clienteNombre,
              hasFactura: hasFactura,
              hasGuia: hasGuia,
              onClose: () => sendDocumentModal.close(),
              onSend: async (documentType: 'factura' | 'guia') => {
                await handleSendDocument(row.original.id_cotizacion, documentType)
              }
            })
          }
        })
      })
    }
  }
])
const generalColumns = ref<TableColumn<any>[]>([
  {
    accessorKey: 'nro',
    header: 'N°',
    cell: ({ row }: { row: any }) => {
      return row.index + 1
    }
  },
  {
    accessorKey: 'contacto',
    header: 'Contacto',
    cell: ({ row }: { row: any }) => {
      const nombre = row.original?.nombre || ''
      const documento = row.original?.documento || ''
      const correo = row.original?.correo || ''
      const telefono = row.original?.telefono || ''
      return h('div', { class: 'py-2 w-full whitespace-normal' }, [
        h('div', { class: 'font-medium' }, nombre),
        h('div', { class: 'text-sm text-gray-500' }, documento),
        h('div', { class: 'text-sm text-gray-500' }, telefono),
        h('div', { class: 'text-sm text-gray-500' }, correo)
      ])
    }
  },

  {
    accessorKey: 'tipo_cliente',
    header: 'T. Cliente',
    cell: ({ row }: { row: any }) => {
      return row.original.name
    }
  },
  //Ajuste	C.Final	Factura C.	Guia R.
  {
    accessorKey: 'ajuste',
    header: 'Ajuste',
    cell: ({ row }: { row: any }) => {
      return h(UBadge, {
        color: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'error' : 'success',
        label: row.original.estado_cotizacion_final === 'AJUSTADO' ? 'SI' : 'NO'
      })
    }
  },
  {
    accessorKey: 'c_final',
    header: 'C. Final',
    cell: ({ row }: { row: any }) => {
      // cotizacion_final_url SHOW DOWNLOAD ICON 
      if (row.original.cotizacion_final_url) {
        return h(UButton, {
          icon: 'vscode-icons:file-type-excel',
          color: 'primary',
          variant: 'ghost',
          size: 'xl',
          onClick: () => {
            window.open(row.original.cotizacion_final_url, '_blank')
          }
        })
      } else {
        return
      }
    }
  },
  {
    accessorKey: 'factura_c_',
    header: 'Factura C. ',
    cell: ({ row }: { row: any }) => {
      // if factura_comercial exist show download icon else show button to open modal to upload and button delete
      if (row.original.factura_comercial) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',
            onClick: () => {
              window.open(row.original.factura_comercial, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            'aria-label': 'Eliminar factura comercial',
            onClick: () => {
              handleDeleteFacturaComercial(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          label: 'Subir',

          variant: 'outline',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Factura Comercial',
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file: File }) => {
                await handleUploadFacturaComercial(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guia R. ',
    cell: ({ row }: { row: any }) => {
      // if guia_r exist show download icon else show button to open modal to upload
      if (row.original.guia_remision_url) {
        return h('div', { class: 'flex space-x-2' }, [
          h(UButton, {
            icon: 'i-heroicons-arrow-down-tray',
            color: 'primary',
            variant: 'outline',
            'aria-label': 'Descargar guía de remisión',
            onClick: () => {
              window.open(row.original.guia_remision_url, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
            'aria-label': 'Eliminar guía de remisión',
            onClick: () => {
              handleDeleteGuiaRemision(row.original.id_cotizacion)
            }
          })
        ])
      } else {
        return h(UButton, {
          icon: 'i-heroicons-arrow-up-tray',
          color: 'primary',
          variant: 'outline',
          label: 'Subir',
          onClick: () => {
            simpleUploadFileModal.open({
              title: 'Subir Guia Remisión',
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file: File }) => {
                await handleUploadGuiaRemision(data, row.original.id_cotizacion)
              }
            })
          }
        })
      }
    }
  },
  {
    accessorKey: 'whatsapp',
    header: 'Acciones',
    cell: ({ row }: { row: any }) => {
      const hasFactura = !!row.original.factura_comercial
      const hasGuia = !!row.original.guia_remision_url
      const clienteNombre = row.original?.nombre || 'Cliente'
      
      // Solo mostrar el botón si hay al menos un documento disponible
      
      
      return h(UTooltip, {
        text: 'Enviar documento por WhatsApp',
        placement: 'top'
      }, {
        default: () => h(UButton, {
          icon: 'iconamoon:menu-burger-horizontal',
          color: 'success',
          variant: 'ghost',
          'aria-label': 'Enviar documento por WhatsApp',
          onClick: () => {
            sendDocumentModal.open({
              idCotizacion: row.original.id_cotizacion,
              clienteNombre: clienteNombre,
              hasFactura: hasFactura,
              hasGuia: hasGuia,
              onClose: () => sendDocumentModal.close(),
              onSend: async (documentType: 'factura' | 'guia') => {
                await handleSendDocument(row.original.id_cotizacion, documentType)
              }
            })
          }
        })
      })
    }
  }
])

const handleUploadFacturaComercial = async (data: { file: File }, idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      const response = await uploadFacturaComercial({
        idCotizacion: idCotizacion,
        file: data.file
      })
      if (response.success) {
        showSuccess('Factura comercial subida correctamente', 'success')
        await getGeneral(Number(id))
      } else {
        showError('Error al subir la factura comercial', 'error')
      }
    } catch (error) {
      showError('Error al subir la factura comercial', 'error')
    }
  })
}
const handleDeleteFacturaComercial = async (idCotizacion: number) => {
  showConfirmation(
    'Confirmar eliminación',
    '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
    async () => {
      try {
        await withSpinner(async () => {
          const response = await deleteFacturaComercial(idCotizacion)
          if (response.success) {
            await getGeneral(Number(id))
            showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
          }
        }, 'Eliminando archivo...')
      } catch (error) {
        console.error('Error al eliminar archivo:', error)
        showError('Error de Eliminación', 'Error al eliminar el archivo')
      }
    }
  )
}
const handleDeleteGuiaRemision = async (idCotizacion: number) => {
  showConfirmation(
    'Confirmar eliminación',
    '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
    async () => {
      try {
        await withSpinner(async () => {
          const response = await deleteGuiaRemision(idCotizacion)
          if (response.success) {
            await getGeneral(Number(id))
            showSuccess('Eliminación Exitosa', 'El archivo se ha eliminado correctamente.')
          }
        }, 'Eliminando archivo...')
      } catch (error) {
        console.error('Error al eliminar archivo:', error)
        showError('Error de Eliminación', 'Error al eliminar el archivo')
      }
    }
  )
}
const handleUploadGuiaRemision = async (data: { file: File }, idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      const response = await uploadGuiaRemision({
        idCotizacion: idCotizacion,
        file: data.file
      })
      if (response.success) {
        showSuccess('Guía remisión subida correctamente', 'success')
        await getGeneral(Number(id))
      } else {
        showError('Error al subir la guía remisión', 'error')
      }
    } catch (error) {
      showError('Error al subir la guía remisión', 'error')
    }
  })
}

const handleSendDocument = async (idCotizacion: number, documentType: 'factura' | 'guia') => {
  await withSpinner(async () => {
    try {
      let response
      if (documentType === 'factura') {
        response = await sendFactura(idCotizacion)
      } else {
        response = await sendGuia(idCotizacion)
      }
      
      if (response.success) {
        showSuccess(
          'Documento enviado',
          `El ${documentType === 'factura' ? 'factura comercial' : 'guía de remisión'} se ha enviado correctamente por WhatsApp`
        )
        sendDocumentModal.close()
      } else {
        showError('Error al enviar documento', response.error || 'No se pudo enviar el documento por WhatsApp')
      }
    } catch (error: any) {
      showError('Error al enviar documento', error?.message || 'Error al enviar el documento por WhatsApp')
    }
  }, 'Enviando documento...')
}

onMounted(async () => {
  await getGeneral(Number(id))
  await getHeaders(Number(id))
})
</script>

<style scoped></style>