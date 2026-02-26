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
      :previous-page-url="(currentRole == ROLES.COORDINACION || currentId == ID_JEFEVENTAS || currentRole == ROLES.ADMINISTRACION) ? `/cargaconsolidada/completados/pasos/${id}` : `/cargaconsolidada/completados`">
      <template #body-top>
        <div class="flex flex-col gap-2 w-full">
          <SectionHeader :title="`Factura y Guía #${carga}`" :headers="headers" :loading="loadingGeneral || loadingHeaders" />
          <div v-if="currentRole === ROLES.CONTABILIDAD" class="flex justify-end">
            <UButton
              icon="i-heroicons-paper-airplane"
              color="primary"
              variant="solid"
              size="sm"
              @click="handleEnviarFormulario"
            >
              Enviar formulario
            </UButton>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGeneral } from '~/composables/cargaconsolidada/factura-guia/useGeneral'
import { USelect, UBadge, UButton, UTooltip } from '#components'
import SimpleUploadFileModal from '~/components/cargaconsolidada/cotizacion-final/CotizacionFinalSimpleUploadFile.vue'
import SendDocumentModal from '~/components/cargaconsolidada/factura-guia/SendDocumentModal.vue'
import EnviarFormularioModal from '~/components/cargaconsolidada/factura-guia/EnviarFormularioModal.vue'
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
const enviarFormularioModal = overlay.create(EnviarFormularioModal)
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
    case ROLES.CONTABILIDAD:
      return generalColumnsContabilidad.value || []
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
              title: 'Subir Facturas Electronicas',
              multiple: true,
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file?: File, files?: File[] }) => {
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

            onClick: () => {
              window.open(row.original.guia_remision_url, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
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
          icon: 'i-heroicons-chat-bubble-left-right',
          color: 'success',
          variant: 'ghost',
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
              title: 'Subir Facturas Electronicas',
              multiple: true,
              onClose: () => simpleUploadFileModal.close(),
              onSave: async (data: { file?: File, files?: File[] }) => {
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

            onClick: () => {
              window.open(row.original.guia_remision_url, '_blank')
            }
          }),
          h(UButton, {
            icon: 'i-heroicons-trash',
            color: 'error',
            variant: 'outline',
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

const generalColumnsContabilidad = ref<TableColumn<any>[]>([
  {
    accessorKey: 'nro',
    header: 'N°',
    cell: ({ row }: { row: any }) => row.index + 1
  },
  {
    accessorKey: 'contacto',
    header: 'Contacto',
    cell: ({ row }: { row: any }) => {
      const nombre = row.original?.nombre || ''
      const documento = row.original?.documento || ''
      const telefono = row.original?.telefono || ''
      const correo = row.original?.correo || ''
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
    cell: ({ row }: { row: any }) => row.original.name
  },
  {
    accessorKey: 'registrado',
    header: 'Registrado',
    cell: ({ row }: { row: any }) =>
      h(UBadge, {
        label: row.original.registrado ? 'Sí' : 'No',
        color: row.original.registrado ? 'success' : 'neutral'
      })
  },
  {
    accessorKey: 'tipo_comprobante',
    header: 'T. Comprobante',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ tipo_comprobante?: string | null }> | undefined
      if (!comprobantes?.length) return h('span', { class: 'text-gray-400 text-sm' }, '—')
      return h('div', { class: 'flex flex-col gap-1' }, comprobantes.map((c, i) =>
        c.tipo_comprobante
          ? h(UBadge, { key: i, label: c.tipo_comprobante, color: 'info', variant: 'soft' })
          : h(UBadge, { key: i, label: '—', color: 'neutral', variant: 'soft' })
      ))
    }
  },
  {
    accessorKey: 'total_comprobantes',
    header: 'Valor Comprobante',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ valor_comprobante?: number | null }> | undefined
      if (!comprobantes?.length) return h('span', { class: 'text-gray-400 text-sm' }, '—')
      return h('div', { class: 'flex flex-col gap-0.5 text-sm' }, comprobantes.map((c, i) => {
        const val = c.valor_comprobante
        return h('span', { key: i, class: 'font-medium' }, val != null ? `S/ ${Number(val).toFixed(2)}` : '—')
      }))
    }
  },
  {
    accessorKey: 'total_detracciones',
    header: 'Detracción',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ detraccion?: { monto: number; file_url?: string } | null }> | undefined
      if (!comprobantes?.length) return h('span', { class: 'text-gray-400 text-sm' }, '—')
      return h('div', { class: 'flex flex-col gap-1' }, comprobantes.map((c, i) => {
        const d = c.detraccion
        if (!d) return h('span', { key: i, class: 'text-gray-400 text-sm' }, '—')
        const monto = h('span', { class: 'text-sm font-medium' }, `S/ ${Number(d.monto).toFixed(2)}`)
        if (d.file_url) {
          return h('div', { key: i, class: 'flex flex-col gap-0.5' }, [
            monto,
            h('a', { href: d.file_url, target: '_blank', rel: 'noopener noreferrer', class: 'inline-flex items-center gap-1 text-primary text-xs hover:underline' }, ['Ver constancia'])
          ])
        }
        return h('span', { key: i }, monto)
      }))
    }
  },
  {
    accessorKey: 'comprobante_pdf',
    header: 'Comprobante (PDF)',
    cell: ({ row }: { row: any }) => {
      const comprobantes = row.original.comprobantes as Array<{ comprobante_file_url?: string | null; file_name?: string | null }> | undefined
      if (!comprobantes?.length) return h('span', { class: 'text-gray-400 text-sm' }, '—')
      return h('div', { class: 'flex flex-col gap-1' }, comprobantes.map((c, i) =>
        c.comprobante_file_url
          ? h('a', {
            key: i,
            href: c.comprobante_file_url,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'inline-flex items-center gap-1 text-primary text-sm hover:underline'
          }, [c.file_name || 'Ver comprobante'])
          : h('span', { key: i, class: 'text-gray-400 text-sm' }, '—')
      ))
    }
  },
  {
    accessorKey: 'guia_r_',
    header: 'Guía R.',
    cell: ({ row }: { row: any }) => {
      if (row.original.guia_remision_url) {
        return h(UButton, {
          icon: 'i-heroicons-arrow-down-tray',
          color: 'primary',
          variant: 'outline',
          size: 'xs',
          onClick: () => window.open(row.original.guia_remision_url, '_blank')
        })
      }
      return h('span', { class: 'text-gray-400 text-sm' }, '—')
    }
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      const estado = row.original.estado_cotizacion_final || 'PENDIENTE'
      const colorMap: Record<string, string> = {
        PAGADO: 'success', AJUSTADO: 'error', SOBREPAGO: 'warning', PENDIENTE: 'neutral', COTIZADO: 'info'
      }
      return h(UBadge, { label: estado, color: colorMap[estado] || 'neutral', variant: 'soft' })
    }
  },
  {
    accessorKey: 'acciones',
    header: 'Acciones',
    cell: ({ row }: { row: any }) =>
      h(UTooltip, { text: 'Ver detalle contabilidad', placement: 'top' }, {
        default: () => h(UButton, {
          icon: 'i-heroicons-eye',
          color: 'primary',
          variant: 'ghost',
          size: 'sm',
          onClick: () => {
            navigateTo(`/cargaconsolidada/contabilidad/factura-guia/clientes/${row.original.id_cotizacion}?carga=${carga.value || ''}`)
          }
        })
      })
  }
])

const handleEnviarFormulario = () => {
  enviarFormularioModal.open({
    idContenedor: id,
    onClose: () => enviarFormularioModal.close(),
    onSent: () => {
      enviarFormularioModal.close()
      showSuccess('Formularios enviados', 'Los mensajes de WhatsApp fueron enviados correctamente.')
    }
  })
}

const handleUploadFacturaComercial = async (data: { file?: File, files?: File[] }, idCotizacion: number) => {
  await withSpinner(async () => {
    try {
      const filesToUpload = data.files || (data.file ? [data.file] : [])
      
      if (filesToUpload.length === 0) {
        showError('No se seleccionaron archivos para subir', 'error')
        return
      }

      // Enviar todos los archivos en un solo request
      const response = await uploadFacturaComercial({
        idCotizacion: idCotizacion,
        files: filesToUpload
      })

      if (response.success) {
        const count = filesToUpload.length
        const message = (response as any).message || 
          (count === 1 
            ? 'Factura comercial subida correctamente' 
            : `${count} factura(s) comercial(es) subida(s) correctamente`)
        showSuccess(message, 'success')
        await getGeneral(Number(id))
      } else {
        const errorMessage = (response as any).message || 'Error al subir las facturas comerciales'
        showError(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error al subir facturas comerciales:', error)
      showError('Error al subir las facturas comerciales', 'error')
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